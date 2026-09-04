/* End-to-end coverage uses the real Auth, Firestore and Functions emulators.
 * Never run against the production project. NODE_PATH points to isolated pinned test tools.
 */
const {chromium, expect} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {initializeApp} = require('../functions/node_modules/firebase-admin/app');
const {getFirestore} = require('../functions/node_modules/firebase-admin/firestore');
const {getAuth} = require('../functions/node_modules/firebase-admin/auth');
const projectId = 'demo-songkeep-account';
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8096');
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099');
initializeApp({projectId});
const db=getFirestore(), auth=getAuth(), output=process.env.SONGKEEP_E2E_OUTPUT || '/tmp/songkeep-e2e-results';
fs.mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:3010';
const results=[];
let current='initialization';
async function check(name,run) {current=name; await run(); results.push(name); console.log(`PASS: ${name}`);}
async function shot(page,name){await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});}
async function noInternal(page){assert(!/Saved to your relationship|Preview Complete|authoritative|canonical|FirebaseError|static preview|one continuous relationship/i.test(await page.locator('body').innerText()));}
async function fillRegistration(page,email,first,last,organization) {
 await page.getByLabel('First name',{exact:true}).fill(first);
 await page.getByLabel('Last name',{exact:true}).fill(last);
 await page.getByLabel('Email',{exact:true}).fill(email);
 if(organization) {await page.getByLabel('Organization or group name',{exact:true}).fill(organization);await page.getByLabel('Group type',{exact:true}).selectOption('business');}
 await page.getByLabel('Password',{exact:true}).fill('SongKeepTest123!');
 await page.getByLabel('Confirm password',{exact:true}).fill('SongKeepTest123!');
 await page.getByRole('button',{name:'Create account & continue',exact:true}).click();
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}}), page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let orgId, owner;
 try {
 await check('Package page stays focused and advertises the correct song limits',async()=>{
  await page.goto(`${origin}/services`); await expect(page.getByRole('heading',{name:'Choose your experience.'})).toBeVisible();
  await expect(page.getByText('Up to 6 songs',{exact:true})).toBeVisible();await expect(page.getByText('Up to 10 songs',{exact:true})).toBeVisible();await noInternal(page);
  await shot(page,'packages-desktop');
 });
 await check('Registration creates a real account and one reusable organization before event data',async()=>{
  await page.goto(`${origin}/begin?offering=honor-a-life-song-experience`);
  await expect(page.getByRole('button',{name:'Create account & continue',exact:true})).toBeEnabled({timeout:20000});
  await expect(page.getByLabel('Preferred date',{exact:true})).toHaveCount(0);await shot(page,'create-account-desktop');
  await fillRegistration(page,'owner@e2e.example','Jordan','Miller','Harmony Team');
  await expect(page.getByRole('heading',{name:'Tell us about your event.'})).toBeVisible({timeout:25000});
  owner=await auth.getUserByEmail('owner@e2e.example');
  const profile=(await db.doc(`users/${owner.uid}`).get()).data();assert.equal(profile.firstName,'Jordan');assert.equal(profile.lastName,'Miller');
  const orgs=await db.collection('organizations').where('createdBy','==',owner.uid).get();assert.equal(orgs.size,1);orgId=orgs.docs[0].id;
  assert.equal((await db.collection(`organizations/${orgId}/experiences`).get()).size,0);
  assert.equal((await db.collection(`organizations/${orgId}/experienceRequests`).get()).size,0);
  assert.equal((await db.doc(`organizations/${orgId}/members/${owner.uid}`).get()).data().role,'organization_admin');
  await expect(page.getByLabel('Organization or group name',{exact:true})).toHaveCount(0);await shot(page,'event-desktop');
 });
 await check('An unfinished event can be saved, revisited and resumed without duplicate names',async()=>{
  await page.getByLabel('Preferred date',{exact:true}).fill('2026-12-15');await page.getByLabel('Preferred start time',{exact:true}).fill('14:00');
  await page.getByLabel('Location or room').fill('Main hall');await page.getByLabel('Estimated participants').fill('18');
  await page.getByRole('button',{name:'Save and finish later',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Continue planning',exact:true})).toBeVisible({timeout:20000});await shot(page,'account-saved-plan');
  await page.goto(`${origin}/login`);await page.waitForURL('**/organization',{timeout:20000});
  await page.goto(`${origin}/begin?offering=honor-a-life-song-experience&organizationId=${orgId}`);
  await page.getByRole('button',{name:'Continue to event details',exact:true}).click();
  await expect(page.getByLabel('Preferred date',{exact:true})).toHaveValue('2026-12-15');await expect(page.getByLabel('Location or room')).toHaveValue('Main hall');
 });
 await check('An actual invoice request produces clear confirmation and prefilled account billing',async()=>{
  await page.getByRole('button',{name:'Review experience',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Review your experience.'})).toBeVisible();
  await page.getByLabel('I am authorized to book for this group.',{exact:false}).check();
  await page.getByRole('button',{name:'Request invoice',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Your invoice request is in.'})).toBeVisible({timeout:30000});await noInternal(page);await shot(page,'invoice-requested');
  const requests=await db.collection(`organizations/${orgId}/experienceRequests`).get();assert.equal(requests.size,1);
  assert.equal(requests.docs[0].data().amountCents,250000);assert.equal((await db.collection(`organizations/${orgId}/experiences`).get()).size,0);
  await page.getByRole('link',{name:'Go to my account',exact:true}).click();await expect(page.getByRole('heading',{name:'Requests & payment',exact:true})).toBeVisible({timeout:15000});await shot(page,'account-after-request');
  await page.getByRole('link',{name:'Invoices',exact:true}).click();
  await expect(page.getByLabel('Organization billing name',{exact:true})).toHaveValue('Harmony Team',{timeout:15000});
  await expect(page.getByLabel('Billing contact',{exact:true})).toHaveValue('Jordan Miller');await expect(page.getByLabel('Billing email',{exact:true})).toHaveValue('owner@e2e.example');await shot(page,'invoices-prefilled');
 });
 await check('Returning sign-in preserves the selected package and reuses the organization',async()=>{
  await page.goto(`${origin}/organization?org=${orgId}`);await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.goto(`${origin}/begin?offering=songkeep-legacy-album`);await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill('owner@e2e.example');await page.getByLabel('Password',{exact:true}).fill('SongKeepTest123!');
  await page.getByRole('button',{name:'Sign in & continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue to event details',exact:true}).click();
  await expect(page.getByText('Up to 10 songs',{exact:true})).toBeVisible();
  await page.getByLabel('Preferred date',{exact:true}).fill('2027-01-20');await page.getByLabel('Preferred start time',{exact:true}).fill('11:00');
  await page.getByRole('button',{name:'Review experience',exact:true}).click();await page.getByLabel('I am authorized to book for this group.',{exact:false}).check();await page.getByRole('button',{name:'Request invoice',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Your invoice request is in.'})).toBeVisible({timeout:20000});
  assert.equal((await db.collection('organizations').where('createdBy','==',owner.uid).get()).size,1);
  const requests=await db.collection(`organizations/${orgId}/experienceRequests`).get();assert.equal(requests.size,2);assert(requests.docs.some(d=>d.data().amountCents===600000));
 });
 await check('A verified second person joins the same account with limited role permissions',async()=>{
  await page.goto(`${origin}/organization/account?org=${orgId}`);await page.getByText('Invite a team member',{exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill('teammate@e2e.example');await page.getByLabel('Access',{exact:true}).selectOption('viewer');
  await page.getByRole('button',{name:'Create invitation',exact:true}).click();await expect(page.getByLabel('Team invitation link')).toBeVisible();
  const invite=await page.getByLabel('Team invitation link').inputValue();await shot(page,'team-invitation');
  const otherContext=await browser.newContext({viewport:{width:390,height:844}}), other=await otherContext.newPage();
  await other.goto(invite);await other.getByRole('link',{name:'Create account',exact:true}).click();
  await expect(other.getByLabel('Organization or group name',{exact:true})).toHaveCount(0);
  await fillRegistration(other,'teammate@e2e.example','Casey','Taylor');
  await expect(other.getByRole('heading',{name:'Verify your email.'})).toBeVisible({timeout:15000});
  const teammate=await auth.getUserByEmail('teammate@e2e.example');await auth.updateUser(teammate.uid,{emailVerified:true});
  // Refresh the token by signing in again; email verification is still enforced by the real rules.
  await otherContext.close();const verifiedContext=await browser.newContext({viewport:{width:390,height:844}}), verified=await verifiedContext.newPage();
  await verified.goto(`${origin}/login?next=${encodeURIComponent(new URL(invite).pathname+new URL(invite).search)}`);
  await verified.getByLabel('Email',{exact:true}).fill('teammate@e2e.example');await verified.getByLabel('Password',{exact:true}).fill('SongKeepTest123!');await verified.getByRole('button',{name:'Sign in & continue',exact:true}).click();
  await verified.getByRole('button',{name:'Join',exact:true}).click({timeout:20000});
  await expect(verified.getByRole('heading',{name:'Welcome to SongKeep.'})).toBeVisible({timeout:15000});
  assert.equal((await db.doc(`organizations/${orgId}/members/${teammate.uid}`).get()).data().role,'viewer');
  assert.equal((await db.collection('organizations').where('createdBy','==',teammate.uid).get()).size,0);
  await shot(verified,'teammate-mobile');
  await verified.goto(`${origin}/begin?offering=single-song-group-event&organizationId=${orgId}`);
  await expect(verified.getByRole('button',{name:'Continue to event details',exact:true})).toBeDisabled({timeout:10000});await verifiedContext.close();
 });
 await check('History includes past and upcoming experiences without losing transactions',async()=>{
  const stamp=new Date('2026-09-04T12:00:00Z');
  for(const [id,title,status,startsAt] of [['past','Summer celebration','closed','2026-08-20T14:00:00Z'],['next','Winter gathering','scheduled','2026-12-15T14:00:00Z']]) await db.doc(`organizations/${orgId}/experiences/${id}`).set({organizationId:orgId,title,status,startsAt,offeringId:'honor-a-life-song-experience',templateKind:'full_program',participantMode:'named_roster',billingStatus:'paid',createdAt:stamp,updatedAt:stamp});
  await page.goto(`${origin}/organization/experiences?org=${orgId}`);await expect(page.getByRole('heading',{name:'Past experiences',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Upcoming & in progress',exact:true})).toBeVisible();await noInternal(page);await shot(page,'experience-history');
 });
 await check('Mobile forms stay in the viewport and do not repeat account fields',async()=>{
  const mobileContext=await browser.newContext({viewport:{width:390,height:844}}), mobile=await mobileContext.newPage();
  await mobile.goto(`${origin}/begin?offering=honor-a-life-song-experience`);await expect(mobile.getByLabel('First name',{exact:true})).toBeVisible();
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(mobile,'create-account-mobile');
  await mobile.setViewportSize({width:320,height:720});assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await mobileContext.close();
 });
 await check('Marketing photos are real group images, crossfade, and respect reduced motion',async()=>{
  await page.goto(origin); const hero=page.locator('.consumerHeroMedia');
  await expect.poll(()=>hero.locator('img').first().evaluate(img=>img.naturalWidth),{timeout:30000}).toBeGreaterThan(0);
  await page.mouse.move(1435,995);await expect(hero.getByRole('button',{name:'Pause photos'})).toBeVisible({timeout:20000});await shot(page,'group-marketing');
  const first=await hero.getAttribute('data-photo');await page.waitForTimeout(10000);assert.notEqual(await hero.getAttribute('data-photo'),first);
  await hero.getByRole('button',{name:'Pause photos'}).click();await page.mouse.move(1435,995);const paused=await hero.getAttribute('data-photo');await page.waitForTimeout(9000);assert.equal(await hero.getAttribute('data-photo'),paused);
  await page.emulateMedia({reducedMotion:'reduce'});await expect(hero).toHaveAttribute('data-reduced-motion','true');assert.equal(await hero.getByRole('button').count(),0);
 });
 assert.deepEqual(errors,[]); console.log(`${results.length} end-to-end scenarios passed.`);
 } catch(error){console.error(`FAILED: ${current}`,error);await shot(page,'failure');fs.writeFileSync(path.join(output,'failure.txt'),`${current}\n${error.stack}\n${await page.locator('body').innerText()}\nPAGE ERRORS: ${JSON.stringify(errors)}`);process.exitCode=1;}
 finally {fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:results,failed:process.exitCode?current:null},null,2));await browser.close();await db.terminate();}
})().catch(error=>{console.error(error);process.exitCode=1;});
