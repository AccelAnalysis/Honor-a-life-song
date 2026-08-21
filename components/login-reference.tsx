import Link from "next/link";
import { identityLifecycleExits, loginWorkflowNodes } from "@/lib/identity-navigation";
import styles from "./login-reference.module.css";

export function LoginReference() {
  const roots = loginWorkflowNodes.filter((node) => !node.parentSlug);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Internal reference · not customer-facing</p>
          <h1>Identity / Login workflow authority</h1>
          <p>This surface preserves the route hierarchy, provider boundary, and fail-closed access sequence without exposing those implementation details on the consumer login page.</p>
        </div>
        <Link href="/login">Open consumer login →</Link>
      </header>

      <section className={styles.flow} aria-label="Canonical identity resolution sequence">
        {[
          "Identity provider",
          "Authenticated person",
          "Memberships",
          "Roles",
          "Organization context",
          "Permitted workspaces"
        ].map((item, index) => (
          <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
        ))}
      </section>

      <section className={styles.tree} aria-labelledby="login-tree-title">
        <div className={styles.sectionHeading}><p className={styles.kicker}>Route-backed hierarchy</p><h2 id="login-tree-title">Login workflow nodes</h2></div>
        <div className={styles.columns}>
          {roots.map((root) => (
            <article key={root.id}>
              <span>{root.availability === "provider_required" ? "Provider boundary" : "Chassis contract"}</span>
              <h3>{root.label}</h3>
              <p>{root.description}</p>
              <ul>
                {loginWorkflowNodes.filter((node) => node.parentSlug === root.slug).map((child) => (
                  <li key={child.id}><Link href={`/login/${child.slug}`}>{child.label}</Link><small>{child.description}</small></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.exits} aria-labelledby="identity-exits-title">
        <div className={styles.sectionHeading}><p className={styles.kicker}>Sibling lifecycle routes</p><h2 id="identity-exits-title">Identity exits</h2></div>
        <div>{identityLifecycleExits.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</div>
      </section>
    </main>
  );
}
