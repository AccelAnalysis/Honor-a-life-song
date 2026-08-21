import Link from "next/link";
import { BrandSensoryReference } from "@/components/brand/brand-sensory-reference";

export default function BrandSensoryReferencePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "clamp(24px, 6vw, 80px)", background: "#f3efe9" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}>
        <div>
          <Link href="/" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}>
            Honor a Life Song
          </Link>
          <p style={{ color: "#6e6878", maxWidth: 760, lineHeight: 1.6 }}>
            Internal reference surface for Brand + Sensory authority. This route is not a public navigation destination and contains no
            production participant, media, consent, payment, or delivery data.
          </p>
        </div>
        <BrandSensoryReference />
      </div>
    </main>
  );
}
