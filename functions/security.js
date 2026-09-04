'use strict';
const {requireValue, id} = require('./domain');
async function authorize(tx, db, actor, organizationId, roles) {
  requireValue(actor?.uid, 'Sign in to continue.', 'unauthenticated');
  const admin = await tx.get(db.doc(`admins/${id(actor.uid)}`));
  if (admin.exists && admin.data().active !== false) return {admin: true};
  requireValue(organizationId, 'This action is available only to SongKeep staff.', 'permission-denied');
  const member = await tx.get(db.doc(`organizations/${id(organizationId)}/members/${id(actor.uid)}`));
  requireValue(member.exists && member.data().status === 'active' && (!roles || roles.includes(member.data().role)), 'Your account does not have permission for this action.', 'permission-denied');
  return {admin: false, member: member.data()};
}
async function assertAdmin(tx, db, actor) { return authorize(tx, db, actor, null); }
const BUYERS = ['organization_admin','billing_contact'];
module.exports = {authorize, assertAdmin, BUYERS};
