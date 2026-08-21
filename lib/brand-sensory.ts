export const brandSensory = {
  authorityVersion: "0.1.0",
  principle: "Workflows inherit the Honor a Life Song sensory system. Workflows do not invent their own brand language.",
  personality: [
    "human",
    "intimate",
    "alive",
    "crafted",
    "musical",
    "documentary",
    "dignified",
    "intergenerational"
  ],
  avoid: [
    "clinical",
    "sentimentalized",
    "elderly-coded",
    "technology-forward",
    "funeral-coded",
    "generic SaaS",
    "literal music-note decoration"
  ],
  colors: {
    ink: "#191722",
    mutedInk: "#6E6878",
    paper: "#FFFDF9",
    softPaper: "#F3EFE9",
    line: "#DDD6CF",
    plum: "#5B3D63",
    plumSoft: "#EEE4EF",
    brass: "#B58A4D",
    resonance: "#4F7470",
    resonanceSoft: "#E8F0EE",
    success: "#2F6B4F",
    warning: "#8A5A22",
    danger: "#8A3D46"
  },
  typography: {
    display: "var(--font-brand-serif, Georgia, 'Times New Roman', serif)",
    text: "var(--font-brand-sans, Inter, ui-sans-serif, system-ui, sans-serif)",
    transcript: "var(--font-brand-serif, Georgia, 'Times New Roman', serif)"
  },
  radii: {
    compact: "10px",
    control: "999px",
    card: "18px",
    feature: "28px"
  },
  motion: {
    quick: 120,
    standard: 220,
    expressive: 420,
    reducedMotionRule: "Remove decorative transforms, waveform animation, parallax, and crossfades when prefers-reduced-motion is set. Preserve state changes without animation."
  },
  mediaRatios: {
    portrait: "4 / 5",
    story: "3 / 2",
    songArtwork: "1 / 1",
    event: "16 / 9"
  },
  audio: {
    autoplay: false,
    defaultMuted: true,
    publicPreviewSeconds: { min: 20, max: 40 },
    requiredPlayerStates: ["idle", "loading", "ready", "playing", "paused", "ended", "unavailable", "restricted", "error"],
    requiredRecorderStates: ["idle", "requesting-permission", "recording", "paused", "review", "uploading", "saved", "denied", "error"],
    accessibility: [
      "Never require sound to understand status or complete a task.",
      "Expose accessible names for play, pause, seek, volume, download, share, and record controls.",
      "Provide transcripts or equivalent text when source speech is needed to complete a workflow.",
      "Do not autoplay audio.",
      "Do not encode state solely through waveform color or animation."
    ]
  }
} as const;

export type BrandSensoryAuthority = typeof brandSensory;
