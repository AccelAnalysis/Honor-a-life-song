/* Called by account-first.cjs against the same guarded, isolated emulator project. */
const {expect: baseExpect} = require('@playwright/test');
const assert = require('node:assert/strict');
const {randomBytes} = require('node:crypto');
const path = require('node:path');
const expect = baseExpect.configure({timeout:20000});

exports.verifyTeamRoles = async ({page, browser, db, auth, orgId, password, output}) => {
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8096');
 assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
 assert.equal(db.projectId,'demo-songkeep-account');
 const origin = 'http://127.0.0.1:3010';
 for (const role of ['program_coordinator','event_contact']) {
  const email = `${role}-${randomBytes(6).toString('hex')}@songkeep.invalid`;
  // Auth fixture is synthetic; invitation creation and all participant writes use the actual UI/rules.
  const invitedUser = await auth.createUser({email,password,emailVerified:true,displayName:'Event teammate'});
  await page.goto(`${origin}/organization/account?org=${orgId}`);
  await page.getByText('Invite a team member',{exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill(email);
  await page.getByLabel('Access',{exact:true}).selectOption(role);
  await page.getByRole('button',{name:'Create invitation',exact:true}).click();
  await expect(page.getByLabel('Team invitation link')).toBeVisible();
  const invitation = new URL(await page.getByLabel('Team invitation link').inputValue());
  const invitationDoc = await db.doc(`organizations/${orgId}/invitations/${invitation.searchParams.get('id')}`).get();
  assert.equal(invitationDoc.data().email,email);assert.equal(invitationDoc.data().role,role);
  const context = await browser.newContext({viewport:{width:1280,height:960}}), teammate = await context.newPage();
  try {
   await teammate.goto(`${origin}/login?next=${encodeURIComponent(invitation.pathname+invitation.search)}`);
   await teammate.getByLabel('Email',{exact:true}).fill(email);
   await teammate.getByLabel('Password',{exact:true}).fill(password);
   await teammate.getByRole('button',{name:'Sign in & continue',exact:true}).click();
   await teammate.getByRole('button',{name:'Join',exact:true}).click();
   await expect(teammate.getByRole('heading',{name:'Welcome to SongKeep.',exact:true})).toBeVisible();
   assert.equal((await db.doc(`organizations/${orgId}/members/${invitedUser.uid}`).get()).data().role,role);
   await teammate.goto(`${origin}/organization?org=${orgId}&experience=next`);
   await teammate.getByText('Add a person connected to this experience',{exact:true}).click();
   const personName = `Participant for ${role}`;
   await teammate.getByLabel('Participant or subject name',{exact:true}).fill(personName);
   await teammate.getByRole('button',{name:'Add person',exact:true}).click();
   await expect(teammate.getByText(personName,{exact:true})).toBeVisible();
   const participants = await db.collection(`organizations/${orgId}/experiences/next/participants`).where('displayName','==',personName).get();
   assert.equal(participants.size,1);assert.equal(participants.docs[0].data().permissionReadiness,'not_requested');
   const article = teammate.locator('article').filter({has:teammate.getByText(personName,{exact:true})});
   await article.getByText('Create permission link',{exact:true}).click();
   await article.getByLabel('Recipient email',{exact:true}).fill(email);
   await article.getByRole('button',{name:'Create secure link',exact:true}).click();
   await expect(teammate.getByText('Permission link ready',{exact:true})).toBeVisible();
   const permissions = await db.collection(`organizations/${orgId}/experiences/next/permissionInvitations`).where('participantId','==',participants.docs[0].id).get();
   assert.equal(permissions.size,1);assert.equal(permissions.docs[0].data().status,'pending');
   await teammate.screenshot({path:path.join(output,`${role}-participant-controls.png`),fullPage:true});
   await teammate.goto(`${origin}/begin?offering=single-song-group-event&organizationId=${orgId}`);
   await expect(teammate.getByRole('button',{name:'Continue to event details',exact:true})).toBeDisabled();
   console.log(`PASS: ${role} invitation, participant capture, permission request and purchase restriction`);
  } finally { await context.close(); }
 }
};
