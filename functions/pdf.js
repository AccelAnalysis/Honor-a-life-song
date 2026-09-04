'use strict';
const PDFDocument = require('pdfkit');
const money = cents => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(cents/100);
// Render only the immutable issued snapshot. No browser HTML, external URL fetching or live totals.
async function renderInvoice(invoice) {
  const c=invoice.commercial;
  if(!c||!invoice.invoiceNumber)throw new Error('Only an issued snapshot can be rendered.');
  const doc=new PDFDocument({size:'LETTER',margins:{top:44,bottom:60,left:44,right:44},bufferPages:true,info:{Title:`SongKeep invoice ${invoice.invoiceNumber}`,Author:c.seller.legalName,CreationDate:new Date(c.issuedAt),ModDate:new Date(c.issuedAt)}});
  doc.registerFont('SongKeep',require.resolve('@fontsource/manrope/files/manrope-latin-400-normal.woff')).font('SongKeep');
  const chunks=[],done=new Promise((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  const ink='#0D1233',muted='#30364E',accent='#6250C8';
  function room(height){if(doc.y+height>724){doc.addPage();doc.x=44;}}
  function section(title){room(48);doc.moveDown(.7);doc.fontSize(11).fillColor(ink).text(title,44,doc.y,{width:524});doc.moveDown(.3);}
  function body(value,size=9){doc.fontSize(size).fillColor(muted).text(value||'-',44,doc.y,{width:524,lineGap:2});}
  doc.fontSize(28).fillColor(ink).text('SongKeep',44,38);
  doc.fontSize(9).fillColor(accent).text('Your story. Your song. Always.',44,80);
  doc.fontSize(23).fillColor(ink).text('Invoice',350,40,{width:218,align:'right'});
  doc.fontSize(10).text(invoice.invoiceNumber,350,73,{width:218,align:'right'});
  doc.moveTo(44,106).lineTo(568,106).lineWidth(2).stroke(accent);
  doc.fontSize(9).fillColor(muted).text(`Issued ${c.issuedAt.slice(0,10)}   |   Due ${c.dueAt.slice(0,10)}   |   ${c.currency}`,44,122,{width:524});
  const addressY=154;
  doc.fontSize(10).fillColor(ink).text('From',44,addressY,{width:248});
  doc.fontSize(9).fillColor(muted).text([c.seller.legalName,c.seller.dba,c.seller.address,c.seller.email,c.seller.phone].filter(Boolean).join('\n'),44,addressY+20,{width:248,lineGap:2});
  const fromEnd=doc.y;
  doc.fontSize(10).fillColor(ink).text('Bill to',320,addressY,{width:248});
  doc.fontSize(9).fillColor(muted).text([c.buyer.name,c.buyer.contactName,c.buyer.address,c.buyer.email,c.buyer.purchaseOrder?`PO: ${c.buyer.purchaseOrder}`:''].filter(Boolean).join('\n'),320,addressY+20,{width:248,lineGap:2});
  doc.y=Math.max(doc.y,fromEnd)+9;doc.x=44;
  section('Your experience');
  for(const line of c.lineItems){room(70);const y=doc.y;doc.fontSize(9).fillColor(muted).text(`${line.quantity} × ${line.description}`,44,y,{width:404,lineGap:2});const end=doc.y;doc.text(money(line.amountCents),462,y,{width:106,align:'right'});doc.y=Math.max(doc.y,end)+7;doc.x=44;}
  if(c.serviceDate)body(`Preferred date: ${c.serviceDate.slice(0,10)} (subject to confirmation)`,8);
  if(c.location)body(`Location: ${c.location}`,8);
  room(154);doc.moveDown(.6);
  for(const [label,amount] of [['Subtotal',c.subtotalCents],['Discount / credit',-c.discountCents],['Tax',c.taxCents],['Total',c.totalCents],['Paid at issue',c.amountPaidAtIssueCents||0],['Balance at issue',c.totalCents-(c.amountPaidAtIssueCents||0)]]){
    const y=doc.y,size=label==='Total'?13:9;doc.fontSize(size).fillColor(ink).text(label,320,y,{width:135});const end=doc.y;doc.text(money(amount),460,y,{width:108,align:'right'});doc.y=Math.max(doc.y,end)+4;doc.x=44;
  }
  section('Payment and terms');body(c.paymentTerms);body(c.paymentInstructions);body(c.terms);body(c.taxNote,8);
  section('Pay or view your current balance');
  doc.fontSize(9).fillColor(accent).text('Open your secure SongKeep invoice',44,doc.y,{width:524,link:c.accountUrl,underline:true});
  body('This is the original issued document. Your account shows later payments, refunds and the current balance.',8);
  section('Reference');body(`Organization: ${invoice.organizationId}   |   Order / request: ${invoice.orderId}\nExperience: ${c.experienceId||'Created after payment confirmation'}   |   Offering: ${invoice.offeringId}`,7);
  const range=doc.bufferedPageRange();
  for(let page=range.start;page<range.start+range.count;page++){
    doc.switchToPage(page);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;
    doc.fontSize(7).fillColor(muted).text(`${invoice.invoiceNumber} · SongKeep · ${page+1} / ${range.count}`,44,756,{width:524,align:'center',lineBreak:false});doc.page.margins.bottom=bottom;
  }
  doc.end();return done;
}
module.exports={renderInvoice};
