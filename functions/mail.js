'use strict';
const {FieldValue} = require('firebase-admin/firestore');
const {invoiceStatus,serializable,sha256} = require('./domain');
const REMINDERS=['issued','not_viewed','payment_reminder','due_soon','due_today','overdue'];
function shouldDeliver(message,invoice) {
  if(!invoice.commercial)return false;
  if(REMINDERS.includes(message.kind))return !invoice.remindersPaused&&!['paid','void','refunded','uncollectible','draft'].includes(invoiceStatus(serializable(invoice)));
  return !['void','draft'].includes(invoice.status)||message.kind==='refund';
}
function emailText(message,invoice) {
  const c=invoice.commercial,money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
  const headings={issued:'Your SongKeep invoice is ready',copy:'Your SongKeep invoice',receipt:'Your payment is confirmed',refund:'Your refund is recorded',onboarding:'Your SongKeep experience is ready to prepare',due_soon:'Your SongKeep invoice is due soon',due_today:'Your SongKeep invoice is due today',overdue:'Your SongKeep invoice is past due',not_viewed:'Your SongKeep invoice is ready to view',payment_reminder:'A reminder about your SongKeep invoice'};
  const title=headings[message.kind]||'Your SongKeep invoice';
  return {subject:`${title} — ${invoice.invoiceNumber}`,text:[`Hello ${c.buyer.contactName},`,'',title+'.',`Invoice: ${invoice.invoiceNumber}`,`Experience: ${c.lineItems.map(x=>x.description).join(', ')}`,`Invoice total: ${money(c.totalCents)}`,message.amountCents?`Amount ${message.kind==='refund'?'refunded':'received'}: ${money(message.amountCents)}`:'',`Current balance: ${money(invoice.amountDueCents)}`,`Due: ${c.dueAt.slice(0,10)}`,'',`Open your secure SongKeep account: ${c.accountUrl}`,'',message.kind==='onboarding'?'Your preferred date remains subject to confirmation. Open your experience for the next preparation step.':c.paymentInstructions,'',`Questions? ${c.seller.email} · ${c.seller.phone}`].filter(x=>x!==undefined).join('\n')};
}
function makeMailService(db,sendEmail) {
  async function deliver(ref) {
    const invoiceRef=ref.parent.parent,token=crypto.randomUUID();
    const claimed=await db.runTransaction(async tx=>{const [doc,inv]=await Promise.all([tx.get(ref),tx.get(invoiceRef)]);if(!doc.exists||!inv.exists)return null;const m=doc.data(),i=inv.data();if(m.status==='sent'||m.status==='cancelled'||m.status==='failed')return null;if(m.status==='sending'&&m.leaseUntil?.toMillis()>Date.now())return null;if(m.retryAt?.toMillis()>Date.now())return null;if(!shouldDeliver(m,i)){tx.update(ref,{status:'cancelled'});return null;}if((m.attempts||0)>=5){tx.update(ref,{status:'failed',lastError:'Delivery needs staff review.'});return null;}tx.update(ref,{status:'sending',leaseToken:token,leaseUntil:new Date(Date.now()+120000),attempts:(m.attempts||0)+1});return {message:m,invoice:i};});
    if(!claimed)return;
    try {
      // Recheck after claiming so settled invoices suppress queued reminder delivery.
      const fresh=await invoiceRef.get();if(!shouldDeliver(claimed.message,fresh.data())){await ref.update({status:'cancelled'});return;}
      const result=await sendEmail({to:claimed.message.recipient,from:claimed.invoice.commercial.seller.email,...emailText(claimed.message,fresh.data()),idempotencyKey:`songkeep-${sha256(ref.path)}`});
      await db.runTransaction(async tx=>{const [m,i]=await Promise.all([tx.get(ref),tx.get(invoiceRef)]);if(m.data()?.leaseToken!==token)return;tx.update(ref,{status:'sent',providerMessageId:result.id,sentAt:FieldValue.serverTimestamp(),leaseUntil:null});if(['issued','copy'].includes(claimed.message.kind)&&i.exists){const data=serializable(i.data());tx.update(invoiceRef,{sentAt:FieldValue.serverTimestamp(),status:invoiceStatus({...data,sentAt:new Date().toISOString()})});}});
    }catch(error){await db.runTransaction(async tx=>{const m=await tx.get(ref);if(m.data()?.leaseToken!==token||m.data()?.status==='cancelled')return;tx.update(ref,{status:m.data().attempts>=5?'failed':'retry',retryAt:new Date(Date.now()+Math.min(3600000,60000*2**m.data().attempts)),leaseUntil:null,lastError:'Email delivery was not confirmed. Staff can review or retry.'});});}
  }
  async function run(){const pending=await db.collectionGroup('invoiceMessages').where('status','in',['queued','retry','sending']).limit(100).get();for(const m of pending.docs)await deliver(m.ref);return {examined:pending.size};}
  return {deliver,run};
}
function channelActive(record){return Boolean(record&&record.consented===true&&!record.withdrawnAt);}
function purchasedAgain(message,purchases){
  const current=(purchases||[]).find(item=>item.id===message.requestId);
  const currentAt=Date.parse(current?.paidAt||current?.createdAt||'')||0;
  return (purchases||[]).some(item=>item.id!==message.requestId&&['paid','in_fulfillment','fulfilled'].includes(item.status)&&(Date.parse(item.paidAt||item.createdAt||'')||0)>currentAt);
}
function decidePurchaseDelivery(message,context){
  const now=context.now||new Date();
  if(message.channel==='sms'||message.kind==='sms_follow_up'){
    if(!channelActive(context.preferences?.sms))return {action:'skip',reason:'sms_consent_required'};
    // TODO: Twilio delivery and inbound STOP are not connected. Never send SMS from this runner.
    return {action:'skip',reason:'sms_provider_not_configured'};
  }
  if(message.channel!=='email')return {action:'skip',reason:'unsupported_channel'};
  if(!channelActive(context.preferences?.email))return {action:'skip',reason:'email_consent_required'};
  if(!message.recipient)return {action:'skip',reason:'recipient_required'};
  if(message.kind==='next_offer'){
    const sendAfter=message.sendAfter?new Date(message.sendAfter):null;
    if(sendAfter&&!Number.isNaN(sendAfter.valueOf())&&sendAfter>now)return {action:'wait',reason:'scheduled'};
    if(purchasedAgain(message,context.purchases))return {action:'skip',reason:'repurchased'};
    if(!String(context.postalAddress||'').trim())return {action:'wait',reason:'postal_address_required'};
    if(!context.unsubscribeUrl)return {action:'wait',reason:'unsubscribe_required'};
    if(!context.groupUrl)return {action:'wait',reason:'group_url_required'};
  }
  if(message.kind==='song_link'&&!message.destinationUrl)return {action:'wait',reason:'destination_required'};
  if(!context.from)return {action:'wait',reason:'sender_required'};
  return {action:'send'};
}
function purchaseEmailText(message,context){
  if(message.kind==='next_offer'){
    return {subject:'Another song or a group booking from SongKeep',text:[`Hello,`,`It has been a few days since ${message.productName||'your SongKeep song'}.`,'You can order another song, or plan a group booking.',`Another song: ${message.destinationUrl}`,`Group booking: ${context.groupUrl}`,'You are receiving this because you agreed to emails from SongKeep.',`Unsubscribe: ${context.unsubscribeUrl}`,'','SongKeep',context.postalAddress].join('\n\n')};
  }
  return {subject:'Your song link from SongKeep',text:['Hello,','Your payment is confirmed. This email is only about opening the song you purchased.',message.productName||'Your song',message.experienceTitle?`Experience: ${message.experienceTitle}`:'',`Open your song: ${message.destinationUrl}`,'SongKeep shows the latest status for this purchase in your account.',context.from?`Questions? ${context.from}`:''].filter(Boolean).join('\n\n')};
}
function makePurchaseMailService(db,sendEmail,{now=()=>new Date()}={}){
  async function deliver(ref){
    const token=crypto.randomUUID();
    const claimed=await db.runTransaction(async tx=>{
      const doc=await tx.get(ref);if(!doc.exists)return null;const stored=doc.data();
      if(['sent','cancelled','failed','skipped'].includes(stored.status))return null;
      if(stored.status==='sending'&&stored.leaseUntil?.toMillis()>Date.now())return null;
      if(stored.retryAt?.toMillis()>Date.now())return null;
      const [user,settings,purchases]=await Promise.all([tx.get(db.doc(`users/${stored.userId}`)),tx.get(db.doc('platformSettings/invoicing')),tx.get(db.collection(`users/${stored.userId}/purchaseRequests`))]);
      const prefs=user.exists?user.data().communicationPreferences||{}:{};
      const appUrl=String(settings.data()?.appUrl||'').replace(/\/$/,'');
      const unsubscribeToken=prefs.email?.unsubscribeToken;
      const deliveryContext={preferences:serializable(prefs),purchases:purchases.docs.map(item=>({id:item.id,...serializable(item.data())})),postalAddress:settings.data()?.address||'',unsubscribeUrl:appUrl&&unsubscribeToken?`${appUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`:'',groupUrl:appUrl?`${appUrl}/begin`:'',from:settings.data()?.email||'',now:now()};
      const decision=decidePurchaseDelivery(serializable(stored),deliveryContext);
      if(decision.action==='skip'){tx.update(ref,{status:'skipped',skipReason:decision.reason,skippedAt:FieldValue.serverTimestamp(),leaseUntil:null});return null;}
      if(decision.action==='wait'){if(decision.reason!=='scheduled'&&(stored.status!=='held'||stored.lastError!==decision.reason))tx.update(ref,{status:'held',lastError:decision.reason,leaseUntil:null});return null;}
      if(stored.channel==='sms'||(stored.attempts||0)>=5){tx.update(ref,{status:stored.channel==='sms'?'skipped':'failed',skipReason:stored.channel==='sms'?'sms_provider_not_configured':null,lastError:stored.channel==='sms'?null:'Delivery needs staff review.',leaseUntil:null});return null;}
      tx.update(ref,{status:'sending',leaseToken:token,leaseUntil:new Date(Date.now()+120000),attempts:(stored.attempts||0)+1});
      return {message:serializable(stored),...deliveryContext};
    });
    if(!claimed||claimed.message.channel==='sms')return;
    try{
      const rendered=purchaseEmailText(claimed.message,claimed);
      const result=await sendEmail({to:claimed.message.recipient,from:claimed.from,...rendered,idempotencyKey:`songkeep-${sha256(ref.path)}`});
      await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.data()?.leaseToken!==token)return;tx.update(ref,{status:'sent',providerMessageId:result.id,sentAt:FieldValue.serverTimestamp(),leaseUntil:null});});
    }catch{
      await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.data()?.leaseToken!==token||current.data()?.status==='cancelled')return;const attempts=current.data().attempts||1;tx.update(ref,{status:attempts>=5?'failed':'retry',retryAt:new Date(Date.now()+Math.min(3600000,60000*2**attempts)),leaseUntil:null,lastError:'Email delivery was not confirmed. Staff can review or retry.'});});
    }
  }
  async function run(){
    const pending=await db.collectionGroup('purchaseMessages').where('status','in',['queued','retry','sending','held','scheduled']).limit(100).get();
    const rank={queued:0,retry:1,sending:2,held:3,scheduled:4};
    const docs=[...pending.docs].sort((a,b)=>(rank[a.data().status]??9)-(rank[b.data().status]??9));
    for(const item of docs)await deliver(item.ref);
    return {examined:docs.length};
  }
  return {deliver,run};
}
module.exports={makeMailService,emailText,shouldDeliver,makePurchaseMailService,purchaseEmailText,decidePurchaseDelivery};
