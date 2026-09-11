/* Regression tests for the standalone public presentation; no accounts or external services. */
const {chromium, expect: baseExpect} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const expect = baseExpect.configure({timeout:10000});
const documentPath = path.join(__dirname, '../public/presentations/songkeep-customer-pipeline.html');
const output = process.env.SONGKEEP_PRESENTATION_OUTPUT || '/tmp/songkeep-presentation-results';
fs.mkdirSync(output,{recursive:true});
const results=[];
let current='startup', browser, server, page;
// Canvas resolves computed color(), rgb() and color-mix() consistently in Chromium.
async function contrastReport(page) {
 return page.evaluate(() => {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  function rgba(color){ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map(v=>v/255);}
  function over(f,b){return [f[0]*f[3]+b[0]*(1-f[3]),f[1]*f[3]+b[1]*(1-f[3]),f[2]*f[3]+b[2]*(1-f[3]),1];}
  function luminance(c){return c.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
  return [...document.querySelectorAll('.outcome-line strong,.offer strong,.stage-badge,.choice-number,.activity-number,.menu-stage-number,.gate-node span,.growth-node span,.menu-stage strong')]
   .filter(el=>el.getClientRects().length && getComputedStyle(el).visibility!=='hidden')
   .map(el=>{
    let bg=[1,1,1,1];const ancestors=[];for(let node=el;node;node=node.parentElement) ancestors.unshift(node);
    for(const node of ancestors) bg=over(rgba(getComputedStyle(node).backgroundColor),bg);
    const fg=over(rgba(getComputedStyle(el).color),bg), l1=luminance(fg), l2=luminance(bg);
    return {text:el.textContent.trim(),selector:el.className||el.tagName,ratio:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};
   });
 });
}
async function check(name, action){current=name;await action();results.push(name);console.log(`PASS: ${name}`);}
async function verifySlide(id){
 const active=page.locator('.slide:not([hidden])');await expect(active).toHaveCount(1);await expect(active).toHaveAttribute('id',id);
 assert(await page.evaluate(()=>[...document.querySelectorAll('.slide[hidden]')].every(el=>el.inert&&el.getAttribute('aria-hidden')==='true')));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.slide:not([hidden])')].every(el=>el.scrollWidth<=el.clientWidth+1)),`Horizontal overflow on ${id}`);
 const contrast=await contrastReport(page);assert(contrast.every(item=>item.ratio>=4.5),JSON.stringify({id,failing:contrast.filter(item=>item.ratio<4.5)}));
}
(async()=>{
 try {
  const html=fs.readFileSync(documentPath);
  server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}/presentations/songkeep-customer-pipeline.html`;
  browser=await chromium.launch({headless:true});
  const errors=[];
  for(const appearance of ['light','dark']) for(const width of [1440,390,320]) {
   const label=`${appearance}-${width}`,context=await browser.newContext({viewport:{width,height:width===1440?960:844},colorScheme:appearance,reducedMotion:'reduce'});
   page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);
   await check(`${label}: all 24 slides reflow and stage text meets 4.5:1`,async()=>{
    const ids=await page.locator('.slide').evaluateAll(slides=>slides.map(s=>s.id));assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);
    for(let i=0;i<ids.length;i++) {
     await verifySlide(ids[i]);
     if(ids[i]==='home'||ids[i]==='stage-7') await page.screenshot({path:path.join(output,`${label}-${ids[i]}.png`),fullPage:true});
     if(i<ids.length-1) await page.locator('#nextBtn').click();
    }
    await expect(page.locator('#nextBtn')).toBeDisabled();await expect(page.locator('#progressText')).toHaveText('24 / 24');
   });
   await check(`${label}: native keyboard controls, menu and touch targets`,async()=>{
    await page.locator('#homeBtn').focus();await page.keyboard.press('Space');await verifySlide('home');
    await page.locator('#stageMenuBtn').click();await expect(page.locator('#stageDialog')).toBeVisible();
    const contrast=await contrastReport(page);assert(contrast.every(item=>item.ratio>=4.5),JSON.stringify(contrast.filter(item=>item.ratio<4.5)));
    await page.locator('#stageDialog [data-go="stage-7"]').click();await verifySlide('stage-7');
    await expect(page.locator('#stage-7 h1')).toBeFocused();await page.keyboard.press('ArrowRight');await verifySlide('stage-7-actions');
    await page.keyboard.press('Home');await verifySlide('home');
    await page.locator('#stageMenuBtn').click();await page.keyboard.press('Escape');await expect(page.locator('#stageDialog')).not.toBeVisible();await expect(page.locator('#stageMenuBtn')).toBeFocused();
    const small=await page.locator('button:visible').evaluateAll(buttons=>buttons.filter(button=>{const r=button.getBoundingClientRect();return r.width<44||r.height<44;}).map(button=>button.id||button.textContent.trim()));assert.deepEqual(small,[]);
    assert(await page.locator('#progressFill').evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration)<.01));
   });
   await context.close();
  }
  await check('Direct slide links and current package descriptions',async()=>{
   const context=await browser.newContext();page=await context.newPage();await page.goto(`${url}#stage-3`);await verifySlide('stage-3');
   await expect(page.getByText(/up to 6 songs/)).toBeVisible();await expect(page.getByText(/up to 10 songs/)).toBeVisible();await context.close();
  });
  assert.deepEqual(errors,[]);console.log(`${results.length} presentation scenarios passed.`);
 } catch(error) {
  process.exitCode=1;console.error(`FAILED: ${current}`,error);fs.writeFileSync(path.join(output,'failure.txt'),`${current}\n${error.stack}`);
  if(page&&!page.isClosed()) await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});
 } finally {
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:results,failed:process.exitCode?current:null},null,2));
  if(browser) await browser.close();if(server) await new Promise(resolve=>server.close(resolve));
 }
})();
