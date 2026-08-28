# SongKeep / Honor a Life Song — Brand + Sensory Experience Authority

**Authority status:** architectural design authority  
**Version:** 0.2.0  
**Applies to:** Public, Identity, Customer / Family, Facility / Project Ageless, Creator / Production, Admin / Operations, Secure Delivery, and shared platform services

## 1. Governing rule

> **Workflows inherit the SongKeep sensory system. Workflows do not invent their own brand language.**

The operating chassis governs where experiences belong. Workflow contracts govern what those experiences do. This authority governs how they feel, look, move, sound, and present approved human media.

The approved SongKeep logo supplied on August 28, 2026 is the visual source of truth for the application design system. The application-facing identity is **SongKeep**, with the tagline **“Your Story. Your Song. Always.”** The repository and operating architecture may continue to use **Honor a Life Song** as the project/service name during naming migration, but customer-facing screens should not compete with themselves by presenting both names as equal primary brands.

## 2. Brand idea

SongKeep is a human-led story-to-song experience centered on three promises expressed directly in the mark:

- **Heart:** a life and story worth holding;
- **Music:** the story becomes a song; and
- **Keyhole:** the song and memories are treated as something personal, protected, and lasting.

The sensory identity should express the transformation:

**voice → story → lyric → song → shared meaning → keepsake**

The design direction is:

**living memory × music craft × protected keepsake**

The platform must not present itself as an AI song generator, generic media SaaS product, senior-living portal, funeral or memorial product, clinical system, or entertainment streaming service.

## 3. Personality

The experience should be:

- warm;
- human;
- alive;
- musical;
- personal;
- contemporary;
- optimistic;
- crafted;
- trustworthy; and
- intergenerational.

It should avoid feeling:

- clinical;
- sentimentalized;
- elderly-coded;
- funeral-coded;
- technology-forward for its own sake;
- generic SaaS;
- overly luxurious or formal;
- childish or candy-colored; or
- decorated with repeated music-note or heart motifs.

The logo may contain its sanctioned heart, note, and keyhole. Those elements should not be repeated throughout the interface as decorative icons. Warmth comes from people, sound, imagery, pacing, color, and language—not visual clutter.

## 4. Brand architecture

### Application-facing brand

**SongKeep** is the primary product identity shown in application chrome, authentication, customer workspaces, delivery, and other product-facing surfaces.

### Service / operating context

**Honor a Life Song** remains the service and repository context until a separate naming migration changes architecture, source paths, legal language, program documents, or contractual references.

### Program brands

Program names such as **Project Ageless** remain program identities inside SongKeep. They should use the same core interface system rather than creating separate branded applications.

### Co-branding rule

Do not place a large SongKeep logo beside a large Honor a Life Song wordmark. If both names must appear for transitional, legal, or program reasons, SongKeep remains the visual brand and the secondary service reference is quiet text.

## 5. Logo authority

The approved mark consists of:

1. the heart / music-note / keyhole emblem;
2. the **SongKeep** wordmark;
3. the tagline **YOUR STORY. YOUR SONG. ALWAYS.**; and
4. a pink → violet → blue gradient as a core signature.

The master supplied artwork is authoritative for shape, proportions, gradient direction, and lettering. Do not redraw the wordmark using a substitute typeface.

### Sanctioned logo variants

- **Full lockup:** emblem + SongKeep + tagline. Use on welcome, login, public landing, formal presentation, and selected empty-state / delivery moments.
- **Primary app lockup:** emblem + SongKeep, without tagline. Use in application headers and navigation where the full lockup would consume too much space.
- **Compact mark:** emblem only. Use for favicon, app icon, compact mobile chrome, loading mark, and small signed brand moments.
- **Monochrome mark:** a single-color version in Midnight Ink or white when gradients cannot be reproduced accessibly or reliably.

### Clear space and scale

- Preserve clear space around the mark equal to at least one quarter of the emblem height.
- Never compress, stretch, rotate, skew, outline, or add independent drop shadows to the mark.
- Never put the full tagline lockup into small application headers.
- Never place the gradient mark over visually busy imagery without an appropriate quiet field.
- Prefer white, near-white, or deep Midnight Ink backgrounds around the mark.

See [`LOGO_SYSTEM.md`](./LOGO_SYSTEM.md) for implementation details.

## 6. Core color system

The new palette is derived from the approved SongKeep artwork. Approximate digital tokens are sampled from the supplied logo and are intended for interface use; the source artwork remains authoritative for the logo itself.

| Token | Value | Role |
|---|---:|---|
| **Midnight Ink** | `#141648` | Primary text, deep navigation, high-contrast brand field |
| **Indigo** | `#4858BE` | Core brand color, focus, selected state, graphic accents |
| **Azure** | `#1572C6` | Primary action, links, active controls |
| **Sky** | `#1C8BD3` | Bright secondary accent, visualization, decorative gradient edge |
| **Violet** | `#834AB4` | Story / creative accent, artwork, gradient transition |
| **Magenta** | `#D53FA3` | Emotional highlight, lyric/story emphasis, gradient start |
| **Lavender Mist** | `#E5E3F0` | Quiet tinted surface |
| **Canvas** | `#FFFFFF` | Primary background |
| **Soft Canvas** | `#F7F8FC` | Secondary background |
| **Line** | `#E1E4F0` | Dividers and low-emphasis borders |
| **Muted Ink** | `#62657A` | Secondary text |
| **Success** | `#2F6B4F` | Success states only |
| **Warning** | `#8A5A22` | Warning states only |
| **Danger** | `#8A3D46` | Destructive / critical states only |

### Primary gradient

The sanctioned interface echo of the logo gradient is:

```css
linear-gradient(
  135deg,
  #D53FA3 0%,
  #834AB4 35%,
  #4858BE 62%,
  #1572C6 82%,
  #1C8BD3 100%
)
```

Use the gradient for:

- waveform / resonance detail;
- selected song artwork treatments;
- thin progress or accent rules;
- hero light fields;
- small brand moments; and
- controlled delivery / keepsake artwork.

Do **not** make every button, card, header, or page background a gradient. The brand should feel fresh and clear, not neon or gamer-like.

### Accessibility rules

- Midnight Ink, Indigo, and Azure may be used for normal text on white when contrast requirements are met.
- Sky and Magenta are primarily accent colors; do not use them for small body text on white.
- Primary buttons should normally use solid Midnight Ink or Azure with white text rather than a multi-stop gradient.
- Status colors retain their semantic meaning. Brand colors must not replace success, warning, or danger when meaning would become ambiguous.
- Never encode state through color alone.

## 7. Surface and container system

SongKeep should not look like a conventional dashboard product.

### Default surface behavior

- White and Soft Canvas are the dominant page fields.
- Use negative space before adding a container.
- Use thin dividers before adding bordered cards.
- Use media, song artwork, quotes, lyrics, and human imagery as visual anchors.
- Cards are for genuine groups, choices, collections, or stateful work—not for every paragraph.
- Avoid nested cards, boxes inside boxes, thick borders, full-page side panels, and persistent metadata chrome.

### Radius

The rounded logo language should be reflected with restraint:

- controls: `12px`;
- compact cards / inputs: `14px`;
- media / feature surfaces: `20px`;
- large hero / keepsake artwork: `28px` when appropriate;
- pills: only for chips, tags, filters, and small segmented controls.

Do not make every object pill-shaped.

### Elevation

Use shadows sparingly. Prefer one soft elevation level for floating controls or media, and flat composition elsewhere.

## 8. Typography authority

The logo is smooth, contemporary, and rounded. The interface should therefore use a **warm humanist / rounded sans** as its primary visual voice rather than making the product serif-led.

### UI / brand sans

Use a highly legible humanist or rounded sans for:

- navigation;
- controls;
- headings;
- forms;
- labels;
- dashboard information; and
- app chrome.

The implementation should expose `--font-brand-sans` and use a system-safe fallback until a final open-licensed typeface is selected. Do not approximate the SongKeep wordmark in typed text and call it the logo.

### Story / lyric serif

A calm editorial serif may be used selectively for:

- lyric reading;
- long story passages;
- participant quotations;
- keepsake notes; and
- editorial public storytelling.

The serif is a storytelling layer, not the default interface font.

### Hierarchy

- Large display headings should be short and emotionally direct.
- Body copy should be comfortably readable and not overly narrow.
- Metadata should be reduced in prominence rather than removed when operationally necessary.
- Avoid excessive all-caps text. The tagline is an intentional exception within the logo artwork.

## 9. Photography authority

Use **observed moments rather than posed beneficiaries**.

Preferred subjects include:

- a participant remembering during an interview;
- family members sharing photographs or objects;
- a songwriter marking lyrics;
- hands at a piano, guitar, mixing desk, or microphone;
- an interviewer listening rather than performing for camera;
- rehearsal and recording moments;
- first-listen reactions;
- intergenerational listening;
- event preparation and presentation; and
- tactile memory details such as handwritten notes, photo backs, letters, and keepsakes.

Avoid:

- generic senior-living stock photography;
- forced celebration poses;
- staged hand-holding imagery used as shorthand for compassion;
- isolated instrument stock shots with no human context;
- artificial bokeh used to manufacture sentiment;
- funeral visual tropes; and
- demographic tokenism.

The people should look like people with stories, not demographics receiving a service.

### Media ratios

- Portrait: `4:5`
- Story image: `3:2`
- Song artwork / song card: `1:1`
- Event / performance: `16:9`

These are defaults, not cropping mandates. Never damage meaning, accessibility, or consent scope to force a ratio.

## 10. Visual motif: resonance

The logo already contains a literal musical note. Outside the sanctioned mark, the primary reusable visual motif remains **resonance** rather than additional floating music notes.

A resonance line may begin with irregular human-speech energy, move through story or lyric structure, and resolve into a musical cadence. It may use the SongKeep gradient when color is appropriate.

The motif may appear as:

- waveform-derived rules;
- section dividers;
- playback progress;
- story-to-song progression;
- song artwork;
- recording state; and
- subtle motion transitions.

Do not use the motif as decorative noise.

## 11. Album / keepsake artwork system

Every finished creative work may have a square **song artwork** surface. Artwork is not automatically public.

Artwork may combine:

- approved portrait or memory photography;
- an approved place, object, document, or environmental image;
- restrained resonance-line graphics;
- SongKeep gradient accents;
- title;
- dedicatee / subject name; and
- optional date or program identity.

The artwork system must support image-free treatments for participants who do not permit photographic use.

Do not fabricate documentary photographs or imply that generated imagery is participant history. Synthetic or illustrative art, if used, must be clearly an art treatment and must not be presented as evidence of a real memory or event.

## 12. Experience modes

### Public / Acquisition

Visual, cinematic, photographic, and musical. Public surfaces should make it immediately clear that the experience is about a person, a story, and a song. Use large imagery, short copy, audio invitations, and clear customer journeys. Avoid presenting the public site like a product dashboard.

### Identity / Login

A calm branded welcome. The primary feeling should be **returning to something personal**, not entering enterprise software. Use the SongKeep mark prominently, one clear task, a warm image or subtle brand field, and minimal technical explanation.

### Customer / Family

Personal and journey-led. The current song, story, next meaningful action, media, and listening should dominate. Operational status should be translated into plain language.

### Facility / Project Ageless

People, songs, upcoming touchpoints, and the program experience lead. Administrative coordination is present but visually secondary to the participants and program.

### Creator / Production

A studio-like working mode. Creative-work identity, lyrics, source material, recording, versions, and playback lead. Denser controls are appropriate when they support creative work rather than generic CRM behavior.

### Admin / Operations

The most restrained use of the brand. Use clear hierarchy, strong whitespace, solid semantic controls, and selective gradient / artwork accents. Tables and filters are appropriate, but containerization should still be controlled.

### Secure Delivery / Keepsake

The most emotionally expressive product surface. A finished private song should feel like receiving a private record made for one person—not like opening cloud storage.

## 13. Audio experience authority

Audio is a primary product primitive, not a file attachment.

One sanctioned audio system should support context variants:

- Public: `AudioPreview` — consent-cleared excerpt, normally 20–40 seconds;
- Customer review: review playback with version / approval context;
- Customer final song: full player with permitted actions;
- Creator: production playback with version metadata and operational controls;
- Facility: program-song cards / approved preview behavior;
- Secure Delivery: full keepsake player;
- Story contribution: voice-memory playback; and
- Interview / creator workspace: source playback where authorization and consent allow it.

### Required player states

`idle`, `loading`, `ready`, `playing`, `paused`, `ended`, `unavailable`, `restricted`, `error`

### Required recorder states

`idle`, `requesting-permission`, `recording`, `paused`, `review`, `uploading`, `saved`, `denied`, `error`

### Audio rules

- Never autoplay.
- Never use sound as the only indication of success, failure, timing, or status.
- Provide explicit play / pause state.
- Provide keyboard-operable and screen-reader-labeled controls.
- Expose duration and progress in accessible text.
- Use the same sanctioned waveform language across contexts.
- Treat volume and device output as user-controlled.
- Public preview playback must evaluate publication/marketing permission before an asset is exposed.
- Download and share actions are distinct from playback entitlement.
- Voice recordings must show recording state visibly and announce it accessibly.
- A denied microphone permission must degrade to another contribution method rather than block the participant journey.
- Transcripts or equivalent text are required when speech content must be understood to complete the workflow.

## 14. Sonic-brand principles

SongKeep may later commission a short sonic signature for films, approved videos, event presentation, social media, and intentionally sounded media.

Direction:

- acoustic / human rather than synthetic-first;
- approximately 3–4 seconds;
- restrained instrumentation such as piano, guitar harmonic, room tone, or subtle human vocal texture;
- a small movement from openness or tension into warm resolution;
- original and licensable across required channels; and
- never dependent on a recognizable copyrighted melody.

The platform UI must not play a sonic signature automatically. A branded sound is a media asset, not a notification requirement.

## 15. Motion principles

Motion should communicate **arrival, transition, resonance, and continuity**.

Use:

- short fades or spatial transitions for contextual change;
- subtle waveform / progress motion during intentional playback;
- gentle gradient movement only in isolated expressive surfaces;
- restrained artwork reveals in public or delivery surfaces; and
- clear state transitions for recording / playback.

Avoid:

- continuous decorative waveform animation;
- full-page animated gradients;
- parallax that competes with reading;
- bouncing hearts or music notes;
- autoplay video with sound;
- motion used as the sole state cue; and
- large cinematic transitions inside Admin / Creator operational tasks.

When `prefers-reduced-motion` is active, remove decorative transforms, waveform animation, parallax, and crossfades while preserving immediate state changes.

## 16. Iconography

Use a coherent, simple stroke icon family. Icons should represent actions and objects directly.

Allowed examples: play, pause, record, microphone, image, document, people, calendar, download, share, lock, waveform, message, approval.

Do not use heart, keyhole, or music-note icons as generic decoration simply because they appear in the logo. A song, recording, story, lyric, performance, consent record, and creative work are different domain objects and should remain distinguishable.

## 17. Brand voice and microcopy

Voice is warm, clear, specific, and human. It should not perform sentimentality.

Prefer:

- “Listen to Evelyn’s song”
- “Record a memory”
- “Share a story”
- “Ready for family review”
- “Your interview is scheduled for Tuesday”
- “This photo is approved for private family sharing”

Avoid:

- “Unlock the magic”
- “Create unforgettable moments with AI”
- “Your loved one’s digital legacy vault”
- “The elderly participant” when a person’s name or participant role is available
- internal build terms such as chassis, reference boundary, provider handoff, object model, or workflow contract in customer-facing copy
- celebratory language on error, consent, grief, payment, or restriction states

Operational surfaces may be more direct than public storytelling surfaces.

## 18. Consent-aware media presentation

Authorization and consent remain separate.

A component receiving an asset must not infer public, family, event, or sponsor usage permission from the fact that the current user can access the record.

Presentation rules:

- public media requires the applicable publication / marketing permission;
- event photography/video requires the applicable event/media permission;
- designated family sharing requires its own permission;
- sponsor acknowledgment is not public-story permission;
- withdrawn or restricted use must have an explicit non-rendering / restricted state; and
- artwork derivatives inherit the restrictions of their source assets unless a more restrictive derivative policy is set.

Brand expression never overrides consent.

## 19. Accessibility authority

Target WCAG 2.2 AA.

The sensory system must support:

- keyboard operation;
- visible focus;
- adequate text and non-text contrast;
- large usable touch targets;
- reduced motion;
- non-audio alternatives;
- text alternatives for meaningful imagery;
- transcripts / captions where needed;
- explicit recording state;
- no autoplay audio;
- assisted workflows; and
- media experiences that do not require an email address, smartphone, or independent digital operation from every participant.

## 20. Sanctioned reusable primitives

The platform should converge on these integration points rather than inventing equivalents per workflow:

```text
Brand
├── identity
│   ├── FullLockup
│   ├── AppLockup
│   └── CompactMark
│
├── tokens
│   ├── color
│   ├── gradient
│   ├── typography
│   ├── spacing
│   ├── radius
│   ├── elevation
│   └── motion
│
├── media
│   ├── Portrait
│   ├── StoryImage
│   ├── SongArtwork
│   ├── Waveform
│   └── ApprovedMedia
│
└── audio
    ├── AudioPlayer
    ├── AudioPreview
    ├── VoiceRecorder
    ├── Waveform
    ├── TrackMetadata
    └── PlaybackProgress
```

The implementation must not simulate connected production services.

## 21. Adoption order

1. Establish this SongKeep authority and tokens without repo-wide restyling.
2. Add approved logo assets and sanctioned variants.
3. Apply the system to Identity / Login.
4. Apply the system to Public / Home and public customer journeys.
5. Apply to Customer / Family.
6. Apply to Secure Delivery / Keepsake.
7. Apply to Facility / Project Ageless.
8. Apply the studio variant to Creator / Production.
9. Apply the restrained operational variant to Admin / Operations.

## 22. Acceptance test for the system

The brand system is working when:

- a screenshot feels recognizably SongKeep even when the logo is not visible;
- the interface uses the logo gradient as a signature rather than a background effect everywhere;
- customer surfaces feel visual, musical, personal, and calm rather than like SaaS dashboards;
- the Login page feels like entering a personal music-and-memory experience;
- a Secure Delivery song page feels like receiving a private record release rather than downloading a file;
- the same audio language is recognizable in Public, Customer, Facility, Creator, and Delivery contexts;
- photography looks documentary rather than generic or demographic;
- the UI remains fully understandable with sound disabled;
- reduced motion does not remove meaning;
- consent restrictions visibly control media availability;
- Admin and Creator remain efficient without forcing their dense visual grammar onto customer experiences; and
- no route invents a competing color palette, logo treatment, or component aesthetic.
