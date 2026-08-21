# Service Boundaries

The chassis does not bind UI components directly to third-party vendors. Later implementation should provide adapters/repositories for:

- identity and sessions;
- relational persistence;
- secure object storage;
- payments and invoices;
- email and SMS;
- scheduling/calendar services;
- analytics;
- monitoring and incident reporting;
- secure delivery links.

Payment state, authorization, consent enforcement and delivery entitlement must remain server-authoritative.
