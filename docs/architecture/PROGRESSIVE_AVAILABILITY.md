# Progressive Availability

The complete information architecture should be visible and acceptance-testable before every business workflow is operational.

A workflow destination may exist structurally before its authoritative production service is connected. The platform must distinguish route/workflow structure from live business capability and must not fabricate production results or silently substitute client-only behavior for a server-authoritative workflow.

Chassis status vocabulary:

- **Chassis active** — the top-level route, shared workspace composition, and integration contract exist. This does not imply live backend functionality.
- **Workflow structured** — the source-defined child/grandchild route and concrete workflow surface exist, but production actions remain gated behind shared service/repository interfaces that are not yet connected.
- **Workflow planned** — the destination is reserved in the information architecture but its concrete workflow surface has not yet been implemented.

A structured Facility workflow may therefore expose its real domain and service boundaries while explicitly disabling actions such as authoritative participant saves, scheduling, messaging, consent mutation, media publication, secure delivery, funding-state mutation, and report export until the corresponding production adapter exists.

Moving a destination from planned to structured is not the same as declaring it live.
