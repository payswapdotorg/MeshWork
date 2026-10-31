# Implementation plan and team handoff

## TL mandate

The TL owns integration, source-of-truth documentation, interfaces, sequencing, review gates, CI and releases. The TL must split work among three workers while preserving interface contracts. Workers may prepare branches/PRs, but the TL owns integration and end-to-end correctness.

## Team allocation

### TL — Architecture and integration

- Fork/copy ZCode source into this repository; preserve notices, licence and third-party attributions.
- Baseline source audit: task/project ownership, runtime sessions, dynamic-workflow, services, RPC, network policy, Browser/Terminal dock, settings, automation, plugin and installers.
- Own architecture decisions, contracts, migration strategy, cross-worker integration and upstream sync strategy.
- Preserve existing Linux and Windows installability.
- Maintain repo documentation and status/progress evidence.
- Reject UI placeholders, mocks represented as completed functionality, arbitrary privileged command execution and unverified aggregation claims.

### Worker 1 — Workspace UI and Figma

- Translate the three Figma pages into ZCode shared React components and platform surfaces.
- Preserve the New Task entry, projects/task assignment, task list, model selector, permissions, context/commands, automations, plugin marketplace, skills, memory, subagents, browser/terminal toggles and settings.
- Add Connections, My Nodes and Marketplace navigation.
- Add responsive desktop/web layouts without regressing keyboard, localization, themes or accessibility.
- Build UI around actual typed service state; no fake data in production.
- Figma: https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL

### Worker 2 — Agent orchestration and deterministic workflow

- Extend ZCode dynamic-workflow compiler/runtime and current services.
- Define and implement NetworkIntent, NetworkExecutionPlan, PlanStep, candidate scoring and postcondition contracts.
- Implement planning/counterfactual display, approval scope, deterministic validators, journal, idempotency, retry/recovery and verification.
- Build typed tools for capability discovery, quote discovery, network plan construction, policy application, network health and accounting.
- Ensure LLMs do not perform privileged network changes or authoritative money/routing computations.
- Add replay/fault tests and provenance.

### Worker 3 — Node service, gateway and network data plane

- Define node identity/enrollment and capability advertisement.
- Build typed local node service and least-privilege helper.
- Build Linux gateway adapter with safe interface discovery, namespaced firewall/routing state, tc QoS/accounting, guest AP and portal where supported.
- Evaluate MeshLink broker patterns/code (MIT) separately from gateway code (no licence found at reviewed default branch).
- Evaluate MPTCP/OpenMPTCProuter/MPQUIC/tunnel relay for true single-flow bonding.
- Implement WAN path observations, traffic policy, failover, metering and adapter health.
- Keep Windows/desktop endpoint features separate from Linux router-mode claims.

## Milestones and acceptance gates

### M0 — Fork, baseline and source ownership

- Fork/copy ZCode into payswapdotorg/MeshWork.
- Confirm exact upstream commit, licences, git history strategy, dependency licences and third-party notices.
- Build Linux and Windows desktop apps without Meshwork changes.
- Verify projects/tasks, task session, Browser, Terminal, automations, plugins, settings and memory.
- Record baseline unit/E2E/architecture test results and installer artifacts.
- Add architecture ownership and source-of-truth docs.

Exit: clean baseline launch/install on Linux and Windows; baseline failures explicitly recorded, no regressions introduced.

### M1 — New Task-first workspace

- Preserve ZCode task/project and runtime contracts.
- Add product identity/visual system; New Task as default route.
- Wire browser/terminal dock toggles (separate states and persisted layout), projects selector, prompt actions, model selector and approval mode.
- Add Connections/My Nodes/Marketplace navigation.
- Retain existing settings and capability surfaces.

Exit: desktop and web E2E for new task, project assignment, task restore, dock visibility/resizing, automation/plugin navigation and existing settings.

### M2 — Deterministic intent and execution engine

- Add typed network intent schemas.
- Candidate generation, hard constraints, scored counterfactuals and stable tie-breaking.
- Approval/permission grant, spend/cap limits, journal, idempotency and postcondition checks.
- Build offline/replay/failure-injection test harness.

Exit: same input/state produces identical normalized plan; unauthorized action cannot execute; failed execution is resumable/recoverable.

### M3 — Node identity and capability discovery

- Local node agent/service; enrollment and key rotation.
- Probe local interfaces/paths and platform-specific supported capabilities.
- Signed heartbeat/capability advertisement and local privacy settings.
- Endpoint-only default; sharing/relay/AP/exit node off by default.

Exit: two test nodes can enroll, advertise only enabled capabilities, withdraw/revoke, and continue safely during coordinator loss within grant TTL.

### M4 — Single gateway hotspot and operator model

- Adapt MeshLink broker concepts behind Meshwork interfaces.
- Linux gateway/AP/guest isolation, captive portal, service offers/profiles, entitlement and kernel-enforced rate/usage limits.
- Payment connector and durable reconciliation.
- Safe installer/uninstaller and config rollback.

Exit: clean Raspberry Pi/Linux test device can publish a free and paid offer, onboard a client, enforce policy, record usage, revoke/expire and reconcile payment. Verify ISP eligibility workflow.

### M5 — Local multi-WAN policy routing and failover

- Discover at least two independent WAN interfaces.
- Health probes and policy routing tables.
- Traffic-class selection, load balancing, failover and hysteresis.
- Per-path cost/metering/budget handling.

Exit: independent flow distribution and failover demonstrated; shared upstream bottleneck detected; no claim of single-flow bonding.

### M6 — True single-flow bonding

- Evaluate Linux MPTCP and supported proxy/tunnel strategy.
- Configure endpoint + remote relay and subflow path manager.
- Observe per-subflow status and performance.
- Tune scheduler/congestion control and failure recovery.
- Compare test transfer against the best single link and disclose relay bottleneck.

Exit: one logical file transfer demonstrably uses more than one path; measurable goodput validated across different RTT/loss; fallback/recovery tested. No UI claim unless proof exists.

### M7 — Marketplace and provider offers

- Service offers and versions, quote expiry/locking, reservation, purchase flow and access grant.
- Provider onboarding, permission evidence, eligibility checks and node health.
- Metering, cancellation/refund/dispute/settlement reconciliation.
- User-visible price/fee/usage/policy.

Exit: end-to-end offer → quote → payment → entitlement → measured usage → expiry/revoke → settlement/refund tests.

### M8 — Group purchase / pooled demand

- Demand pool lifecycle and member commitments.
- Threshold conditions, provider bids/quotes and terms.
- Deterministic member allocation and payment authorization.
- Cancellation, threshold expiry, provider offer changes and refunds.

Exit: pool never commits/bills members before threshold and terms are approved; deterministic allocation; failure/exit/refund tested.

### M9 — Production cross-platform releases

- Linux router node images/installers and desktop app release.
- Windows desktop package with only supported endpoint/network features.
- Update, rollback, uninstall, data migration and code signing.
- Security, performance, localization, accessibility and network compatibility audit.

Exit: reproducible install artifacts and clean-machine verification on supported Windows/Linux versions.

## Execution governance

- Each milestone has one canonical spec, owner, dependencies and acceptance test.
- Every task has owner, milestone, status, source evidence, tests run, remaining risks and next action.
- Track green status only when code, tests and reproducible verification evidence exist.
- Tests must run against actual adapters/integration environments where the milestone requires real network behavior. Mocks are allowed for deterministic unit tests but cannot satisfy integration acceptance.
- Before broad refactors, run repo architecture governance and affected tests. Use architecture contracts to stop circular dependencies and accidental UI/service coupling.
- TL should require source paths, callsites, migrations, CI results, E2E trace and install artifacts in each worker handoff.
- No milestone is complete because a planning document or Figma screen exists.

## First work order

1. Create the ZCode fork/base and verify clean Linux/Windows packaging.
2. Perform a focused source map of New Task, project/task state, browser/terminal dock, settings, automation, plugin and workflow runtime.
3. Start Figma-to-component implementation only after confirming existing ZCode design tokens and components.
4. In parallel, Worker 3 prepares a gateway adapter spike without touching production routing by default: enumerate interfaces, render topology, dry-run plan, no privileges.
5. Worker 2 defines typed intent/plan contracts against actual ZCode runtime ports.
6. TL performs integration and ensures docs, code and tests remain in sync.