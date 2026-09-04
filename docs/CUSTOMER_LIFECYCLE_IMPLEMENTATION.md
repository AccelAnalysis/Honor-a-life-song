# SongKeep Customer Lifecycle Implementation

## Customer-facing surfaces

| Surface | Responsibility |
| --- | --- |
| `/services` | Compare the three organization experiences by story, music, presentation, and post-event output. |
| `/begin` | Select/change an experience, choose the organization, record a preferred plan, and choose card or invoice. |
| `/create-account` | Create a person identity and a separate permanent organization/contact relationship. |
| `/organization` | Show the organization’s current commercial next action, experiences, participant readiness, feedback, renewal, and advocacy. |
| `/organization/account` | Show the primary contact, organization details, authorized team, requests, invoices, and agreements. |
| `/participate` | Verified-email participant/representative permission response with granular scopes. |
| `/memories` | Private experience access plus source-attributed post-experience individual commerce. |

## Administrator surfaces

| Surface | Responsibility |
| --- | --- |
| `/admin/requests` | Connect invoices, confirm payment, and create the organization experience. |
| `/admin/catalog` | Publish participant/family products with optional price and checkout link. |
| `/admin/communications` | View state-driven nurture queues and next actions. |
| `/admin/consent` | Review submitted permission responses and activate versioned consent. |
| `/admin/reports` | Review organization request, promoter, recovery, referral, and individual-commerce indicators. |

## Data boundaries

```text
organizations/{organizationId}
  members/{userId}
  experienceRequests/{requestId}
  feedback/{feedbackId}
  referrals/{referralId}
  experiences/{experienceId}
    participants/{participantId}
      consents/{consentId}
    permissionInvitations/{invitationId}
    entitlements/{entitlementId}
    accessInvitations/{invitationId}

postExperienceProducts/{productId}

users/{userId}
  organizations/{organizationId}
  experienceAccess/{accessId}
  purchaseRequests/{purchaseRequestId}
```

## Pipeline event mapping

| Pipeline transition | Persisted event/state |
| --- | --- |
| Awareness → Consideration | Acquisition context is carried into the identified organization request. |
| Decision Ready → Booking | An organization account and selected offering exist. |
| Booking → Paid | An administrator records authoritative payment confirmation. |
| Paid → Story Capture | The package-aware `OrganizationExperience` is created. |
| Participant onboarding | A verified invitation response is reviewed into active consent. |
| Experience Complete → Loyalty | Organization feedback and next-experience options become available. |
| Promoter → Advocacy | A score of 9–10 unlocks an attributed referral record. |
| Experience → Individual customer | Accepted experience access authorizes a source-attributed product request. |

## Interface principles

The experience follows an Apple-style interaction hierarchy:

- one primary action per screen;
- progressive disclosure for optional organization details;
- large controls and adaptive layouts;
- visible keyboard focus and semantic status/error announcements;
- persistent context with minimal navigation chrome;
- explicit separation of destructive or authoritative actions;
- no color-only status communication; and
- reduced-motion behavior.
