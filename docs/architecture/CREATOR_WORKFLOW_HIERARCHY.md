# Creator / Production Workflow Hierarchy

## Purpose

This slice deepens the existing eight Creator / Production chassis destinations without creating a separate production application. The Creator workspace remains an operational view over canonical platform records and shared service boundaries.

The source-defined top-level destinations remain, in order:

1. Creator Dashboard
2. My Work
3. Story Workspace
4. Song Workspace
5. Production
6. Media
7. Calendar
8. Messages

`Resources / Templates` is present in the broader source shell, but it is deliberately not introduced as a ninth top-level route in this bounded build.

## Routing contract

Source-defined children are addressable in the URL rather than represented only as cards. Creator Dashboard children use the explicit `dashboard` route segment; Lyrics is a genuine grandchild route.

Examples:

```text
/creator/dashboard/assigned-work
/creator/work/revision
/creator/story/pronunciations
/creator/song/lyrics/version-history
/creator/production/quality-review
/creator/media/delivery-assets
```

A selected canonical CreativeWork is carried in the route when present:

```text
/creator/creative-work/<creativeWorkId>/story/source-materials
/creator/creative-work/<creativeWorkId>/song/lyrics/draft
/creator/creative-work/<creativeWorkId>/production/recording
/creator/creative-work/<creativeWorkId>/media/working-files
```

Deep links therefore restore the Creator workspace, top-level parent, child, optional Lyrics grandchild, and selected CreativeWork. Refresh and browser history operate on the same URL state rather than component-local selection.

## Canonical domain reuse

This slice reuses the existing canonical concepts:

- `Person`
- `Organization`
- `Order`
- `ProgramRun`
- `Participant`
- `StoryContribution`
- `CreativeWork`
- `LyricVersion`
- `Approval`
- `MediaAsset`
- `ConsentRecord`
- `AuditEvent`

No `CreatorSong`, `CreatorLyrics`, `CreatorStory`, `CreatorMedia`, or Creator-specific approval model is introduced.

The only new creative-domain behavior is a pure helper for appending and ordering canonical `LyricVersion` records without overwriting earlier versions.

## Shared service boundaries

Creator workflow nodes declare the shared boundaries they depend on, including assignments, stories, creative work, approvals, media, consent, workflow state, scheduling, communications, secure delivery, and audit.

All production service connection flags remain false in the reference chassis. As a result, actions such as persisting lyric versions, recording approval, changing production state, uploading working assets, scheduling commitments, sending messages, and preparing delivery assets remain visibly gated and cannot simulate success.

## Human-led creative process

The hierarchy supports human story interpretation, lyric development, review, production, and quality control. It does not introduce autonomous interviews, AI songwriting, generated lyric rewriting, a creator marketplace, or generic digital-asset-management behavior.

## Consent and information boundaries

Creator authorization and participant/customer consent remain separate. Story material that requires internal creative use is labeled as consent-sensitive. Raw or recorded interview use must additionally honor the applicable recording permission.

Internal notes, sensitive-content flags, working media, source materials, unpublished lyric work, and production artifacts are classified as Creator/internal workflow content. Final audio, lyric PDFs, and delivery assets are only delivery candidates; they remain subject to final approval, entitlement, consent, and the separate Secure Delivery boundary.

## Workflow integrity

Production surfaces explicitly preserve the shared meaning-to-song lifecycle. A lyric draft or uploaded audio asset does not create production readiness. Production is eligible only once the authoritative lifecycle has reached `Approved for Production` or an applicable downstream production/review state.

Creator task completion is also kept distinct from final delivery or order closure.

## Calendar and Messages

Calendar and Messages remain top-level leaf destinations because the source defines no child pages beneath them.

Calendar uses the shared scheduling boundary. Messages uses the normalized communications boundary. Neither introduces a Creator-only backend or vendor-specific UI integration.

## Accessibility and responsive behavior

The same central Creator hierarchy drives desktop and mobile navigation. Child and Lyrics grandchild navigation uses semantic `nav` landmarks, keyboard-focusable links, visible active state, and horizontally scrollable mobile treatment rather than mouse-only controls.
