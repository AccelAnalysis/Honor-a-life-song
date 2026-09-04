# SongKeep Customer Pipeline — Apple HIG redesign notes

This presentation remains a SongKeep-branded interactive customer-pipeline walkthrough, but its interaction and presentation system now follows the principles in Apple's Human Interface Guidelines.

## Applied principles

- Purpose and simplicity: each slide has one clear job and one dominant information hierarchy.
- Agency and familiarity: persistent Home/Pipeline access, Previous/Next controls, a stage menu, keyboard navigation, direct stage links, and fullscreen presentation mode.
- Preserve context: the presentation chrome always identifies the current stage and slide progress.
- Flexibility: responsive layouts reflow for desktop, tablet, and phone rather than shrinking a desktop canvas.
- Accessibility: 44px minimum primary controls for touch layouts, visible focus, semantic headings and labels, aria-live slide announcements, hidden/inert inactive slides, non-color-only stage cues, reduced-motion support, higher-contrast preference support, and light/dark appearance support.
- Responsible color: SongKeep brand color is used as an accent while white/soft-canvas fields and Midnight Ink carry most content.
- Restraint: negative space and dividers replace unnecessary card nesting and dashboard-like chrome.

## Presentation structure

The deck preserves the original 24-slide logic:

1. Interactive seven-stage pipeline home.
2. Three slides for each stage: overview/mindset/metrics, actual activities, and SongKeep platform support.
3. Pipeline operating logic and handoffs.
4. Advocacy-to-Awareness growth loop.

All platform-support language is presented in current-state/product language so the deck remains usable as the platform is completed.
