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
    label: "Hero / Value Proposition",
    href: "/#hero-value-proposition",
    description: "The core promise: meaningful life stories become human-created songs, shared experiences and lasting keepsakes."
  },
  {
    id: "home-how-it-works",
    label: "How It Works",
    href: "/#home-how-it-works",
    description: "A public overview of the shared meaning-to-song journey."
  },
  {
    id: "featured-stories-songs",
    label: "Featured Stories / Songs",
    href: "/#featured-stories-songs",
    description: "Approved songs, stories and media can be surfaced here without fabricating sample participant content."
  },
  {
    id: "program-highlights",
    label: "Program Highlights",
    href: "/#program-highlights",
    description: "Highlights of Project Ageless and other program configurations that use the shared platform."
  },
  {
    id: "testimonials",
    label: "Testimonials",
    href: "/#testimonials",
    description: "Approved participant, family or facility testimonials can be presented here when permissioned content is connected."
  },
  {
    id: "request-a-song",
    label: "Request a Song CTA",
    href: "/#request-a-song",
    description: "A clear acquisition handoff into the canonical request journey rather than a separate marketing-form backend."
  }
] as const satisfies readonly PublicHierarchyItem[];

export const howItWorksSteps = [
  {
    id: "share-your-story",
    label: "Share Your Story",
    slug: "share-your-story",
    href: "/how-it-works/share-your-story",
    description: "Begin with the person, occasion and meaningful memories that should shape the song.",
    summary: "The journey starts by identifying the song subject, the reason for the song and the stories, memories and source material that matter most.",
    details: [
      "Identify the song subject and occasion or purpose.",
      "Use guided story prompts to surface people, places, events, values, personality and musical preferences.",
      "Prepare approved photographs, notes, audio or documents that can support the story.",
      "Invite family contributions when the authorized service configuration allows them."
    ]
  },
  {
    id: "interview-story-capture",
    label: "Interview / Story Capture",
    slug: "interview-story-capture",
    href: "/how-it-works/interview-story-capture",
    description: "Guided interviews and story contributions capture the material that will be shaped into the creative work.",
    summary: "Honor a Life Song uses human-led interviews and guided story capture to understand the life, relationships, events and meaning behind the song.",
    details: [
      "Schedule and prepare for an interview or assisted story-capture session.",
      "Capture chronology, names, pronunciations, important people, places and events.",
      "Gather source material and family-contributed memories when authorized.",
      "Allow story capture to happen across more than one touch when the service or program calls for it."
    ]
  },
  {
    id: "songwriting-process",
    label: "Songwriting Process",
    slug: "songwriting-process",
    href: "/how-it-works/songwriting-process",
    description: "Human interpretation turns captured meaning into themes, lyrics and musical direction.",
    summary: "The defining service is human-created: captured stories are interpreted, shaped and developed into a song rather than passed through an autonomous song generator.",
    details: [
      "Organize story themes, chronology and meaningful details.",
      "Shape the narrative around the people, moments and values that should be honored.",
      "Develop lyrics and musical direction through the creative team.",
      "Preserve version history as the work moves toward review."
    ]
  },
  {
    id: "review-revisions",
    label: "Review & Revisions",
    slug: "review-revisions",
    href: "/how-it-works/review-revisions",
    description: "Authorized reviewers can respond to drafts, request revisions and approve the work for production.",
    summary: "Review is a governed part of the service: the current draft can be considered, feedback can be submitted and an authorized approval moves the song forward.",
    details: [
      "Present the current lyric or creative draft for the appropriate review.",
      "Collect specific feedback and revision requests.",
      "Retain previous versions so changes remain traceable.",
      "Record approval before the work advances into production."
    ]
  },
  {
    id: "production",
    label: "Production",
    slug: "production",
    href: "/how-it-works/production",
    description: "Approved creative work moves through composition, recording, editing and quality review.",
    summary: "Once the creative direction is approved, the song advances through the human production process and a final quality gate.",
    details: [
      "Complete composition and arrangement as required by the creative work.",
      "Record the performance and supporting musical elements.",
      "Edit, mix and finalize the recording.",
      "Complete quality review before final approval and delivery."
    ]
  },
  {
    id: "delivery-keepsakes",
    label: "Delivery / Keepsakes",
    slug: "delivery-keepsakes",
    href: "/how-it-works/delivery-keepsakes",
    description: "Approved final songs and keepsakes are delivered through controlled, permission-aware access.",
    summary: "The completed work is delivered as an experience and lasting keepsake, with access and sharing governed by the permissions attached to the people and media involved.",
    details: [
      "Deliver the approved final song securely.",
      "Provide permitted lyric sheets, song cards, private links or other configured keepsakes.",
      "Support presentation or event delivery when the service is part of a program.",
      "Record delivery and preserve the consent and access controls that apply to the final assets."
    ]
  }
] as const satisfies readonly PublicWorkflowItem[];

export const projectAgelessSections = [
  {
    id: "program-overview",
    label: "Program Overview",
    slug: "program-overview",
    href: "/services/project-ageless/program-overview",
    description: "Project Ageless is the flagship facility and community-program configuration of Honor a Life Song.",
    summary: "Project Ageless is a short-form participatory residency that uses the shared Honor a Life Song platform to coordinate stories, songs, family connection, presentation and keepsakes.",
    details: [
      "A program run is tied to a specific facility, dates, scope, funding and status.",
      "An engagement may last approximately two weeks to one month.",
      "Participants can join different combinations of program touchpoints rather than being forced through one rigid sequence.",
      "The program uses the same people, story, creative-work, consent, communication, media and delivery boundaries as the rest of Honor a Life Song."
    ]
  },
  {
    id: "facility-benefits",
    label: "Facility Benefits",
    slug: "facility-benefits",
    href: "/services/project-ageless/facility-benefits",
    description: "Facilities gain a participatory program centered on resident stories, family connection, presentation and measurable completion.",
    summary: "Project Ageless is designed so residents participate rather than only watch, while facilities gain a structured community experience with approved outputs and outcome reporting.",
    details: [
      "Create meaningful resident engagement around life stories and music.",
      "Preserve stories as songs and keepsakes that can be shared with authorized families.",
      "Build community goodwill through a structured program and presentation experience.",
      "Use approved media and outcome information only within the permissions granted for the program."
    ]
  },
  {
    id: "participant-experience",
    label: "Participant Experience",
    slug: "participant-experience",
    href: "/services/project-ageless/participant-experience",
    description: "Participants can take part in the touchpoints that fit their interests, availability and circumstances.",
    summary: "Participation is flexible by design: a resident or community member can join any appropriate combination of story sharing, interviews, songwriting, listening, presentation and keepsake delivery.",
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
    description: "Authorized family collaborators can contribute memories, help verify details and participate in the experience.",
    summary: "Families can help strengthen the story and receive meaningful memories and keepsakes without receiving broader access than the participant or representative has authorized.",
    details: [
      "Contribute stories, photographs, names, dates and pronunciations when invited.",
      "Schedule or join an interview when that participation is part of the program.",
      "Help review sensitive facts or provide authorization where appropriate.",
      "Receive permitted recordings and event invitations through the configured family experience."
    ]
  },
  {
    id: "concert-presentation",
    label: "Concert / Presentation",
    slug: "concert-presentation",
    href: "/services/project-ageless/concert-presentation",
    description: "Programs can culminate in a concert, listening event or presentation built around the completed creative work.",
    summary: "A Project Ageless run can culminate in a shared presentation that honors participants and connects residents, families and the facility around the stories and songs created during the residency.",
    details: [
      "Coordinate the event date, venue and run of show.",
      "Prepare the participant list and family invitations.",
      "Address accessibility needs as part of event readiness.",
      "Apply photography, video, performance and public-use permissions before media or stories are used beyond the private event."
    ]
  },
  {
    id: "sponsorship",
    label: "Sponsorship",
    slug: "sponsorship",
    href: "/services/project-ageless/sponsorship",
    description: "Facilities and community partners can coordinate permitted sponsorship without exposing participant records to funders.",
    summary: "A Project Ageless program can be supported by facilities, local partners, nonprofits, sponsors or grant-funded organizations while keeping participant access and funding restrictions separate.",
    details: [
      "Support can cover a program, song, concert, legacy songwriting, refreshments, holiday events or other approved program components.",
      "Each program run should preserve the paying party, service recipient, funding source, amount, allocation and restrictions.",
      "Sponsor recognition must follow the permissions attached to the program and participants.",
      "Funding a program does not give a sponsor access to participant details."
    ]
  },
  {
    id: "request-facility-program",
    label: "Request a Facility Program",
    slug: "request-facility-program",
    href: "/services/project-ageless/request-facility-program",
    description: "The public acquisition path for a facility that wants to discuss and scope a Project Ageless program.",
    summary: "The request path is the public handoff into the canonical Program Lead workflow: consultation, scope and funding, contracting, facility onboarding and participant enrollment.",
    details: [
      "Begin with the facility and program need rather than creating a separate Project Ageless application.",
      "Move the lead through consultation and scope-and-funding decisions.",
      "Create the program run only after the engagement is contracted and ready for facility onboarding.",
      "Keep participant enrollment, consent and touchpoint activity inside the facility workspace after onboarding."
    ],
    integrationNote: "The operating chassis reserves this public handoff for a canonical Program Lead / Inquiry service. Authoritative request persistence is not connected in this hierarchy slice, so the public experience does not fabricate a separate form backend or pretend a request has been submitted."
  }
] as const satisfies readonly PublicWorkflowItem[];

const serviceChildren: readonly PublicHierarchyItem[] = [
  {
    id: "individual-family-songs",
    label: "Individual & Family Songs",
    href: "/services#individual-family-songs",
    description: "The direct-to-family or individual configuration of the shared meaning-to-song journey."
  },
  {
    id: "project-ageless",
    label: "Project Ageless",
    href: "/services/project-ageless",
    description: "The flagship facility and community-program configuration.",
    children: projectAgelessSections
  },
  {
    id: "community-programs",
    label: "Community Programs",
    href: "/services#community-programs",
    description: "Future program templates built on the same platform rather than separate applications."
  }
];

export const publicNavigation: readonly PublicHierarchyItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    description: "Honor a Life Song public home.",
    children: homeSections
  },
  {
    id: "how-it-works",
    label: "How It Works",
    href: "/how-it-works",
    description: "The six-step public meaning-to-song journey.",
    children: howItWorksSteps
  },
  {
    id: "services",
    label: "Services",
    href: "/services",
    description: "Individual, Project Ageless and future community-program configurations.",
    children: serviceChildren
  }
] as const;

export function getHowItWorksStep(slug: string) {
  return howItWorksSteps.find((item) => item.slug === slug);
}

export function getProjectAgelessSection(slug: string) {
  return projectAgelessSections.find((item) => item.slug === slug);
}
