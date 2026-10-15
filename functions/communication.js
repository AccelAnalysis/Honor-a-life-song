'use strict';
const {randomUUID}=require('node:crypto');
const {FieldValue}=require('firebase-admin/firestore');
const {DomainError,requireValue,id,sha256,email}=require('./domain');
const EMAIL_CONSENT={
  channel:'email',
  version:'2026-10-email-1',
  language:"I agree to receive emails from SongKeep about the song I purchase, including a link to open that song, and later emails about another song or a group booking. I can unsubscribe at any time. Commercial emails include SongKeep's postal address. Consent is not required to purchase."
};
const SMS_CONSENT={
  channel:'sms',
  version:'2026-10-sms-1',
  language:'I agree to receive text messages from SongKeep about my purchase and SongKeep offers at the mobile number I provide. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help. Consent is not required to purchase.'
};
const stamp=()=>FieldValue.serverTimestamp();
function normalizePhone(value){
  const digits=String(value??'').replace(/\D/g,'');
  if(digits.length===10)return `+1${digits}`;
  if(digits.length===11&&digits.startsWith('1'))return `+${digits}`;
  if(digits.length>=10&&digits.length<=15)return `+${digits}`;
  return null;
}
function active(record){return Boolean(record&&record.consented===true&&!record.withdrawnAt);}
function planChannel(channel,current,granted,source,now,extra){
  if(granted!==true&&granted!==false)return null;
  if(source==='checkout'&&granted!==true)return null;
  if(active(current)&&granted===true)return null;
  if(source==='account_creation'&&current?.languageVersion&&!current.withdrawnAt&&(current.consented===true||current.consented===granted))return null;
  const copy=channel==='email'?EMAIL_CONSENT:SMS_CONSENT;
  const grantedNow=granted===true;
  let unsubscribeToken=current?.unsubscribeToken||null,tokenHash=null;
  if(channel==='email'&&grantedNow&&(!unsubscribeToken||current?.withdrawnAt)){unsubscribeToken=extra.token||randomUUID();tokenHash=sha256(unsubscribeToken);}
  const record={channel,consented:grantedNow,languageVersion:copy.version,language:copy.language,consentedAt:grantedNow?now:null,declinedAt:grantedNow?null:now,source,withdrawnAt:null,...(channel==='email'&&unsubscribeToken?{unsubscribeToken}:{}),...(channel==='sms'?{phone:extra.phone}:{})};
  return {record,tokenHash,event:{channel,action:grantedNow?'granted':'declined',source,languageVersion:copy.version,language:copy.language,createdAt:now,...(channel==='sms'?{phone:extra.phone}:{})}};
}
function planConsentChanges(existing,input){
  requireValue(['account_creation','checkout'].includes(input.source),'Choose where this choice was made.','invalid-argument');
  const now=input.now||new Date().toISOString();
  const current=existing||{};
  const phone=input.phone?normalizePhone(input.phone):null;
  if(input.phone&&!phone)throw new DomainError('Enter a valid mobile number.','invalid-argument');
  const storedPhone=phone||current.phone||null;
  if(input.sms===true&&!storedPhone)throw new DomainError('Add a mobile number to agree to text messages.','invalid-argument');
  const emailChange=planChannel('email',current.email,input.email,input.source,now,{token:input.token});
  const smsChange=planChannel('sms',current.sms,input.sms,input.source,now,{phone:storedPhone});
  const nextPhone=phone||current.phone||null;
  return {
    phone:nextPhone,
    email:emailChange?emailChange.record:current.email||null,
    sms:smsChange?smsChange.record:current.sms||null,
    emailWrite:emailChange?emailChange.record:null,
    smsWrite:smsChange?smsChange.record:null,
    events:[emailChange?.event,smsChange?.event].filter(Boolean),
    tokenHash:emailChange?.tokenHash||null,
    changed:Boolean(emailChange||smsChange||(phone&&phone!==current.phone))
  };
}
function planEmailWithdrawal(preferences,now=new Date().toISOString()){
  const emailRecord=preferences?.email;
  if(!emailRecord||emailRecord.consented!==true||emailRecord.withdrawnAt)return {changed:false,email:emailRecord||null};
  return {changed:true,email:{...emailRecord,consented:false,withdrawnAt:now},event:{channel:'email',action:'withdrawn',source:'unsubscribe',languageVersion:emailRecord.languageVersion||null,language:emailRecord.language||null,createdAt:now}};
}
function optionalEmail(value){
  if(typeof value!=='string'||!value.trim())return null;
  try{return email(value);}catch{return null;}
}
function followUpDelayDays(){
  const raw=process.env.SONGKEEP_FOLLOWUP_DELAY_DAYS;
  if(raw==null||raw==='')return 5;
  const days=Number(raw);
  return Number.isInteger(days)&&days>=1&&days<=90?days:5;
}
function purchaseMessagePlans(input){
  const requestId=id(input.requestId),userId=id(input.userId);
  const recipients=[...new Set([optionalEmail(input.buyerEmail),optionalEmail(input.deliveryEmail)].filter(Boolean))];
  requireValue(recipients.length,'The purchase needs a buyer email before SongKeep can queue a song link.','failed-precondition');
  const sendAfter=new Date(Date.parse(input.now||new Date().toISOString())+followUpDelayDays()*86400000).toISOString();
  const song=recipients.map((recipient,index)=>({
    id:index===0?`song-link-${requestId}`:`song-link-${requestId}-${sha256(recipient).slice(0,12)}`,
    data:{kind:'song_link',channel:'email',purpose:'transactional',status:'queued',userId,requestId,receiptId:input.receiptId,recipient,productName:input.productName||'Your SongKeep song',experienceTitle:input.experienceTitle||'',destinationUrl:input.destinationUrl,attempts:0}
  }));
  return {
    song,
    followUp:{id:`next-offer-${requestId}`,data:{kind:'next_offer',channel:'email',purpose:'commercial',status:'scheduled',userId,requestId,receiptId:input.receiptId,recipient:recipients[0],productName:input.productName||'Your SongKeep song',experienceTitle:input.experienceTitle||'',destinationUrl:input.destinationUrl,sendAfter,delayDays:followUpDelayDays(),attempts:0}},
    sms:{id:`sms-follow-up-${requestId}`,data:{kind:'sms_follow_up',channel:'sms',purpose:'commercial',status:'scheduled',userId,requestId,receiptId:input.receiptId,productName:input.productName||'Your SongKeep song',sendAfter,delayDays:followUpDelayDays(),attempts:0}}
  };
}
function queuePostPurchaseMessages(tx,db,input){
  const plans=purchaseMessagePlans(input);
  const base=`users/${id(input.userId)}/purchaseMessages`;
  for(const message of [...plans.song,plans.followUp,plans.sms])tx.create(db.doc(`${base}/${message.id}`),{...message.data,createdAt:stamp()});
  return plans;
}
function makeCommunicationService(db){
  async function save(actor,input){
    requireValue(actor?.uid,'Sign in to continue.','unauthenticated');
    const userRef=db.doc(`users/${id(actor.uid)}`);
    return db.runTransaction(async tx=>{
      const snap=await tx.get(userRef);
      const existing=snap.exists?snap.data().communicationPreferences||{}: {};
      const plan=planConsentChanges(existing,{...input,now:new Date().toISOString(),token:randomUUID()});
      if(!plan.changed)return {saved:true,unchanged:true};
      if(!snap.exists){
        tx.set(userRef,{communicationPreferences:{phone:plan.phone,updatedAt:stamp(),...(plan.emailWrite?{email:stampRecord(plan.emailWrite)}:{}),...(plan.smsWrite?{sms:stampRecord(plan.smsWrite)}:{})}});
      }else {
        const update={'communicationPreferences.updatedAt':stamp()};
        if(plan.phone&&plan.phone!==(existing.phone||null))update['communicationPreferences.phone']=plan.phone;
        if(plan.emailWrite)update['communicationPreferences.email']=stampRecord(plan.emailWrite);
        if(plan.smsWrite)update['communicationPreferences.sms']=stampRecord(plan.smsWrite);
        tx.update(userRef,update);
      }
      for(const event of plan.events)tx.create(userRef.collection('communicationConsentEvents').doc(),{...event,createdAt:stamp()});
      if(plan.tokenHash)tx.create(db.doc(`communicationUnsubscribeTokens/${plan.tokenHash}`),{userId:actor.uid,channel:'email',createdAt:stamp()});
      return {saved:true};
    });
  }
  async function unsubscribe(input){
    const token=typeof input?.token==='string'?input.token.trim():'';
    requireValue(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token),'This unsubscribe link is not valid.','invalid-argument');
    const tokenRef=db.doc(`communicationUnsubscribeTokens/${sha256(token)}`);
    return db.runTransaction(async tx=>{
      const tokenDoc=await tx.get(tokenRef);
      requireValue(tokenDoc.exists,'This unsubscribe link is not valid.','not-found');
      const userRef=db.doc(`users/${id(tokenDoc.data().userId)}`);
      const user=await tx.get(userRef);
      requireValue(user.exists,'This unsubscribe link is not valid.','not-found');
      const preferences=user.data().communicationPreferences||{};
      const plan=planEmailWithdrawal(preferences);
      if(!plan.changed)return {unsubscribed:true,already:true};
      tx.update(userRef,{'communicationPreferences.email':stampRecord(plan.email),'communicationPreferences.updatedAt':stamp()});
      tx.create(userRef.collection('communicationConsentEvents').doc(),{...plan.event,createdAt:stamp()});
      return {unsubscribed:true};
    });
  }
  return {save,unsubscribe};
}
function stampRecord(record){
  const next={...record};
  for(const field of ['consentedAt','declinedAt','withdrawnAt'])if(typeof next[field]==='string')next[field]=stamp();
  return next;
}
module.exports={EMAIL_CONSENT,SMS_CONSENT,normalizePhone,planConsentChanges,planEmailWithdrawal,purchaseMessagePlans,queuePostPurchaseMessages,followUpDelayDays,makeCommunicationService};
