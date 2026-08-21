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

Dashboard; My Song Journey; Story & Memories; Interviews; Lyrics & Review; Family & Collaborators; Messages; Payments & Orders; Files & Keepsakes; Consent & Permissions; Profile & Settings; Help & Support.

## Facility / Project Ageless Workspace

Program Dashboard; Program Overview; Participants; Schedule & Touchpoints; Stories & Interviews; Songs & Creative Works; Families; Concert & Events; Keepsakes; Sponsors & Funding; Reports & Outcomes; Facility Team; Program Settings; Help.

## Creator / Production Workspace

Creator Dashboard; My Work; Story Workspace; Song Workspace; Production; Media; Calendar; Messages; Resources / Templates.

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
