# ADR-001: Extend ZCode as the Meshwork workspace/runtime

- Status: Accepted as the implementation direction; confirm after M0 source/packaging baseline.
- Date: 2026-10-31

## Context

Meshwork needs a desktop-first agent workspace, project/task system, local tools, browser, terminal, automations, plugins, model providers and a deterministic workflow runtime. Rebuilding these would duplicate the existing ZCode platform and create a second task/session authority.

## Decision

Use zai-org/ZCode as the upstream codebase. Preserve the existing task/project/session/runtime and desktop packaging boundaries. Implement Meshwork as extensions/services/adapters:
- Meshwork UI surfaces and domain features in existing UI/service boundaries;
- network intent/planning in the ZCode dynamic-workflow execution system;
- local node and network adapter behind typed service/RPC contracts;
- optional Linux gateway/helper package for privileged data-plane operations;
- separate network marketplace/control-plane services.

## Consequences

Positive:
- Existing projects/tasks and execution sessions remain first-class.
- Existing browser/terminal/automation/plugin capabilities are reused.
- Existing Windows/Linux build and release pipeline remains the installation backbone.
- Deterministic workflow compiler/runtime can host typed network orchestration.

Constraints:
- Preserve Apache-2.0 and upstream notices when forking ZCode.
- Respect upstream design system and architecture governance.
- Never introduce a competing task queue or direct UI-to-shell network privilege.
- Add new platform-specific capabilities only where verified.

## Alternatives rejected

- Build a new Electron app from scratch: rejected due duplicate platform/runtime work.
- Make a pure browser app: rejected because node/gateway capabilities require a local service and desktop integration.
- Embed the MeshLink broker as the main agent runtime: rejected because it is a local hotspot access broker, not a general workspace or network control plane.
- Claim all desktop installs are routers: rejected because OS and NIC capabilities differ; each install advertises only probed/permissioned abilities.