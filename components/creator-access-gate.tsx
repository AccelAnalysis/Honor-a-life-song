"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { listCreatorAssignments } from "@/lib/firebase/creator-deliverables";
import { isPlatformAdmin } from "@/lib/firebase/organization-account";

export type CreatorAccessRole = "admin" | "creator";

const CreatorAccessContext = createContext<CreatorAccessRole | null>(null);

export function useCreatorAccess() {
  return useContext(CreatorAccessContext);
}

export function CreatorAccessGate({ children }: { children: ReactNode }) {
  const { user, status, configurationError } = useAuth();
  const pathname = usePathname();
  const [role, setRole] = useState<CreatorAccessRole | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (status !== "signed_in" || !user) {
      setRole(null);
      setDenied(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      isPlatformAdmin(user.uid),
      listCreatorAssignments(user.uid).catch(() => [])
    ]).then(([admin, assignments]) => {
      if (cancelled) return;
      if (admin) setRole("admin");
      else if (assignments.length) setRole("creator");
      else setDenied(true);
    }).catch(() => { if (!cancelled) setDenied(true); });
    return () => { cancelled = true; };
  }, [status, user]);

  if (status === "loading" || (status === "signed_in" && !role && !denied)) {
    return <section className="unavailable large"><strong>Opening Creator Studio…</strong><span>Confirming your access.</span></section>;
  }

  if (status === "unavailable") {
    return <section className="unavailable large"><strong>Account access is temporarily unavailable.</strong><span>{configurationError ?? "Please try again or contact SongKeep for help."}</span></section>;
  }

  if (status === "signed_out" || !user) {
    const next = encodeURIComponent(pathname || "/creator/song");
    return <section className="unavailable large"><strong>Sign in to open Creator Studio.</strong><span>Songwriting is available to Honor a Life Song creators and staff.</span><Link href={`/login?next=${next}`}>Sign in</Link></section>;
  }

  if (!role || denied) {
    return <section className="unavailable large"><strong>This account does not have creator access.</strong><span>Organization membership does not open the songwriting studio.</span><Link href="/">Return home</Link></section>;
  }

  return <CreatorAccessContext.Provider value={role}>{children}</CreatorAccessContext.Provider>;
}
