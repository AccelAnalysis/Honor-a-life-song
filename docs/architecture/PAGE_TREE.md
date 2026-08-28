# Platform Page Tree

## Public / Acquisition

- Home
  - Organization-facing Value Proposition
  - How It Works
  - Featured Stories / Songs
  - Choose an Experience
  - Testimonials
  - Plan an Experience CTA
- How It Works
  - Choose an Experience
  - Prepare Participants
  - Stories Become Songs
  - Review & Event Preparation
  - Presentation or Concert
  - Secure Sharing & Keepsakes
- Services
  - Single-Song Group Event — $200
  - Honor a Life Song Experience — $2,500
    - Program Overview
    - Facility Benefits
    - Participant Experience
    - Family Experience
    - Concert / Presentation
    - Sponsorship
    - Request a Facility Program
  - Community Use Cases
- Stories
- Sponsorship & Partnerships
- About
- Pricing / Packages
- FAQ
- Schedule a Consultation
- Login / Plan an Experience

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

## Organization Account

- Home
  - Next Experience
  - Materials Ready
  - Agreements Requiring Attention
  - Suggested Future Dates
- Experiences
  - Upcoming Experiences
  - Past Experiences
  - Single-Song Group Event
    - Overview
    - Event Setup
    - Shared Song
    - Event Materials
  - Honor a Life Song Experience
    - Overview
    - Participants
    - Interviews
    - Songs
    - Concert
    - Event Materials
- Songs & Memories
- Account
  - Team
  - Billing
  - Organization Agreements
- Help

## Participant / Family Access

- Claim Invitation
  - Verified Email
  - Permissioned Access Summary
  - Keep These Memories
- My Memories
  - Claimed Experiences
  - Private Keepsake Entry
- Secure Delivery
  - Song / `[deliveryToken]`

## Legacy Customer / Family Workflow Reference

This source-defined ten-module workspace remains as a deeper internal/reference surface. It is not the initial participant/family entry experience and is not linked from primary acquisition. `CUSTOMER_MODEL.md` governs current customer ownership and access.

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

## Legacy Facility / Project Ageless Workflow Reference

The depth below is retained as internal workflow architecture. Customer-facing facility functionality now appears package-by-package inside an `OrganizationExperience`, not as permanent global organization navigation.

The operating chassis currently registers these eleven top-level Facility destinations. This slice preserves those integration points and implements the source-defined hierarchy beneath them.

- Program Dashboard
  - Program Status
  - Participants
  - Active Touchpoints
  - Stories Captured
  - Songs in Progress
  - Concert Countdown
  - Action Items
- Program Overview
  - Scope
  - Dates
  - Program Team
  - Funding
  - Deliverables
- Participants
  - Participant Roster
  - Add Participant
  - Participant Detail
    - Contact / Representative
    - Participation Status
    - Accessibility Notes
    - Consent
    - Story Contributions
    - Touchpoint Attendance
    - Song Status
    - Family Connections
  - Import / Export Roster
- Schedule & Touchpoints
  - Program Calendar
  - Group Story Session
  - Individual Interview
  - Family Interview
  - Songwriting Session
  - Rehearsal / Listening
  - Concert
  - Keepsake Delivery
- Stories & Interviews
  - Story Capture Queue
  - Interview Schedule
  - Interview Notes
  - Family Contributions
  - Story Status
- Songs & Creative Works
  - Individual Songs
  - Group / Community Song
  - Song Status
  - Review Readiness
- Families
  - Family Contacts
  - Invitations
  - Contributions
  - Event Attendance
- Concert & Events
  - Event Details
  - Venue
  - Run of Show
  - Participant List
  - Family Invitations
  - Accessibility
  - Photography / Media Permissions
  - Event Completion
- Keepsakes
  - Digital Deliveries
  - Printed Song Cards
  - Distribution Status
- Sponsors & Funding
  - Funding Sources
  - Sponsor Commitments
  - Covered Activities
  - Sponsor Recognition
  - Restrictions
- Reports & Outcomes
  - Participation
  - Family Engagement
  - Songs Completed
  - Event Attendance
  - Satisfaction
  - Program Outcomes
  - Export Report

### Source-defined Facility destinations outside this bounded slice

The broader source also names **Facility Team**, **Program Settings**, and **Help** as Facility-level destinations. They are intentionally not added to the current eleven-item chassis navigation by this hierarchy build. They remain source requirements for a future explicit chassis integration decision.

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

The operating chassis currently registers exactly 12 Admin top-level destinations. Their source-defined child hierarchy is:

- Executive Dashboard
  - New Requests
  - Active Orders
  - Active Programs
  - Songs Completed
  - Revenue
  - Capacity
  - Alerts
- Requests / CRM-Lite
  - New Inquiries
  - Qualification
  - Consultations
  - Quotes
  - Conversion
- Orders & Experiences
  - Organization Orders
  - Organization Experiences
  - Experience Templates
  - Exceptions
  - Closed Work
- Users & Organizations
  - Customers
  - Family Collaborators
  - Facilities
  - Facility Staff
  - Creators
  - Partners
  - Sponsors
- Catalog & Pricing
  - Packages
  - Program Templates
  - Add-ons
  - Deposits
  - Revision Limits
  - Turnaround Targets
- Payments & Finance
  - Payments
  - Invoices
  - Refunds
  - Failed Payments
  - Sponsor Funding
  - Reconciliation
- Scheduling
  - Interviews
  - Facility Visits
  - Program Sessions
  - Events
  - Creator Availability
- Communications
  - Message Templates
  - Email
  - SMS
  - Failed Deliveries
  - Communication History
- Consent & Compliance
  - Consent Records
  - Restrictions
  - Withdrawals
  - Media Permissions
  - Retention
  - Deletion / Restriction Requests
  - Audit Logs
- Reports & Analytics
  - Sales Funnel
  - Turnaround
  - Creator Workload
  - Revisions
  - Program Outcomes
  - Funding Reports
  - Export Center
- Monitoring & Incidents
  - _No source-defined child navigation in this bounded slice._
- Platform Configuration
  - Roles & Permissions
  - Program Templates
  - Status Definitions
  - Notification Rules
  - Integration Settings
  - Feature Flags

`System Settings` is also defined by the broader Platform Shell source, but it is not one of the 12 currently registered Admin chassis destinations. This bounded hierarchy build therefore documents it without silently adding a thirteenth top-level route.

Both `Catalog & Pricing → Program Templates` and `Platform Configuration → Program Templates` operate on the same canonical `ProgramTemplate` records.

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
