"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { isPlatformAdmin } from "@/lib/firebase/organization-account";
import { isStaticPreview } from "@/lib/preview-mode";

export function AdminAccessGate({ children, previewAllowed = false }: { children: ReactNode; previewAllowed?: boolean }) {
  const { user, status, configurationError } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(previewAllowed && isStaticPreview ? true : null);

  useEffect(() => {
    if (previewAllowed && isStaticPreview) { setAllowed(true); return; }
    if (status !== "signed_in" || !user) {
      setAllowed(null);
      return;
    }
    let cancelled = false;
    isPlatformAdmin(user.uid)
      .then((result) => { if (!cancelled) setAllowed(result); })
      .catch(() => { if (!cancelled) setAllowed(false); });
    return () => { cancelled = true; };
  }, [previewAllowed, status, user]);

  if (!(previewAllowed && isStaticPreview) && (status === "loading" || (status === "signed_in" && allowed === null))) {
    return <section className="unavailable large"><strong>Opening Operations…</strong><span>Confirming your access.</span></section>;
  }

  if (!(previewAllowed && isStaticPreview) && status === "unavailable") {
    return <section className="unavailable large"><strong>Account access is temporarily unavailable.</strong><span>{configurationError ?? "Please try again or contact SongKeep for help."}</span></section>;
  }

  if (!(previewAllowed && isStaticPreview) && (status === "signed_out" || !user)) {
    return <section className="unavailable large"><strong>Sign in to open Operations.</strong><span>Administrative records are available only to authorized Honor a Life Song staff.</span><Link href="/login?next=%2Fadmin">Sign in</Link></section>;
  }

  if (!(previewAllowed && isStaticPreview) && !allowed) {
    return <section className="unavailable large"><strong>This account does not have Operations access.</strong><span>Organization membership does not grant platform-administrator access.</span><Link href="/organization">Return to your account</Link></section>;
  }

  return <>{children}</>;
}
