# Platform Page Tree

## Public / Acquisition

- Home
- How It Works
- Services
  - Individual & Family Songs
  - Project Ageless
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
- Create Account
- Verify Email
- Password Recovery
- Accept Invitation
- Multi-Factor Authentication
- Access / Consent Error States

## Customer / Family Workspace

Dashboard; My Song Journey; Story & Memories; Interviews; Lyrics & Review; Family & Collaborators; Messages; Payments & Orders; Files & Keepsakes; Consent & Permissions; Profile & Settings; Help & Support.

## Facility / Project Ageless Workspace

Program Dashboard; Program Overview; Participants; Schedule & Touchpoints; Stories & Interviews; Songs & Creative Works; Families; Concert & Events; Keepsakes; Sponsors & Funding; Reports & Outcomes; Facility Team; Program Settings; Help.

## Creator / Production Workspace

Creator Dashboard; My Work; Story Workspace; Song Workspace; Production; Media; Calendar; Messages; Resources / Templates.

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
- Orders & Programs
  - Individual Orders
  - Project Ageless Programs
  - Other Program Runs
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

Private Song Page; QR Keepsake Landing Page; Access Verification; Expired / Revoked Link; Delivery Confirmation.
