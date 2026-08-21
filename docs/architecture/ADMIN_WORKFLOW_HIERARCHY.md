# Admin / Operations Workflow Hierarchy

## Purpose

Admin / Operations is the Honor a Life Song control plane. It provides privileged cross-platform oversight over canonical platform records without becoming a second application or a duplicate business system.

The governing rule remains: **features plug into the operating chassis; features do not redesign the chassis to fit themselves.**

This hierarchy build keeps the 12 existing Admin top-level destinations in their chassis order and adds only the child workflows defined by the platform source specification.

## Navigation and route model

`lib/admin-navigation.ts` is the central source for Admin child navigation, shared service-boundary metadata, route resolution, selected-record context, and static preview routes.

Top-level routes remain chassis-owned:

- `/admin`
- `/admin/requests`
- `/admin/programs`
- `/admin/people`
- `/admin/catalog`
- `/admin/finance`
- `/admin/scheduling`
- `/admin/communications`
- `/admin/consent`
- `/admin/reports`
- `/admin/monitoring`
- `/admin/settings`

Child workflows are route-backed, for example:

- `/admin/dashboard/active-orders`
- `/admin/requests/new-inquiries`
- `/admin/programs/project-ageless-programs`
- `/admin/consent/withdrawals`
- `/admin/reports/program-outcomes`
- `/admin/settings/feature-flags`

Where a workflow supports a selected canonical record, the record identity is explicit in the route instead of being guessed from transient browser state:

`/admin/programs/individual-orders/record/<orderId>`

`/admin/people/facilities/record/<organizationId>`

`/admin/consent/consent-records/record/<consentRecordId>`

Synthetic `ref-*` identifiers exist only to make static PR-preview routes visually testable. They are not production records.

Invalid nested routes fail closed and do not fall back to an unrelated Admin destination.

## Chassis ownership

The shared `WorkspaceRoute` remains responsible for:

- workspace identity;
- top-level navigation;
- responsive composition;
- route identity;
- active-parent state;
- reference-mode warnings;
- progressive availability;
- invalid-route handling; and
- mobile reachability.

`AdminWorkspace` owns only the active Admin module content and its source-defined child navigation.

The mobile overflow navigation now exposes all remaining top-level destinations instead of making only the fourth destination reachable through `More`.

## Canonical records

The Admin hierarchy does not introduce persisted entities such as `AdminOrder`, `AdminProgram`, `AdminCustomer`, `AdminConsent`, `AdminPayment`, or `AdminAudit`.

Admin surfaces are explicitly bound to shared concepts including:

- `Person`;
- `Membership`;
- `Organization`;
- `Inquiry`;
- `Order`;
- `ProgramTemplate`;
- `ProgramRun`;
- `Participant`;
- `Touchpoint`;
- `Participation`;
- `StoryContribution`;
- `CreativeWork`;
- `LyricVersion`;
- `Approval`;
- `MediaAsset`;
- `ConsentRecord`; and
- `AuditEvent`.

Commercial, funding, scheduling, communications, reporting, monitoring, and configuration remain shared service boundaries until fuller canonical contracts/adapters are connected.

## Program Templates overlap

The source intentionally exposes Program Templates in two Admin areas:

- Catalog & Pricing → Program Templates
- Platform Configuration → Program Templates

Both routes declare the same `program_template` record context and are presented as two operational entry points to one canonical `ProgramTemplate` record. The UI cross-links the two entry points and does not create separate catalog and configuration template persistence.

## Executive Dashboard

The dashboard children are operational views, not a new analytics database:

- New Requests → canonical inquiries;
- Active Orders → governed individual song workflow state;
- Active Programs → canonical program-run state;
- Songs Completed → governed creative/approval completion;
- Revenue → authoritative received payment state;
- Capacity → supported workload/capacity inputs only;
- Alerts → traceable operational failures, blockers, and incidents.

Reference mode intentionally does not fabricate counts, revenue, capacity forecasts, or alerts.

## Requests / CRM-Lite

The request area remains deliberately bounded to service operation: inquiries, qualification, consultations, quotes, and conversion. It does not add generalized enterprise CRM pipelines, scoring, marketing automation, or broad constituent management.

Conversion is defined as a governed transition into the canonical downstream entity: `Order` for individual service or `ProgramRun` for program delivery.

## Payments and finance integrity

Payment and refund state remains server-authoritative. Browser redirects or client state cannot declare payment success, refund completion, or reconciliation success.

The finance hierarchy exposes payments, invoices, refunds, failed payments, sponsor funding, and reconciliation without attempting to become a full general-ledger/accounting system.

## Scheduling

All Admin scheduling workflows reference the shared scheduling boundary. No Admin-specific calendar service is introduced. Customer, Facility, Creator, and Admin scheduling must ultimately resolve against the same authority.

## Communications

Message templates, email, SMS, failed deliveries, and communication history remain behind the shared communication boundary. The Admin UI does not call providers directly and does not simulate sends or delivery success while providers are disconnected.

## Consent and compliance

Admin authorization and participant consent remain independent gates. The hierarchy preserves source-defined consent records, restrictions, withdrawals, media permissions, retention, deletion/restriction requests, and shared audit logs.

Withdrawal is treated as a future-use blocker rather than permission for the Admin UI to erase legally necessary audit evidence.

Sensitive exports likewise require both authorization and applicable consent/scope.

## Reporting

Reports derive from canonical records when authoritative data exists. Reference mode does not present fabricated company metrics.

Project Ageless program-outcome surfaces preserve participation, engagement, completion, attendance, satisfaction, and meaning/connection measures without inferring clinical outcomes.

Funding reports support sponsor/grant/facility evidence needs without implementing grant prospecting, application writing, deadline management, funder portals, or full grant-compliance software.

## Monitoring & Incidents

`Monitoring & Incidents` remains a top-level leaf because the source specification defines no child navigation beneath it in this bounded slice.

The surface is an integration point for shared service health, failures, failed jobs, integration errors, incidents, and recovery information. With no production monitoring adapter connected, it explicitly shows an unavailable/reference state rather than fake live health or incident data.

## Platform Configuration

Roles & Permissions, Program Templates, Status Definitions, Notification Rules, Integration Settings, and Feature Flags are represented as high-impact server-authoritative configuration boundaries.

Configuration must not bypass authorization, consent, workflow prerequisites, payment integrity, or security. Secrets are never intended for client-visible configuration.

## System Settings

The broader Platform Shell source also defines `System Settings`, but the operating chassis currently registers only 12 Admin destinations and does not include it. This hierarchy build therefore does not silently add a thirteenth route or merge it into Platform Configuration. It remains documented as a source/chassis discrepancy for a later explicit architecture decision.

## Progressive availability

The hierarchy is marked `structured`: navigation and workflow surfaces are implemented, while authoritative production services remain gated.

Current Admin service connection flags are intentionally false for requests, orders, programs, people, catalog, payments, funding, scheduling, communications, consent, reporting, audit, monitoring, configuration, and secure delivery. This reflects the actual repository state and prevents reference screens from masquerading as live operations.

## Domain integrity helpers

`domain/admin.ts` adds pure control-plane guard helpers rather than new persisted entities. They encode:

- Admin authorization does not bypass required consent;
- protected server-authoritative actions fail without server confirmation;
- active individual and program ranges derive from existing governed workflow states;
- sponsor funding alone never grants participant access;
- client state cannot assert payment success;
- Project Ageless experience metrics do not support clinical claims; and
- sensitive exports require both authorization and consent.

## Deferred production dependencies

Before Admin can operate live, the corresponding shared production repositories/adapters must be connected and authorized. This includes identity/session enforcement, persistence, payments/invoices/refunds, funding, scheduling, email/SMS, consent persistence, reporting/export generation, audit persistence, monitoring, secure delivery, and safe configuration persistence.
