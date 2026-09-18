'use strict';

const {randomBytes} = require('node:crypto');
const catalog = require('./catalog.json');
const {assertAdmin, authorize} = require('./security');
const {requireValue, id, text, email, sha256, serializable} = require('./domain');
const {FieldValue} = require('firebase-admin/firestore');

const nowField = () => FieldValue.serverTimestamp();
const DATE_STATES = ['proposed','held','confirmed'];
const STATUSES = ['draft','ready','viewed','claimed','change_requested','accepted','payment_pending','invoice_open','booked','expired','revoked'];

function makePreparedBookingService(db, {getBilling, now = () => new Date()} = {}) {
  const refFor = value => db.doc(`preparedBookings/${id(value)}`);
  const token = () => randomBytes(32).toString('base64url');

  function asDate(value, label, optional = false) {
    if (optional && !value) return null;
    const date = new Date(value);
    requireValue(Number.isFinite(date.valueOf()), `Choose a valid ${label}.`, 'invalid-argument');
    return date;
  }

  function validatePaymentOptions(value) {
    const options = Array.isArray(value) ? [...new Set(value)] : [];
    requireValue(options.length > 0 && options.every(item => ['card','invoice'].includes(item)), 'Choose card, invoice, or both.');
    return options;
  }

  function snapshot(data) {
    return {
      organizationName:data.organizationName,
      organizationKind:data.organizationKind,
      recipientName:data.recipientName,
      recipientEmail:data.recipientEmail,
      recipientTitle:data.recipientTitle||null,
      recipientPhone:data.recipientPhone||null,
      offeringId:data.offeringId,
      offeringName:data.offeringName,
      amountCents:data.amountCents,
      currency:'USD',
      scope:data.scope,
      preferredStartsAt:serializable(data.preferredStartsAt),
      dateStatus:data.dateStatus,
      holdExpiresAt:data.holdExpiresAt?serializable(data.holdExpiresAt):null,
      venue:data.venue||null,
      participantEstimate:data.participantEstimate||null,
      organizationGoal:data.organizationGoal||null,
      paymentOptions:data.paymentOptions,
      invoiceActivationPolicy:data.invoiceActivationPolicy||'payment_required',
      agreementVersion:data.agreementVersion,
      version:data.currentVersion
    };
  }

  function customerView(doc) {
    const data=serializable(doc.data());
    return {
      id:doc.id,status:data.status,organizationId:data.organizationId||undefined,
      organizationName:data.organizationName,organizationKind:data.organizationKind,
      recipientName:data.recipientName,recipientEmail:data.recipientEmail,
      recipientTitle:data.recipientTitle||undefined,recipientPhone:data.recipientPhone||undefined,
      offeringId:data.offeringId,offeringName:data.offeringName,amountCents:data.amountCents,currency:'USD',
      scope:data.scope,preferredStartsAt:data.preferredStartsAt,dateStatus:data.dateStatus,
      holdExpiresAt:data.holdExpiresAt||undefined,venue:data.venue||undefined,
      participantEstimate:data.participantEstimate||undefined,organizationGoal:data.organizationGoal||undefined,
      paymentOptions:data.paymentOptions,invoiceActivationPolicy:data.invoiceActivationPolicy||'payment_required',agreementVersion:data.agreementVersion,currentVersion:data.currentVersion,
      tokenExpiresAt:data.tokenExpiresAt,claimedByUserId:data.claimedByUserId||undefined,
      agreementId:data.agreementId||undefined,experienceRequestId:data.experienceRequestId||undefined,
      invoiceId:data.invoiceId||undefined,experienceId:data.experienceId||undefined
    };
  }

  async function requireBookingByToken(rawToken) {
    const hash=sha256(text(rawToken,'booking link',500));
    const match=await db.collection('preparedBookings').where('tokenHash','==',hash).limit(1).get();
    requireValue(!match.empty,'This booking link is no longer available.','not-found');
    const doc=match.docs[0], data=doc.data();
    requireValue(data.status!=='revoked','This booking link has been replaced.','failed-precondition');
    requireValue(!data.tokenExpiresAt || new Date(serializable(data.tokenExpiresAt)) >= now(),'This booking link has expired. Contact SongKeep for a new link.','failed-precondition');
    return doc;
  }

  function activity(tx, bookingRef, kind, actorUserId, detail={}) {
    tx.create(bookingRef.collection('activity').doc(), {kind,actorUserId:actorUserId||null,detail,createdAt:nowField()});
  }

  async function create(actor,input) {
    let rawToken=token(), bookingRef=db.collection('preparedBookings').doc(), versionRef=bookingRef.collection('versions').doc('v1');
    const offering=catalog[input.offeringId];
    requireValue(offering,'Choose an available SongKeep experience.','invalid-argument');
    const startsAt=asDate(input.preferredStartsAt,'date and time');
    const dateStatus=String(input.dateStatus||'proposed');
    requireValue(DATE_STATES.includes(dateStatus),'Choose whether the date is proposed, held, or confirmed.');
    const holdExpiresAt=asDate(input.holdExpiresAt,'hold expiration',true);
    requireValue(dateStatus!=='held'||holdExpiresAt,'A held date needs an expiration date.');
    const participantEstimate=input.participantEstimate==null?null:Number(input.participantEstimate);
    requireValue(participantEstimate===null||(Number.isInteger(participantEstimate)&&participantEstimate>=1&&participantEstimate<=10000),'Enter a valid participant estimate.');
    const data={
      status:'ready',
      organizationId:input.organizationId?id(input.organizationId):null,
      organizationName:text(input.organizationName,'organization name',160),
      organizationKind:text(input.organizationKind||'community_partner','organization type',80),
      recipientName:text(input.recipientName,'customer name',160),
      recipientEmail:email(input.recipientEmail),
      recipientTitle:text(input.recipientTitle,'title',120,true)||null,
      recipientPhone:text(input.recipientPhone,'phone number',80,true)||null,
      salesOwnerUserId:actor.uid,
      offeringId:input.offeringId,offeringName:offering.name,amountCents:offering.priceCents,currency:'USD',scope:offering.scope,
      preferredStartsAt:startsAt,dateStatus,holdExpiresAt,venue:text(input.venue,'location',500,true)||null,
      participantEstimate,organizationGoal:text(input.organizationGoal,'experience goal',2000,true)||null,
      paymentOptions:validatePaymentOptions(input.paymentOptions),
      invoiceActivationPolicy:input.invoiceActivationPolicy==='approved_receivable'?'approved_receivable':'payment_required',
      agreementVersion:'organization-service-v1',currentVersion:1,
      tokenHash:sha256(rawToken),tokenExpiresAt:new Date(now().valueOf()+14*86400000),
      claimedByUserId:null,agreementId:null,experienceRequestId:null,invoiceId:null,experienceId:null,
      createdAt:nowField(),updatedAt:nowField()
    };
    await db.runTransaction(async tx=>{
      await assertAdmin(tx,db,actor);
      if(data.organizationId){
        const org=await tx.get(db.doc(`organizations/${data.organizationId}`));
        requireValue(org.exists,'The organization could not be found.','not-found');
      }
      tx.create(bookingRef,data);
      tx.create(versionRef,{...snapshot(data),createdByUserId:actor.uid,createdAt:nowField()});
      activity(tx,bookingRef,'created',actor.uid,{version:1});
    });
    return {...customerView(await bookingRef.get()),token:rawToken,completionPath:`/complete/${rawToken}`};
  }

  async function list(actor) {
    await db.runTransaction(tx=>assertAdmin(tx,db,actor));
    const docs=await db.collection('preparedBookings').orderBy('createdAt','desc').limit(100).get();
    return docs.docs.map(doc=>customerView(doc));
  }

  async function resolve(actor,input) {
    const doc=await requireBookingByToken(input.token), ref=doc.ref;
    if(!doc.data().viewedAt && !['booked','revoked'].includes(doc.data().status)){
      await db.runTransaction(async tx=>{
        const current=await tx.get(ref); if(!current.exists||current.data().viewedAt)return;
        tx.update(ref,{viewedAt:nowField(),status:current.data().status==='ready'?'viewed':current.data().status,updatedAt:nowField()});
        activity(tx,ref,'viewed',actor?.uid||null);
      });
    }
    return customerView(await ref.get());
  }

  async function claim(actor,input) {
    requireValue(actor?.uid&&actor.email,'Sign in with the email address this booking was prepared for.','unauthenticated');
    const doc=await requireBookingByToken(input.token), ref=doc.ref, data=doc.data();
    requireValue(email(actor.email)===data.recipientEmail,'Sign in with the email address this booking was prepared for.','permission-denied');
    const organizationId=id(input.organizationId);
    await db.runTransaction(async tx=>{
      const current=await tx.get(ref);requireValue(current.exists,'Booking not found.','not-found');
      const c=current.data();
      requireValue(!c.organizationId||c.organizationId===organizationId,'This booking is already connected to another organization.');
      await authorize(tx,db,actor,organizationId,['organization_admin']);
      requireValue(!c.claimedByUserId||c.claimedByUserId===actor.uid,'This booking has already been claimed.');
      tx.update(ref,{organizationId,claimedByUserId:actor.uid,claimedAt:c.claimedAt||nowField(),status:['ready','viewed'].includes(c.status)?'claimed':c.status,updatedAt:nowField()});
      activity(tx,ref,'claimed',actor.uid,{organizationId});
    });
    return customerView(await ref.get());
  }

  async function sign(actor,input) {
    requireValue(actor?.uid,'Sign in to continue.','unauthenticated');
    requireValue(input.electronicRecordsAccepted===true,'Accept electronic records before signing.');
    const doc=await requireBookingByToken(input.token), ref=doc.ref, data=doc.data();
    requireValue(data.claimedByUserId===actor.uid&&data.organizationId,'Claim this booking before signing.');
    requireValue(!['revoked','expired','booked'].includes(data.status),'This booking cannot be signed in its current state.');
    const agreementId=`prepared-${doc.id}-v${data.currentVersion}`, agreementRef=db.doc(`organizations/${data.organizationId}/agreements/${agreementId}`);
    const commercialSnapshot=snapshot(data), commercialSnapshotHash=sha256(JSON.stringify(commercialSnapshot));
    await db.runTransaction(async tx=>{
      await authorize(tx,db,actor,data.organizationId,['organization_admin']);
      const current=await tx.get(ref);requireValue(current.data().currentVersion===data.currentVersion,'This booking was revised. Review the current version before signing.');
      tx.set(agreementRef,{
        organizationId:data.organizationId,title:'SongKeep service agreement',kind:'service_agreement',
        documentVersion:data.agreementVersion,status:'signed',relatedExperienceId:null,documentUrl:null,
        preparedBookingId:doc.id,preparedBookingVersion:data.currentVersion,commercialSnapshotHash,
        requestedAt:nowField(),signedAt:nowField(),signedByUserId:actor.uid,
        signedByName:text(input.signedByName,'signer name',160),signedByTitle:text(input.signedByTitle,'signer title',160),
        electronicRecordsAccepted:true
      });
      tx.update(ref,{agreementId,status:'accepted',acceptedAt:nowField(),updatedAt:nowField()});
      activity(tx,ref,'agreement_signed',actor.uid,{agreementId,version:data.currentVersion});
    });
    return customerView(await ref.get());
  }

  async function requestChange(actor,input) {
    const doc=await requireBookingByToken(input.token), ref=doc.ref;
    requireValue(actor?.uid&&doc.data().claimedByUserId===actor.uid,'Claim this booking before requesting a change.','permission-denied');
    const change=ref.collection('changeRequests').doc();
    await db.runTransaction(async tx=>{
      tx.create(change,{category:text(input.category||'other','change category',80),message:text(input.message,'change request',2000),status:'open',requestedByUserId:actor.uid,createdAt:nowField()});
      tx.update(ref,{status:'change_requested',updatedAt:nowField()});
      activity(tx,ref,'change_requested',actor.uid,{changeRequestId:change.id});
    });
    return {id:change.id};
  }

  async function rotate(actor,input) {
    const ref=refFor(input.bookingId), rawToken=token();
    await db.runTransaction(async tx=>{
      await assertAdmin(tx,db,actor);
      const current=await tx.get(ref);requireValue(current.exists,'Booking not found.','not-found');
      requireValue(current.data().status!=='booked','A completed booking does not need a new link.');
      tx.update(ref,{tokenHash:sha256(rawToken),tokenExpiresAt:new Date(now().valueOf()+14*86400000),status:current.data().status==='revoked'?'ready':current.data().status,updatedAt:nowField()});
      activity(tx,ref,'link_rotated',actor.uid);
    });
    return {token:rawToken,completionPath:`/complete/${rawToken}`};
  }

  async function revoke(actor,input) {
    const ref=refFor(input.bookingId);
    await db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const current=await tx.get(ref);requireValue(current.exists,'Booking not found.','not-found');tx.update(ref,{status:'revoked',revokedAt:nowField(),updatedAt:nowField()});activity(tx,ref,'revoked',actor.uid);});
    return {revoked:true};
  }

  async function complete(actor,input) {
    requireValue(actor?.uid,'Sign in to continue.','unauthenticated');
    const doc=await requireBookingByToken(input.token), ref=doc.ref, data=doc.data();
    requireValue(data.claimedByUserId===actor.uid&&data.organizationId,'Claim this booking before completing it.');
    requireValue(data.status==='accepted'&&data.agreementId,'Sign the service agreement before completing the booking.');
    const paymentMethod=String(input.paymentMethod);
    requireValue(data.paymentOptions.includes(paymentMethod),'Choose an available payment method.');
    const billing=getBilling();
    await billing.saveBilling(actor,{
      organizationId:data.organizationId,
      name:input.billing?.name||data.organizationName,
      contactName:input.billing?.contactName||data.recipientName,
      email:input.billing?.email||data.recipientEmail,
      address:input.billing?.address,
      purchaseOrder:input.billing?.purchaseOrder||''
    });
    const request=await billing.createRequest(actor,{
      organizationId:data.organizationId,offeringId:data.offeringId,preferredStartsAt:serializable(data.preferredStartsAt),
      requestedPaymentMethod:paymentMethod,agreementAcknowledged:true,idempotencyKey:`prepared-${doc.id}-v${data.currentVersion}`,
      venue:data.venue||'',participantEstimate:data.participantEstimate||undefined,organizationGoal:data.organizationGoal||'',
      acquisition:{source:'prepared_booking',content:doc.id}
    });
    await db.runTransaction(async tx=>{
      const current=await tx.get(ref);
      requireValue(current.exists&&current.data().currentVersion===data.currentVersion,'This booking changed while it was being completed.');
      tx.update(db.doc(`organizations/${data.organizationId}/experienceRequests/${request.id}`),{
        preparedBookingId:doc.id,preparedBookingVersion:data.currentVersion,agreementId:data.agreementId,
        salesOwnerUserId:data.salesOwnerUserId,dateStatus:data.dateStatus,holdExpiresAt:data.holdExpiresAt||null,updatedAt:nowField()
      });
    });
    const invoice=await billing.issue(actor,{organizationId:data.organizationId,invoiceId:request.id,discountCents:0},true);
    const approvedReceivable=paymentMethod==='invoice'&&data.invoiceActivationPolicy==='approved_receivable'
      ? await billing.activateApprovedReceivable({organizationId:data.organizationId,invoiceId:invoice.id,preparedBookingId:doc.id})
      : null;
    await db.runTransaction(async tx=>{
      const current=await tx.get(ref);
      requireValue(current.exists&&current.data().currentVersion===data.currentVersion,'This booking changed while it was being completed.');
      tx.update(ref,{experienceRequestId:request.id,invoiceId:invoice.id,...(approvedReceivable?{status:'booked',experienceId:approvedReceivable.experienceId,bookedAt:nowField()}:{status:paymentMethod==='invoice'?'invoice_open':'payment_pending'}),updatedAt:nowField()});
      activity(tx,ref,'commercial_request_created',actor.uid,{requestId:request.id,invoiceId:invoice.id,paymentMethod});
    });
    return {booking:customerView(await ref.get()),request,invoice:{id:invoice.id,invoiceNumber:invoice.invoiceNumber,status:invoice.status}};
  }

  async function markBookedFromExperience(preparedBookingId, experienceId) {
    const ref=refFor(preparedBookingId);
    await db.runTransaction(async tx=>{const current=await tx.get(ref);if(!current.exists||current.data().status==='booked')return;tx.update(ref,{status:'booked',experienceId,bookedAt:nowField(),updatedAt:nowField()});activity(tx,ref,'booked',null,{experienceId});});
  }

  return {create,list,resolve,claim,sign,requestChange,rotate,revoke,complete,markBookedFromExperience};
}

module.exports={makePreparedBookingService,STATUSES,DATE_STATES};
