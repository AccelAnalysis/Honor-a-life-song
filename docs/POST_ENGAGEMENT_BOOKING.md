# Organization-to-Individual Customer Lifecycle

## Purpose

SongKeep operates two connected commerce relationships without confusing who owns the original experience:

```text
Organization awareness and consideration
→ organization chooses $200 / $2,500 / $6,000
→ permanent organization + primary contact account
→ preferred plan + organization authority acknowledgement
→ card checkout handoff OR organization invoice request
→ authoritative payment confirmation
→ organization experience
→ participant-specific permission invitations
→ story, song, presentation, delivery
→ organization feedback / recovery / renewal / advocacy
→ participant and family access
→ experience-derived individual products
```

The customer-facing application does not expose the seven customer-pipeline stages as navigation. The stages govern workflow state, automation, reporting, and administrative follow-up underneath a simple next-action experience.

## Catalog authority

`domain/experience.ts` defines three organization-owned experience templates:

- Single-Song Group Event — **$200**
- Honor a Life Song Experience — **$2,500**
- SongKeep Legacy Album — **$6,000**

All three retain `buyer: "organization"`. The Legacy Album adds album mapping, tracks, release management, and approved distribution to the shared meaning-to-song platform.

`postExperienceProducts` is a separate administrator-managed catalog. These products can be shown only to eligible participants or designated family members who have accepted private access to a source organization experience.

## Account and contact continuity

The organization is the permanent commercial customer. The primary contact is a person connected to it. Account creation separately records:

- organization name and type;
- organization email, phone, website, and address when available;
- contact name, title, direct email, and phone; and
- the person’s current relationship role.

A change in personnel must not erase the organization’s requests, invoices, experiences, participants, feedback, referrals, or future opportunities.

## Commercial truth

An organization experience request contains the chosen offering, exact catalog amount, preferred date/time, venue, participant estimate, goal, requested payment method, acquisition context, and relationship next action.

Card checkout is a handoff. A redirect or browser return never changes the financial state to paid. A platform administrator confirms payment and atomically creates the resulting organization experience.

Invoice requests remain attached to the same organization relationship. They enter the invoice-payment nurture queue until an invoice is connected and payment is confirmed.

## Participant permissions

Organization payment and agreements never create participant permission.

The organization may create a private invitation for a participant or authorized representative. The invited person signs in with the verified invited email and responds separately to participation, interview recording, internal creative use, designated-family sharing, private performance, event photo/video, public marketing, and testimonial choices.

A submitted response is reviewed by SongKeep before it becomes an active consent record. Assisted and printable alternatives remain available.

## Post-experience growth

After a completed experience:

- the organization receives NPS/CSAT follow-up;
- scores 0–6 route to service recovery;
- scores 7–8 stay in relationship nurture;
- scores 9–10 unlock an attributed warm-introduction workflow;
- another experience can be planned under the same account; and
- eligible participants and designated family members can request or purchase products derived from the source experience.

Every individual purchase request records the source organization, source experience, participant, recipient relationship, product, payment method, and authoritative fulfillment state.

## Service boundaries

Implemented client/data boundaries include Firebase identity, organization/contact persistence, experience requests, invoice-request state, payment-link handoff, administrator payment reconciliation, experience creation, participant permission invitations and responses, organization feedback, referrals, individual product catalog, source-attributed purchase requests, and administrator review surfaces.

External notification sending, card-payment webhooks, invoice-provider generation, secure media bytes, and fulfillment provider integrations remain separate adapters. The user interface does not claim those provider actions occurred when they have not.
