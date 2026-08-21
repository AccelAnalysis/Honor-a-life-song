# Facility / Project Ageless Workflow Hierarchy

## Purpose

This implementation deepens the existing eleven Facility / Project Ageless operating-chassis integration points into the source-defined child and grandchild workflow hierarchy.

It does **not** redesign the operating chassis and it does **not** create a separate Project Ageless application. Facility workflows remain a program-oriented view over the same canonical people, organization, program, story, creative-work, consent, media, funding, scheduling, communications, delivery, reporting, and audit boundaries used elsewhere in Honor a Life Song.

The governing rule remains:

> Features plug into the chassis. Features do not redesign the chassis to fit themselves.

## Bounded top-level scope

The existing top-level Facility navigation remains exactly:

1. Program Dashboard
2. Program Overview
3. Participants
4. Schedule & Touchpoints
5. Stories & Interviews
6. Songs & Creative Works
7. Families
8. Concert & Events
9. Keepsakes
10. Sponsors & Funding
11. Reports & Outcomes

The broader source also names Facility Team, Program Settings, and Help. They remain outside this bounded eleven-page slice until explicit chassis integration points are established.

## Hierarchy authority

`lib/facility-navigation.ts` is the shared hierarchy registry for this slice. It defines:

- the 60 source-defined Facility children;
- the eight Participant Detail grandchildren;
- descriptions and shared platform boundaries for each workflow;
- action/service requirements;
- consent scopes where a downstream action requires a specific permission;
- cross-module targets for dashboard and schedule summary links;
- nested route resolution; and
- static-route generation for preview/export builds.

Feature components consume this registry rather than hard-coding eleven independent submenu systems.

## Route model

The shared authenticated workspace catch-all route remains the chassis route owner. Facility nesting is resolved inside that route rather than by creating a second Facility application shell.

Representative routes:

```text
/facility
/facility/dashboard/program-status
/facility/program/scope
/facility/schedule/family-interview
/facility/events/photography-media-permissions
/facility/participants/detail
/facility/participants/detail/:participantId/consent
```

ProgramRun context can be carried explicitly:

```text
/facility/run/:programRunId
/facility/run/:programRunId/program/dates
/facility/run/:programRunId/participants/detail/:participantId/touchpoint-attendance
```

A route identifier is context, not authorization. Production access to a ProgramRun or Participant must still be validated by the authoritative authorization layer when repositories/services are connected.

Invalid children, extra segments, or invalid Participant Detail grandchildren fail safely. The router does not fall back to a different Facility workflow.

## Context preservation

The route model preserves:

- workspace identity;
- ProgramRun identifier;
- top-level Facility destination;
- child destination;
- selected Participant identifier when applicable; and
- Participant Detail grandchild destination.

Because these are encoded in the URL, refresh and browser Back/Forward navigation preserve the intended nested location. The same registry supplies desktop links, mobile links, and static preview routes.

## Facility page composition

Facility workflows continue to render inside `WorkspaceRoute`:

```text
Authenticated Workspace
├── Facility / Program context
├── existing Facility top-level navigation
└── active Facility module
    ├── module heading / summary
    ├── child navigation
    └── active child workflow
        └── Participant Detail grandchild context where applicable
```

`components/facility-workspace.tsx` owns Facility module content. The shared chassis continues to own the header, workspace identity, context boundary, responsive composition, top-level navigation, route identity, reference/unavailable states, and global application composition.

## Canonical domain contracts reused

The implementation continues to use the existing platform vocabulary rather than introducing Project Ageless duplicates:

- `Organization`
- `ProgramTemplate`
- `ProgramRun`
- `Person`
- `Membership`
- `Participant`
- `Touchpoint`
- `Participation`
- `StoryContribution`
- `CreativeWork`
- `LyricVersion`
- `Approval`
- `MediaAsset`
- `ConsentRecord`
- `AuditEvent`

No `ProjectAgelessResident`, `ProjectAgelessSong`, `ProjectAgelessFamily`, or `ProjectAgelessConsent` model is introduced.

## Flexible participation

Project Ageless remains a flexible participatory residency rather than a participant-level funnel.

```text
ProgramTemplate
      ↓
ProgramRun
   ├── Participant
   └── Touchpoint
          ↓
     Participation
```

`Participation` records attendance independently for a particular participant and touchpoint as `planned`, `attended`, `declined`, or `missed`.

`domain/programs.ts` provides helpers for participant-specific Participation records and the reporting concept "attended at least one touchpoint." It intentionally does not define a universal participant-completion sequence.

## Program lifecycle authority

The governed Project Ageless ProgramRun lifecycle is:

```text
Lead
→ Consultation
→ Scope & Funding
→ Contracted
→ Facility Onboarding
→ Participant Enrollment
→ Consent Readiness
→ Active Program Touches
→ Story and Song Development
→ Event Readiness
→ Concert / Presentation
→ Keepsake Delivery
→ Outcome Measurement
→ Program Closeout
```

`domain/workflows.ts` remains the lifecycle authority. Dashboard Program Status and Action Items read from that contract rather than calculating independent UI progress.

## Authorization and consent

Authorization and consent remain independent gates.

```text
AUTHORIZATION
      +
CONSENT
      ↓
ACTION ALLOWED
```

The consent contract supports participation, interview recording, internal creative use, designated family sharing, private performance, event photo/video, public marketing, sponsor acknowledgment, testimonial use, and extended retention.

`ConsentState` also includes the source-required expired state. Consent evaluation fails closed when consent is missing, pending, restricted, withdrawn, expired, superseded, or missing the requested scope.

`authorizationAndConsentAllow` explicitly requires the actor authorization decision and the applicable consent decision. Connecting a production service later must not bypass either boundary.

## Shared service boundaries and progressive availability

The Facility hierarchy is structurally implemented, but the reference chassis does not pretend that production adapters exist.

Current Facility service-connection flags are false for:

- programs/persistence;
- people;
- scheduling;
- stories;
- creative work;
- consent persistence/mutation;
- communications;
- media;
- secure delivery;
- funding;
- reporting; and
- audit persistence.

When a workflow action depends on one of these services, the workflow surface identifies the boundary and disables the production action. It does not simulate success.

Examples of gated actions include:

- adding an authoritative participant record;
- importing/exporting a roster;
- scheduling sessions through a production calendar;
- sending family invitations;
- recording or changing authoritative consent;
- changing creative-work state;
- publishing event photography/video;
- recording event completion;
- issuing a secure delivery;
- publishing sponsor acknowledgment; and
- generating authoritative reports.

This slice introduces the progressive-availability state **Workflow structured** to distinguish a concrete source-defined workflow surface from a live production capability.

## Privacy and access boundaries

Facility routes and surfaces are designed around a selected ProgramRun. Future repositories must enforce that Facility users can read only authorized program/facility data and must not expose unrelated participants, family records, Creator-only notes, unrestricted production files, sponsor data from other programs, consent-restricted media, or administrator-only data.

Participant Detail requires an explicit selected Participant context before its grandchildren are opened. A Participant does not need an authenticated user account.

Family relationships remain explicitly scoped and do not imply broad access to participant information or media. Sponsor funding does not imply participant-record access.

## Static preview coverage

GitHub Pages PR previews use static export. `getFacilityStaticRouteSlugs` generates every structural Facility parent, child, selected-participant route, and Participant Detail grandchild for both non-contextual reference routes and the reference ProgramRun context. `generateStaticParams` consumes that registry for the Facility workspace.

This keeps direct nested preview URLs refreshable rather than allowing only top-level Facility pages to export.

## Test coverage

The Facility slice adds tests for:

- all eleven top-level Facility destinations and their order;
- all 60 required children;
- all eight Participant Detail grandchildren;
- unique child slugs and concrete domain/service metadata;
- nested route resolution and invalid-route failure;
- ProgramRun and Participant deep-link context round trips;
- static preview route generation;
- shared-registry reachability for responsive navigation;
- progressive availability with disconnected production services;
- flexible participant/touchpoint participation;
- exact Project Ageless lifecycle ordering; and
- authorization/consent separation with fail-closed consent states.

Repository CI remains responsible for lint, TypeScript checking, Vitest, and production build validation.

## Explicitly not built by this slice

This implementation does not introduce:

- Facility Team, Program Settings, or Help as new top-level chassis destinations;
- a separate Project Ageless application;
- a separate song engine;
- an open songwriter marketplace;
- generative-AI songwriting;
- autonomous AI interviewing;
- a general-purpose memory vault;
- a sponsor portal;
- grant prospecting/application management;
- medical or therapy records;
- clinical assessments;
- public social networking;
- volunteer management;
- white-label partner portals; or
- separate CMV/AK9I applications.

## Architectural follow-up

The next Facility implementation slice should connect shared repositories/services behind the established boundaries rather than extending UI structure independently. The highest-risk integration work is authorization-scoped ProgramRun persistence combined with granular consent enforcement, because route context alone must never become data entitlement.
