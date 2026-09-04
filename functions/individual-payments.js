'use strict';
const {FieldValue}=require('firebase-admin/firestore');
const {randomUUID}=require('node:crypto');
const {id,requireValue,sha256,DomainError,hasRequiredAssets}=require('./domain');
const stamp=()=>FieldValue.serverTimestamp();
// Individual products remain separate from the three organization experience offerings.
function makeIndividualPaymentService(db,stripe,lifecycle){
  async function requestFor(actor,input){
    return db.runTransaction(async tx=>{
      requireValue(actor.uid&&actor.emailVerified,'Sign in with your verified invited email.','permission-denied');
      const ref=db.doc(`users/${id(actor.uid)}/purchaseRequests/${id(input.requestId)}`),p=await tx.get(ref);
      requireValue(p.exists,'Purchase request not found.','not-found');
      await lifecycle.currentAccess(tx,actor,p.data().accessId);
      return {ref,data:p.data()};
    });
  }
  async function checkout(actor,input){
    const found=await requestFor(actor,input),ref=found.ref;
    if(found.data.checkout?.sessionId){
      const prior=await stripe.checkout.sessions.retrieve(found.data.checkout.sessionId);
      if(prior.payment_status==='paid'){await confirm(prior);return {paid:true};}
      if(prior.status==='open'&&prior.url)return {url:prior.url};
      requireValue(prior.status==='expired','Your payment is still processing.');
      await db.runTransaction(async tx=>{const p=await tx.get(ref);if(p.data()?.checkout?.sessionId===prior.id)tx.update(ref,{checkout:null,updatedAt:stamp()});});
    }
    const reservation=await db.runTransaction(async tx=>{
      const [request,config]=await Promise.all([tx.get(ref),tx.get(db.doc('platformSettings/invoicing'))]);
      const p=request.data();const scope=await lifecycle.currentAccess(tx,actor,p.accessId);
      const product=await tx.get(db.doc(`postExperienceProducts/${id(p.productId)}`));
      requireValue(product.exists&&product.data().status==='active','This product is no longer available.');requireValue(product.data().audiences.includes(scope.access.recipient)&&hasRequiredAssets(product.data().kind,scope.assets.map(a=>a.data().kind)),'Current permission does not include the materials required by this product.','permission-denied');
      requireValue(['invoice_requested','payment_pending'].includes(p.status)&&Number.isSafeInteger(p.priceCents)&&p.priceCents>0,'SongKeep must confirm this product price before online payment.');
      requireValue(config.exists&&config.data().appUrl?.startsWith('https://'),'SongKeep must configure its secure account URL before payment.');
      if(p.checkout?.status==='creating')return p.checkout;
      requireValue(!p.checkout,'Refresh to check your current payment.');
      const checkout={key:randomUUID(),status:'creating',amountCents:p.priceCents,productName:p.productName,buyerEmail:actor.email,accountUrl:`${config.data().appUrl}/memories?purchase=${ref.id}`};
      tx.update(ref,{checkout,status:'payment_pending',requestedPaymentMethod:'card',updatedAt:stamp()});return checkout;
    });
    const session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_email:reservation.buyerEmail,client_reference_id:ref.id,metadata:{songkeep:'individual_purchase',userId:actor.uid,requestId:ref.id},line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:reservation.amountCents,product_data:{name:reservation.productName}}}],success_url:`${reservation.accountUrl}&payment=returned`,cancel_url:reservation.accountUrl},{idempotencyKey:`songkeep-product-${reservation.key}`});
    await db.runTransaction(async tx=>{const p=await tx.get(ref);requireValue(p.data()?.checkout?.key===reservation.key,'The checkout changed. Please contact SongKeep.');tx.update(ref,{checkout:{...reservation,status:'open',sessionId:session.id,url:session.url},updatedAt:stamp()});});
    return {url:session.url};
  }
  async function confirm(session){
    requireValue(session.mode==='payment'&&session.metadata?.songkeep==='individual_purchase'&&session.payment_status==='paid'&&session.currency==='usd','This payment is not a confirmed SongKeep purchase.');
    const uid=id(session.metadata.userId),ref=db.doc(`users/${uid}/purchaseRequests/${id(session.metadata.requestId)}`),reference=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id;
    requireValue(reference,'Payment confirmation is missing its transaction reference.');
    const evidence=db.doc(`paymentEvidence/${sha256(`stripe|${reference}`)}`);
    return db.runTransaction(async tx=>{
      const [snapshot,prior]=await Promise.all([tx.get(ref),tx.get(evidence)]);
      requireValue(snapshot.exists,'The paid purchase needs staff review.');const p=snapshot.data();
      if(prior.exists){requireValue(prior.data().purchasePath===ref.path&&prior.data().amountCents===session.amount_total,'The payment was already reconciled elsewhere.');return {duplicate:true};}
      requireValue(p.checkout?.sessionId===session.id&&p.checkout?.amountCents===session.amount_total&&p.priceCents===session.amount_total&&['payment_pending','invoice_requested'].includes(p.status),'This payment does not match the recorded purchase.');
      let fulfillmentHold=false;
      try{await lifecycle.currentAccess(tx,{uid,email:p.checkout.buyerEmail,emailVerified:true},p.accessId);}catch(error){if(!(error instanceof DomainError))throw error;fulfillmentHold=true;}
      tx.create(evidence,{purchasePath:ref.path,userId:uid,organizationId:p.organizationId,experienceId:p.experienceId,amountCents:session.amount_total,currency:'USD',method:'stripe',reference,confirmedAt:stamp()});
      tx.update(ref,{status:'paid',paidAt:stamp(),checkout:null,paymentReference:reference,fulfillmentHold,updatedAt:stamp()});
      tx.create(db.doc(`users/${uid}/purchaseReceipts/${evidence.id}`),{requestId:ref.id,productName:p.productName,organizationId:p.organizationId,experienceId:p.experienceId,amountCents:session.amount_total,currency:'USD',reference,createdAt:stamp()});
      if(fulfillmentHold)tx.set(db.doc(`billingExceptions/purchase-${ref.id}`),{userId:uid,requestId:ref.id,organizationId:p.organizationId,reason:'Payment confirmed after permissions changed. Review refund or permitted fulfillment; do not release material.',status:'needs_review',createdAt:stamp()});
      return {paid:true,fulfillmentHold};
    });
  }
  async function webhook(event){
    const original=event.data.object;if(original.metadata?.songkeep!=='individual_purchase')return;
    const session=await stripe.checkout.sessions.retrieve(original.id);
    if(session.payment_status==='paid'){
      try{return await confirm(session);}catch(error){if(!(error instanceof DomainError))throw error;await db.doc(`billingExceptions/${id(event.id)}`).set({userId:original.metadata.userId,requestId:original.metadata.requestId,eventId:event.id,sessionId:session.id,paymentIntentId:session.payment_intent,amountCents:session.amount_total,reason:error.message,status:'needs_review',createdAt:stamp()});return;}
    }
    if(!['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type))return;
    const ref=db.doc(`users/${id(original.metadata.userId)}/purchaseRequests/${id(original.metadata.requestId)}`);
    await db.runTransaction(async tx=>{const p=await tx.get(ref);if(p.data()?.checkout?.sessionId===session.id)tx.update(ref,{checkout:null,updatedAt:stamp()});});
  }
  return {checkout,confirm,webhook};
}
module.exports={makeIndividualPaymentService};
