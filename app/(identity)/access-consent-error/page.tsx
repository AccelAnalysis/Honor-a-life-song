import { IdentityLifecyclePlaceholder } from "@/components/identity-lifecycle-placeholder";

export default function AccessConsentErrorPage() {
  return <IdentityLifecyclePlaceholder title="Access / Consent Error States" description="Authorization failures and consent-specific restrictions must fail closed and remain distinguishable. Authentication or workspace authorization does not imply consent for downstream story, media, performance, sharing or publication uses." />;
}
