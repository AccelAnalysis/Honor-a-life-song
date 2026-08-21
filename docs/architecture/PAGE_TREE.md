# Platform Page Tree

## Public / Acquisition

- Home
  - Hero / Value Proposition
  - How It Works
  - Featured Stories / Songs
  - Program Highlights
  - Testimonials
  - Request a Song CTA
- How It Works
  - Share Your Story
  - Interview / Story Capture
  - Songwriting Process
  - Review & Revisions
  - Production
  - Delivery / Keepsakes
- Services
  - Individual & Family Songs
  - Project Ageless
    - Program Overview
    - Facility Benefits
    - Participant Experience
    - Family Experience
    - Concert / Presentation
    - Sponsorship
    - Request a Facility Program
  - Community Programs
- Stories
- Sponsorship & Partnerships
- About
- Pricing / Packages
- FAQ
- Schedule a Consultation
- Login / Begin Request

## Identity / Access

- Login
  - Sign In
    - Identity Provider Handoff
    - Multi-Factor Challenge (conditional)
  - Resolve Access
    - Authenticated Person
    - Memberships
    - Roles
    - Organization Context
  - Enter Workspace
    - Permitted Workspaces
- Create Account
- Verify Email
- Password Recovery
- Accept Invitation
- Multi-Factor Authentication
- Access / Consent Error States

The sibling Identity / Access destinations remain separate workflows. Login links to them when account creation, email verification, recovery, invitation acceptance, MFA policy/enrollment, or an explicit access/error path is required.

## Customer / Family Workspace

The operating chassis currently registers exactly ten Customer / Family top-level destinations. The source-defined hierarchy beneath those integration points is:

- Dashboard
  - Current Song / Program
  - Progress Timeline
  - Next Action
  - Messages
  - Recent Activity
- My Song Journey
  - Request
  - Interview
  - Story Development
  - Lyrics
  - Production
  - Delivery
- Story & Memories
  - Guided Story Questions
  - Life Timeline
  - People & Relationships
  - Places
  - Important Events
  - Values / Personality
  - Favorite Music / Style
  - Uploads
    - Photos
    - Documents
    - Audio
    - Other Memories
- Interviews
  - Schedule Interview
  - Upcoming Interview
  - Reschedule
  - Interview Preparation
- Lyrics & Review
  - Current Draft
  - Previous Versions
  - Submit Feedback
  - Request Revision
  - Approve Lyrics
- Family & Collaborators
  - Invite Family Member
  - Manage Contributors
  - Contributions
  - Access Permissions
- Messages
- Files & Keepsakes
  - Final Song
  - Lyric Sheet
  - Song Card
  - Shareable Link
  - Physical Keepsake Status
- Payments & Orders
  - Order Summary
  - Deposit / Balance
  - Receipts
  - Refund Status
  - Add-ons
- Consent & Permissions
  - Participation Consent
  - Recording Consent
  - Family Sharing
  - Performance Permission
  - Photo / Video Permission
  - Public Story / Marketing Permission

The full Platform Shell also defines standalone Customer destinations for **Production** (Production Status, Recording Status, Final Approval), **Profile & Settings**, and **Help & Support**. They remain intentionally outside this bounded ten-page chassis slice. Customer-facing production status is represented through `My Song Journey → Production` pending a later architecture decision on those omitted standalone destinations.

## Facility / Project Ageless Workspace

Program Dashboard; Program Overview; Participants; Schedule & Touchpoints; Stories & Interviews; Songs & Creative Works; Families; Concert & Events; Keepsakes; Sponsors & Funding; Reports & Outcomes; Facility Team; Program Settings; Help.

## Creator / Production Workspace

The currently registered eight Creator destinations remain the chassis integration points. Their source-defined hierarchy is:

- Creator Dashboard
  - Assigned Work
  - Due Soon
  - Awaiting Review
  - Revision Requests
  - Production Queue
- My Work
  - New Assignments
  - In Progress
  - Awaiting Customer
  - Revision
  - Completed
- Story Workspace
  - Interview Notes
  - Source Materials
  - Story Themes
  - Timeline
  - Important People
  - Facts to Verify
  - Pronunciations
  - Sensitive Content Flags
- Song Workspace
  - Song Overview
  - Lyrics
    - Draft
    - Version History
    - Comparison
  - Customer Feedback
  - Internal Notes
  - Approvals
  - Files
- Production
  - Composition
  - Arrangement
  - Recording
  - Editing
  - Mixing
  - Mastering / Finalization
  - Quality Review
- Media
  - Working Files
  - Final Audio
  - Lyric PDF
  - Delivery Assets
- Calendar
- Messages

`Resources / Templates` remains source-defined in the broader platform shell but is intentionally outside the bounded eight-page Creator chassis slice until a ninth top-level integration point is explicitly established.

## Admin / Operations Workspace

Executive Dashboard; Requests / CRM-Lite; Orders & Programs; Users & Organizations; Catalog & Pricing; Payments & Finance; Scheduling; Communications; Consent & Compliance; Reports & Analytics; Platform Configuration; Monitoring & Incidents; System Settings.

## Secure Delivery

- Song / `[deliveryToken]`
  - Access Resolution
    - Token Validation
    - Access Verification when required
    - Entitlement Validation
    - Consent Validation
    - Asset Authorization
  - Private Song Page
    - Listen
    - Download
    - Lyrics
    - Photos / Approved Story
    - Share Controls
  - QR Keepsake Landing Page / entry
  - Access Verification
  - Expired / Revoked Link
  - Delivery Confirmation

Access Resolution items are implementation/security gates rather than user-facing navigation destinations. QR entry resolves into the same secure route and does not bypass those gates.
