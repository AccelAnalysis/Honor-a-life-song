"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getLoginChildren,
  getLoginNode,
  getLoginTrail,
  identityLifecycleExits,
  loginWorkflowNodes
} from "@/lib/identity-navigation";
import styles from "./login-route.module.css";

const stageDetails: Record<string, { input: string; boundary: string; output: string }> = {
  "login-sign-in": {
    input: "A person chooses to sign in.",
    boundary: "IdentityService begins provider authentication; credentials are not owned by this presentation component.",
    output: "A provider-authenticated identity result or a fail-closed authentication error."
  },
  "login-provider": {
    input: "The sign-in request enters the selected production identity provider.",
    boundary: "IdentityService normalizes provider results; SessionService establishes the server-authoritative session.",
    output: "An authenticated provider identity that can be resolved to a canonical Person."
  },
  "login-mfa": {
    input: "Authentication policy indicates an additional factor is required.",
    boundary: "The production identity provider performs the MFA challenge; the UI must not invent or locally validate factors.",
    output: "Verified authentication continues to person resolution, or access fails closed."
  },
  "login-resolve-access": {
    input: "A provider-authenticated identity is available.",
    boundary: "AuthorizationService resolves Person, Membership(s), Role(s) and Organization Context from canonical platform records.",
    output: "A normalized identity context ready for workspace authorization."
  },
  "login-person": {
    input: "Authenticated provider identity.",
    boundary: "Resolve exactly one canonical Person identity before applying organization or workspace permissions.",
    output: "Canonical person identifier for downstream membership resolution."
  },
  "login-memberships": {
    input: "Canonical Person.",
    boundary: "Resolve the person's active Membership records, including organization-scoped memberships where applicable.",
    output: "Membership set used to determine roles and contexts."
  },
  "login-roles": {
    input: "Resolved memberships.",
    boundary: "Use the chassis role vocabulary rather than feature-local authorization flags.",
    output: "Customer, family collaborator, authorized representative, facility staff, creator and/or admin roles granted by membership."
  },
  "login-organization": {
    input: "Resolved person, memberships and roles.",
    boundary: "Determine the active organization context only from authorized memberships.",
    output: "Organization context for role-scoped workspace access when one is required."
  },
  "login-enter-workspace": {
    input: "Resolved identity and organization context.",
    boundary: "AuthorizationService calculates permitted workspace destinations before navigation occurs.",
    output: "A permitted workspace or an explicit access-denied state."
  },
  "login-permitted-workspaces": {
    input: "Resolved roles and organization context.",
    boundary: "Only Customer, Facility, Creator and Admin workspace destinations granted to this context may be entered.",
    output: "Authorized redirect into the shared authenticated workspace composition."
  }
};

export function LoginRoute() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const loginIndex = parts.lastIndexOf("login");
  const activeSlug = loginIndex >= 0 ? parts.slice(loginIndex + 1).join("/") : "";
  const activeNode = activeSlug ? getLoginNode(activeSlug) : undefined;
  const children = getLoginChildren(activeNode?.slug ?? null);
  const trail = activeNode ? getLoginTrail(activeNode.slug) : [];
  const detail = activeNode ? stageDetails[activeNode.id] : undefined;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <Link className={styles.brand} href="/">Honor a Life Song</Link>
          <p className={styles.kicker}>Identity / Access</p>
          <h2 className={styles.sidebarTitle}>Login</h2>
        </div>

        <nav className={styles.tree} aria-label="Login workflow hierarchy">
          <Link className={`${styles.treeLink} ${!activeNode ? styles.active : ""}`} href="/login">
            <span>Login overview</span>
            <small>Workflow root</small>
          </Link>
          {loginWorkflowNodes.map((node) => (
            <Link
              className={`${styles.treeLink} ${node.parentSlug ? styles.child : ""} ${activeNode?.id === node.id ? styles.active : ""}`}
              href={`/login/${node.slug}`}
              key={node.id}
            >
              <span>{node.label}</span>
              <small>{node.availability === "provider_required" ? "Provider required" : "Chassis contract"}</small>
            </Link>
          ))}
        </nav>

        <div className={styles.exits}>
          <strong>Identity lifecycle exits</strong>
          {identityLifecycleExits.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topRow}>
          <div className={styles.breadcrumbs}>
            <Link href="/">Home</Link><span>/</span><Link href="/login">Identity</Link><span>/</span><span>Login</span>
            {trail.map((item) => <span key={item.id}> / {item.label}</span>)}
          </div>
          <span className={`${styles.status} ${activeNode?.availability === "provider_required" ? styles.provider : ""}`}>
            {activeNode?.availability === "provider_required" ? "Provider required" : "Chassis active"}
          </span>
        </div>

        <section className={styles.heading}>
          <p className={styles.kicker}>{activeNode ? "Login workflow" : "Identity entry point"}</p>
          <h1>{activeNode?.label ?? "Login"}</h1>
          <p>{activeNode?.description ?? "Establish who the person is, resolve how that person is permitted to enter the platform, and hand the authenticated identity into the shared workspace without duplicating the chassis authorization model."}</p>
        </section>

        {!activeNode && (
          <>
            <div className={styles.notice}>
              <strong>Production authentication is not connected.</strong>
              <span>The source specification leaves the identity provider and hosting stack unresolved. This hierarchy therefore exposes real route, state and service contracts while refusing to simulate credentials or client-side authorization.</span>
            </div>
            <div className={styles.flow} aria-label="Login resolution sequence">
              <span>Identity Provider</span><b>→</b><span>Authenticated Person</span><b>→</b><span>Membership(s)</span><b>→</b><span>Role(s)</span><b>→</b><span>Organization Context</span><b>→</b><span>Permitted Workspace(s)</span>
            </div>
          </>
        )}

        {detail && (
          <section className={styles.grid} aria-label={`${activeNode?.label} contract`}>
            <article className={styles.card}><h3>Input</h3><p>{detail.input}</p></article>
            <article className={styles.card}><h3>Service boundary</h3><p>{detail.boundary}</p></article>
            <article className={styles.card}><h3>Output</h3><p>{detail.output}</p></article>
          </section>
        )}

        {children.length > 0 && (
          <section>
            <p className={styles.kicker}>{activeNode ? "Grandchild workflows" : "Child workflows"}</p>
            <div className={styles.grid}>
              {children.map((child) => (
                <article className={styles.card} key={child.id}>
                  <h2>{child.label}</h2>
                  <p>{child.description}</p>
                  <Link href={`/login/${child.slug}`}>Open workflow →</Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeNode?.availability === "provider_required" && (
          <div className={styles.notice}>
            <strong>Provider-dependent action is fail-closed.</strong>
            <span>No credential submission, MFA verification, session creation or authentication success is fabricated until a production identity provider is selected and connected behind the governed service interfaces.</span>
          </div>
        )}

        <section className={styles.source}>
          <h2>Source-backed responsibility</h2>
          <p>{activeNode?.sourceBasis ?? "The Identity / Access shell establishes who the person is and how they are permitted to enter the platform. Login feeds the canonical Person → Membership(s) → Role(s) → Organization Context → Permitted Workspace(s) sequence."}</p>
        </section>

        {!activeNode && (
          <section className={styles.source}>
            <h2>Alternate and exception paths</h2>
            <div className={styles.grid}>
              {identityLifecycleExits.map((item) => <article className={styles.card} key={item.href}><h3>{item.label}</h3><p>{item.reason}</p><Link href={item.href}>Open destination →</Link></article>)}
            </div>
          </section>
        )}

        <Link className={styles.returnLink} href={activeNode ? "/login" : "/"}>{activeNode ? "← Back to Login overview" : "← Return home"}</Link>
      </main>
    </div>
  );
}
