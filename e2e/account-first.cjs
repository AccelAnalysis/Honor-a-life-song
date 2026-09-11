/* Real browser + official emulators. This test cannot target a production project. */
const {chromium, expect: baseExpect} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes} = require('node:crypto');
const functionsRequire = require('node:module').createRequire(path.join(__dirname, '../functions/package.json'));
const {initializeApp} = functionsRequire('firebase-admin/app');
const {getFirestore} = functionsRequire('firebase-admin/firestore');
const {getAuth} = functionsRequire('firebase-admin/auth');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8096');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
initializeApp({projectId: 'demo-songkeep-account'});
const db = getFirestore(), auth = getAuth(), expect = baseExpect.configure({timeout: 20000});
const output = process.env.SONGKEEP_E2E_OUTPUT || '/tmp/songkeep-e2e-results';
const origin = 'http://127.0.0.1:3010';
const suffix = randomBytes(6).toString('hex');
const ownerEmail = `owner-${suffix}@songkeep.invalid`, teammateEmail = `team-${suffix}@songkeep.invalid`;
const password = `${randomBytes(20).toString('hex')}Aa1!`;
const passed = []; let current = 'initialization';
fs.mkdirSync(output, {recursive:true});
async function check(name, action) { current = name; await action(); passed.push(name); console.log(`PASS: ${name}`); }
async function shot(page, name) { await page.screenshot({path:path.join(output, `${name}.png`), fullPage:true}); }
const button = (page, name) => page.getByRole('button', {name, exact:true});
const heading = (page, name) => page.getByRole('heading', {name, exact:true});
async function cleanCopy(page) { assert(!/Saved to your relationship|Preview Complete|authoritative|canonical|FirebaseError|static preview|one continuous relationship/i.test(await page.locator('body').innerText())); }
async function register(page, email, first, last, group) {
 for (const [label, value] of [['First name',first],['Last name',last],['Email',email],['Password',password],['Confirm password',password]]) await page.getByLabel(label,{exact:true}).fill(value);
 if (group) { await page.getByLabel('Organization or group name',{exact:true}).fill(group); await page.getByLabel('Group type',{exact:true}).selectOption('business'); }
 await button(page, 'Create account & continue').click();
}
async function signIn(page, email) {
 await page.getByLabel('Email',{exact:true}).fill(email); await page.getByLabel('Password',{exact:true}).fill(password); await button(page,'Sign in & continue').click();
}
async function requestInvoice(page) {
 await button(page,'Review experience').click(); await expect(heading(page,'Review your experience.')).toBeVisible();
 await page.getByLabel('I am authorized to book for this group.',{exact:false}).check(); await button(page,'Request invoice').click();
 await expect(heading(page,'Your invoice request is in.')).toBeVisible(); await cleanCopy(page);
}
(async () => {
 const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
 const context = await browser.newContext({viewport:{width:1440,height:1000}}), page = await context.newPage();
 const errors = []; context.on('page', p => p.on('pageerror', e => errors.push(e.message))); page.on('pageerror',e => errors.push(e.message));
 page.setDefaultTimeout(20000);
 let orgId, owner;
 try {
  await check('Focused package page and correct song limits', async () => {
   await page.goto(`${origin}/services`); await expect(heading(page,'Choose your experience.')).toBeVisible();
   for (const count of [6,10]) await expect(page.getByText(`Up to ${count} songs`,{exact:true})).toBeVisible();
   await cleanCopy(page); await shot(page,'packages-desktop');
  });
  await check('Account and organization exist before event data', async () => {
   await page.goto(`${origin}/begin?offering=honor-a-life-song-experience`); await expect(button(page,'Create account & continue')).toBeEnabled();
   await expect(page.getByLabel('Preferred date',{exact:true})).toHaveCount(0); await shot(page,'create-account-desktop');
   await register(page,ownerEmail,'Jordan','Miller','Harmony Team'); await expect(heading(page,'Tell us about your event.')).toBeVisible();
   owner = await auth.getUserByEmail(ownerEmail);
   const profile = (await db.doc(`users/${owner.uid}`).get()).data(); assert.equal(profile.firstName,'Jordan'); assert.equal(profile.lastName,'Miller');
   const orgs = await db.collection('organizations').where('createdBy','==',owner.uid).get(); assert.equal(orgs.size,1); orgId = orgs.docs[0].id;
   for (const collection of ['experiences','experienceRequests']) assert.equal((await db.collection(`organizations/${orgId}/${collection}`).get()).size,0);
   assert.equal((await db.doc(`organizations/${orgId}/members/${owner.uid}`).get()).data().role,'organization_admin');
   await expect(page.getByLabel('Organization or group name',{exact:true})).toHaveCount(0); await shot(page,'event-desktop');
  });
  await check('Save and resume retains event details without repeated account input', async () => {
   await page.getByLabel('Preferred date',{exact:true}).fill('2027-12-15'); await page.getByLabel('Preferred start time',{exact:true}).fill('14:00');
   await page.getByLabel('Location or room').fill('Main hall'); await page.getByLabel('Estimated participants').fill('18');
   await button(page,'Save and finish later').click(); await expect(heading(page,'Continue planning')).toBeVisible(); await shot(page,'account-saved-plan');
   await page.goto(`${origin}/login`); await page.waitForURL('**/organization');
   await page.goto(`${origin}/begin?offering=honor-a-life-song-experience&organizationId=${orgId}`); await button(page,'Continue to event details').click();
   await expect(page.getByLabel('Preferred date',{exact:true})).toHaveValue('2027-12-15'); await expect(page.getByLabel('Location or room')).toHaveValue('Main hall');
  });
  await check('Real invoice request, clear confirmation and prefilled billing', async () => {
   await requestInvoice(page); await shot(page,'invoice-requested');
   const requests = await db.collection(`organizations/${orgId}/experienceRequests`).get(); assert.equal(requests.size,1); assert.equal(requests.docs[0].data().amountCents,250000);
   assert.equal((await db.collection(`organizations/${orgId}/experiences`).get()).size,0);
   await page.getByRole('link',{name:'Go to my account',exact:true}).click(); await expect(heading(page,'Requests & payment')).toBeVisible(); await shot(page,'account-after-request');
   await page.getByRole('link',{name:'Invoices',exact:true}).click();
   for (const [label,value] of [['Organization billing name','Harmony Team'],['Billing contact','Jordan Miller'],['Billing email',ownerEmail]]) await expect(page.getByLabel(label,{exact:true})).toHaveValue(value);
   await shot(page,'invoices-prefilled');
  });
  await check('Returning sign-in and second package reuse the same organization', async () => {
   await page.goto(`${origin}/organization?org=${orgId}`); await button(page,'Sign out').click();
   await page.goto(`${origin}/begin?offering=songkeep-legacy-album`); await button(page,'Sign in').click(); await signIn(page,ownerEmail); await button(page,'Continue to event details').click();
   await expect(page.getByText('Up to 10 songs',{exact:true})).toBeVisible(); await page.getByLabel('Preferred date',{exact:true}).fill('2028-01-20'); await page.getByLabel('Preferred start time',{exact:true}).fill('11:00');
   await requestInvoice(page); assert.equal((await db.collection('organizations').where('createdBy','==',owner.uid).get()).size,1);
   const requests = await db.collection(`organizations/${orgId}/experienceRequests`).get(); assert.equal(requests.size,2); assert(requests.docs.some(d => d.data().amountCents === 600000));
  });
  await check('Verified teammate joins existing organization without purchasing authority', async () => {
   await page.goto(`${origin}/organization/account?org=${orgId}`); await page.getByText('Invite a team member',{exact:true}).click();
   await page.getByLabel('Email address',{exact:true}).fill(teammateEmail); await page.getByLabel('Access',{exact:true}).selectOption('viewer'); await button(page,'Create invitation').click();
   await expect(page.getByLabel('Team invitation link')).toBeVisible(); const invitation = await page.getByLabel('Team invitation link').inputValue(); await shot(page,'team-invitation');
   const otherContext = await browser.newContext({viewport:{width:390,height:844}}), other = await otherContext.newPage();
   await other.goto(invitation); await other.getByRole('link',{name:'Create account',exact:true}).click(); await expect(other.getByLabel('Organization or group name',{exact:true})).toHaveCount(0);
   await register(other,teammateEmail,'Casey','Taylor'); await expect(heading(other,'Verify your email.')).toBeVisible();
   const teammate = await auth.getUserByEmail(teammateEmail); await auth.updateUser(teammate.uid,{emailVerified:true}); await otherContext.close();
   const verifiedContext = await browser.newContext({viewport:{width:390,height:844}}), verified = await verifiedContext.newPage();
   const inviteUrl = new URL(invitation); await verified.goto(`${origin}/login?next=${encodeURIComponent(inviteUrl.pathname+inviteUrl.search)}`); await signIn(verified,teammateEmail); await button(verified,'Join').click();
   await expect(heading(verified,'Welcome to SongKeep.')).toBeVisible(); assert.equal((await db.doc(`organizations/${orgId}/members/${teammate.uid}`).get()).data().role,'viewer');
   assert.equal((await db.collection('organizations').where('createdBy','==',teammate.uid).get()).size,0); await shot(verified,'teammate-mobile');
   await verified.goto(`${origin}/begin?offering=single-song-group-event&organizationId=${orgId}`); await expect(button(verified,'Continue to event details')).toBeDisabled(); await verifiedContext.close();
  });
  await check('Past and upcoming experiences remain alongside transaction history', async () => {
   for (const [id,title,status,startsAt] of [['past','Summer celebration','closed','2026-08-20T14:00:00Z'],['next','Winter gathering','scheduled','2028-12-15T14:00:00Z']]) await db.doc(`organizations/${orgId}/experiences/${id}`).set({organizationId:orgId,title,status,startsAt,offeringId:'honor-a-life-song-experience',templateKind:'full_program',participantMode:'named_roster',billingStatus:'paid',createdAt:new Date(),updatedAt:new Date()});
   await page.goto(`${origin}/organization/experiences?org=${orgId}`); await expect(heading(page,'Past experiences')).toBeVisible(); await expect(heading(page,'Upcoming & in progress')).toBeVisible(); await cleanCopy(page); await shot(page,'experience-history');
  });
  await check('Mobile account forms fit 390px and 320px viewports', async () => {
   const mobileContext = await browser.newContext({viewport:{width:390,height:844}}), mobile = await mobileContext.newPage();
   await mobile.goto(`${origin}/begin?offering=honor-a-life-song-experience`); await expect(mobile.getByLabel('First name',{exact:true})).toBeVisible();
   assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)); await shot(mobile,'create-account-mobile');
   await mobile.setViewportSize({width:320,height:720}); assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)); await mobileContext.close();
  });
  await check('Group photography loads, crossfades, pauses and respects reduced motion', async () => {
   await page.bringToFront(); await page.goto(origin); const hero = page.locator('.consumerHeroMedia');
   await expect.poll(() => hero.locator('img').first().evaluate(img => img.naturalWidth),{timeout:30000}).toBeGreaterThan(0);
   // Hover pauses the hero by design. Keep the pointer on the header, outside the photography.
   await page.locator('.publicHeader').hover(); await expect(button(hero,'Pause photos')).toBeVisible(); await shot(page,'group-marketing');
   assert.equal(await page.evaluate(() => document.visibilityState),'visible');
   const initial = await hero.getAttribute('data-photo'); await expect.poll(() => hero.getAttribute('data-photo'),{timeout:15000}).not.toBe(initial);
   await button(hero,'Pause photos').click(); await page.locator('.publicHeader').hover(); const paused = await hero.getAttribute('data-photo'); await page.waitForTimeout(9000); assert.equal(await hero.getAttribute('data-photo'),paused);
   await page.emulateMedia({reducedMotion:'reduce'}); await expect(hero).toHaveAttribute('data-reduced-motion','true'); await expect(hero.getByRole('button')).toHaveCount(0);
  });
  assert.deepEqual(errors,[]); console.log(`${passed.length} end-to-end scenarios passed.`);
 } catch (error) {
  console.error(`FAILED: ${current}`,error); await shot(page,'failure').catch(() => {}); fs.writeFileSync(path.join(output,'failure.txt'),`${current}\n${error.stack}\n${await page.locator('body').innerText()}\nPAGE ERRORS: ${JSON.stringify(errors)}`); process.exitCode = 1;
 } finally {
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed,failed:process.exitCode ? current : null},null,2)); await browser.close(); await db.terminate();
 }
})().catch(error => { console.error(error); process.exitCode=1; });
