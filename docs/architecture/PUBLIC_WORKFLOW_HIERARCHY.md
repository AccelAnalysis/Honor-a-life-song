# Public Workflow Hierarchy

This document governs the child and grandchild navigation implemented for the Public / Acquisition shell. It deepens the operating chassis without changing the chassis boundaries.

## Governing rules

1. Honor a Life Song remains one platform with one shared meaning-to-song engine.
2. Public navigation explains and acquires the service; it does not create a parallel marketing database or duplicate workflow engine.
3. Both products are organization-owned experience templates on the shared platform.
4. Public stories, songs, testimonials and media are shown only when approved content and the applicable permissions are connected.
5. Public acquisition addresses facility and organization decision-makers while participant-centered imagery communicates the human outcome.
6. Until authoritative inquiry, scheduling, agreement, and payment persistence are connected, the routes must not pretend a request, reservation, acceptance, or purchase was completed.

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
├── #single-song-group-event
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

How It Works exposes the six organization-facing stages while retaining the route slugs for link compatibility:

1. Choose an Experience
2. Prepare Participants
3. Stories Become Songs
4. Review & Event Preparation
5. Presentation or Concert
6. Secure Sharing & Keepsakes

These are presentation stages, not replacements for the deeper domain workflow states in `domain/workflows.ts`. Each public stage has its own route and can later consume the relevant domain services without redefining them.

## Services

The two primary products are the $200 Single-Song Group Event and the $2,500 Honor a Life Song Experience. Both are purchased by an organization and create an `OrganizationExperience`.

## Services → Honor a Life Song Experience

Project Ageless exposes seven source-defined public destinations:

1. Program Overview
2. Facility Benefits
3. Participant Experience
4. Family Experience
5. Concert / Presentation
6. Sponsorship
7. Request a Facility Program

The public Project Ageless experience explains flexible participation. A program run may span approximately two weeks to one month, interviews can occur across multiple touches, and participants do not have to attend the same combination of activities.

The authenticated organization account remains the customer destination. Roster, consent readiness, interviews, songs, concert, and material workflows appear inside this full experience rather than as permanent global facility navigation.

## Integration boundary

The request route terminates at the acquisition boundary until a production request service is connected:

```text
Public organization experience request
        ↓
Canonical Program Lead / Inquiry
        ↓
Consultation
        ↓
Scope & Funding
        ↓
Contracted
        ↓
Organization Experience Setup
        ↓
Organization Experience
```

No separate Project Ageless request database or simulated client-side submission state should be introduced.
