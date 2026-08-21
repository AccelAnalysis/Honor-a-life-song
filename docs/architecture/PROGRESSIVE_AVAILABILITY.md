# Progressive Availability

The complete information architecture should be visible and acceptance-testable before every business workflow is operational.

A planned module may appear in its governed navigation position, but it must be visibly unavailable with an explicit reason. It must not return fabricated production results, pretend an integration exists, or silently perform a client-only substitute for a server-authoritative workflow.

Chassis status vocabulary:

- **Chassis active** — route, composition and contract exist; this does not imply live backend functionality.
- **Workflow planned** — destination exists in information architecture but authoritative service/persistence is not implemented.
