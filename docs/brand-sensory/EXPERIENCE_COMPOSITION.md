# SongKeep Experience Composition Authority

The Brand + Sensory system governs more than tokens and components. It also governs **composition**: what a person sees first, how much architecture is visible, when music appears, how the SongKeep mark is used, and which visual grammar belongs to each audience.

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

## SongKeep composition signature

The approved SongKeep logo establishes a visual language of:

```text
bright field
+ Midnight Ink
+ pink / violet / blue resonance
+ smooth geometry
+ music
+ privacy / safekeeping
+ generous breathing room
```

Translate those qualities into the interface rather than repeating the logo itself on every screen.

### The logo should be prominent when

- someone first encounters the application;
- a customer signs in or creates an account;
- a finished song is received;
- a public page introduces the SongKeep experience; or
- a branded document / presentation needs formal identity.

### The logo should become quiet when

- someone is completing a form;
- a creator is working on lyrics or production;
- an administrator is handling operations;
- a facility coordinator is managing a roster or schedule; or
- repeating the mark would compete with the person, song, or task.

## Experience modes

### Consumer / listening mode

Applies to Public, Identity, Customer / Family, and Secure Delivery.

- image- and music-led rather than card-led;
- large, contemporary typography and strong negative space;
- one primary action per scene;
- SongKeep full/app lockup used deliberately rather than repetitively;
- songs presented as visual objects;
- user-initiated audio near the center of the experience;
- minimal persistent chrome;
- gradients used as accents, waveform, progress, or light fields rather than full-page decoration;
- technical state translated into plain, humane language;
- no domain vocabulary such as membership resolution, provider handoff, service boundary, or chassis status in ordinary customer copy.

### Program mode

Applies to Facility / Project Ageless.

- people, songs, events, and program imagery remain visually prominent;
- coordination and outcome information is available without turning the program into an administrative dashboard;
- the SongKeep palette provides continuity without overwhelming program identity;
- participant photography and song presentation remain permission-aware.

### Studio mode

Applies to Creator / Production.

- creative-work identity, lyrics, sources, recordings, versions, and waveforms lead the composition;
- the SongKeep gradient may appear in playback, waveform, current-work identity, and selected creative state;
- denser controls are appropriate when they resemble a working studio rather than a generic CRM;
- internal notes and production assets remain visibly distinct from recipient-facing work.

### Operations mode

Applies to Admin / Operations.

- tables, filters, metrics, and dense state controls are appropriate;
- white / Soft Canvas, Midnight Ink, Azure, and semantic colors do most of the work;
- the full gradient should be rare and intentional;
- containerization is still restrained: group by task and hierarchy, not by wrapping every block in a card;
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

### Preferred page rhythm

```text
full-width or broad visual field
→ focused content block
→ media / audio moment
→ generous whitespace
→ next meaningful decision
```

Avoid:

```text
header
→ row of metric cards
→ row of feature cards
→ another bordered section
→ technical explanation panel
→ more cards
```

unless the audience and task genuinely require an operational dashboard.

## Identity presentation

`/login` is a consumer surface.

It should feel like **entering SongKeep**, not authenticating into enterprise software.

Preferred composition:

```text
SongKeep full or app lockup
+ quiet human / musical image or light brand field
+ short welcoming message
+ login fields
+ one primary action
+ quiet recovery / support links
```

It may show fields, verification prompts, privacy reassurance, and account-recovery paths. It must not display:

- the Login workflow tree;
- breadcrumbs describing internal identity stages;
- provider-required or chassis-active badges;
- input / service-boundary / output cards;
- Person → Membership → Role → Organization diagrams;
- source-backed responsibility copy; or
- competing Honor a Life Song and SongKeep mastheads.

Those materials belong at `/reference/identity/login`.

## Customer workspace composition

The customer workspace should answer, in roughly this order:

1. **What is this song / experience?**
2. **Where are we in the journey?**
3. **What can I listen to or look at now?**
4. **What is the one next thing I need to do?**
5. **Where can I find the rest if I need it?**

Do not lead with internal statuses, record identifiers, metadata grids, or a dense left navigation when a simpler journey presentation is available.

## Facility composition

Facility users have more coordination work, but the program should still look like a human program.

Lead with:

- upcoming program moment;
- people;
- songs / creative works;
- event readiness;
- next coordination need.

Support with roster, consent readiness, schedule, funding, and reports without turning all of those into equal-weight dashboard tiles.

## Secure Delivery composition

A private delivered song is the strongest branded moment after Login.

Preferred order:

```text
SongKeep mark
→ song artwork / approved image
→ title + person
→ primary play action
→ lyric / story context
→ permitted download / share / keepsake actions
```

Avoid a file-management presentation. The listener should encounter the song before storage metadata.

## Audio behavior

- No autoplay.
- The first sound requires a deliberate user action.
- Once the person invites sound, the interface may maintain continuity within the same experience.
- Sound is never the only state cue.
- Public preview, customer review, final delivery, creator production, and voice-memory capture use variants of the same sanctioned audio system.
- Waveform / playback progress may use the SongKeep gradient when contrast and state clarity are preserved.
- A reference sonic signature may be browser-generated, but it must be identified as a reference rather than a final commissioned sonic logo.

## Imagery

Reference stock imagery may be used to establish composition before owned photography exists. It must:

- be licensed for the intended use;
- be credited in the reference implementation;
- never imply that a stock subject is a real participant or customer;
- be replaced by commissioned or properly consented brand photography before production launch where appropriate.

Prefer images with authentic human interaction, memory objects, listening, songwriting, recording, and intergenerational connection. Avoid generic senior-care, healthcare, funeral, and posed “service recipient” imagery.

## Color composition

The page should usually be mostly Canvas / Soft Canvas with Midnight Ink typography. Azure is the default active/action color. Magenta, Violet, Indigo, and Sky create brand moments rather than competing for equal attention.

A useful visual ratio is conceptual rather than prescriptive:

```text
~70–85% calm neutral field
~10–20% Midnight / solid brand structure
~5–10% gradient / expressive accent
```

The goal is not to mathematically enforce percentages; it is to prevent the palette from becoming an all-over rainbow treatment.

## Acceptance test

A consumer should experience this order of meaning:

> person → memory → voice → song → keepsake

not:

> navigation → hierarchy → status → card → technical explanation

A SongKeep screen should also pass this test:

> if the logo were temporarily hidden, would the combination of color, spacing, typography, imagery, audio treatment, and calm composition still feel like the same product?

The security, consent, state, and workflow rules remain exactly as strict underneath the presentation.
