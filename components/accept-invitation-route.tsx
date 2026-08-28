"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { OrganizationInvitation } from "@/domain/organization-account";
import { getOrganizationInvitation } from "@/lib/firebase/organization-account";
import { acceptOrganizationInvitationSecure } from "@/lib/firebase/organization-invitations";

export function AcceptInvitationRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const organizationId = searchParams.get("org");
  const invitationId = searchParams.get("id");
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !invitationId || status !== "signed_in" || !user?.emailVerified) return;
    let cancelled = false;
    setLoading(true);
    getOrganizationInvitation(organizationId, invitationId)
      .then((nextInvitation) => { if (!cancelled) setInvitation(nextInvitation); })
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
      await acceptOrganizationInvitationSecure({
        organizationId,
        invitationId,
        userId: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? user.email ?? "Team member",
        emailVerified: user.emailVerified
      });
      router.push(`/organization?org=${organizationId}`);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "We could not accept this invitation.");
      setLoading(false);
    }
  }

  if (!organizationId || !invitationId) {
    return <main className="centeredPage"><section className="authCard"><p className="eyebrow">SongKeep</p><h1>Link incomplete.</h1><Link href="/login">Sign in</Link></section></main>;
  }

  const returnPath = `/accept-invitation?org=${encodeURIComponent(organizationId)}&id=${encodeURIComponent(invitationId)}`;

  if (status === "loading") return <main className="centeredPage"><section className="authCard"><p>Opening…</p></section></main>;
  if (status === "signed_out") {
    return <main className="centeredPage"><section className="authCard"><p className="eyebrow">Team invitation</p><h1>Sign in to join.</h1><p>Use the invited email.</p><Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Sign in</Link><p>New here? <Link href={`/create-account?next=${encodeURIComponent(returnPath)}`}>Create account</Link></p></section></main>;
  }

  if (user && !user.emailVerified) {
    return <main className="centeredPage"><section className="authCard"><p className="eyebrow">SongKeep</p><h1>Verify your email.</h1><Link href={`/verify-email?next=${encodeURIComponent(returnPath)}`}>Verify email</Link></section></main>;
  }

  if (loading && !invitation) return <main className="centeredPage"><section className="authCard"><p>Opening…</p></section></main>;

  return <main className="centeredPage"><section className="authCard">
    <p className="eyebrow">Team invitation</p>
    <h1>Join your organization.</h1>
    {invitation ? <p>{invitation.role.replaceAll("_", " ")}</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {invitation?.status === "pending" ? <button type="button" onClick={accept} disabled={loading}>{loading ? "Joining…" : "Join"}</button> : null}
    {invitation?.status === "accepted" ? <Link href={`/organization?org=${organizationId}`}>Open SongKeep</Link> : null}
  </section></main>;
}
