# Honor a Life Song Brand + Sensory Experience System

This directory establishes the third architectural authority for the platform:

```text
HONOR A LIFE SONG
│
├── 1. Operating Chassis
│      Where things belong
│
├── 2. Workflow Model
│      What things do
│
└── 3. Brand + Sensory System
       How the experience feels, looks, moves and sounds
```

The governing rule is:

> **Workflows inherit the Honor a Life Song sensory system. Workflows do not invent their own brand language.**

## Authority

Read [`BRAND_AUTHORITY.md`](./BRAND_AUTHORITY.md) before implementing imagery, artwork, waveform, playback, recording, typography, motion, or public / private media presentation.

The authority defines:

- brand personality and anti-patterns;
- semantic palette;
- serif / sans roles;
- photography direction;
- album / keepsake art system;
- resonance / waveform language;
- motion and reduced-motion behavior;
- audio player and recorder states;
- sonic-brand principles;
- consent-aware media presentation;
- accessibility rules; and
- adoption order across platform shells.

## Code integration points

The initial additive implementation lives in:

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

The internal reference surface is available at:

```text
/reference/brand-sensory
```

It intentionally contains no production participant, story, image, audio, payment, consent, or delivery data.

## Deliberate non-goals of this PR

This authority slice does **not**:

- restyle every route;
- replace `app/globals.css`;
- change shared public or workspace shell composition;
- alter route hierarchies being built in concurrent workflow PRs;
- introduce a logo asset that has not been approved;
- introduce external font files or licensing assumptions;
- fabricate participant photography or sample life stories;
- connect production media storage;
- connect production recording persistence;
- bypass authorization or consent; or
- turn Secure Delivery into a finished production player before its workflow hierarchy consolidates.

## Adoption sequence

After hierarchy PR consolidation, the implementation layer should be rebased onto current `main` and applied in this order:

1. Secure Delivery reference experience;
2. Public / Home;
3. Customer / Family;
4. Facility / Project Ageless;
5. Creator / Production; and
6. Admin / Operations.

The first four should carry more visible emotional and media expression. Creator and Admin should use a restrained operational variant of the same system.
