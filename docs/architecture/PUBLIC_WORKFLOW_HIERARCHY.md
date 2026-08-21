# Public Workflow Hierarchy

This document governs the child and grandchild navigation implemented for the Public / Acquisition shell. It deepens the operating chassis without changing the chassis boundaries.

## Governing rules

1. Honor a Life Song remains one platform with one shared meaning-to-song engine.
2. Public navigation explains and acquires the service; it does not create a parallel marketing database or duplicate workflow engine.
3. Project Ageless remains a configurable program on the shared platform, not a standalone application.
4. Public stories, songs, testimonials and media are shown only when approved content and the applicable permissions are connected.
5. The public facility-request destination is the handoff to the canonical Program Lead / Inquiry service. Until authoritative persistence is connected, the route must not pretend a request has been submitted.

## Route hierarchy

```text
/
├── #hero-value-proposition
├── #home-how-it-works
├── #featured-stories-songs
├── #program-highlights
├── #testimonials
└── #request-a-song

/how-it-works
├── /share-your-story
├── /interview-story-capture
├── /songwriting-process
├── /review-revisions
├── /production
└── /delivery-keepsakes

/services
├── #individual-family-songs
├── /project-ageless
│   ├── /program-overview
│   ├── /facility-benefits
│   ├── /participant-experience
│   ├── /family-experience
│   ├── /concert-presentation
│   ├── /sponsorship
│   └── /request-facility-program
└── #community-programs
```

## Home

Home is section-based rather than a collection of artificial subpages. Its six source-defined children are stable anchors so navigation can deep-link into the public landing experience while keeping the homepage coherent.

Featured stories, songs and testimonials intentionally do not contain invented examples. Approved content can later plug into those anchors through the shared media, consent and publishing boundaries.

## How It Works

How It Works exposes the six public-facing service stages:

1. Share Your Story
2. Interview / Story Capture
3. Songwriting Process
4. Review & Revisions
5. Production
6. Delivery / Keepsakes

These are presentation stages, not replacements for the deeper domain workflow states in `domain/workflows.ts`. Each public stage has its own route and can later consume the relevant domain services without redefining them.

## Services → Project Ageless

Project Ageless exposes seven source-defined public destinations:

1. Program Overview
2. Facility Benefits
3. Participant Experience
4. Family Experience
5. Concert / Presentation
6. Sponsorship
7. Request a Facility Program

The public Project Ageless experience explains flexible participation. A program run may span approximately two weeks to one month, interviews can occur across multiple touches, and participants do not have to attend the same combination of activities.

The authenticated facility workspace remains the operational destination for program scope, rosters, consent readiness, touchpoints, stories, songs, families, events, keepsakes, sponsors and outcomes.

## Integration boundary

The request route terminates at the acquisition boundary until a production request service is connected:

```text
Public Project Ageless request
        ↓
Canonical Program Lead / Inquiry
        ↓
Consultation
        ↓
Scope & Funding
        ↓
Contracted
        ↓
Facility Onboarding
        ↓
Program Run
```

No separate Project Ageless request database or simulated client-side submission state should be introduced.
