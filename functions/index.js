'use strict';
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const {getStorage}=require('firebase-admin/storage');
const {onCall,onRequest,HttpsError}=require('firebase-functions/v2/https');
const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {onObjectFinalized}=require('firebase-functions/v2/storage');
const {makeStorageIntegrity}=require('./storage-integrity');
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {defineSecret}=require('firebase-functions/params');
const {logger}=require('firebase-functions');
const {makeBillingService}=require('./billing');
const {makeLifecycleService}=require('./lifecycle');
const {makePaymentService}=require('./payments');
const {makeIndividualPaymentService}=require('./individual-payments');
const {makeMailService}=require('./mail');
const {renderInvoice}=require('./pdf');
const {DomainError,id,requireValue}=require('./domain');
initializeApp();
const db=getFirestore();
const getBilling=()=>makeBillingService(db,{renderPdf:renderInvoice,bucket:getStorage().bucket()});
const lifecycle=makeLifecycleService(db,{getIdentity:uid=>getAuth().getUser(uid)});
const stripeKey=defineSecret('SONGKEEP_STRIPE_SECRET_KEY'),webhookKey=defineSecret('SONGKEEP_STRIPE_WEBHOOK_SECRET'),emailKey=defineSecret('SONGKEEP_EMAIL_API_KEY');
const actorOf=request=>({uid:request.auth?.uid,email:request.auth?.token.email,emailVerified:request.auth?.token.email_verified===true});
const options={region:'us-central1',memory:'512MiB',timeoutSeconds:120,maxInstances:10,cors:true};
async function safe(work) {try{return await work();}catch(error){if(error instanceof DomainError)throw new HttpsError(error.code,error.message);logger.error('SongKeep operation failed',{name:error.name,code:error.code});throw new HttpsError('internal','This action could not be completed. Please retry or contact SongKeep.');}}
exports.songkeepBilling=onCall(options,request=>safe(async()=>{
  requireValue(request.auth,'Sign in to continue.','unauthenticated');const {operation:action,...input}=request.data||{},billing=getBilling(),actor=actorOf(request);
  const methods={configure:billing.configure,getSettings:billing.getSettings,saveBilling:billing.saveBilling,createRequest:billing.createRequest,prepare:billing.prepare,read:billing.read,issue:billing.issue,download:billing.download,viewed:billing.viewed,send:billing.send,recordPayment:billing.recordPayment,close:billing.close,recordRefund:billing.recordRefund,saveConsent:lifecycle.saveConsent,approvePermission:lifecycle.approvePermission,submitPermission:lifecycle.submitPermission,purchase:lifecycle.purchase,updatePurchase:lifecycle.updatePurchase,release:lifecycle.release,reviewDeliverable:lifecycle.reviewDeliverable,materials:lifecycle.materials,verifyMaterial:makeStorageIntegrity(db,getStorage().bucket()).verifyMaterial};
  requireValue(Object.hasOwn(methods,action),'Choose a supported action.','invalid-argument');return methods[action](actor,input);
}));
exports.songkeepMedia=onCall(options,request=>safe(async()=>{const result=await lifecycle.media(actorOf(request),request.data||{});requireValue(result.storagePath.startsWith('organizations/'),'The media path is not valid.');const [url]=await getStorage().bucket().file(result.storagePath).getSignedUrl({action:'read',expires:Date.now()+60000});return {url,expiresInSeconds:60};}));
exports.songkeepCheckout=onCall({...options,secrets:[stripeKey]},request=>safe(()=>{const Stripe=require('stripe');const service=makePaymentService(db,new Stripe(stripeKey.value()),getBilling());return request.data?.cancel===true?service.cancelCheckout(actorOf(request),request.data):service.checkout(actorOf(request),request.data||{});}));
exports.songkeepStripeWebhook=onRequest({...options,secrets:[stripeKey,webhookKey]},async(req,res)=>{if(req.method!=='POST'){res.status(405).send('Method not allowed');return;}const Stripe=require('stripe'),stripe=new Stripe(stripeKey.value());let event;try{event=stripe.webhooks.constructEvent(req.rawBody,req.headers['stripe-signature'],webhookKey.value());}catch{res.status(400).send('Invalid signature');return;}try{if(event.data.object.metadata?.songkeep==='individual_purchase')await makeIndividualPaymentService(db,stripe,lifecycle).webhook(event);else await makePaymentService(db,stripe,getBilling()).webhook(event);res.status(200).json({received:true});}catch(error){logger.error('Stripe reconciliation retry required',{eventId:event.id,code:error.code});res.status(500).send('Reconciliation failed');}});
exports.songkeepPrepareInvoice=onDocumentCreated({document:'organizations/{organizationId}/invoices/{invoiceId}',region:'us-central1',memory:'512MiB',timeoutSeconds:120,retry:true},async event=>{const invoice=event.data?.data(),config=await db.doc('platformSettings/invoicing').get();if(!invoice||invoice.status!=='draft'||!config.data()?.autoIssue)return;try{await getBilling().issue({uid:id(invoice.createdBy)},event.params,true);}catch(error){if(!(error instanceof DomainError))throw error;await event.data.ref.set({preparationNotice:'SongKeep is reviewing the invoice details. You can update your billing information in your account.'},{merge:true});}});
exports.songkeepInvoiceReminders=onSchedule({schedule:'every 60 minutes',region:'us-central1',timeZone:'America/New_York',timeoutSeconds:300},()=>getBilling().reminders());
exports.songkeepInvoiceMail=onSchedule({schedule:'every 15 minutes',region:'us-central1',secrets:[emailKey],timeoutSeconds:300},async()=>{if(process.env.SONGKEEP_EMAIL_ENABLED!=='true')return;const mail=makeMailService(db,async input=>{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${emailKey.value()}`,'Content-Type':'application/json','Idempotency-Key':input.idempotencyKey},body:JSON.stringify({from:`SongKeep <${input.from}>`,to:[input.to],subject:input.subject,text:input.text}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Email provider ${response.status}`);const result=await response.json();if(!result.id)throw new Error('Missing provider receipt');return result;});await mail.run();});

exports.songkeepVerifyCreatorUpload=onObjectFinalized({region:'us-central1',memory:'256MiB',timeoutSeconds:120,retry:true},async event=>{if(!event.data.name?.includes('/creator-submissions/'))return;try{await makeStorageIntegrity(db,getStorage().bucket(event.data.bucket)).verify(event.data.name);}catch(error){if(!(error instanceof DomainError))throw error;logger.warn('Upload requires review',{path:event.data.name,reason:error.message});}});

exports.songkeepIndividualCheckout=onCall({...options,secrets:[stripeKey]},request=>safe(()=>{const Stripe=require('stripe');return makeIndividualPaymentService(db,new Stripe(stripeKey.value()),lifecycle).checkout(actorOf(request),request.data||{});}));
