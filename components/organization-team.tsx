"use client";
import { useEffect, useState, type FormEvent } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import type { OrganizationMember, OrganizationMemberRole } from "@/domain/organization-account";
import { createOrganizationInvitation } from "@/lib/firebase/organization-account";
import { getFirebaseFirestore } from "@/lib/firebase/client";
import { customerMessage } from "@/lib/customer-messages";
import { appPath } from "@/lib/app-path";
import { useAuth } from "./auth-provider";
import styles from "./organization-relationship.module.css";
const roleLabels: Record<string, string> = { organization_admin: "Administrator", coordinator: "Event coordinator", viewer: "View only" };
export function OrganizationTeam({ organizationId, members, canManage }: { organizationId: string; members: OrganizationMember[]; canManage: boolean }) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<{ id: string; email: string; role: string; status: string }[]>([]);
  const [error, setError] = useState<string | null>(null), [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [copied, setCopied] = useState(false);
  async function refresh() {
    const result = await getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "invitations"));
    setInvitations(result.docs.map(item => ({ id: item.id, ...item.data() } as typeof invitations[number])).filter(item => item.status === "pending"));
  }
  useEffect(() => {
    let cancelled = false; setInvitations([]); setLink(null); setError(null);
    if (canManage) getDocs(collection(getFirebaseFirestore(), "organizations", organizationId, "invitations")).then(result => {
      if (!cancelled) setInvitations(result.docs.map(item => ({ id: item.id, ...item.data() } as typeof invitations[number])).filter(item => item.status === "pending"));
    }).catch(cause => { if (!cancelled) setError(customerMessage(cause, "We could not open team invitations.")); });
    return () => { cancelled = true; };
  }, [organizationId, canManage]);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user || !canManage || busy) return;
    const values = new FormData(event.currentTarget), form = event.currentTarget;
    setBusy(true); setError(null); setCopied(false);
    try {
      const email = String(values.get("email") ?? "").trim().toLowerCase();
      if (members.some(member => member.email.toLowerCase() === email && member.status === "active")) throw new Error("This person is already on your team.");
      if (invitations.some(item => item.email.toLowerCase() === email)) throw new Error("This person already has an invitation. Copy the existing link below.");
      const item = await createOrganizationInvitation({ organizationId, email, role: String(values.get("role") ?? "viewer") as OrganizationMemberRole, invitedBy: user.uid });
      setLink(`${window.location.origin}${appPath(`/accept-invitation?org=${encodeURIComponent(organizationId)}&id=${encodeURIComponent(item.id)}`)}`);
      form.reset(); await refresh();
    } catch (cause) { setError(customerMessage(cause, "We could not create the invitation. Please try again.")); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    if (!canManage || busy) return;
    setBusy(true); setError(null);
    try { await updateDoc(doc(getFirebaseFirestore(), "organizations", organizationId, "invitations", id), { status: "revoked" }); setLink(null); await refresh(); }
    catch (cause) { setError(customerMessage(cause)); } finally { setBusy(false); }
  }
  return <section className={styles.surface} id="team" aria-labelledby="team-heading">
    <div className={styles.sectionHeading}><div><h2 id="team-heading">Your team</h2><p>Each person signs in with their own account.</p></div></div>
    <div className={styles.rows}>{members.map(member => <div className={styles.row} key={member.userId}><div><strong>{member.displayName}</strong><span>{member.email}</span></div><span>{roleLabels[member.role] ?? "Team member"}{member.userId === user?.uid ? " · You" : ""}</span></div>)}</div>
    {canManage ? <>
      <details className={styles.capturePanel}><summary>Invite a team member</summary><form onSubmit={invite}>
        <label><span>Email address</span><input required type="email" name="email" /></label>
        <label><span>Access</span><select name="role" defaultValue="viewer"><option value="viewer">View only</option><option value="coordinator">Event coordinator</option><option value="organization_admin">Administrator</option></select></label>
        <p>Administrators can book and manage billing. Coordinators can help plan events. View-only members can see shared account information.</p>
        <button type="submit" disabled={busy}>{busy ? "Creating…" : "Create invitation"}</button>
      </form></details>
      {invitations.map(item => <div className={styles.row} key={item.id}><div><strong>{item.email}</strong><span>Invitation pending · {roleLabels[item.role]}</span></div><div className={styles.teamActions}><button type="button" onClick={() => { setLink(`${window.location.origin}${appPath(`/accept-invitation?org=${encodeURIComponent(organizationId)}&id=${encodeURIComponent(item.id)}`)}`); setCopied(false); }}>Get link</button><button type="button" disabled={busy} onClick={() => void revoke(item.id)}>Cancel invitation</button></div></div>)}
    </> : null}
    {link ? <div className={styles.linkResult}><strong>Invitation ready</strong><p>Copy this link and send it to your teammate. They’ll verify their email before joining.</p><input aria-label="Team invitation link" readOnly value={link} onFocus={e => e.currentTarget.select()} /><button type="button" onClick={() => { navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => setError("Select and copy the invitation link.")); }}>{copied ? "Copied" : "Copy invitation link"}</button><span role="status">{copied ? "Link copied." : ""}</span></div> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
