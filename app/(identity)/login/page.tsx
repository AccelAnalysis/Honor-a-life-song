import Link from "next/link";

export default function LoginPage() {
  return <main className="centeredPage"><section className="authCard"><Link className="brand" href="/">Honor a Life Song</Link><p className="eyebrow">Identity / Access Shell</p><h1>Sign in</h1><p>Authentication is an explicit infrastructure boundary in the chassis. No fake credentials or client-side authorization are provided.</p><div className="unavailable"><strong>Authentication provider not connected</strong><span>This route and access state are ready for a production identity provider in a later slice.</span></div><Link href="/">Return home</Link></section></main>;
}
