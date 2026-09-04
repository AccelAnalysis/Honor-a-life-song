'use strict';
const {createHash} = require('node:crypto');
class DomainError extends Error {
  constructor(message, code = 'failed-precondition') { super(message); this.code = code; }
}
function requireValue(condition, message, code) { if (!condition) throw new DomainError(message, code); }
function id(value) {
  requireValue(typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value), 'Choose a valid record.', 'invalid-argument');
  return value;
}
function text(value, label, max = 2000, optional = false) {
  const result = typeof value === 'string' ? value.trim() : '';
  requireValue((optional || result.length > 0) && result.length <= max, `Enter a valid ${label}.`, 'invalid-argument');
  return result;
}
function email(value) {
  const result = text(value, 'email address', 254).toLowerCase();
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 'Enter a valid email address.', 'invalid-argument');
  return result;
}
function money(value, positive = false) {
  requireValue(Number.isSafeInteger(value) && value >= (positive ? 1 : 0) && value <= 1000000000, 'Enter an amount in whole cents within the supported range.', 'invalid-argument');
  return value;
}
function totals(subtotal, discount, basisPoints) {
  money(subtotal); money(discount);
  requireValue(discount <= subtotal && Number.isInteger(basisPoints) && basisPoints >= 0 && basisPoints <= 10000, 'Review the discount and approved tax rate.', 'invalid-argument');
  const tax = Math.round((subtotal - discount) * basisPoints / 10000);
  return {subtotalCents: subtotal, discountCents: discount, taxCents: tax, totalCents: money(subtotal - discount + tax)};
}
function timestamp(value) { return value?.toDate ? value.toDate().toISOString() : value instanceof Date ? value.toISOString() : value; }
function serializable(value) {
  if (value?.toDate || value instanceof Date) return timestamp(value);
  if (Array.isArray(value)) return value.map(serializable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, serializable(v)]));
  return value;
}
function invoiceStatus(invoice, now = new Date()) {
  if (['draft','void','uncollectible','refunded','paid'].includes(invoice.status)) return invoice.status;
  if (invoice.amountPaidCents >= invoice.commercial.totalCents) return 'paid';
  if (new Date(invoice.commercial.dueAt) < now) return 'overdue';
  if (invoice.amountPaidCents > 0) return 'partially_paid';
  return invoice.viewedAt ? 'viewed' : invoice.sentAt ? 'sent' : 'issued';
}
function reminderKind(invoice, now = new Date()) {
  if (invoice.remindersPaused || ['draft','void','uncollectible','refunded','paid'].includes(invoiceStatus(invoice, now))) return null;
  const day = 86400000, due = new Date(invoice.commercial.dueAt), issued = new Date(invoice.commercial.issuedAt);
  const date = now.toISOString().slice(0,10), dueDate = due.toISOString().slice(0,10);
  if (date > dueDate) return 'overdue';
  if (date === dueDate) return 'due_today';
  if (due - now <= 3 * day) return 'due_soon';
  if (!invoice.viewedAt && now - issued >= 2 * day) return 'not_viewed';
  if (invoice.viewedAt && now - issued >= 5 * day) return 'payment_reminder';
  return null;
}
function paymentUpdate(invoice, amountCents) {
  money(amountCents, true);
  requireValue(!['draft','void','uncollectible','refunded','paid'].includes(invoiceStatus(invoice)), 'This invoice cannot receive another payment.');
  requireValue(amountCents <= invoice.amountDueCents, 'Payment exceeds the remaining invoice balance.');
  const amountPaidCents = invoice.amountPaidCents + amountCents;
  return {amountPaidCents, amountDueCents: invoice.commercial.totalCents - amountPaidCents, status: amountPaidCents === invoice.commercial.totalCents ? 'paid' : 'partially_paid'};
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function invoiceNumber(year, sequence) { requireValue(Number.isInteger(sequence) && sequence > 0, 'Invalid invoice sequence.'); return `SK-${year}-${String(sequence).padStart(6,'0')}`; }
function checkoutActive(invoice, now = new Date()) { return Boolean(invoice.checkout && ['creating','open','processing'].includes(invoice.checkout.status)); }
module.exports = {DomainError, requireValue, id, text, email, money, totals, timestamp, serializable, invoiceStatus, reminderKind, paymentUpdate, sha256, invoiceNumber, checkoutActive};

function hasRequiredAssets(kind, assetKinds) {
  const kinds={digital_song:['song'],printed_lyrics:['lyrics'],song_card:['lyrics','keepsake'],event_video:['event_video'],photo_music_package:['photo','song'],additional_copy:['song','lyrics','keepsake'],personalized_follow_on:['song','lyrics'],other:['song','lyrics','photo','event_video','keepsake','album_artwork','release_link','other']};
  return kind==='photo_music_package' ? ['photo','song'].every(value=>assetKinds.includes(value)) : (kinds[kind]||[]).some(value=>assetKinds.includes(value));
}
module.exports.hasRequiredAssets=hasRequiredAssets;
