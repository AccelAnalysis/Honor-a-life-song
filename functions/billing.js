'use strict';
const {FieldValue} = require('firebase-admin/firestore');
const {randomUUID} = require('node:crypto');
const catalog = require('./catalog.json');
const {authorize, assertAdmin, BUYERS} = require('./security');
const {requireValue, id, text, email, money, totals, serializable, invoiceStatus, reminderKind, paymentUpdate, sha256, invoiceNumber, checkoutActive} = require('./domain');
const nowField = () => FieldValue.serverTimestamp();
const invoicePath = (org, invoice) => `organizations/${id(org)}/invoices/${id(invoice)}`;
function makeBillingService(db, {renderPdf, bucket, now = () => new Date()} = {}) {
  const audit = (tx, actor, action, entityId, detail = {}) => tx.create(db.collection('billingAudit').doc(), {actorUserId:actor.uid, action, entityId, detail, createdAt:nowField()});
  const message = (tx, ref, key, kind, recipient, extra = {}) => tx.set(ref.collection('invoiceMessages').doc(key), {organizationId:ref.parent.parent.id, invoiceId:ref.id, kind, recipient, status:'queued', attempts:0, createdAt:nowField(), ...extra});
  async function cancelMessages(tx, ref) { return tx.get(ref.collection('invoiceMessages').where('status','in',['queued','retry','sending'])); }
  function cancelQueued(tx, messages) { for(const doc of messages.docs) tx.update(doc.ref,{status:'cancelled',cancelledAt:nowField()}); }
  function settings(input) {
    const dueDays = Number(input.dueDays), taxBasisPoints = Number(input.taxBasisPoints);
    requireValue(Number.isInteger(dueDays) && dueDays >= 1 && dueDays <= 90,'Choose payment terms between 1 and 90 days.');
    requireValue(Number.isInteger(taxBasisPoints) && taxBasisPoints >= 0 && taxBasisPoints <= 10000,'Enter an approved tax rate in basis points.');
    requireValue(input.taxReviewed === true,'Confirm the tax treatment has been reviewed before issuing invoices.');
    const appUrl = new URL(text(input.appUrl,'account URL',500));
    requireValue(appUrl.protocol === 'https:' && !appUrl.username && !appUrl.password && !appUrl.search && !appUrl.hash,'Use the HTTPS SongKeep site URL without query parameters.');
    return {legalName:text(input.legalName,'legal business name',160),dba:text(input.dba,'doing-business-as name',160,true),address:text(input.address,'business address',600),email:email(input.email),phone:text(input.phone,'business phone',80),paymentInstructions:text(input.paymentInstructions,'remittance instructions',2000),terms:text(input.terms,'service and cancellation terms',4000),dueDays,taxBasisPoints,taxReviewed:true,taxNote:text(input.taxNote,'tax-treatment explanation',500),autoIssue:input.autoIssue === true,appUrl:appUrl.toString().replace(/\/$/,'')};
  }
  async function configure(actor,input) { const config=settings(input); await db.runTransaction(async tx => {await assertAdmin(tx,db,actor);tx.set(db.doc('platformSettings/invoicing'),{...config,updatedBy:actor.uid,updatedAt:nowField()});audit(tx,actor,'invoice.settings','invoicing');});return config; }
  async function getSettings(actor) { return db.runTransaction(async tx => {await assertAdmin(tx,db,actor);const s=await tx.get(db.doc('platformSettings/invoicing'));return s.exists?serializable(s.data()):null;}); }
  async function saveBilling(actor,input) { const org=id(input.organizationId);const profile={name:text(input.name,'billing organization name',160),contactName:text(input.contactName,'billing contact',160),email:email(input.email),address:text(input.address,'billing address',600),purchaseOrder:text(input.purchaseOrder,'purchase-order number',100,true)};await db.runTransaction(async tx=>{await authorize(tx,db,actor,org,BUYERS);tx.update(db.doc(`organizations/${org}`),{billingProfile:profile,billingEmail:profile.email,updatedAt:nowField()});audit(tx,actor,'billing.profile',org);});return profile; }
  async function createRequest(actor,input) {
    const org=id(input.organizationId), offering=catalog[input.offeringId];
    requireValue(offering,'Choose an available experience.','invalid-argument');
    requireValue(input.agreementAcknowledged === true,'Confirm your authority to plan for this organization.');
    const startsAt = new Date(input.preferredStartsAt);
    requireValue(Number.isFinite(startsAt.valueOf()),'Choose a valid preferred date and time.','invalid-argument');
    requireValue(['card','invoice'].includes(input.requestedPaymentMethod),'Choose a payment method.');
    const nonce=id(input.idempotencyKey || randomUUID()), requestId=sha256(`${actor.uid}|${org}|${nonce}`).slice(0,32);
    const requestHash=sha256(JSON.stringify({offeringId:input.offeringId,preferredStartsAt:startsAt.toISOString(),requestedPaymentMethod:input.requestedPaymentMethod,venue:input.venue||null,participantEstimate:input.participantEstimate||null,organizationGoal:input.organizationGoal||null,sourceExperienceId:input.sourceExperienceId||null,replacesRequestId:input.replacesRequestId||null}));
    const requestRef=db.doc(`organizations/${org}/experienceRequests/${requestId}`), ref=db.doc(invoicePath(org,requestId));
    const request=await db.runTransaction(async tx=>{
      await authorize(tx,db,actor,org,['organization_admin']);
      const [organization, existing]=await Promise.all([tx.get(db.doc(`organizations/${org}`)),tx.get(requestRef)]);
      requireValue(organization.exists,'Organization not found.','not-found');
      if(existing.exists) {requireValue(existing.data().requestHash===requestHash && existing.data().createdByUserId===actor.uid,'This request identifier is already in use.');return {id:requestId,...serializable(existing.data())};}
      let previousRef, previousInvoice, previousMessages;
      if(input.sourceExperienceId) { const source=await tx.get(db.doc(`organizations/${org}/experiences/${id(input.sourceExperienceId)}`));requireValue(source.exists,'The previous experience could not be found.'); }
      if(input.replacesRequestId) {
        previousRef=db.doc(`organizations/${org}/experienceRequests/${id(input.replacesRequestId)}`);
        const previous=await tx.get(previousRef);
        requireValue(previous.exists && !['cancelled','converted'].includes(previous.data().status) && !previous.data().experienceId,'Only an open, unpaid request can be replaced.');
        const oldRef=db.doc(invoicePath(org,previous.data().invoiceId || previousRef.id));
        previousInvoice=await tx.get(oldRef);
        requireValue(previousInvoice.exists||!previous.data().invoiceUrl,'A prior external invoice needs staff reconciliation before changing the package.');
        if(previousInvoice.exists) {
          requireValue(previousInvoice.data().amountPaidCents===0 && !checkoutActive(previousInvoice.data(),now()),'Wait for the pending checkout to expire or ask SongKeep to reconcile the payment before changing experience.');
          previousMessages=await cancelMessages(tx,oldRef);
        }
      }
      const invoiceMethod=input.requestedPaymentMethod==='invoice';
      const participantEstimate=input.participantEstimate==null?null:Number(input.participantEstimate);
      requireValue(participantEstimate===null || (Number.isInteger(participantEstimate)&&participantEstimate>=1&&participantEstimate<=10000),'Enter a valid participant estimate.');
      const data={requestHash,organizationId:org,organizationName:organization.data().name,createdByUserId:actor.uid,offeringId:input.offeringId,offeringName:offering.name,amountCents:offering.priceCents,currency:'USD',status:invoiceMethod?'invoice_requested':'payment_pending',financialStatus:invoiceMethod?'invoice_requested':'payment_pending',requestedPaymentMethod:input.requestedPaymentMethod,preferredStartsAt:startsAt,venue:text(input.venue,'location',500,true)||null,participantEstimate,organizationGoal:text(input.organizationGoal,'experience goal',2000,true)||null,agreementAcknowledged:true,agreementVersion:'organization-planning-v1',sourceExperienceId:input.sourceExperienceId?id(input.sourceExperienceId):null,replacesRequestId:input.replacesRequestId||null,invoiceId:requestId,nurtureTrack:invoiceMethod?'invoice_payment':'payment_reconciliation',nextAction:'Your invoice is being prepared. Open billing to review your next step.',acquisition:Object.fromEntries(['source','medium','campaign','content','referralCode'].filter(k=>typeof input.acquisition?.[k]==='string').map(k=>[k,input.acquisition[k].slice(0,200)])),createdAt:nowField(),updatedAt:nowField()};
      if(previousRef) {tx.update(previousRef,{status:'cancelled',financialStatus:'cancelled',replacedByRequestId:requestId,supersededAt:nowField(),nurtureTrack:'consideration',nextAction:'Replaced by your new experience request.',updatedAt:nowField()}); if(previousInvoice?.exists){tx.update(previousInvoice.ref,{status:'void',voidedAt:nowField(),voidReason:'Package replaced',replacedByInvoiceId:requestId,updatedAt:nowField()});cancelQueued(tx,previousMessages);tx.update(db.doc(`organizations/${org}/orders/${previousInvoice.data().orderId}`),{status:'void',updatedAt:nowField()});}}
      tx.create(requestRef,data);
      tx.create(ref,{organizationId:org,requestId,orderId:requestId,offeringId:input.offeringId,status:'draft',invoiceNumber:null,commercial:null,amountPaidCents:0,amountRefundedCents:0,amountDueCents:offering.priceCents,currency:'USD',createdBy:actor.uid,createdAt:nowField(),updatedAt:nowField()});
      tx.create(db.doc(`organizations/${org}/orders/${requestId}`),{organizationId:org,requestId,invoiceId:requestId,offeringId:input.offeringId,status:'awaiting_payment',createdAt:nowField(),updatedAt:nowField()});
      audit(tx,actor,'request.created',requestId,{organizationId:org,replacesRequestId:input.replacesRequestId||null});
      return {id:requestId,...serializable({...data,createdAt:now(),updatedAt:now()})};
    });
    return request;
  }
  // Backfill only an unpaid legacy request. Never invent a second invoice over a live external one.
  async function prepare(actor,input) {
    const org=id(input.organizationId),requestId=id(input.requestId||input.invoiceId),ref=db.doc(invoicePath(org,requestId));
    await db.runTransaction(async tx=>{
      const authority=await authorize(tx,db,actor,org,BUYERS);
      const [invoice,request]=await Promise.all([tx.get(ref),tx.get(db.doc(`organizations/${org}/experienceRequests/${requestId}`))]);
      if(invoice.exists)return;
      requireValue(request.exists,'Request not found.','not-found');const r=request.data();
      requireValue(!r.experienceId&&!['converted','cancelled'].includes(r.status)&&!['paid','refunded'].includes(r.financialStatus),'An existing settled request must be reconciled, not invoiced again.');
      requireValue(!r.invoiceUrl||(authority.admin&&input.confirmExternalReplacement===true&&text(input.reason,'external invoice cancellation reference',500)),'An external invoice already exists. SongKeep must confirm its cancellation before replacing it.');
      const offer=catalog[r.offeringId];requireValue(offer&&offer.priceCents===r.amountCents,'This legacy price requires manual commercial review.');
      const orderRef=db.doc(`organizations/${org}/orders/${requestId}`),order=await tx.get(orderRef);
      requireValue(!order.exists,'An order already exists and needs reconciliation.');
      tx.create(ref,{organizationId:org,requestId,orderId:requestId,offeringId:r.offeringId,status:'draft',invoiceNumber:null,commercial:null,amountPaidCents:0,amountRefundedCents:0,amountDueCents:offer.priceCents,currency:'USD',createdBy:r.createdByUserId,legacyExternalInvoiceUrl:r.invoiceUrl||null,createdAt:nowField(),updatedAt:nowField()});
      tx.create(orderRef,{organizationId:org,requestId,invoiceId:requestId,offeringId:r.offeringId,status:'awaiting_payment',createdAt:nowField(),updatedAt:nowField()});
      tx.update(request.ref,{invoiceId:requestId,updatedAt:nowField()});audit(tx,actor,'invoice.legacy_prepared',requestId,{reason:input.reason||null});
    });return read(actor,{organizationId:org,invoiceId:requestId});
  }
  async function read(actor,input) {const ref=db.doc(invoicePath(input.organizationId,input.invoiceId)); return db.runTransaction(async tx=>{await authorize(tx,db,actor,input.organizationId,BUYERS);const doc=await tx.get(ref);requireValue(doc.exists,'Invoice not found.','not-found');const data=serializable(doc.data());return {id:doc.id,...data,status:invoiceStatus(data,now())};});}
  async function issue(actor,input, automatic=false) {
    const org=id(input.organizationId), ref=db.doc(invoicePath(org,input.invoiceId));
    const result=await db.runTransaction(async tx=>{
      const access=await authorize(tx,db,actor,org,BUYERS);
      const invoice=await tx.get(ref);requireValue(invoice.exists,'Invoice not found.','not-found');
      if(invoice.data().status!=='draft'){requireValue(invoice.data().commercial,'This draft was cancelled.');return {id:ref.id,...serializable(invoice.data())};}
      const [request,organization,configDoc]=await Promise.all([tx.get(db.doc(`organizations/${org}/experienceRequests/${invoice.data().requestId}`)),tx.get(db.doc(`organizations/${org}`)),tx.get(db.doc('platformSettings/invoicing'))]);
      requireValue(configDoc.exists,'SongKeep must complete its legal business, remittance, and reviewed tax settings before issuing this invoice.');
      const config=settings(configDoc.data());
      requireValue(access.admin || config.autoIssue,'Your request is saved. SongKeep will review and issue your invoice.');
      requireValue(request.exists && !['cancelled','converted'].includes(request.data().status),'This request is no longer awaiting payment.');
      const r=request.data(), offering=catalog[r.offeringId];requireValue(offering && r.amountCents===offering.priceCents,'The catalog and request amount need staff review.');
      const creator=await tx.get(db.doc(`organizations/${org}/members/${r.createdByUserId}`));
      const b=organization.data().billingProfile || {};
      const buyer={name:text(b.name||organization.data().name,'billing organization name',160),contactName:text(b.contactName||creator.data()?.displayName,'billing contact',160),email:email(b.email||organization.data().billingEmail||creator.data()?.email),address:text(b.address||organization.data().address,'billing address',600),purchaseOrder:text(b.purchaseOrder,'purchase-order number',100,true)};
      const discount=access.admin&&!automatic?money(input.discountCents||0):0;
      const total=totals(offering.priceCents,discount,config.taxBasisPoints);requireValue(total.totalCents>0,'A zero-balance experience requires a separately approved funding arrangement.');
      const issued=now(),year=issued.getUTCFullYear(),counterRef=db.doc(`invoiceCounters/${year}`),counter=await tx.get(counterRef),sequence=(counter.data()?.value||0)+1;
      const number=invoiceNumber(year,sequence),due=new Date(issued.valueOf()+config.dueDays*86400000).toISOString();
      const commercial={version:1,seller:{legalName:config.legalName,dba:config.dba,address:config.address,email:config.email,phone:config.phone},buyer,lineItems:[{quantity:1,description:`${offering.name}. ${offering.scope}`,unitAmountCents:offering.priceCents,amountCents:offering.priceCents}],...total,taxBasisPoints:config.taxBasisPoints,taxNote:config.taxNote,currency:'USD',issuedAt:issued.toISOString(),dueAt:due,serviceDate:serializable(r.preferredStartsAt),location:r.venue||'',experienceId:r.experienceId||null,paymentTerms:`Payment due within ${config.dueDays} days.`,paymentInstructions:config.paymentInstructions,terms:config.terms,amountPaidAtIssueCents:0,accountUrl:`${config.appUrl}/organization/invoices?organization=${encodeURIComponent(org)}&invoice=${encodeURIComponent(ref.id)}`};
      const data={status:'issued',invoiceNumber:number,commercial,commercialHash:sha256(JSON.stringify(commercial)),amountDueCents:total.totalCents,issuedAt:nowField(),updatedAt:nowField()};
      tx.set(counterRef,{value:sequence,updatedAt:nowField()});tx.update(ref,data);
      tx.update(request.ref,{invoiceId:ref.id,invoiceNumber:number,invoiceDueAt:new Date(due),invoiceUrl:commercial.accountUrl,status:r.requestedPaymentMethod==='invoice'?'invoice_open':'payment_pending',financialStatus:r.requestedPaymentMethod==='invoice'?'invoice_open':'payment_pending',nextAction:'Your invoice is ready. Pay online or review the payment instructions.',updatedAt:nowField()});
      tx.update(db.doc(`organizations/${org}/orders/${r.id||request.id}`),{totalCents:total.totalCents,currency:'USD',invoiceNumber:number,updatedAt:nowField()});
      message(tx,ref,'issued-v1','issued',buyer.email);
      audit(tx,actor,'invoice.issued',ref.id,{invoiceNumber:number,commercialHash:data.commercialHash});
      return {id:ref.id,...serializable(invoice.data()),...serializable({...data,issuedAt:issued,updatedAt:issued})};
    });
    if(renderPdf && bucket) await ensurePdf(result);
    return result;
  }
  async function ensurePdf(invoice) {
    requireValue(invoice.commercial && invoice.invoiceNumber,'The invoice has not been issued yet.');
    const ref=db.doc(invoicePath(invoice.organizationId,invoice.id));
    const path=`invoices/${invoice.organizationId}/${invoice.id}/v${invoice.commercial.version}.pdf`, file=bucket.file(path);
    let bytes;
    if((await file.exists())[0]) [bytes]=await file.download();
    else {bytes=await renderPdf(invoice);try{await file.save(bytes,{resumable:false,preconditionOpts:{ifGenerationMatch:0},metadata:{contentType:'application/pdf',cacheControl:'private, no-store',metadata:{invoiceId:invoice.id,commercialHash:invoice.commercialHash}}});}catch(error){if(Number(error.code)!==412) throw error;[bytes]=await file.download();}}
    const hash=sha256(bytes);
    await db.runTransaction(async tx=>{const current=await tx.get(ref);requireValue(current.data()?.commercialHash===invoice.commercialHash,'The invoice snapshot does not match.');tx.update(ref,{pdfStoragePath:path,pdfHash:hash,pdfVersion:invoice.commercial.version,pdfGeneratedAt:current.data().pdfGeneratedAt||nowField()});});
    return {bytes,hash};
  }
  async function download(actor,input) {const invoice=await read(actor,input);const {bytes,hash}=await ensurePdf(invoice);await db.runTransaction(async tx=>{await authorize(tx,db,actor,input.organizationId);audit(tx,actor,'invoice.downloaded',invoice.id,{pdfHash:hash});});return {pdfBase64:bytes.toString('base64'),sha256:hash,fileName:`${invoice.invoiceNumber}.pdf`};}
  async function viewed(actor,input){const ref=db.doc(invoicePath(input.organizationId,input.invoiceId));await db.runTransaction(async tx=>{await authorize(tx,db,actor,input.organizationId);const snap=await tx.get(ref);requireValue(snap.exists,'Invoice not found.');const i=snap.data();if(!i.commercial || i.viewedAt)return;tx.update(ref,{viewedAt:nowField(),status:invoiceStatus({...serializable(i),viewedAt:now().toISOString()},now())});});return read(actor,input);}
  async function send(actor,input) {
    const ref=db.doc(invoicePath(input.organizationId,input.invoiceId)),key=id(input.idempotencyKey||randomUUID());
    await db.runTransaction(async tx=>{const authority=await authorize(tx,db,actor,input.organizationId,BUYERS);const snap=await tx.get(ref);requireValue(snap.exists&&snap.data().commercial,'Issue the invoice before sending it.');const i=snap.data();requireValue(!['void','draft'].includes(i.status),'This invoice is not available to send.');const recipient=email(input.email||i.commercial.buyer.email);const existing=await tx.get(ref.collection('invoiceMessages').doc(key));if(existing.exists)return;
      if(recipient!==i.commercial.buyer.email && !authority.admin){const members=await tx.get(db.collection(`organizations/${input.organizationId}/members`).where('email','==',recipient));requireValue(members.docs.some(m=>m.data().status==='active'),'Invite this billing contact to the organization account before sending.');}
      requireValue(!i.lastSendRequestedAt || now()-new Date(serializable(i.lastSendRequestedAt))>=60000,'Please wait a minute before sending another copy.');
      message(tx,ref,key,'copy',recipient);tx.update(ref,{lastSendRequestedAt:nowField()});audit(tx,actor,'invoice.send_requested',ref.id,{recipient});
    });return {queued:true};
  }
  async function recordPayment(actor,input,provider=false) {
    const org=id(input.organizationId),ref=db.doc(invoicePath(org,input.invoiceId)),amount=money(input.amountCents,true),method=provider?'stripe':input.method;
    requireValue((provider?['stripe']:['check','bank_transfer','cash']).includes(method),'Choose a confirmed payment method.');
    if(!provider)requireValue(input.confirmed===true,'Confirm that the funds have been received.');
    const reference=text(input.reference,'payment reference',200),evidenceRef=db.doc(`paymentEvidence/${sha256(`${method}|${reference}`)}`);
    return db.runTransaction(async tx=>{
      if(!provider) await assertAdmin(tx,db,actor);
      const [snap,evidence]=await Promise.all([tx.get(ref),tx.get(evidenceRef)]);requireValue(snap.exists,'Invoice not found.','not-found');const invoice=snap.data();
      if(evidence.exists){requireValue(evidence.data().invoicePath===ref.path&&evidence.data().amountCents===amount,'This payment reference has already been used for another amount or invoice.');return {duplicate:true,experienceId:evidence.data().experienceId||null};}
      requireValue(provider || !checkoutActive(invoice,now()),'An online payment is in progress. Reconcile it or wait for checkout to expire before recording another payment.');
      requireValue(!provider || (input.currency==='usd'&&invoice.checkout?.sessionId===input.sessionId&&invoice.checkout?.amountCents===amount),'The processor payment does not match the invoice checkout.');
      requireValue(!invoice.amountRefundedCents,'Reconcile the refunded commercial balance before accepting another payment.');
      const changes=paymentUpdate(serializable(invoice),amount),requestRef=db.doc(`organizations/${org}/experienceRequests/${invoice.requestId}`),request=await tx.get(requestRef);
      requireValue(request.exists&&!['cancelled'].includes(request.data().status),'The source request is no longer payable.');
      const requests=request.data(),experienceId=requests.experienceId||`request-${invoice.requestId}`,expRef=db.doc(`organizations/${org}/experiences/${experienceId}`),existingExperience=await tx.get(expRef),pending=await cancelMessages(tx,ref);
      const fullyPaid=changes.status==='paid',offering=catalog[invoice.offeringId];requireValue(offering,'Offering not found.');
      tx.create(evidenceRef,{invoicePath:ref.path,organizationId:org,invoiceId:ref.id,amountCents:amount,currency:'USD',method,reference,recordedBy:actor.uid,confirmedAt:nowField(),experienceId:fullyPaid?experienceId:null});
      tx.update(ref,{...changes,checkout:null,...(fullyPaid?{paidAt:nowField(),experienceId}:{}),updatedAt:nowField()});
      tx.update(db.doc(`organizations/${org}/orders/${invoice.orderId}`),{amountPaidCents:changes.amountPaidCents,status:fullyPaid?'paid':'partially_paid',updatedAt:nowField()});
      if(fullyPaid){
        if(!existingExperience.exists)tx.create(expRef,{organizationId:org,title:offering.name,offeringId:invoice.offeringId,templateKind:offering.templateKind,participantMode:offering.participantMode,status:'preparing',startsAt:requests.preferredStartsAt,venue:requests.venue||null,participantExpectedCount:requests.participantEstimate||null,billingStatus:'paid',sourceExperienceRequestId:invoice.requestId,invoiceId:ref.id,dateStatus:'requested',nextAction:offering.participantMode==='group'?'Confirm your event and prepare the shared story.':offering.participantMode==='album_subject'?'Plan the album story sessions and permissions.':'Add participants and send individual permission links.',createdAt:nowField(),updatedAt:nowField()});
        else requireValue(existingExperience.data().sourceExperienceRequestId===invoice.requestId,'An experience with this identifier already belongs to another request.');
        tx.update(requestRef,{status:'converted',financialStatus:'paid',experienceId,nurtureTrack:'customer_onboarding',nextAction:'Your payment is confirmed. Open your experience to prepare.',paidAt:nowField(),updatedAt:nowField()});cancelQueued(tx,pending);
        tx.set(db.doc(`organizations/${org}/onboarding/${experienceId}`),{experienceId,invoiceId:ref.id,status:'ready',createdAt:nowField()});
        message(tx,ref,'onboarding','onboarding',invoice.commercial.buyer.email,{experienceId});
      }else tx.update(requestRef,{nextAction:'Your partial payment is recorded. Review the remaining balance in billing.',updatedAt:nowField()});
      message(tx,ref,`receipt-${evidenceRef.id}`,'receipt',invoice.commercial.buyer.email,{amountCents:amount,reference,method,amountDueCents:changes.amountDueCents});
      if(fullyPaid)tx.set(db.doc(`billingFollowUp/${org}-${ref.id}`),{organizationId:org,invoiceId:ref.id,status:'resolved',resolvedAt:nowField()},{merge:true});
      audit(tx,actor,'payment.confirmed',ref.id,{amountCents:amount,method,reference,experienceId:fullyPaid?experienceId:null});
      return {duplicate:false,experienceId:fullyPaid?experienceId:null,...changes};
    });
  }
  async function close(actor,input) {
    const org=id(input.organizationId),ref=db.doc(invoicePath(org,input.invoiceId)),action=input.action;
    requireValue(['void','uncollectible'].includes(action),'Choose a supported invoice action.');const reason=text(input.reason,'reason',1000);
    await db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const snap=await tx.get(ref);requireValue(snap.exists,'Invoice not found.');const i=snap.data();requireValue(!['paid','refunded','void','uncollectible'].includes(invoiceStatus(serializable(i),now()))&&!checkoutActive(i,now()),'This invoice cannot be closed while settled or during active checkout.');requireValue(action!=='void'||i.amountPaidCents===0,'An invoice with payments must be reconciled before replacement.');const pending=await cancelMessages(tx,ref);tx.update(ref,{status:action,[`${action}At`]:nowField(),closeReason:reason,updatedAt:nowField()});cancelQueued(tx,pending);tx.update(db.doc(`organizations/${org}/experienceRequests/${i.requestId}`),{status:'cancelled',financialStatus:'cancelled',nurtureTrack:'consideration',nextAction:`Invoice ${action}. Contact SongKeep for help.`,updatedAt:nowField()});tx.update(db.doc(`organizations/${org}/orders/${i.orderId}`),{status:action,updatedAt:nowField()});audit(tx,actor,`invoice.${action}`,ref.id,{reason});});return read(actor,input);
  }
  async function recordRefund(actor,input) {
    requireValue(input.confirmed===true,'Confirm that the refund transaction is complete.');
    const org=id(input.organizationId),ref=db.doc(invoicePath(org,input.invoiceId)),amount=money(input.amountCents,true),reference=text(input.reference,'confirmed refund reference',200),reason=text(input.reason,'refund reason',1000),evidence=db.doc(`refundEvidence/${sha256(reference)}`);
    await db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const [snap,prior]=await Promise.all([tx.get(ref),tx.get(evidence)]);requireValue(snap.exists,'Invoice not found.');if(prior.exists){requireValue(prior.data().invoicePath===ref.path&&prior.data().amountCents===amount,'Refund reference has already been used.');return;}const i=snap.data();requireValue(!checkoutActive(i,now())&&amount<=i.amountPaidCents-(i.amountRefundedCents||0),'Refund exceeds the refundable balance or checkout is still active.');const pending=await cancelMessages(tx,ref),total=(i.amountRefundedCents||0)+amount,full=total===i.amountPaidCents;
      tx.create(evidence,{invoicePath:ref.path,amountCents:amount,reference,reason,recordedBy:actor.uid,confirmedAt:nowField()});tx.update(ref,{amountRefundedCents:total,remindersPaused:true,...(full?{status:'refunded',refundedAt:nowField()}:{}),updatedAt:nowField()});cancelQueued(tx,pending);
      if(full){tx.update(db.doc(`organizations/${org}/experienceRequests/${i.requestId}`),{financialStatus:'refunded',nurtureTrack:'service_recovery',nextAction:'Your refund is recorded. SongKeep will confirm any closeout steps.',updatedAt:nowField()});tx.update(db.doc(`organizations/${org}/orders/${i.orderId}`),{status:'refunded',updatedAt:nowField()});if(i.experienceId)tx.update(db.doc(`organizations/${org}/experiences/${i.experienceId}`),{billingStatus:'refunded',updatedAt:nowField()});}
      message(tx,ref,`refund-${evidence.id}`,'refund',i.commercial.buyer.email,{amountCents:amount,reference});audit(tx,actor,'refund.confirmed',ref.id,{amountCents:amount,reference,reason});
    });return read(actor,input);
  }
  async function reminders() {
    let after=null,count=0;
    do {let query=db.collectionGroup('invoices').where('status','in',['issued','sent','viewed','partially_paid','overdue']).orderBy('__name__').limit(100);if(after)query=query.startAfter(after);const page=await query.get();if(page.empty)break;for(const snap of page.docs){await db.runTransaction(async tx=>{const current=await tx.get(snap.ref),i=serializable(current.data()),kind=reminderKind(i,now());if(!kind)return;const key=`${kind}-${now().toISOString().slice(0,10)}`,existing=await tx.get(snap.ref.collection('invoiceMessages').doc(key));if(existing.exists)return;message(tx,snap.ref,key,kind,i.commercial.buyer.email);tx.update(snap.ref,{status:invoiceStatus(i,now()),updatedAt:nowField()});if(kind==='overdue')tx.set(db.doc(`billingFollowUp/${i.organizationId}-${snap.id}`),{organizationId:i.organizationId,invoiceId:snap.id,status:'open',dueAt:nowField(),ownerUserId:null},{merge:true});count++;});}after=page.docs.at(-1);if(page.size<100)break;}while(after);return {queued:count};
  }
  return {configure,getSettings,saveBilling,createRequest,prepare,read,issue,ensurePdf,download,viewed,send,recordPayment,close,recordRefund,reminders};
}
module.exports={makeBillingService,invoicePath};
