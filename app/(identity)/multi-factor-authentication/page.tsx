import { IdentityLifecyclePlaceholder } from "@/components/identity-lifecycle-placeholder";

export default function MultiFactorAuthenticationPage() {
  return <IdentityLifecyclePlaceholder title="Multi-Factor Authentication" description="MFA is a governed Identity / Access workflow and is required by the product scope for administrators and staff. Provider-specific enrollment and challenge handling remain deferred until the production identity service is selected." />;
}
