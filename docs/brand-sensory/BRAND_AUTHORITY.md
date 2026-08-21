# Honor a Life Song — Brand + Sensory Experience Authority

**Authority status:** architectural design authority  
**Version:** 0.1.0  
**Applies to:** Public, Identity, Customer / Family, Facility / Project Ageless, Creator / Production, Admin / Operations, Secure Delivery, and shared platform services

## 1. Governing rule

> **Workflows inherit the Honor a Life Song sensory system. Workflows do not invent their own brand language.**

The operating chassis governs where experiences belong. Workflow contracts govern what those experiences do. This authority governs how they feel, look, move, sound, and present approved human media.

This document is intentionally separate from repo-wide restyling. It defines the sanctioned system while route hierarchy work is still consolidating. Adoption may occur progressively after hierarchy branches merge.

## 2. Brand idea

Honor a Life Song is a human-led story-to-song platform. The sensory identity should express the transformation:

**voice → story → lyric → song → shared meaning → keepsake**

The design direction is:

**documentary storytelling × recording-studio craft × modern heirloom album**

The platform must not present itself as an AI song generator, generic media SaaS, senior-living portal, funeral or memorial product, or entertainment streaming service.

## 3. Personality

The experience should be:

- human;
- intimate;
- alive;
- crafted;
- musical;
- documentary;
- dignified; and
- intergenerational.

It should avoid feeling:

- clinical;
- sentimentalized;
- elderly-coded;
- technology-forward for its own sake;
- funeral-coded;
- generic SaaS;
- luxury for luxury's sake; or
- decorated with literal music-note motifs.

Warmth must come from human material, composition, typography, pacing, and craft—not from excessive ornament or sentimentality.

## 4. Experience layers

### Public / Acquisition

Cinematic, editorial, photographic, and musical. Public surfaces should explain the transformation from story to song with approved human media and consent-aware audio previews. The public experience may be emotionally expressive but must never autoplay audio.

### Authenticated working platform

Calm, legible, efficient, and restrained. Brand is carried through typography, semantic color, artwork, thumbnails, waveform language, microcopy, and media behavior rather than decorative treatment. Operational tasks take priority over emotional staging.

### Secure Delivery / Keepsake

The most emotionally expressive product surface. A finished private song should feel like receiving a private record release made for one person—not like downloading a file from storage.

## 5. Sensory motif: resonance

The primary visual motif is **resonance**, not a music note.

A resonance line may begin with irregular human-speech energy, move through story or lyric structure, and resolve into a more musical cadence. The motif may appear as:

- static waveform-derived rules;
- section dividers;
- progress visualizations;
- album / keepsake artwork;
- playback progress;
- subtle motion transitions; and
- abstract background details.

Do not use the motif as decorative noise. Every use should reinforce voice, transformation, playback, or progression.

## 6. Color authority

The existing warm foundation is retained and clarified semantically.

| Token | Value | Role |
|---|---:|---|
| Ink | `#191722` | Primary text / deep neutral |
| Muted ink | `#6E6878` | Secondary text |
| Paper | `#FFFDF9` | Primary light surface |
| Soft paper | `#F3EFE9` | Secondary surface |
| Line | `#DDD6CF` | Borders / dividers |
| Plum | `#5B3D63` | Core brand emphasis |
| Plum soft | `#EEE4EF` | Brand-tinted surface |
| Brass | `#B58A4D` | Crafted / heirloom accent |
| Resonance | `#4F7470` | Living secondary accent; audio / story resonance |
| Resonance soft | `#E8F0EE` | Quiet resonance surface |
| Success | `#2F6B4F` | Success states only |
| Warning | `#8A5A22` | Warning states only |
| Danger | `#8A3D46` | Destructive / critical states only |

Plum and brass remain heritage colors. Resonance teal prevents the identity from collapsing into memorial/luxury coding and represents life, connection, and sound.

Semantic status colors may not be replaced by brand accents when doing so would reduce clarity.

## 7. Typography authority

Typography should feel editorial rather than ornamental.

- **Display / story serif:** contemporary humanist or editorial serif. The implementation must support a brand-serif token; Georgia remains an acceptable system fallback until a licensed/approved typeface is selected.
- **UI sans:** highly legible sans for controls, navigation, forms, labels, data, and operational content. Inter/system sans remains an acceptable baseline.
- **Transcript / lyric presentation:** serif by default for reading emphasis, with comfortable measure and line height. Creators may switch to an operational monospace or sans view where comparison tooling requires it.

Typography may evoke liner notes through large lyrical statements, quiet captions, dates, places, names, credits, and generous lyric spacing. It must not imitate decorative sheet music.

## 8. Photography authority

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

## 9. Album / keepsake artwork system

Every finished creative work may have a square **song artwork** surface. Artwork is not automatically public.

Artwork may combine:

- approved portrait or memory photography;
- an approved place, object, document, or environmental image;
- restrained resonance-line graphics;
- title;
- dedicatee / subject name; and
- optional date or program identity.

The artwork system must support image-free treatments for participants who do not permit photographic use.

Do not fabricate documentary photographs or imply that generated imagery is participant history. Synthetic or illustrative art, if used, must be clearly an art treatment and must not be presented as evidence of a real memory or event.

## 10. Audio experience authority

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

## 11. Sonic-brand principles

Honor a Life Song may later commission a short sonic signature for films, approved videos, event presentation, social media, and other intentionally sounded media.

Direction:

- acoustic / human rather than synthetic-first;
- approximately 3–4 seconds;
- restrained instrumentation such as piano, guitar harmonic, room tone, or subtle human vocal texture;
- a small movement from openness or tension into warm resolution;
- original and licensable across required channels; and
- never dependent on a recognizable copyrighted melody.

The platform UI must not play a sonic signature automatically. A branded sound is a media asset, not a notification requirement.

## 12. Motion principles

Motion should communicate **arrival, transition, resonance, and continuity**.

Use:

- short fades or spatial transitions for contextual change;
- subtle waveform/progress motion during intentional playback;
- restrained artwork reveals in public or delivery surfaces; and
- clear state transitions for recording / playback.

Avoid:

- continuous decorative waveform animation;
- parallax that competes with reading;
- bouncing music notes;
- autoplay video with sound;
- motion used as the sole state cue; and
- large cinematic transitions inside Admin / Creator operational tasks.

When `prefers-reduced-motion` is active, remove decorative transforms, waveform animation, parallax, and crossfades while preserving immediate state changes.

## 13. Iconography

Use a coherent, simple stroke icon family. Icons should represent actions and objects directly.

Allowed examples: play, pause, record, microphone, image, document, people, calendar, download, share, lock, waveform, message, approval.

Do not use a music note as the generic icon for every creative concept. A song, recording, story, lyric, performance, and creative work are different domain objects and should remain distinguishable.

## 14. Brand voice and microcopy

Voice is warm, clear, specific, and human. It should not perform sentimentality.

Prefer:

- “Listen to Evelyn’s song”
- “Record a memory”
- “Share a story”
- “Ready for family review”
- “This photo is approved for private family sharing”

Avoid:

- “Unlock the magic”
- “Create unforgettable moments with AI”
- “Your loved one’s digital legacy vault”
- “The elderly participant” when a person’s name or participant role is available
- celebratory language on error, consent, grief, payment, or restriction states

Operational surfaces may be more direct than public storytelling surfaces.

## 15. Consent-aware media presentation

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

## 16. Accessibility authority

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

## 17. Sanctioned reusable primitives

The platform should converge on these integration points rather than inventing equivalents per workflow:

```text
Brand
├── tokens
│   ├── color
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

The first implementation slice may provide reference-safe primitives without production media or recording services. Components must not simulate connected services.

## 18. Adoption order

1. Establish this authority and tokens without repo-wide restyling.
2. Complete and merge workflow-hierarchy branches.
3. Rebase a bounded Brand implementation onto consolidated `main`.
4. Brand Secure Delivery reference preview first.
5. Apply the system to Public / Home.
6. Apply to Customer / Family.
7. Apply to Facility / Project Ageless.
8. Apply the restrained variant to Creator / Production and Admin / Operations.

## 19. Acceptance test for the system

The brand system is working when:

- a Secure Delivery song page feels unmistakably Honor a Life Song without resembling a streaming-service clone;
- the same audio language is recognizable in Public, Customer, Facility, Creator, and Delivery contexts;
- photography looks documentary rather than generic or demographic;
- the UI remains fully understandable with sound disabled;
- reduced motion does not remove meaning;
- consent restrictions visibly control media availability;
- workspaces feel related while preserving their operational needs; and
- a screenshot can feel recognizably Honor a Life Song without relying on music-note decoration or the wordmark alone.
