import { IdentityLifecyclePlaceholder } from "@/components/identity-lifecycle-placeholder";

export default function PasswordRecoveryPage() {
  return <IdentityLifecyclePlaceholder title="Password Recovery" description="Password recovery is a dedicated Identity / Access workflow. It must use the selected provider's secure recovery process rather than exposing password-reset behavior in the Login presentation layer." />;
}
