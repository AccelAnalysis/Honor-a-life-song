import { IdentityLifecyclePlaceholder } from "@/components/identity-lifecycle-placeholder";

export default function CreateAccountPage() {
  return <IdentityLifecyclePlaceholder title="Create Account" description="New-account creation is a sibling Identity / Access workflow. It will plug into the selected production identity service and canonical Person/Membership model rather than being implemented inside Login." />;
}
