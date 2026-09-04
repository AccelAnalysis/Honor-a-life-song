'use strict';
const {FieldValue} = require('firebase-admin/firestore');
const {randomUUID} = require('node:crypto');
const {authorize,BUYERS} = require('./security');
const {id,requireValue,invoiceStatus,serializable,DomainError} = require('./domain');
const stamp=()=>FieldValue.serverTimestamp();
function makePaymentService(db,stripe,billing) {
  async function applySession(session) {
    requireValue(session.mode==='payment'&&session.metadata?.songkeep==='invoice','This payment is not a SongKeep invoice.');
    requireValue(session.payment_status==='paid','The payment has not been confirmed.');
    return billing.recordPayment({uid:'stripe-webhook'},{organizationId:session.metadata.organizationId,invoiceId:session.metadata.invoiceId,amountCents:session.amount_total,currency:session.currency,sessionId:session.id,reference:typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id},true);
  }
  async function checkout(actor,input) {
    const org=id(input.organizationId),invoiceId=id(input.invoiceId),ref=db.doc(`organizations/${org}/invoices/${invoiceId}`);
    // The invoice may have an expired browser link but a real payment in flight.
    // Reconcile the provider state before ever creating a second session.
    let invoice=await billing.read(actor,input);
    if(invoice.checkout?.sessionId) {
      const prior=await stripe.checkout.sessions.retrieve(invoice.checkout.sessionId);
      if(prior.payment_status==='paid'){await applySession(prior);return {paid:true};}
      if(prior.status==='open'&&prior.url)return {url:prior.url};
      requireValue(prior.status==='expired','Your payment is still processing. SongKeep will confirm it here.');
      await db.runTransaction(async tx=>{await authorize(tx,db,actor,org,BUYERS);const current=await tx.get(ref);if(current.data()?.checkout?.sessionId===prior.id)tx.update(ref,{checkout:null,updatedAt:stamp()});});
    }
    const reservation=await db.runTransaction(async tx=>{
      await authorize(tx,db,actor,org,BUYERS);const current=await tx.get(ref);requireValue(current.exists,'Invoice not found.');invoice=serializable(current.data());
      requireValue(!['draft','paid','void','refunded','uncollectible'].includes(invoiceStatus(invoice)),'This invoice is not available for online payment.');
      if(invoice.checkout?.status==='creating')return invoice.checkout;
      requireValue(!invoice.checkout,'Your online payment is being reconciled. Please refresh.');
      const checkout={key:randomUUID(),status:'creating',amountCents:invoice.amountDueCents,createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+31*60000).toISOString()};
      tx.update(ref,{checkout,updatedAt:stamp()});return checkout;
    });
    // The same reservation key recovers from a timeout after Stripe accepted creation.
    const session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_email:invoice.commercial.buyer.email,client_reference_id:invoiceId,metadata:{songkeep:'invoice',organizationId:org,invoiceId},line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:reservation.amountCents,product_data:{name:`SongKeep invoice ${invoice.invoiceNumber}`,description:invoice.commercial.lineItems.map(i=>i.description).join('; ').slice(0,500)}}}],success_url:`${invoice.commercial.accountUrl}&payment=returned`,cancel_url:invoice.commercial.accountUrl},{idempotencyKey:`songkeep-invoice-${reservation.key}`});
    await db.runTransaction(async tx=>{const current=await tx.get(ref);requireValue(current.data()?.checkout?.key===reservation.key,'The checkout reservation changed. Contact SongKeep before paying.');tx.update(ref,{checkout:{...reservation,status:'open',sessionId:session.id,url:session.url,expiresAt:new Date(session.expires_at*1000).toISOString()},updatedAt:stamp()});});
    return {url:session.url};
  }
  async function webhook(event) {
    if(!['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type))return;
    const source=event.data.object;if(source.metadata?.songkeep!=='invoice')return;
    const session=await stripe.checkout.sessions.retrieve(source.id),ref=db.doc(`organizations/${id(source.metadata.organizationId)}/invoices/${id(source.metadata.invoiceId)}`);
    if(session.payment_status==='paid') {
      try {return await applySession(session);} catch(error) {
        if(!(error instanceof DomainError))throw error;
        await db.doc(`billingExceptions/${id(event.id)}`).set({organizationId:source.metadata.organizationId,invoiceId:source.metadata.invoiceId,eventId:event.id,sessionId:session.id,paymentIntentId:session.payment_intent,amountCents:session.amount_total,reason:error.message,status:'needs_review',createdAt:stamp()});
        return;
      }
    }
    await db.runTransaction(async tx=>{const current=await tx.get(ref);if(!current.exists||current.data().checkout?.sessionId!==session.id)return;if(session.status==='expired'||event.type==='checkout.session.async_payment_failed')tx.update(ref,{checkout:null,updatedAt:stamp()});else if(session.status==='complete')tx.update(ref,{'checkout.status':'processing',updatedAt:stamp()});});
  }
  async function cancelCheckout(actor,input) {
    const invoice=await billing.read(actor,input);
    if(!invoice.checkout)return {cancelled:true};
    requireValue(invoice.checkout.sessionId,'Resume checkout first so its provider status can be checked.');
    let session=await stripe.checkout.sessions.retrieve(invoice.checkout.sessionId);
    if(session.payment_status==='paid'){await applySession(session);return {paid:true};}
    if(session.status==='open')session=await stripe.checkout.sessions.expire(session.id);
    requireValue(session.status==='expired','The payment is processing and cannot be cancelled here.');
    const ref=db.doc(`organizations/${id(input.organizationId)}/invoices/${id(input.invoiceId)}`);
    await db.runTransaction(async tx=>{await authorize(tx,db,actor,input.organizationId,BUYERS);const current=await tx.get(ref);if(current.data()?.checkout?.sessionId===session.id)tx.update(ref,{checkout:null,updatedAt:stamp()});});
    return {cancelled:true};
  }
  return {checkout,cancelCheckout,webhook,applySession};
}
module.exports={makePaymentService};
