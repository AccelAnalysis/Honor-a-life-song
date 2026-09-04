'use strict';
const {FieldValue} = require('firebase-admin/firestore');
const {authorize, assertAdmin} = require('./security');
const {requireValue,id,text,email,serializable,sha256,money,hasRequiredAssets} = require('./domain');
const SCOPES=['participation','interview_recording','internal_creative_use','designated_family_sharing','private_performance','event_photo_video','public_marketing','sponsor_acknowledgment','testimonial','extended_retention'];
const STAGES=['post_event','closed','assets_processing'];
const stamp=()=>FieldValue.serverTimestamp();
function makeLifecycleService(db, {getIdentity} = {}) {
  const audit=(tx,actor,action,entityId)=>tx.create(db.collection('lifecycleAudit').doc(),{actorUserId:actor.uid,action,entityId,createdAt:stamp()});
  async function consentInTransaction(tx,actor,input,invitationRef) {
    const org=id(input.organizationId),experience=id(input.experienceId),participant=id(input.participantId),base=`organizations/${org}/experiences/${experience}`,pRef=db.doc(`${base}/participants/${participant}`);
    const [p,existing,entitlements,invitations]=await Promise.all([tx.get(pRef),tx.get(pRef.collection('consents')),tx.get(db.collection(`${base}/entitlements`).where('participantId','==',participant)),tx.get(db.collection(`${base}/accessInvitations`).where('participantId','==',participant))]);
    requireValue(p.exists,'Participant not found.');
    requireValue(existing.size+entitlements.size+invitations.size<380,'This consent revision needs a supervised migration because of its number of existing releases.');
    requireValue(['not_requested','pending','active','active_with_restrictions','withdrawn','expired','superseded'].includes(input.state),'Choose a valid permission state.');
    requireValue(Array.isArray(input.scopes)&&input.scopes.every(s=>SCOPES.includes(s)),'Choose supported permission scopes.');
    requireValue(['self','authorized_representative'].includes(input.authorityBasis),'Record the signer authority.');
    requireValue(['electronic','paper'].includes(input.source),'Record the consent source.');
    const restrictions=(input.restrictions||[]).map(r=>text(r,'restriction',1000));requireValue(restrictions.length<=20,'Use no more than 20 restrictions.');
    const families=[...new Set((input.designatedFamilyEmails||[]).map(email))];requireValue(families.length<=20,'Use no more than 20 family recipients.');
    if(['active','active_with_restrictions'].includes(input.state)){requireValue(input.scopes.length,'Choose the permitted uses.');requireValue(!input.scopes.includes('designated_family_sharing')||families.length,'Add at least one designated family email address.');}
    requireValue(input.state!=='active'||!restrictions.length,'Select active with restrictions when restrictions are present.');requireValue(input.state!=='active_with_restrictions'||restrictions.length,'Describe the restrictions.');
    const version=Math.max(p.data().permissionVersion||0,...existing.docs.map(d=>d.data().version||0))+1,consentRef=pRef.collection('consents').doc();
    const data={organizationId:org,experienceId:experience,participantId:participant,state:input.state,scopes:[...new Set(input.scopes)],restrictions,authorityBasis:input.authorityBasis,signedByName:text(input.signedByName,'signer name',160),source:input.source,participantDeliveryEmail:input.participantDeliveryEmail?email(input.participantDeliveryEmail):null,designatedFamilyEmails:families,version,effectiveAt:['active','active_with_restrictions'].includes(input.state)?stamp():null,withdrawnAt:input.state==='withdrawn'?stamp():null,createdAt:stamp(),createdBy:actor.uid};
    const readiness={active:'ready',active_with_restrictions:'restricted',withdrawn:'withdrawn'}[input.state]||'pending';
    for(const old of existing.docs)if(['active','active_with_restrictions'].includes(old.data().state))tx.update(old.ref,{state:'superseded',supersededAt:stamp()});
    tx.create(consentRef,data);tx.update(pRef,{permissionReadiness:readiness,permissionVersion:version,currentConsentId:consentRef.id,updatedAt:stamp()});
    for(const entitlement of entitlements.docs)if(entitlement.data().status!=='revoked')tx.update(entitlement.ref,{status:'revoked',revokedAt:stamp()});
    for(const invitation of invitations.docs)if(['pending','accepted'].includes(invitation.data().status))tx.update(invitation.ref,{status:'revoked',revokedAt:stamp()});
    if(invitationRef)tx.update(invitationRef,{status:'approved',consentRecordId:consentRef.id,reviewedAt:stamp(),reviewedBy:actor.uid});
    audit(tx,actor,'consent.version_created',consentRef.id);return consentRef.id;
  }
  async function saveConsent(actor,input){return db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);return consentInTransaction(tx,actor,input);});}
  async function submitPermission(actor,input) {
    requireValue(actor.uid&&actor.emailVerified,'Verify the invited email before submitting permissions.','permission-denied');
    requireValue(Array.isArray(input.scopes)&&input.scopes.every(scope=>SCOPES.includes(scope))&&input.scopes.includes('participation')&&input.scopes.includes('internal_creative_use'),'Participation and creative-use permission are required.');
    const families=[...new Set((input.designatedFamilyEmails||[]).map(email))];requireValue(families.length<=20,'Use no more than 20 family recipients.');
    requireValue(!input.scopes.includes('designated_family_sharing')||families.length,'Add at least one designated family email address.');
    requireValue(['self','authorized_representative'].includes(input.authorityBasis),'Record the signer authority.');
    const payload={signatureName:text(input.signatureName,'signature name',160),authorityBasis:input.authorityBasis,scopes:[...new Set(input.scopes)],restrictions:(input.restrictions||[]).map(r=>text(r,'restriction',1000)),participantDeliveryEmail:email(input.participantDeliveryEmail||actor.email),designatedFamilyEmails:families};
    requireValue(payload.restrictions.length<=20,'Use no more than 20 restrictions.');
    const hash=sha256(JSON.stringify(payload));
    return db.runTransaction(async tx=>{const ref=db.doc(`organizations/${id(input.organizationId)}/experiences/${id(input.experienceId)}/permissionInvitations/${id(input.invitationId)}`),invitation=await tx.get(ref);requireValue(invitation.exists&&email(invitation.data().recipientEmail)===email(actor.email),'Sign in with the invited email address.','permission-denied');
      if(invitation.data().status==='submitted'&&invitation.data().submittedByUserId===actor.uid&&invitation.data().responseHash===hash)return {submitted:true};
      requireValue(invitation.data().status==='pending','This invitation is no longer available.');
      tx.update(ref,{...payload,status:'submitted',submittedByUserId:actor.uid,submittedAt:stamp(),responseHash:hash});audit(tx,actor,'permission.submitted',ref.id);return {submitted:true};
    });
  }
  async function approvePermission(actor,input){return db.runTransaction(async tx=>{
    await assertAdmin(tx,db,actor);
    const org=id(input.organizationId),experience=id(input.experienceId),invitationRef=db.doc(`organizations/${org}/experiences/${experience}/permissionInvitations/${id(input.invitationId)}`),snapshot=await tx.get(invitationRef);requireValue(snapshot.exists,'Permission response not found.');
    const i=snapshot.data();if(i.status==='approved')return i.consentRecordId;
    requireValue(i.status==='submitted','Only a submitted permission response can be approved.');
    requireValue(i.scopes?.includes('participation')&&i.scopes?.includes('internal_creative_use'),'The participation and creative-use response is incomplete.');
    return consentInTransaction(tx,actor,{organizationId:org,experienceId:experience,participantId:i.participantId,state:i.restrictions?.length?'active_with_restrictions':'active',scopes:i.scopes,restrictions:i.restrictions,authorityBasis:i.authorityBasis,signedByName:i.signatureName,source:'electronic',participantDeliveryEmail:i.participantDeliveryEmail,designatedFamilyEmails:i.designatedFamilyEmails},invitationRef);
  });}
  async function currentAccess(tx,actor,accessId) {
    requireValue(actor.uid&&actor.emailVerified,'Sign in with your verified invited email address.','permission-denied');
    const accessDoc=await tx.get(db.doc(`users/${id(actor.uid)}/experienceAccess/${id(accessId)}`));requireValue(accessDoc.exists,'Open this product from an experience shared with you.','permission-denied');
    const access=accessDoc.data(),base=`organizations/${id(access.organizationId)}/experiences/${id(access.experienceId)}`,pRef=db.doc(`${base}/participants/${id(access.participantId)}`);
    const [invitation,participant,experience]=await Promise.all([tx.get(db.doc(`${base}/accessInvitations/${accessId}`)),tx.get(pRef),tx.get(db.doc(base))]);
    requireValue(invitation.exists&&invitation.data().status==='accepted'&&invitation.data().acceptedBy===actor.uid&&invitation.data().participantId===access.participantId&&invitation.data().recipient===access.recipient&&email(invitation.data().recipientEmail)===email(actor.email),'This invitation is no longer active.','permission-denied');
    requireValue(participant.exists&&experience.exists,'This experience is not available.','permission-denied');
    const latest=await tx.get(pRef.collection('consents').orderBy('version','desc').limit(1));const consent=latest.docs[0];
    requireValue(consent&&consent.data().state==='active'&&(!participant.data().currentConsentId||participant.data().currentConsentId===consent.id),'Current consent does not permit this action.','permission-denied');
    const required=access.recipient==='designated_family'?'designated_family_sharing':'participation';
    requireValue(consent.data().scopes.includes(required),'The current permission does not include this recipient.','permission-denied');
    const recipientEmails=access.recipient==='designated_family'?consent.data().designatedFamilyEmails:[consent.data().participantDeliveryEmail];requireValue(recipientEmails?.includes(email(actor.email)),'This email is not a currently designated recipient.','permission-denied');
    const ids=access.entitlementIds||[];requireValue(ids.length>0&&ids.length<=100,'No current entitlement is available.','permission-denied');
    const entitlements=await Promise.all(ids.map(e=>tx.get(db.doc(`${base}/entitlements/${id(e)}`))));const active=entitlements.filter(e=>e.exists&&e.data().status==='active'&&e.data().consentRecordId===consent.id&&e.data().participantId===access.participantId&&e.data().audience===access.recipient&&e.data().authorizedRecipientEmails?.includes(email(actor.email))&&e.data().requiredConsentScopes?.every(s=>consent.data().scopes.includes(s)));
    requireValue(active.length,'Your permission to these materials has changed. Contact SongKeep for help.','permission-denied');
    const assets=await Promise.all(active.map(e=>tx.get(db.doc(`organizations/${access.organizationId}/assets/${id(e.data().assetId)}`))));
    const permitted=assets.filter(a=>a.exists&&a.data().status==='ready'&&a.data().experienceId===access.experienceId&&(!a.data().workflowStatus||a.data().workflowStatus==='released'));
    requireValue(permitted.length,'No released materials are currently available.','permission-denied');
    return {access,experience:experience.data(),assets:permitted};
  }
  async function purchase(actor,input){const purchaseId=sha256(`${input.accessId}|${input.productId}`).slice(0,32);return db.runTransaction(async tx=>{
    const scope=await currentAccess(tx,actor,input.accessId);requireValue(STAGES.includes(scope.experience.status),'Products become available after the experience.');
    const productDoc=await tx.get(db.doc(`postExperienceProducts/${id(input.productId)}`)),ref=db.doc(`users/${actor.uid}/purchaseRequests/${purchaseId}`),prior=await tx.get(ref);
    requireValue(productDoc.exists&&productDoc.data().status==='active','This product is not currently available.');const product=productDoc.data();requireValue(product.audiences.includes(scope.access.recipient),'This product is not available for this recipient.','permission-denied');
    requireValue(hasRequiredAssets(product.kind,scope.assets.map(a=>a.data().kind)),'This product requires a permitted source material that has not been released to you.','permission-denied');
    if(prior.exists){requireValue(!['cancelled','refunded'].includes(prior.data().status),'Contact SongKeep to start a new order for this product.');return {request:{id:ref.id,...serializable(prior.data())}};}
    const access=scope.access,price=product.priceCents==null?null:money(product.priceCents,true);
    // This is a request, never proof of payment. Current consent is checked again at fulfillment.
    const data={userId:actor.uid,accessId:input.accessId,organizationId:access.organizationId,organizationName:access.organizationName,experienceId:access.experienceId,experienceTitle:access.experienceTitle,participantId:access.participantId,participantName:access.participantName,recipient:access.recipient,productId:productDoc.id,productName:product.name,priceCents:price,currency:'USD',requestedPaymentMethod:'invoice',status:'invoice_requested',createdAt:stamp(),updatedAt:stamp()};
    tx.create(ref,data);audit(tx,actor,'individual.purchase_requested',ref.id);return {request:{id:ref.id,...serializable({...data,createdAt:new Date(),updatedAt:new Date()})}};
  });}
  async function updatePurchase(actor,input){
    let identity;
    if(['paid','in_fulfillment','fulfilled'].includes(input.status)){
      await db.runTransaction(tx=>assertAdmin(tx,db,actor));
      requireValue(getIdentity,'Identity verification is unavailable.');
      identity=await getIdentity(id(input.userId));
      requireValue(identity&&!identity.disabled&&identity.emailVerified,'The recipient account must have a verified email.');
    }
    return db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const ref=db.doc(`users/${id(input.userId)}/purchaseRequests/${id(input.requestId)}`),snapshot=await tx.get(ref);requireValue(snapshot.exists,'Purchase request not found.');const p=snapshot.data();requireValue(!p.checkout,'Reconcile the online checkout before manually updating this purchase.');const transitions={invoice_requested:['payment_pending','paid','cancelled'],payment_pending:['paid','cancelled'],paid:['in_fulfillment','refunded'],in_fulfillment:['fulfilled','refunded'],fulfilled:['refunded'],cancelled:[],refunded:[]};requireValue(p.status===input.status||(transitions[p.status]||[]).includes(input.status),'This purchase cannot move to the requested state.');requireValue(['invoice_requested','payment_pending','paid','in_fulfillment','fulfilled','cancelled','refunded'].includes(input.status),'Choose a valid fulfillment status.');
    if(['paid','in_fulfillment','fulfilled'].includes(input.status)){await currentAccess(tx,{uid:input.userId,email:identity.email,emailVerified:identity.emailVerified},p.accessId);}
    if(['paid','refunded'].includes(input.status)){requireValue(input.confirmed===true,'Verify the actual payment or refund before recording it.');}if(['paid','refunded'].includes(input.status))text(input.reference,'confirmed payment or refund reference',200);
    requireValue(input.status!=='in_fulfillment'||p.status==='paid','Confirm payment before fulfillment.');requireValue(input.status!=='fulfilled'||p.status==='in_fulfillment','Start fulfillment before completing it.');
    tx.update(ref,{status:input.status,reconciliationReference:input.reference||p.reconciliationReference||null,updatedBy:actor.uid,updatedAt:stamp()});audit(tx,actor,'individual.purchase_updated',ref.id);return {saved:true};});}
  async function materials(actor,input){return db.runTransaction(async tx=>{const scope=await currentAccess(tx,actor,input.accessId);return scope.assets.map(a=>({id:a.id,organizationId:scope.access.organizationId,title:a.data().title,kind:a.data().kind}));});}
  async function reviewDeliverable(actor,input){return db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const ref=db.doc(`organizations/${id(input.organizationId)}/assets/${id(input.assetId)}`),snapshot=await tx.get(ref);requireValue(snapshot.exists&&snapshot.data().assignmentId,'Creator material not found.');requireValue(['submitted','approved','changes_requested','rejected'].includes(snapshot.data().workflowStatus),'This material cannot be reviewed in its current state.');requireValue(['approved','changes_requested','rejected'].includes(input.decision),'Choose a valid decision.');requireValue(snapshot.data().status==='ready','Wait for the file to finish uploading.');tx.update(ref,{workflowStatus:input.decision,reviewNotes:text(input.reviewNotes,'review notes',2000,true)||null,reviewedByUserId:actor.uid,reviewedAt:stamp(),updatedAt:stamp()});audit(tx,actor,'creator.material_reviewed',ref.id);return {reviewed:true};});}
  async function release(actor,input){return db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const org=id(input.organizationId),ref=db.doc(`organizations/${org}/assets/${id(input.assetId)}`),snapshot=await tx.get(ref);requireValue(snapshot.exists,'Material not found.');const a=snapshot.data();requireValue(a.workflowStatus==='approved'&&a.status==='ready'&&a.storagePath&&a.storageVerifiedAt&&a.storageChecksum,'Approve and verify the completed upload before release.');
    const audiences=[...new Set(input.audiences||[])];requireValue(audiences.length&&audiences.every(x=>['organization','participant','designated_family'].includes(x)),'Choose an audience.');
    let c=null;const base=`organizations/${org}/experiences/${id(a.experienceId)}`;
    if(a.participantId){const participant=await tx.get(db.doc(`${base}/participants/${id(a.participantId)}`)),consents=await tx.get(db.collection(`${base}/participants/${a.participantId}/consents`).orderBy('version','desc').limit(1));c=consents.docs[0];requireValue(participant.exists&&c?.data().state==='active','Active unrestricted permission is required for release.');for(const audience of audiences){const scope=audience==='designated_family'?'designated_family_sharing':audience==='organization'?(a.kind==='event_video'||a.kind==='photo'?'event_photo_video':'private_performance'):'participation';requireValue(c.data().scopes.includes(scope),`Permission for ${scope.replaceAll('_',' ')} is required.`);}}
    else requireValue(audiences.every(x=>x==='organization')&&text(input.rightsNote,'group-material permission review',1000),'Identify a participant before releasing private materials.');
    const old=await tx.get(db.collection(`${base}/entitlements`).where('assetId','==',ref.id));requireValue(old.size<350,'This release requires a supervised update.');
    for(const e of old.docs)tx.update(e.ref,{status:'revoked',revokedAt:stamp()});
    for(const audience of audiences.filter(x=>x!=='organization')){const recipients=audience==='participant'?[c.data().participantDeliveryEmail]:c.data().designatedFamilyEmails;requireValue(recipients?.length&&recipients.every(Boolean),'Record the designated recipient email before release.');tx.create(db.collection(`${base}/entitlements`).doc(),{organizationId:org,experienceId:a.experienceId,assetId:ref.id,participantId:a.participantId,audience,consentRecordId:c.id,requiredConsentScopes:[audience==='participant'?'participation':'designated_family_sharing'],authorizedRecipientEmails:recipients,status:'active',createdAt:stamp()});}
    tx.update(ref,{workflowStatus:'released',organizationVisible:audiences.includes('organization'),releasedAt:stamp(),releasedBy:actor.uid,rightsNote:input.rightsNote||null,updatedAt:stamp()});audit(tx,actor,'creator.material_released',ref.id);return {released:true};
  });}
  async function media(actor,input){return db.runTransaction(async tx=>{const org=id(input.organizationId),ref=db.doc(`organizations/${org}/assets/${id(input.assetId)}`),snapshot=await tx.get(ref);requireValue(snapshot.exists&&snapshot.data().storagePath,'Material not found.');const a=snapshot.data();let allowed=false;
    if(input.accessId){const scope=await currentAccess(tx,actor,input.accessId);allowed=scope.access.organizationId===org&&scope.assets.some(asset=>asset.id===ref.id);}
    else {requireValue(actor.uid,'Sign in to continue.','unauthenticated');const admin=await tx.get(db.doc(`admins/${id(actor.uid)}`));allowed=admin.exists&&admin.data().active!==false;if(!allowed&&a.assignmentId){const assignment=await tx.get(db.doc(`creatorAssignments/${id(a.assignmentId)}`));allowed=assignment.exists&&assignment.data().assignedUserId===actor.uid&&assignment.data().status!=='cancelled'&&assignment.data().organizationId===org;}
      if(!allowed){await authorize(tx,db,actor,org);requireValue(a.organizationVisible===true&&a.workflowStatus==='released','This material has not been released to the organization.','permission-denied');if(a.participantId){const c=await tx.get(db.collection(`organizations/${org}/experiences/${a.experienceId}/participants/${a.participantId}/consents`).orderBy('version','desc').limit(1));requireValue(c.docs[0]?.data().state==='active'&&c.docs[0].data().scopes.includes(a.kind==='event_video'||a.kind==='photo'?'event_photo_video':'private_performance'),'Current permission does not allow sharing this material.','permission-denied');}allowed=true;}}
    requireValue(typeof a.storagePath==='string'&&a.storagePath.startsWith(`organizations/${org}/creator-submissions/${a.assignmentId}/${ref.id}/`)&&!a.storagePath.includes('..'),'The file location requires staff review.','permission-denied');requireValue(allowed,'You do not have access to this material.','permission-denied');audit(tx,actor,'media.accessed',ref.id);return {storagePath:a.storagePath};
  });}
  return {materials,reviewDeliverable,saveConsent,submitPermission,approvePermission,purchase,updatePurchase,release,media,currentAccess};
}
module.exports={makeLifecycleService};
