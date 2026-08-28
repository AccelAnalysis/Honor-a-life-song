# SongKeep Brand + Sensory Experience System

This directory establishes the visual and sensory authority for the Honor a Life Song platform and its SongKeep application identity.

```text
HONOR A LIFE SONG PLATFORM
│
├── 1. Operating Chassis
│      Where things belong
│
├── 2. Workflow Model
│      What things do
│
└── 3. SongKeep Brand + Sensory System
       How the experience feels, looks, moves and sounds
```

The governing rule is:

> **Workflows inherit the SongKeep sensory system. Workflows do not invent their own brand language.**

## Approved visual source

The SongKeep logo supplied on August 28, 2026 is the application visual source of truth.

It establishes:

- the application-facing name **SongKeep**;
- the tagline **Your Story. Your Song. Always.**;
- the heart + music + keyhole emblem;
- the Midnight / blue / violet / magenta color family;
- a bright white visual field;
- smooth contemporary geometry; and
- a protected-keepsake interpretation of the story-to-song experience.

The repository and operating architecture may continue to use Honor a Life Song naming while product-facing naming is migrated. Ordinary customer screens should treat SongKeep as the primary visual identity rather than creating a competing dual-brand presentation.

## Authority files

Read these before implementing app styling:

- [`BRAND_AUTHORITY.md`](./BRAND_AUTHORITY.md) — complete design authority, palette, typography, surfaces, media, motion, audio, accessibility, and application modes;
- [`LOGO_SYSTEM.md`](./LOGO_SYSTEM.md) — lockups, mark variants, spacing, background rules, app-icon guidance, and prohibited treatments;
- [`EXPERIENCE_COMPOSITION.md`](./EXPERIENCE_COMPOSITION.md) — scene-first composition and rules preventing customer surfaces from becoming internal dashboards.

## Core palette

```text
Midnight Ink   #141648
Indigo         #4858BE
Azure          #1572C6
Sky            #1C8BD3
Violet         #834AB4
Magenta        #D53FA3
Lavender Mist  #E5E3F0
Canvas         #FFFFFF
Soft Canvas    #F7F8FC
```

The sanctioned gradient is a pink → violet → indigo → blue signature derived from the approved logo. It is an accent, not the default background for the application.

## Experience direction

The application should feel like:

> **living memory × music craft × protected keepsake**

Customer-facing surfaces should be visual, audio-aware, calm, and personal. They should use people, song artwork, story, lyrics, sound, and one clear next action before exposing operational detail.

Creator and Admin retain denser controls, but they still inherit SongKeep typography, color, media, spacing, accessibility, and restrained container rules.

## Code integration points

The current design authority is represented in:

```text
lib/
├── brand-sensory.ts
├── brand-sensory.types.ts
└── media-presentation.ts

components/brand/
├── AudioPlayer
├── AudioPreview
├── VoiceRecorder
├── Waveform
├── SongArtwork
├── TrackMetadata
└── BrandSensoryReference
```

Import reusable primitives from `@/components/brand`.

The internal reference surface remains available at:

```text
/reference/brand-sensory
```

It intentionally contains no production participant, story, image, audio, payment, consent, or delivery data.

## Asset implementation next

The approved logo artwork should be committed as a canonical source plus application exports under `public/brand/` before repo-wide visual adoption. Required forms are documented in `LOGO_SYSTEM.md`.

Do not substitute a typed approximation of the SongKeep wordmark.

## Adoption sequence

1. Establish this SongKeep authority and tokens.
2. Add approved logo source and export variants.
3. Restyle Identity / Login.
4. Restyle Public / Home and customer acquisition journeys.
5. Restyle Customer / Family.
6. Restyle Secure Delivery / Keepsake.
7. Restyle Facility / Project Ageless.
8. Apply the studio variant to Creator / Production.
9. Apply the restrained operational variant to Admin / Operations.

The sequence deliberately establishes design authority before changing the application broadly.
