export type PublicHierarchyItem = {
  id: string;
  label: string;
  href: string;
  description: string;
  children?: readonly PublicHierarchyItem[];
};

export type PublicWorkflowItem = PublicHierarchyItem & {
  slug: string;
  summary: string;
  details: readonly string[];
  integrationNote?: string;
};

export const homeSections = [
  {
    id: "hero-value-proposition",
    label: "Every Life Has a Song",
    href: "/#hero-value-proposition",
    description: "Discover how meaningful life stories become human-created songs and lasting keepsakes."
  },
  {
    id: "home-how-it-works",
    label: "How It Works",
    href: "/#home-how-it-works",
    description: "See how a story moves from first memory to finished song."
  },
  {
    id: "featured-stories-songs",
    label: "Songs & Stories",
    href: "/#featured-stories-songs",
    description: "Hear the spirit of the experience through stories and songs shared with permission."
  },
  {
    id: "program-highlights",
    label: "Programs",
    href: "/#program-highlights",
    description: "Explore individual, family, facility, and community ways to create through music."
  },
  {
    id: "testimonials",
    label: "What People Share",
    href: "/#testimonials",
    description: "Read experiences shared by participants, families, and partners when permission is given."
  },
  {
    id: "request-a-song",
    label: "Begin a Song",
    href: "/#request-a-song",
    description: "Start with a person, a memory, or a moment you want to preserve."
  }
] as const satisfies readonly PublicHierarchyItem[];

export const howItWorksSteps = [
  {
    id: "share-your-story",
    label: "Share Your Story",
    slug: "share-your-story",
    href: "/how-it-works/share-your-story",
    description: "Begin with the person, occasion, and memories that should shape the song.",
    summary: "The journey starts with the person at the heart of the song and the memories, relationships, places, and moments that matter most.",
    details: [
      "Tell us who the song is for and what you are honoring.",
      "Use guided questions to remember people, places, events, values, personality, and music preferences.",
      "Share photographs, notes, audio, or documents that help tell the story.",
      "Invite family members to contribute memories when appropriate."
    ]
  },
  {
    id: "interview-story-capture",
    label: "Interview & Story Capture",
    slug: "interview-story-capture",
    href: "/how-it-works/interview-story-capture",
    description: "A human-led conversation helps uncover the details, emotions, and memories behind the song.",
    summary: "We listen closely through guided conversation so the song can reflect the life, relationships, and meaning behind the story.",
    details: [
      "Schedule a conversation at a time that works for you.",
      "Share names, places, milestones, sayings, and memories in your own words.",
      "Bring in family memories or source material when helpful.",
      "Use more than one conversation when the story needs more time."
    ]
  },
  {
    id: "songwriting-process",
    label: "Songwriting",
    slug: "songwriting-process",
    href: "/how-it-works/songwriting-process",
    description: "A human songwriter shapes the story into lyrics and musical direction.",
    summary: "The heart of Honor a Life Song is human interpretation: a songwriter listens for meaning, selects the details that matter, and begins shaping them into music.",
    details: [
      "Find the themes and moments that carry the story.",
      "Shape a clear emotional narrative.",
      "Develop lyrics and musical direction with care.",
      "Refine the work as the song takes shape."
    ]
  },
  {
    id: "review-revisions",
    label: "Review & Revisions",
    slug: "review-revisions",
    href: "/how-it-works/review-revisions",
    description: "Review the work, share feedback, and approve the song before final production.",
    summary: "You have a chance to respond to the song as it develops so important details feel right before the work moves forward.",
    details: [
      "Review the current lyric or creative draft.",
      "Share specific feedback about details that should change.",
      "Request revisions within the service you selected.",
      "Approve the lyrics when they feel ready."
    ]
  },
  {
    id: "production",
    label: "Production",
    slug: "production",
    href: "/how-it-works/production",
    description: "The approved song is composed, recorded, edited, mixed, and prepared for final listening.",
    summary: "Once the creative direction is approved, the song becomes a finished recording through composition, performance, recording, and careful final review.",
    details: [
      "Complete the composition and arrangement.",
      "Record the performance and musical elements.",
      "Edit, mix, and finalize the recording.",
      "Complete a final quality review before delivery."
    ]
  },
  {
    id: "delivery-keepsakes",
    label: "Delivery & Keepsakes",
    slug: "delivery-keepsakes",
    href: "/how-it-works/delivery-keepsakes",
    description: "Receive the finished song and the keepsakes included with your experience.",
    summary: "The finished work is delivered as something you can return to, share privately with the people you choose, and keep as part of the story.",
    details: [
      "Listen to the approved final song.",
      "Receive included lyric sheets, song cards, private links, or other keepsakes.",
      "Enjoy the song as part of a presentation or event when included in a program.",
      "Choose how permitted family members receive or share the finished keepsake."
    ]
  }
] as const satisfies readonly PublicWorkflowItem[];

export const projectAgelessSections = [
  {
    id: "program-overview",
    label: "Program Overview",
    slug: "program-overview",
    href: "/services/project-ageless/program-overview",
    description: "A participatory music and storytelling experience designed for facilities and communities.",
    summary: "Project Ageless brings residents, families, and staff together around stories, songs, shared experiences, and meaningful keepsakes.",
    details: [
      "Programs are planned around the facility, participants, dates, and goals.",
      "An engagement may last approximately two weeks to one month.",
      "Participants can join the activities that fit their interests and circumstances.",
      "The experience can include individual stories, group sessions, songs, family participation, and a final presentation."
    ]
  },
  {
    id: "facility-benefits",
    label: "Facility Benefits",
    slug: "facility-benefits",
    href: "/services/project-ageless/facility-benefits",
    description: "Create meaningful resident engagement through story, music, family connection, and celebration.",
    summary: "Project Ageless gives facilities a structured creative experience in which residents participate rather than only watch.",
    details: [
      "Create meaningful engagement around life stories and music.",
      "Preserve stories as songs and keepsakes for participants and families.",
      "Bring residents, families, and staff together around a shared creative experience.",
      "Celebrate the program through an event or presentation when appropriate."
    ]
  },
  {
    id: "participant-experience",
    label: "Participant Experience",
    slug: "participant-experience",
    href: "/services/project-ageless/participant-experience",
    description: "Participants can join the parts of the program that feel comfortable, meaningful, and accessible to them.",
    summary: "There is no requirement that every participant do every activity. Each person can take part in the parts of the experience that fit them best.",
    details: [
      "Group story-sharing.",
      "One-on-one interviews.",
      "Family-contributed memories.",
      "Lyric or theme review.",
      "Group songwriting.",
      "Rehearsal or listening.",
      "Concert or presentation.",
      "Keepsake delivery and post-program feedback."
    ]
  },
  {
    id: "family-experience",
    label: "Family Experience",
    slug: "family-experience",
    href: "/services/project-ageless/family-experience",
    description: "Families can contribute memories, help verify details, and take part in the celebration.",
    summary: "Family members can help strengthen the story and share in the experience while respecting the participant's wishes and privacy.",
    details: [
      "Contribute stories, photographs, names, dates, and pronunciations when invited.",
      "Join an interview or family conversation when appropriate.",
      "Help verify important or sensitive details.",
      "Receive invitations, songs, and keepsakes when the participant has chosen to share them."
    ]
  },
  {
    id: "concert-presentation",
    label: "Concert & Presentation",
    slug: "concert-presentation",
    href: "/services/project-ageless/concert-presentation",
    description: "Programs can culminate in a concert, listening event, or presentation centered on the stories and songs created together.",
    summary: "A final presentation can bring participants, residents, families, and staff together to celebrate the people and stories at the heart of the program.",
    details: [
      "Plan the event date, location, and flow.",
      "Invite participants and families.",
      "Plan for accessibility and comfort.",
      "Honor each participant's choices about photography, video, performance, and sharing."
    ]
  },
  {
    id: "sponsorship",
    label: "Sponsorship",
    slug: "sponsorship",
    href: "/services/project-ageless/sponsorship",
    description: "Community partners can help make Project Ageless possible through program sponsorship and support.",
    summary: "Facilities, nonprofits, local businesses, community partners, and grant-funded organizations can help support an engagement while participant privacy remains protected.",
    details: [
      "Support an entire program or a specific part of the experience.",
      "Coordinate recognition that fits the program and the sponsor's contribution.",
      "Respect participant privacy and sharing choices at every stage.",
      "Create a clear understanding of what the sponsorship supports."
    ]
  },
  {
    id: "request-facility-program",
    label: "Request a Facility Program",
    slug: "request-facility-program",
    href: "/services/project-ageless/request-facility-program",
    description: "Start a conversation about bringing Project Ageless to your facility or community.",
    summary: "Tell us about your facility, community, participants, timing, and goals so we can discuss a Project Ageless experience that fits.",
    details: [
      "Share the facility or community you represent.",
      "Tell us what you hope participants and families will experience.",
      "Discuss timing, scope, sponsorship, and funding possibilities.",
      "Plan the next steps together after the consultation."
    ]
  }
] as const satisfies readonly PublicWorkflowItem[];

const serviceChildren: readonly PublicHierarchyItem[] = [
  {
    id: "individual-family-songs",
    label: "Individual & Family Songs",
    href: "/services#individual-family-songs",
    description: "Create a personal song from the memories and meaning of one life or family story."
  },
  {
    id: "project-ageless",
    label: "Project Ageless",
    href: "/services/project-ageless",
    description: "A facility and community program built around participation, storytelling, music, and connection.",
    children: projectAgelessSections
  },
  {
    id: "community-programs",
    label: "Community Programs",
    href: "/services#community-programs",
    description: "Custom song experiences for cohorts, veterans, hospice, schools, nonprofits, and mission-driven communities."
  }
];

export const publicNavigation: readonly PublicHierarchyItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    description: "Discover Honor a Life Song.",
    children: homeSections
  },
  {
    id: "how-it-works",
    label: "How It Works",
    href: "/how-it-works",
    description: "Follow the story-to-song journey from first memory to finished keepsake.",
    children: howItWorksSteps
  },
  {
    id: "services",
    label: "Services",
    href: "/services",
    description: "Explore songs and programs for individuals, families, facilities, and communities.",
    children: serviceChildren
  }
] as const;

export function getHowItWorksStep(slug: string) {
  return howItWorksSteps.find((item) => item.slug === slug);
}

export function getProjectAgelessSection(slug: string) {
  return projectAgelessSections.find((item) => item.slug === slug);
}
