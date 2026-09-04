'use strict';
const {FieldValue}=require('firebase-admin/firestore');
const {requireValue,id}=require('./domain');
const {assertAdmin}=require('./security');
// Uploads are immutable. Remove Firebase download tokens before allowing a release.
function makeStorageIntegrity(db,bucket){
  async function verify(path){
    const match=/^organizations\/([A-Za-z0-9_-]+)\/creator-submissions\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/([A-Za-z0-9._-]+)$/.exec(path||'');
    requireValue(match&&!path.includes('..'),'This upload path is not supported.');
    const [,organizationId,assignmentId,assetId]=match;
    const file=bucket.file(path),[metadata]=await file.getMetadata();
    requireValue(Number(metadata.size)>0&&Number(metadata.size)<=250*1024*1024,'The uploaded file is empty or too large.');
    requireValue(metadata.md5Hash||metadata.crc32c,'The uploaded file has no verified checksum.');
    await file.setMetadata({cacheControl:'private, no-store',metadata:{firebaseStorageDownloadTokens:null}});
    await db.runTransaction(async tx=>{
      const ref=db.doc(`organizations/${organizationId}/assets/${assetId}`),[asset,assignment]=await Promise.all([tx.get(ref),tx.get(db.doc(`creatorAssignments/${assignmentId}`))]);
      requireValue(asset.exists&&assignment.exists&&assignment.data().organizationId===organizationId&&asset.data().storagePath===path&&asset.data().assignmentId===assignmentId,'This file does not match its assignment.');
      requireValue(metadata.metadata?.submittedByUserId===assignment.data().assignedUserId&&metadata.metadata?.assignmentId===assignmentId,'The upload does not match its submitting creator.');
      requireValue(metadata.contentType===asset.data().mimeType,'The uploaded file type does not match its material record.');
      tx.update(ref,{storageVerifiedAt:FieldValue.serverTimestamp(),storageGeneration:metadata.generation,storageChecksum:metadata.md5Hash||metadata.crc32c,storageByteLength:Number(metadata.size)});
    });
    return {verified:true};
  }
  async function verifyMaterial(actor,input){const asset=await db.runTransaction(async tx=>{await assertAdmin(tx,db,actor);const a=await tx.get(db.doc(`organizations/${id(input.organizationId)}/assets/${id(input.assetId)}`));requireValue(a.exists,'Material not found.');return a.data();});return verify(asset.storagePath);}
  return {verify,verifyMaterial};
}
module.exports={makeStorageIntegrity};
