import { IdentityLifecyclePlaceholder } from "@/components/identity-lifecycle-placeholder";

export default function VerifyEmailPage() {
  return <IdentityLifecyclePlaceholder title="Verify Email" description="Email verification remains a sibling Identity / Access workflow. Login may hand an unverified account here, but verification state must be authoritative in the production identity service." />;
}
