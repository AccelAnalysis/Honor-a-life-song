export const brandSensory = {
  authorityVersion: "0.2.0",
  applicationBrand: {
    name: "SongKeep",
    tagline: "Your Story. Your Song. Always.",
    serviceContext: "Honor a Life Song",
    principle: "Living memory × music craft × protected keepsake"
  },
  principle: "Workflows inherit the SongKeep sensory system. Workflows do not invent their own brand language.",
  personality: [
    "warm",
    "human",
    "alive",
    "musical",
    "personal",
    "contemporary",
    "optimistic",
    "crafted",
    "trustworthy",
    "intergenerational"
  ],
  avoid: [
    "clinical",
    "sentimentalized",
    "elderly-coded",
    "funeral-coded",
    "technology-forward",
    "generic SaaS",
    "overly luxurious",
    "childish",
    "repeated heart, keyhole, or music-note decoration"
  ],
  colors: {
    midnightInk: "#141648",
    mutedInk: "#62657A",
    canvas: "#FFFFFF",
    softCanvas: "#F7F8FC",
    line: "#E1E4F0",
    indigo: "#4858BE",
    azure: "#1572C6",
    sky: "#1C8BD3",
    violet: "#834AB4",
    magenta: "#D53FA3",
    lavenderMist: "#E5E3F0",
    success: "#2F6B4F",
    warning: "#8A5A22",
    danger: "#8A3D46",

    // Transitional aliases retained so reference components can migrate without
    // forcing an unrelated repo-wide styling change in the design-authority PR.
    ink: "#141648",
    paper: "#FFFFFF",
    softPaper: "#F7F8FC",
    plum: "#834AB4",
    plumSoft: "#E5E3F0",
    brass: "#D53FA3",
    resonance: "#1572C6",
    resonanceSoft: "#E9F4FC"
  },
  gradients: {
    primary: "linear-gradient(135deg, #D53FA3 0%, #834AB4 35%, #4858BE 62%, #1572C6 82%, #1C8BD3 100%)"
  },
  typography: {
    display: "var(--font-brand-sans, 'Avenir Next', Avenir, Inter, ui-sans-serif, system-ui, sans-serif)",
    text: "var(--font-brand-sans, 'Avenir Next', Avenir, Inter, ui-sans-serif, system-ui, sans-serif)",
    story: "var(--font-story-serif, 'Source Serif 4', Georgia, 'Times New Roman', serif)",
    transcript: "var(--font-story-serif, 'Source Serif 4', Georgia, 'Times New Roman', serif)"
  },
  radii: {
    compact: "12px",
    control: "12px",
    card: "14px",
    media: "20px",
    feature: "28px",
    pill: "999px"
  },
  motion: {
    quick: 120,
    standard: 220,
    expressive: 420,
    reducedMotionRule: "Remove decorative transforms, waveform animation, parallax, animated gradients, and crossfades when prefers-reduced-motion is set. Preserve state changes without animation."
  },
  mediaRatios: {
    portrait: "4 / 5",
    story: "3 / 2",
    songArtwork: "1 / 1",
    event: "16 / 9"
  },
  logo: {
    fullLockup: "emblem + wordmark + tagline",
    appLockup: "emblem + wordmark",
    compactMark: "emblem only",
    monochrome: ["midnight", "white"],
    minimumClearSpace: "25% of emblem height",
    preferredFields: ["canvas", "softCanvas", "lavenderMist", "midnightInk"]
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
