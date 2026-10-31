# Meshwork architecture

## 1. Product shape

Meshwork is one desktop-first agent workspace with two inseparable value propositions:

1. An intent-driven workspace that coordinates projects, tasks, local tools, agents, automations, plugins, browser, terminal, devices and remote resources.
2. A collaborative capability network in which participating nodes can advertise, buy, sell, aggregate, relay or pool network access and other approved edge services.

The New Task screen is the front door to both. Users should not have to navigate to a network console before asking the agent to solve a connectivity problem. Dedicated Connections, My Nodes and Marketplace screens provide visibility and control after the intent has been understood.

## 2. Reuse ZCode

Fork the upstream ZCode repository and preserve its existing workspace. Its current structure includes:

- packages/desktop: Electron Main, Host, Renderer and desktop packaging.
- packages/web: browser client.
- packages/server: HTTP/WebSocket services and remote connection.
- packages/ui: shared React components, hooks and Zustand stores.
- packages/services: application services and persistence.
- packages/shared, packages/rpc, packages/client: shared contracts, transport and SDK.
- packages/provider, packages/provider-node: provider capabilities.
- apps/zcode-cli: Agent CLI, TUI, tools, core runtime, workflow packages and plugins.

Use the existing ZCode task/session model, project assignment, runtime command/event contracts, tool system, model provider handling, subagents, automations, plugins and remote workspace machinery. Extend through small adapters/services; do not recreate them in Meshwork.

Keep the original project/task semantics: one project can own many tasks, a task can be assigned or changed to a project through the existing project assignment flow, and existing project selectors, task list, search, filters and persisted state remain functional.

Keep the existing settings navigation and structure. Add grouped Meshwork sections for Network, Node, Marketplace, Billing, Privacy, Relay and advanced networking without rewriting ZCode's General, Appearance, Model settings, Browser Use, Computer Use, Personalization, Memory, Subagents, Plugins, MCP, Skills, Commands and Hooks settings.

## 3. Layered system

### A. Experience layer

- New Task / composer and task session.
- Projects and task list.
- Browser and Terminal docks, individually toggleable and resizable.
- Agent plan, approval requests and execution timeline.
- Connections and aggregation controls.
- My Nodes: device identity, local interfaces, capability grants, operator controls, health and accounting.
- Connectivity marketplace: offers, quotes, checkout, access sessions, reviews and disputes.
- Community purchasing: demand pools, commitments, provider quotes, member allocation and settlement.
- Settings: original ZCode settings plus Meshwork settings.

The UI is a projection of service state. It must not own a second accepted-task queue or make security decisions.

### B. Intent and orchestration layer

Extend the ZCode dynamic-workflow compiler/runtime and existing typed task execution path. The model may interpret natural language, request structured observations, propose candidate plans and explain trade-offs. It does not choose arbitrary shell commands or directly mutate privileged network state.

Core workflow:

1. Parse intent into a typed MeshworkIntent.
2. Resolve the user's local context, project, device, location scope (only when explicitly provided/permissioned), preferences and existing entitlements.
3. Discover relevant node/provider capabilities.
4. Construct candidate plans and counterfactuals.
5. Validate constraints, feasibility, permissions, spending and policy.
6. Present a plan and request approval for material changes.
7. Execute deterministic adapter operations with idempotency keys.
8. Verify observed outcomes against declared postconditions.
9. Journal results, actual costs, usage, provenance and exceptions.
10. Recover/replan on link loss, provider failure, expired quote, failed payment or policy violation.

A workflow step must identify its input schema, output schema, capability requirement, side-effect class, approval policy, timeout, retry policy, idempotency key, compensating action and verification condition.

### C. Capability/control plane

A logically distributed control plane manages:
- cryptographic node identities and enrollment;
- signed node heartbeats and capability advertisements;
- provider/operator identities and service eligibility;
- connection/node discovery and quotes;
- topology, reachability and relay availability;
- offer catalogue, pricing and marketplace policy;
- group-buy demand commitments and provider quotes;
- entitlement/access grants and revocations;
- payment and settlement records;
- health/quality observations and reputation evidence.

Do not place the data path through a single central server by default. The control plane can coordinate metadata, quotes, signed authorizations and rendezvous. Actual traffic follows the selected network path. Provide self-hostable/replaceable coordinator boundaries to avoid one mandatory centralized broker.

### D. Local node agent / node service

Each installation has a cryptographic node identity and a local Node Agent process/service. The agent advertises only capabilities that:
- exist on the host;
- have passed local capability probes;
- are supported by the OS/driver/network topology;
- are explicitly enabled by the owner;
- fall within current resource and policy limits.

Node modes are explicit and independently permissioned:
- endpoint/client;
- provider/client gateway;
- guest hotspot;
- relay/exit node;
- multipath bonding endpoint;
- edge-compute/model provider;
- offline/LAN mesh bridge (future).

Installing Meshwork must not silently turn on hotspot sharing, forwarding, a public relay or a network exit node. Default mode is endpoint plus local diagnostics; sharing is off.

### E. Data plane and adapter boundary

Define a provider-neutral INetworkAdapter / IGatewayAdapter contract. The Linux implementation can use iproute2, policy routing, nftables (or a carefully scoped iptables compatibility implementation), tc, systemd and supported multipath tooling. Other adapters can target OpenWrt, Windows route/interface APIs, WireGuard/Tailscale-compatible tunnels or a remote Linux gateway as appropriate.

The application layer never imports command strings or runs arbitrary network shell. It asks the adapter to perform typed operations such as:
- enumerate interfaces and routes;
- probe path latency/loss/throughput;
- create or update an aggregation policy;
- establish a verified tunnel/subflow;
- apply bandwidth and quota policy;
- install/revoke a device entitlement;
- enable/disable a guest access offer;
- retrieve byte counters and health;
- restore the last known-safe configuration.

Adapters return structured observations with capability version, timestamp, provenance, measurement confidence and errors.

## 4. Deterministic execution

Use the ZCode dynamic-workflow stack as the authoring/compiler/runtime substrate. Keep the pure compiler and the sandbox runtime app-independent, and put production drivers, actor sessions, SQLite journal and tool wiring into the existing bootstrap/service layer.

The network execution planner should be deterministic for a fixed set of:
- validated intent;
- capability snapshots;
- topology observations;
- policy and permission state;
- quote/version data;
- optimizer configuration.

Use explicit scoring and stable tie-breaking. Never rely on a model to perform numerical optimisation, route selection, monetary arithmetic, permission interpretation or postcondition verification.

Persist:
- source observations and freshness windows;
- candidate plans and rejected candidates with reasons;
- selected route and adapter versions;
- approval grants and exact approved scope;
- idempotency keys and execution journal;
- before/after configuration snapshots;
- usage and settlement evidence;
- postcondition results.

## 5. Core domain model

Initial aggregate roots/entities:
- UserIdentity, DeviceIdentity, NodeIdentity
- NodeEnrollment, NodeCapability, CapabilityGrant, NodeHeartbeat
- NetworkInterface, NetworkPath, PathObservation
- AggregationPolicy, TrafficClassPolicy, BondingSession, RelayEndpoint
- ServiceOffer, OfferVersion, Quote, Reservation
- AccessEntitlement, AccessSession, UsageWindow, UsageCounterSnapshot
- PaymentIntent, PaymentAttempt, PaymentEvent, Refund, Dispute, ProviderSettlement
- DemandPool, MemberCommitment, ProviderBid, PoolAllocation
- NetworkExecutionPlan, PlanStep, ApprovalGrant, ExecutionJournalEntry

Do not overload one AccessSession as a payment, quote, network path, relay session and settlement. Keep transitions explicit and reconcilable.

## 6. Storage and persistence

- Preserve ZCode storage/migrations for existing projects/tasks/sessions.
- Use the repo's existing persistence authority for application state where possible; inspect current migration and service ownership before adding tables.
- A node must persist security-sensitive grants, gateway configuration generations, access sessions and counter snapshots durably.
- Journal all side effects; make operations idempotent and resumable.
- Do not add a new shared SQLite deployment for the distributed network control plane just because the local broker reference uses SQLite. Choose coordinator persistence based on multi-tenant/transaction/concurrency requirements; Postgres is the recommended authoritative central database if a hosted coordinator is operated.
- Local node state should continue operating through temporary coordinator disconnection within the bounds of locally cached, non-expired, signed grants.

## 7. Deployment topologies

1. Desktop endpoint: Meshwork on Windows/Linux/macOS; uses local internet and discovered gateways, can buy access or contribute explicitly enabled capabilities.
2. Single-board-computer gateway: Linux/Pi/OpenWrt-compatible node with separate WAN/AP interfaces; sells access using portal or managed onboarding.
3. Multi-WAN edge gateway: one physical gateway with fibre, cellular, satellite or multiple Ethernet uplinks; runs policy routing and/or bonding.
4. Community mesh: multiple local gateways and relays with a coordinator for discovery, authorization and offer management.
5. Remote bonding relay: accessible server/VPS that terminates the multipath tunnel or proxy path; must be considered part of performance and failure model.

Do not promise that a general-purpose Windows desktop can act as a full transparent router or AP on every NIC/driver combination. Advertise only what has been probed and verified on that platform.

## 8. Runtime and packaging

The app must remain installable from this repository on Linux and Windows throughout development. Preserve ZCode's platform build pipeline, signing/notarization boundaries, Electron runtime asset preparation, Node/pnpm pins and existing E2E harness. Add network services as optional platform capabilities, not a prerequisite for launching the desktop workspace.

Baseline verification is a required gate before changes:
- bootstrap and build upstream baseline;
- run lint/typecheck/test and architecture governance checks;
- run desktop launch and browser/terminal smoke tests;
- create and install Linux packages on a clean Linux VM/runner;
- create and install Windows packages on a clean Windows runner;
- verify update/uninstall preserve or intentionally migrate existing user data.

## 9. Non-goals

- Do not issue a speculative token to fund a network economy.
- Do not silently resell a user's ISP connection.
- Do not force a single central broker to carry all user traffic.
- Do not conflate Wi-Fi coverage extension, IP routing, load balancing and single-flow bonding.
- Do not replace ZCode's existing runtime with a chat-only agent wrapper.
- Do not build UI-only placeholder controls or mock successful actions.