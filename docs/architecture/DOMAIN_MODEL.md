# Canonical Domain Model

The chassis reserves canonical concepts before persistence is introduced.

## Identity and organizations
Person, Organization, Membership, Role, Permission.

## Commercial
Inquiry, Request, Quote, Order, OrganizationExperience, Payment, Invoice, Refund.

Every initial `Order` is purchased by an `Organization`. A completed purchase creates or links to one `OrganizationExperience`; an organization retains many experiences over time.

## Program delivery
ExperienceTemplate, ProgramTemplate, OrganizationExperience, ProgramRun, ExperienceParticipant, Participant, Touchpoint, Participation, Event, Invitation.

`ExperienceParticipant` belongs to an `OrganizationExperience`. A participant is not required to have a platform account.

## Story development
Story, StoryContribution, Interview, StoryFact, StoryTheme.

## Creative work
CreativeWork, Song, LyricVersion, Review, Approval, ProductionWork.

## Media and delivery
MediaAsset, OrganizationAsset, ExperienceAssetEntitlement, ExperienceAccessInvitation, DeliveryAsset.

Organization visibility, participant entitlement, consent, and secure-delivery authorization are distinct decisions.

## Governance
ConsentRecord, ConsentGrant, ConsentRestriction, AuditEvent.

## Funding and outcomes
FundingSource, FundingAllocation, OutcomeMeasure.

Names should be extended rather than duplicated under alternate module-specific terminology.
