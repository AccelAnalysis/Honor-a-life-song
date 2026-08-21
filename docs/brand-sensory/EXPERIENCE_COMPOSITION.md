# Honor a Life Song Experience Composition Authority

The Brand + Sensory system governs more than tokens and components. It also governs **composition**: what a person sees first, how much architecture is visible, when music appears, and which visual grammar belongs to each audience.

## Governing rule

> Consumer experiences reveal people, stories, images, lyrics, and sound. Internal architecture remains available to reviewers and developers, but it is not rendered as the customer experience.

The platform therefore maintains two presentations over the same governed domain and workflow contracts:

```text
DOMAIN + WORKFLOW AUTHORITY
          │
          ├── Consumer presentation
          │   People · imagery · song artwork · listening · one clear action
          │
          └── Reference presentation
              hierarchy · service boundaries · states · availability · diagnostics
```

Reference surfaces use `/reference/...` routes and are not public-navigation destinations.

## Experience modes

### Consumer / listening mode

Applies to Public, Identity, Customer / Family, and Secure Delivery.

- image- and music-led rather than card-led;
- large editorial type and strong negative space;
- one primary action per scene;
- songs presented as visual objects;
- user-initiated audio near the center of the experience;
- minimal persistent chrome;
- technical state translated into plain, humane language;
- no domain vocabulary such as membership resolution, provider handoff, service boundary, or chassis status in ordinary customer copy.

### Program mode

Applies to Facility / Project Ageless.

- people, songs, events, and program imagery remain visually prominent;
- coordination and outcome information is available without turning the program into an administrative dashboard;
- participant photography and song presentation remain permission-aware.

### Studio mode

Applies to Creator / Production.

- creative-work identity, lyrics, sources, recordings, versions, and waveforms lead the composition;
- denser controls are appropriate when they resemble a working studio rather than a generic CRM;
- internal notes and production assets remain visibly distinct from recipient-facing work.

### Operations mode

Applies to Admin / Operations.

- tables, filters, metrics, cards, and dense state controls are appropriate;
- this visual grammar must not become the default for consumer, listening, or program surfaces.

## Scene-first composition

Consumer pages should generally move through scenes:

```text
Human image or song artwork
        ↓
One emotional idea
        ↓
A listening invitation
        ↓
Story or lyric detail
        ↓
One next action
```

Cards are allowed for collections and choices. They are not the default container for every idea.

## Identity presentation

`/login` is a consumer surface. It may show fields, verification prompts, privacy reassurance, and account-recovery paths. It must not display:

- the Login workflow tree;
- breadcrumbs describing internal identity stages;
- provider-required or chassis-active badges;
- input / service-boundary / output cards;
- Person → Membership → Role → Organization diagrams;
- source-backed responsibility copy.

Those materials belong at `/reference/identity/login`.

## Audio behavior

- No autoplay.
- The first sound requires a deliberate user action.
- Once the person invites sound, the interface may maintain continuity within the same experience.
- Sound is never the only state cue.
- Public preview, customer review, final delivery, creator production, and voice-memory capture use variants of the same sanctioned audio system.
- A reference sonic signature may be browser-generated, but it must be identified as a reference rather than a final commissioned sonic logo.

## Imagery

Reference stock imagery may be used to establish composition before owned photography exists. It must:

- be licensed for the intended use;
- be credited in the reference implementation;
- never imply that a stock subject is a real participant or customer;
- be replaced by commissioned or properly consented brand photography before production launch where appropriate.

The current consumer reference uses Pexels imagery from Centre for Ageing Better, Los Muertos Crew, and Saulo Leite.

## Acceptance test

A consumer should experience this order of meaning:

> person → memory → voice → song → keepsake

not:

> navigation → hierarchy → status → card → technical explanation

The security, consent, state, and workflow rules remain exactly as strict underneath the presentation.
