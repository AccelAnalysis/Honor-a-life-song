"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatOfferingPrice } from "@/domain/booking";
import { experienceOfferings } from "@/domain/experience";
import { organizationKinds } from "@/domain/account-onboarding";
import type { PreparedBookingCustomerView } from "@/domain/customer-lifecycle";
import {
  createPreparedBooking,
  listPreparedBookings,
  revisePreparedBooking,
  revokePreparedBooking,
  rotatePreparedBookingLink
} from "@/lib/firebase/prepared-booking";
import { customerMessage } from "@/lib/customer-messages";
import styles from "./prepared-booking-admin.module.css";

function formatDate(value: string) {
  const date=new Date(value);
  return Number.isNaN(date.valueOf())?value:new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(date);
}

function titleize(value:string){return value.replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,letter=>letter.toUpperCase());}
function dateInput(value:string){const d=new Date(value);return Number.isNaN(d.valueOf())?"":`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function timeInput(value:string){const d=new Date(value);return Number.isNaN(d.valueOf())?"":`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}

export function PreparedBookingAdmin() {
  const [bookings,setBookings]=useState<PreparedBookingCustomerView[]>([]);
  const [selectedId,setSelectedId]=useState("");
  const [createdLink,setCreatedLink]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);

  async function load(){setBookings(await listPreparedBookings());}
  useEffect(()=>{void load().catch(cause=>setError(customerMessage(cause,"Prepared bookings could not be opened.")));},[]);

  const selected=useMemo(()=>bookings.find(item=>item.id===selectedId),[bookings,selectedId]);

  async function run(work:()=>Promise<void>){
    if(busy)return;setBusy(true);setError(null);setNotice(null);
    try{await work();}catch(cause){setError(customerMessage(cause,"The booking could not be updated."));}
    finally{setBusy(false);}
  }

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    await run(async()=>{
      const date=String(form.get("date")??""),time=String(form.get("time")??"");
      const held=String(form.get("dateStatus")??"proposed")==="held";
      const paymentOptions=form.getAll("paymentOptions").map(String) as Array<"card"|"invoice">;
      const result=await createPreparedBooking({
        organizationName:String(form.get("organizationName")??""),
        organizationKind:String(form.get("organizationKind")??"community_partner") as Parameters<typeof createPreparedBooking>[0]["organizationKind"],
        recipientName:String(form.get("recipientName")??""),
        recipientEmail:String(form.get("recipientEmail")??""),
        recipientTitle:String(form.get("recipientTitle")??"")||undefined,
        recipientPhone:String(form.get("recipientPhone")??"")||undefined,
        offeringId:String(form.get("offeringId")??"single-song-group-event") as Parameters<typeof createPreparedBooking>[0]["offeringId"],
        preferredStartsAt:new Date(`${date}T${time}`).toISOString(),
        dateStatus:String(form.get("dateStatus")??"proposed") as Parameters<typeof createPreparedBooking>[0]["dateStatus"],
        holdExpiresAt:held&&form.get("holdExpiresAt")?new Date(`${String(form.get("holdExpiresAt"))}T23:59:00`).toISOString():undefined,
        venue:String(form.get("venue")??"")||undefined,
        participantEstimate:form.get("participantEstimate")?Number(form.get("participantEstimate")):undefined,
        organizationGoal:String(form.get("organizationGoal")??"")||undefined,
        paymentOptions,
        invoiceActivationPolicy:String(form.get("invoiceActivationPolicy")??"payment_required") as "payment_required" | "approved_receivable"
      });
      const absolute=`${window.location.origin}${result.completionPath}`;
      setCreatedLink(absolute);setSelectedId(result.id);setNotice("Booking link created.");
      (event.currentTarget as HTMLFormElement).reset();
      await load();
    });
  }

  async function copy(value:string){
    await navigator.clipboard.writeText(value);
    setNotice("Booking link copied.");
  }

  return <main className={styles.shell}>
    <header className={styles.header}><Link href="/admin/requests">← Requests</Link><div><span>SongKeep</span><strong>Prepared bookings</strong></div></header>
    <div className={styles.page}>
      {error?<div className={styles.alert} role="alert">{error}</div>:null}
      {notice?<div className={styles.notice} role="status">{notice}</div>:null}

      <section className={styles.heading}><p className={styles.eyebrow}>Sales handoff</p><h1>Prepare the booking.</h1><p>Set what was agreed. The customer confirms, signs, and pays from one secure link.</p></section>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={create}>
          <section><h2>Customer</h2>
            <label><span>Organization</span><input required name="organizationName"/></label>
            <label><span>Organization type</span><select name="organizationKind" defaultValue="community_partner">{organizationKinds.map(kind=><option value={kind.value} key={kind.value}>{kind.label}</option>)}</select></label>
            <div className={styles.twoColumns}><label><span>Contact</span><input required name="recipientName"/></label><label><span>Email</span><input required type="email" name="recipientEmail"/></label></div>
            <div className={styles.twoColumns}><label><span>Title <small>Optional</small></span><input name="recipientTitle"/></label><label><span>Phone <small>Optional</small></span><input name="recipientPhone" type="tel"/></label></div>
          </section>

          <section><h2>Experience</h2>
            <label><span>Experience</span><select name="offeringId">{experienceOfferings.map(item=><option key={item.id} value={item.id}>{item.shortName} · {formatOfferingPrice(item.priceCents)}</option>)}</select></label>
            <div className={styles.twoColumns}><label><span>Date</span><input required type="date" name="date"/></label><label><span>Time</span><input required type="time" name="time"/></label></div>
            <div className={styles.twoColumns}><label><span>Date status</span><select name="dateStatus" defaultValue="held"><option value="proposed">Proposed</option><option value="held">Held</option><option value="confirmed">Confirmed</option></select></label><label><span>Hold through <small>If held</small></span><input type="date" name="holdExpiresAt"/></label></div>
            <label><span>Location <small>Optional</small></span><input name="venue"/></label>
            <label><span>Approx. participants <small>Optional</small></span><input min="1" max="10000" type="number" name="participantEstimate"/></label>
            <label><span>Purpose <small>Optional</small></span><textarea name="organizationGoal" rows={3} placeholder="A short note about what the organization wants to create."/></label>
          </section>

          <section><h2>Payment</h2>
            <div className={styles.checks}><label><input type="checkbox" name="paymentOptions" value="card" defaultChecked/><span>Pay now</span></label><label><input type="checkbox" name="paymentOptions" value="invoice" defaultChecked/><span>Invoice organization</span></label></div>
            <label><span>Invoice activation</span><select name="invoiceActivationPolicy" defaultValue="payment_required"><option value="payment_required">Begin after payment</option><option value="approved_receivable">Approved terms — begin when invoice is issued</option></select></label>
          </section>

          <button className={styles.primary} disabled={busy} type="submit">{busy?"Preparing…":"Create secure booking link"}</button>
        </form>

        <aside className={styles.side}>
          {createdLink?<section className={styles.linkResult}><p className={styles.eyebrow}>Ready to send</p><strong>Secure booking link</strong><code>{createdLink}</code><div className={styles.linkActions}><button onClick={()=>copy(createdLink)} type="button">Copy link</button>{selected?<a href={`mailto:${selected.recipientEmail}?subject=${encodeURIComponent("Complete your SongKeep booking")}&body=${encodeURIComponent(`Your SongKeep experience is ready. Complete your booking here:\n\n${createdLink}`)}`}>Email link</a>:null}</div></section>:null}
          <section className={styles.list}><div className={styles.listHeading}><h2>Recent</h2><button type="button" onClick={()=>run(load)}>Refresh</button></div>
            {bookings.length?bookings.map(item=><button key={item.id} type="button" className={selectedId===item.id?styles.selected:""} onClick={()=>setSelectedId(item.id)}><span>{titleize(item.status)}</span><strong>{item.organizationName}</strong><small>{item.offeringName} · {formatDate(item.preferredStartsAt)}</small></button>):<p className={styles.empty}>No prepared bookings yet.</p>}
          </section>
          {selected?<section className={styles.detail}><span>{titleize(selected.status)}</span><h2>{selected.organizationName}</h2><p>{selected.recipientName} · {selected.recipientEmail}</p><dl><div><dt>Experience</dt><dd>{selected.offeringName}</dd></div><div><dt>Date</dt><dd>{formatDate(selected.preferredStartsAt)}</dd></div><div><dt>Total</dt><dd>{formatOfferingPrice(selected.amountCents)}</dd></div></dl>
            {!["booked","revoked","accepted","payment_pending","invoice_open"].includes(selected.status)?<details className={styles.revise}><summary>Revise booking</summary><form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void run(async()=>{const date=String(data.get("date")??""),time=String(data.get("time")??"");await revisePreparedBooking(selected.id,{offeringId:String(data.get("offeringId")) as Parameters<typeof revisePreparedBooking>[1]["offeringId"],preferredStartsAt:new Date(`${date}T${time}`).toISOString(),dateStatus:String(data.get("dateStatus")) as Parameters<typeof revisePreparedBooking>[1]["dateStatus"],holdExpiresAt:data.get("holdExpiresAt")?new Date(`${String(data.get("holdExpiresAt"))}T23:59:00`).toISOString():undefined,venue:String(data.get("venue")??""),participantEstimate:data.get("participantEstimate")?Number(data.get("participantEstimate")):undefined,organizationGoal:String(data.get("organizationGoal")??""),invoiceActivationPolicy:String(data.get("invoiceActivationPolicy")??"payment_required") as "payment_required"|"approved_receivable"});setNotice("Booking revised. The customer link now shows the new version.");await load();});}}>
              <label><span>Experience</span><select name="offeringId" defaultValue={selected.offeringId}>{experienceOfferings.map(item=><option value={item.id} key={item.id}>{item.shortName}</option>)}</select></label>
              <div className={styles.twoColumns}><label><span>Date</span><input required type="date" name="date" defaultValue={dateInput(selected.preferredStartsAt)}/></label><label><span>Time</span><input required type="time" name="time" defaultValue={timeInput(selected.preferredStartsAt)}/></label></div>
              <div className={styles.twoColumns}><label><span>Date status</span><select name="dateStatus" defaultValue={selected.dateStatus}><option value="proposed">Proposed</option><option value="held">Held</option><option value="confirmed">Confirmed</option></select></label><label><span>Hold through</span><input type="date" name="holdExpiresAt" defaultValue={selected.holdExpiresAt?dateInput(selected.holdExpiresAt):""}/></label></div>
              <label><span>Location</span><input name="venue" defaultValue={selected.venue??""}/></label>
              <label><span>Approx. participants</span><input type="number" min="1" max="10000" name="participantEstimate" defaultValue={selected.participantEstimate??""}/></label>
              <label><span>Purpose</span><textarea name="organizationGoal" rows={3} defaultValue={selected.organizationGoal??""}/></label>
              <label><span>Invoice activation</span><select name="invoiceActivationPolicy" defaultValue={selected.invoiceActivationPolicy}><option value="payment_required">Begin after payment</option><option value="approved_receivable">Approved terms — begin when invoice is issued</option></select></label>
              <button type="submit">Save revision</button>
            </form></details>:null}
            {!["booked","revoked"].includes(selected.status)?<div className={styles.actions}><button type="button" onClick={()=>run(async()=>{const value=await rotatePreparedBookingLink(selected.id);const absolute=`${window.location.origin}${value.completionPath}`;setCreatedLink(absolute);await copy(absolute);await load();})}>New link</button><button type="button" className={styles.danger} onClick={()=>run(async()=>{await revokePreparedBooking(selected.id);await load();})}>Revoke</button></div>:null}
          </section>:null}
        </aside>
      </div>
    </div>
  </main>;
}
