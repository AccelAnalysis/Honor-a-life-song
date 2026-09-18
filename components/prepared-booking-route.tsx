"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountRegistrationForm, type AccountRegistrationResult } from "./account-registration-form";
import { SignInForm } from "./sign-in-form";
import { SongKeepLockup } from "./brand";
import { useAuth } from "./auth-provider";
import { formatOfferingPrice } from "@/domain/booking";
import { getExperienceOffering } from "@/domain/experience";
import type { OrganizationRelationshipProfile, PreparedBookingCustomerView } from "@/domain/customer-lifecycle";
import {
  claimPreparedBooking,
  completePreparedBooking,
  requestPreparedBookingChange,
  resolvePreparedBooking,
  signPreparedBooking
} from "@/lib/firebase/prepared-booking";
import { listOrganizationRelationshipProfiles } from "@/lib/firebase/customer-lifecycle";
import { nativeCheckoutEnabled, openInvoiceCheckout } from "@/lib/firebase/native-services";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./prepared-booking-route.module.css";

type Screen = "offer" | "account" | "confirm" | "agreement" | "payment" | "done" | "change";

function splitName(value: string) {
  const parts=value.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

function formatDate(value: string) {
  const date=new Date(value);
  if(Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(date);
}

function dateStatusLabel(value: PreparedBookingCustomerView["dateStatus"]) {
  return value === "confirmed" ? "Confirmed" : value === "held" ? "Held for you" : "Proposed";
}

export function PreparedBookingRoute({ token: suppliedToken }: { token?: string } = {}) {
  const router=useRouter();
  const params=useSearchParams();
  const token=suppliedToken??params.get("booking")??"";
  const { user, status }=useAuth();
  const [booking,setBooking]=useState<PreparedBookingCustomerView|null>(null);
  const [organizations,setOrganizations]=useState<OrganizationRelationshipProfile[]>([]);
  const [screen,setScreen]=useState<Screen>("offer");
  const [accountMode,setAccountMode]=useState<"create"|"signin">("create");
  const [selectedOrganizationId,setSelectedOrganizationId]=useState("");
  const [paymentMethod,setPaymentMethod]=useState<"card"|"invoice">("invoice");
  const [invoiceNumber,setInvoiceNumber]=useState<string|undefined>();
  const [changeSent,setChangeSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const offering=useMemo(()=>booking?getExperienceOffering(booking.offeringId):undefined,[booking]);

  useEffect(()=>{
    let cancelled=false;
    if(!token){setError("This booking link is incomplete. Contact SongKeep for a new link.");return;}
    setBusy(true);
    resolvePreparedBooking(token)
      .then(value=>{if(!cancelled){
        setBooking(value);
        setPaymentMethod(value.paymentOptions.includes("card")&&nativeCheckoutEnabled?"card":"invoice");
        if(value.status==="change_requested"){setChangeSent(true);setScreen("change");}
        else if(value.status==="claimed")setScreen("confirm");
        else if(value.status==="accepted")setScreen("payment");
        else if(["payment_pending","invoice_open","booked"].includes(value.status))setScreen("done");
      }})
      .catch(cause=>{if(!cancelled)setError(customerMessage(cause,"This booking link is unavailable. Contact SongKeep for help."));})
      .finally(()=>{if(!cancelled)setBusy(false);});
    return()=>{cancelled=true;};
  },[token]);

  useEffect(()=>{
    if(!user){setOrganizations([]);return;}
    let cancelled=false;
    listOrganizationRelationshipProfiles(user.uid)
      .then(items=>{if(!cancelled){setOrganizations(items);const match=booking?.organizationId?items.find(item=>item.id===booking.organizationId):items.length===1?items[0]:undefined;setSelectedOrganizationId(match?.id??"");}})
      .catch(()=>undefined);
    return()=>{cancelled=true;};
  },[booking?.organizationId,user]);

  async function run(work:()=>Promise<void>) {
    if(busy)return;
    setBusy(true);setError(null);
    try{await work();}catch(cause){setError(customerMessage(cause,"We could not complete that step. Please try again."));}
    finally{setBusy(false);}
  }

  async function claim(organizationId:string) {
    const next=await claimPreparedBooking(token,organizationId);
    setBooking(next);setSelectedOrganizationId(organizationId);setScreen("confirm");
  }

  async function completeAccount(result:AccountRegistrationResult) {
    if(!result.organizationId)return;
    await claim(result.organizationId);
  }

  async function sign(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    await run(async()=>{
      const next=await signPreparedBooking({
        token,
        signedByName:String(data.get("signedByName")??""),
        signedByTitle:String(data.get("signedByTitle")??""),
        electronicRecordsAccepted:data.has("electronicRecordsAccepted")
      });
      setBooking(next);setScreen("payment");
    });
  }

  async function complete(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!booking?.organizationId)return;
    const data=new FormData(event.currentTarget);
    await run(async()=>{
      const result=await completePreparedBooking({
        token,paymentMethod,
        billing:{
          name:String(data.get("billingName")??booking.organizationName),
          contactName:String(data.get("billingContact")??booking.recipientName),
          email:String(data.get("billingEmail")??booking.recipientEmail),
          address:String(data.get("billingAddress")??""),
          purchaseOrder:String(data.get("purchaseOrder")??"")
        }
      });
      setBooking(result.booking);setInvoiceNumber(result.invoice.invoiceNumber);
      if(paymentMethod==="card"&&nativeCheckoutEnabled){
        const checkout=await openInvoiceCheckout(booking.organizationId!,result.invoice.id);
        if(checkout.url){window.location.assign(checkout.url);return;}
      }
      setScreen("done");
    });
  }

  if(busy&&!booking)return <main className={styles.shell}><div className={styles.center}><SongKeepLockup variant="app"/><p role="status">Opening your booking…</p></div></main>;
  if(error&&!booking)return <main className={styles.shell}><div className={styles.center}><SongKeepLockup variant="app"/><h1>We couldn’t open this booking.</h1><p>{error}</p><Link className={styles.secondaryLink} href="/">SongKeep home</Link></div></main>;
  if(!booking)return null;

  const names=splitName(booking.recipientName);
  const stepIndex=screen==="offer"?0:screen==="account"?1:screen==="confirm"||screen==="change"?2:screen==="agreement"?3:screen==="payment"?4:5;

  return <main className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="SongKeep home"><SongKeepLockup variant="app"/></Link><span>Complete booking</span></header>
    <div className={styles.progress} aria-label="Booking progress">{[0,1,2,3,4].map(item=><span key={item} className={item<=stepIndex?styles.progressActive:""} />)}</div>
    <div className={styles.stage}>
      {error?<div className={styles.alert} role="alert">{error}</div>:null}

      {screen==="offer"?<section className={styles.scene}>
        <p className={styles.eyebrow}>{booking.organizationName}</p>
        <h1>Your SongKeep experience is ready.</h1>
        <div className={styles.heroOffer}>
          <div><span className={styles.dateBadge}>{dateStatusLabel(booking.dateStatus)}</span><h2>{booking.offeringName}</h2><p>{formatDate(booking.preferredStartsAt)}{booking.venue?` · ${booking.venue}`:""}</p></div>
          <strong>{formatOfferingPrice(booking.amountCents)}</strong>
        </div>
        {offering?<div className={styles.highlights}><span>{offering.storyCapture}</span><span>{offering.creativeOutput}</span><span>{offering.presentation}</span></div>:null}
        {booking.dateStatus==="held"&&booking.holdExpiresAt?<p className={styles.quiet}>Held through {formatDate(booking.holdExpiresAt).split(",")[0]}.</p>:null}
        <button className={styles.primary} onClick={()=>setScreen("account")}>Continue</button>
        <button className={styles.textButton} onClick={()=>setScreen("change")}>Need to change something?</button>
      </section>:null}

      {screen==="account"?<section className={styles.scene}>
        <p className={styles.eyebrow}>Your organization</p>
        <h1>Connect {booking.organizationName}.</h1>
        {status==="signed_in"&&user&&organizations.length?<div className={styles.organizationChoices}>
          {organizations.map(item=><label key={item.id}><input type="radio" name="organization" checked={selectedOrganizationId===item.id} onChange={()=>setSelectedOrganizationId(item.id)}/><span><strong>{item.name}</strong><small>{item.contact.displayName}</small></span></label>)}
          <button className={styles.primary} disabled={!selectedOrganizationId||busy} onClick={()=>run(()=>claim(selectedOrganizationId))}>{busy?"Connecting…":"Use this organization"}</button>
          <button className={styles.textButton} onClick={()=>setOrganizations([])}>Create another organization</button>
        </div>:accountMode==="signin"&&!user?<><SignInForm next={`/complete?booking=${encodeURIComponent(token)}`} onComplete={()=>setAccountMode("create")}/><button className={styles.textButton} onClick={()=>setAccountMode("create")}>Create an account instead</button></>:<AccountRegistrationForm
          offeringId={booking.offeringId}
          onComplete={completeAccount}
          onSignIn={()=>setAccountMode("signin")}
          lockEmail
          lockOrganization
          initialValues={{
            ...names,email:booking.recipientEmail,organizationName:booking.organizationName,
            organizationKind:booking.organizationKind,contactTitle:booking.recipientTitle,contactPhone:booking.recipientPhone
          }}
        />}
      </section>:null}

      {screen==="confirm"?<section className={styles.scene}>
        <p className={styles.eyebrow}>Confirm</p><h1>Does this look right?</h1>
        <dl className={styles.summary}>
          <div><dt>Experience</dt><dd>{booking.offeringName}</dd></div>
          <div><dt>When</dt><dd>{formatDate(booking.preferredStartsAt)} <span>{dateStatusLabel(booking.dateStatus)}</span></dd></div>
          {booking.venue?<div><dt>Where</dt><dd>{booking.venue}</dd></div>:null}
          {booking.participantEstimate?<div><dt>Group</dt><dd>About {booking.participantEstimate} people</dd></div>:null}
          <div><dt>Total</dt><dd>{formatOfferingPrice(booking.amountCents)}</dd></div>
        </dl>
        <button className={styles.primary} onClick={()=>setScreen("agreement")}>Everything looks right</button>
        <button className={styles.textButton} onClick={()=>setScreen("change")}>Request a change</button>
      </section>:null}

      {screen==="change"?<section className={styles.scene}>
        {changeSent?<><div className={styles.successMark}>✓</div><p className={styles.eyebrow}>Sent</p><h1>We’ve got it.</h1><p className={styles.lede}>SongKeep will update the booking before you sign. This link will show the revised version.</p><Link className={styles.secondaryLink} href="/">SongKeep home</Link></>:<>
          <p className={styles.eyebrow}>Make a change</p><h1>Tell us what needs attention.</h1>
          <form className={styles.form} onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void run(async()=>{await requestPreparedBookingChange(token,String(data.get("category")??"other"),String(data.get("message")??""));setBooking(current=>current?{...current,status:"change_requested"}:current);setChangeSent(true);});}}>
            <label><span>What changed?</span><select name="category"><option value="date">Date or time</option><option value="scope">Experience details</option><option value="billing">Billing</option><option value="other">Something else</option></select></label>
            <label><span>Note</span><textarea required name="message" rows={4} placeholder="A short note is enough." /></label>
            <button className={styles.primary} disabled={busy} type="submit">{busy?"Sending…":"Send to SongKeep"}</button>
            <button className={styles.textButton} type="button" onClick={()=>setScreen(booking.claimedByUserId?"confirm":"offer")}>Back</button>
          </form>
        </>}
      </section>:null}

      {screen==="agreement"?<section className={styles.scene}>
        <p className={styles.eyebrow}>Agreement</p><h1>Confirm your organization’s booking.</h1>
        <div className={styles.agreementSummary}><strong>{booking.offeringName}</strong><span>{formatOfferingPrice(booking.amountCents)} · {dateStatusLabel(booking.dateStatus)}</span><p>By signing, you confirm this prepared experience and your authority to book for {booking.organizationName}.</p></div>
        <form className={styles.form} onSubmit={sign}>
          <label><span>Name</span><input required name="signedByName" defaultValue={booking.recipientName}/></label>
          <label><span>Title</span><input required name="signedByTitle" defaultValue={booking.recipientTitle??""}/></label>
          <label className={styles.check}><input required type="checkbox" name="electronicRecordsAccepted"/><span>I’m authorized to book for this organization and accept electronic records and signatures.</span></label>
          <button className={styles.primary} disabled={busy} type="submit">{busy?"Saving…":"Accept & continue"}</button>
        </form>
      </section>:null}

      {screen==="payment"?<section className={styles.scene}>
        <p className={styles.eyebrow}>Billing</p><h1>How would you like to complete the booking?</h1>
        <div className={styles.paymentChoices}>
          {booking.paymentOptions.includes("card")&&nativeCheckoutEnabled?<button className={paymentMethod==="card"?styles.paymentSelected:""} onClick={()=>setPaymentMethod("card")} type="button"><strong>Pay now</strong><span>Secure online checkout</span></button>:null}
          {booking.paymentOptions.includes("invoice")?<button className={paymentMethod==="invoice"?styles.paymentSelected:""} onClick={()=>setPaymentMethod("invoice")} type="button"><strong>Invoice my organization</strong><span>Keep the invoice in your SongKeep account</span></button>:null}
        </div>
        <form className={styles.form} onSubmit={complete}>
          <div className={styles.twoColumns}><label><span>Billing organization</span><input required name="billingName" defaultValue={booking.organizationName}/></label><label><span>Billing contact</span><input required name="billingContact" defaultValue={booking.recipientName}/></label></div>
          <label><span>Billing email</span><input required type="email" name="billingEmail" defaultValue={booking.recipientEmail}/></label>
          <label><span>Billing address</span><textarea required name="billingAddress" rows={3}/></label>
          <label><span>PO number <small>Optional</small></span><input name="purchaseOrder"/></label>
          <button className={styles.primary} disabled={busy} type="submit">{busy?"Preparing…":paymentMethod==="card"?"Continue to secure payment":"Create my invoice"}</button>
        </form>
      </section>:null}

      {screen==="done"?<section className={styles.scene}>
        <div className={styles.successMark}>✓</div><p className={styles.eyebrow}>Ready</p><h1>Your booking is in motion.</h1>
        <p className={styles.lede}>{paymentMethod==="invoice"?`${invoiceNumber??"Your invoice"} is ready in your organization account.`:"Your payment step is ready in billing."}</p>
        {booking.organizationId&&booking.invoiceId?<Link className={styles.primaryLink} href={`/organization/invoices?organization=${booking.organizationId}&invoice=${booking.invoiceId}`}>View invoice</Link>:null}
        {booking.organizationId?<Link className={styles.secondaryLink} href={`/organization?org=${booking.organizationId}`}>Open organization account</Link>:null}
      </section>:null}
    </div>
    <footer className={styles.footer}><span>Prepared for {booking.recipientName}</span><span>SongKeep</span></footer>
  </main>;
}
