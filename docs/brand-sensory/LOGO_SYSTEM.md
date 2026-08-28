# SongKeep Logo System

**Status:** approved visual source translated into implementation rules  
**Source artwork:** SongKeep logo supplied August 28, 2026  
**Tagline:** `YOUR STORY. YOUR SONG. ALWAYS.`

## 1. What the mark communicates

The SongKeep mark combines three ideas in one emblem:

- a **heart** for the person, memory, relationship, and emotional center;
- a **musical note** for the transformation of story into song; and
- a **keyhole** for privacy, safekeeping, access, and a lasting keepsake.

This makes the mark especially appropriate for the application because the product must feel emotional and musical without losing the sense that personal stories and recordings are protected.

The emblem is the one sanctioned place where these three literal symbols are combined. The rest of the interface should use them only when they have actual functional meaning.

## 2. Source colors

The following interface colors are sampled from the supplied artwork. They are not instructions to recolor the master logo; they are the UI palette derived from it.

| Name | Hex | Typical interface use |
|---|---:|---|
| Midnight Ink | `#141648` | Wordmark echo, primary text, deep backgrounds |
| Indigo | `#4858BE` | Brand emphasis, selected states |
| Azure | `#1572C6` | Primary actions and links |
| Sky | `#1C8BD3` | Bright secondary accent |
| Violet | `#834AB4` | Creative / story accent |
| Magenta | `#D53FA3` | Emotional / lyric emphasis |
| Lavender Mist | `#E5E3F0` | Quiet tint / surface |

The primary brand gradient is:

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

The gradient is a **signature accent**, not the default background for the product.

## 3. Required asset set

The repository should ultimately contain approved exports for these roles:

```text
public/brand/
├── songkeep-full-lockup.svg or .png
├── songkeep-app-lockup.svg or .png
├── songkeep-mark.svg or .png
├── songkeep-mark-mono-midnight.svg or .png
├── songkeep-mark-mono-white.svg or .png
├── songkeep-wordmark.svg or .png
├── favicon.svg / favicon.ico
└── app-icon-*.png
```

Do not create a replacement wordmark by typing “SongKeep” with an ordinary font. The supplied lettering is part of the approved mark.

If vector artwork is not available, preserve the approved raster master at sufficient resolution and create derivative exports from that master without changing geometry or color relationships.

## 4. Variant rules

### Full lockup

**Contains:** emblem + SongKeep wordmark + tagline.

Use for:

- public welcome moments;
- Login / account entry;
- branded email / downloadable material where appropriate;
- presentation / launch screens;
- selected Secure Delivery / keepsake moments.

Avoid in:

- narrow app headers;
- dense admin navigation;
- tiny mobile bars;
- repeated cards.

### App lockup

**Contains:** emblem + SongKeep wordmark; tagline removed.

Use for:

- desktop application header;
- mobile drawer / menu header;
- account shell;
- customer workspace;
- facility workspace;
- creator workspace; and
- admin workspace.

### Compact mark

**Contains:** emblem only.

Use for:

- favicon;
- app icon;
- compact mobile header;
- browser / installed-app identity;
- loading or transition state; and
- small brand signature.

It should not replace functional icons such as Home, Story, Record, Lock, or Play.

### Monochrome

Use only when:

- print / reproduction requires it;
- a deep background makes the gradient unreliable;
- accessibility or technical constraints favor a single-color treatment; or
- an integration limits image treatment.

Approved monochrome colors are **Midnight Ink** and **white**.

## 5. Background rules

Preferred logo fields:

1. white / Canvas;
2. Soft Canvas;
3. very pale Lavender Mist; or
4. Midnight Ink for a white monochrome mark.

When the full-color logo appears over photography, use a quiet area of the image or a subtle white field. Do not place the mark over faces, hands, lyrics, waveform detail, or high-frequency backgrounds.

## 6. Clear space

Maintain clear space equal to at least **25% of the emblem height** around the outer bounds of the chosen lockup.

For compact navigation contexts where that is impractical, preserve enough room that no adjacent icon, rule, text, or control appears attached to the mark.

## 7. Minimum use guidance

Because the supplied full lockup contains a small tagline, the full version should not be shrunk until the tagline becomes decorative noise.

Implementation rule:

- at small sizes, remove the tagline by switching to the app lockup;
- at very small sizes, switch to the compact mark;
- never hide or crop only part of the tagline from the full artwork.

## 8. Prohibited treatments

Do not:

- stretch or compress the logo;
- rotate or skew it;
- separate and reposition pieces of the emblem;
- recolor individual parts arbitrarily;
- reverse the gradient direction;
- add an outline;
- add a heavy glow or drop shadow;
- place it inside an unrelated badge or circle;
- substitute emoji hearts, keys, or music notes;
- typeset a replacement wordmark;
- animate the musical note independently from the heart;
- use the keyhole as a decorative security pattern; or
- repeat the emblem as a page wallpaper.

## 9. Application translation

The mark should influence the product without being copied everywhere.

| Logo quality | Interface translation |
|---|---|
| Smooth rounded geometry | Moderate rounded controls and media, not pill-shaped everything |
| Midnight wordmark | Strong Midnight Ink typography and navigation |
| Blue “Keep” | Azure primary action and active state |
| Pink / violet / blue transition | Controlled waveform, progress, and artwork gradients |
| Heart | Human imagery, relationship, story, warmth |
| Note | Audio-first interactions and recognizable playback language |
| Keyhole | Clear privacy, consent, secure delivery, and access cues |
| White field | Bright, calm canvases with generous negative space |

## 10. App-icon guidance

The compact emblem should be centered within a white or very light field with generous breathing room. For platform icon masks, preserve the full heart outline and note; do not crop tightly to the outer stroke.

A dark-background icon may use the white monochrome emblem on Midnight Ink, but the full-color mark on a light field should remain the default where supported.

## 11. Accessibility and logo alternatives

- Meaningful uses of the full logo should have alt text such as `SongKeep — Your Story. Your Song. Always.`
- Decorative repetitions of the compact mark should use empty alt text / equivalent presentation semantics.
- Do not rely on the logo alone to label a navigation action when a text label is needed.
- The logo gradient is brand expression, not a status or progress semantic by itself.

## 12. Naming presentation

On ordinary customer-facing screens, use **SongKeep** as the product name.

Where Honor a Life Song must appear for a service, legal, or transitional reason, the presentation should be secondary, for example:

> SongKeep  
> An Honor a Life Song experience

Do not build a dual-logo masthead unless a separate co-branding decision explicitly requires it.
