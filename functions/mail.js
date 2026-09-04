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
module.exports={makeMailService,emailText,shouldDeliver};
