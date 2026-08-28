"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { OrganizationAccount, OrganizationInvitation } from "@/domain/organization-account";
import { acceptOrganizationInvitation, getOrganization, getOrganizationInvitation } from "@/lib/firebase/organization-account";

export function AcceptInvitationRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const organizationId = searchParams.get("org");
  const invitationId = searchParams.get("id");
  const [organization, setOrganization] = useState<OrganizationAccount | null>(null);
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !invitationId || status !== "signed_in" || !user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getOrganization(organizationId), getOrganizationInvitation(organizationId, invitationId)])
      .then(([nextOrganization, nextInvitation]) => {
        if (cancelled) return;
        setOrganization(nextOrganization);
        setInvitation(nextInvitation);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "We could not open this invitation.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [invitationId, organizationId, status, user]);

  async function accept() {
    if (!user || !organizationId || !invitationId) return;
    setLoading(true);
    setError(null);
    try {
      await acceptOrganizationInvitation({
        organizationId,
        invitationId,
        userId: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? user.email ?? "Team member"
      });
      router.push(`/organization?org=${organizationId}`);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "We could not accept this invitation.");
      setLoading(false);
    }
  }

  if (!organizationId || !invitationId) {
    return <main className="centeredPage"><section className="authCard"><h1>Invitation link incomplete</h1><p>Use the full invitation link provided by your organization.</p><Link href="/login">Sign in</Link></section></main>;
  }

  const returnPath = `/accept-invitation?org=${encodeURIComponent(organizationId)}&id=${encodeURIComponent(invitationId)}`;

  if (status === "loading") return <main className="centeredPage"><section className="authCard"><p>Opening invitation…</p></section></main>;
  if (status === "signed_out") {
    return <main className="centeredPage"><section className="authCard"><p className="eyebrow">Organization invitation</p><h1>Sign in to join your organization.</h1><p>Use the same email address the invitation was sent to.</p><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link><p>New here? <Link href={`/create-account?org=${encodeURIComponent(organizationId)}&invite=${encodeURIComponent(invitationId)}`}>Create an account</Link></p></section></main>;
  }

  if (loading && !invitation) return <main className="centeredPage"><section className="authCard"><p>Opening invitation…</p></section></main>;

  return <main className="centeredPage"><section className="authCard">
    <p className="eyebrow">Organization invitation</p>
    <h1>{organization ? `Join ${organization.name}` : "Join this organization"}</h1>
    {invitation ? <p>You were invited as <strong>{invitation.role.replaceAll("_", " ")}</strong>. Your own sign-in will be added to the organization without changing its event history.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {invitation?.status === "pending" ? <button type="button" onClick={accept} disabled={loading}>{loading ? "Joining…" : "Accept invitation"}</button> : null}
    {invitation?.status === "accepted" ? <Link href={`/organization?org=${organizationId}`}>Open organization account</Link> : null}
  </section></main>;
}
