# Meshwork

**Meshwork is an agent-operated workspace and a collaborative connectivity economy.** It combines the ZCode agent workspace/runtime with a permissioned network of user-operated nodes, gateways, connection providers, relays and community demand pools.

This repository is the source of truth for product requirements, architecture decisions, implementation milestones, security rules, research references, design and handoffs. Implementation must not depend on the original ChatGPT conversation.

## Product north star

A user expresses an outcome in natural language. Meshwork turns that request into a typed, inspectable and permissioned execution plan, selects the tools and network capabilities that can actually satisfy it, obtains approvals, executes through deterministic adapters, verifies the result and records the evidence.

Examples:
- “Combine home fibre, 5G and Starlink for the best connection.”
- “Use multiple links for this large upload; keep video calls on the lowest-latency path.”
- “Find a permitted nearby connection and use it as a temporary backup.”
- “Offer up to 20% of my spare bandwidth, only on the guest network, with a daily cap.”
- “Pool demand from our neighbourhood and negotiate a bulk internet connection.”
- “Keep my task on fibre, but automatically fail over to 5G if fibre degrades.”

Users should not need to understand MPTCP, policy routing, Linux traffic control, captive portals, WireGuard, gateways or payment reconciliation to ask for these outcomes.

## Foundation and upstream

- Base: [zai-org/ZCode](https://github.com/zai-org/ZCode), an Apache-2.0 desktop/web coding-agent workspace with an existing Electron desktop app, shared UI, services/RPC, Agent CLI/runtime, plugins, automations, browser, terminal and dynamic-workflow compiler/runtime.
- Network implementation reference: [meshlink-wifi-gateway](https://github.com/meshlinkfoundation/meshlink-wifi-gateway) and [meshlinkfoundation/broker](https://github.com/meshlinkfoundation/broker).
- Bonding reference to evaluate: [OpenMPTCProuter](https://github.com/Ysurac/openmptcprouter), especially its multi-WAN multipath plus remote relay/VPS approach.

Meshwork should extend the existing ZCode runtime and platform boundaries. Do not replace the task/session runtime, create a second task queue, rebuild browser/terminal/plugin/automation functionality, or create a separate agent framework.

## Main-page design — HTML is canonical

**Primary design reference: [Interactive HTML prototype](design/index.html)**  
[Design run instructions](design/README.md)

Open design/index.html directly in a current desktop browser; it has no build step or remote dependencies. It contains the main New Task workspace, Connections & Aggregation, My Nodes, Marketplace / Buy-Sell-Group-buy, Tasks, Automations and Settings surfaces, with local prototype interactions.

The HTML design is the canonical source for main-page visual and interaction intent. Figma is a secondary exploration/reference file only; do not block implementation or sign-off on Figma work. When HTML and Figma differ, follow HTML and this repository's architecture/design constraints.

### Main-page invariants

- New Task remains the primary entry point.
- The project selector remains visible and must use ZCode's existing project assignment/service.
- Browser and Terminal have separate top-right toggles, independent open/close state, and can be opened together.
- Existing task/session, model, tools, automations, plugins, settings and platform window-control behavior remain intact.
- Network aggregation modes must be truthfully distinguished: multi-WAN flow balancing, policy routing, failover, cross-node relay and true single-flow bonding are not interchangeable.
- Sharing, hotspot, relay and exit-node capabilities remain off until explicit owner permission.
- HTML is a reference prototype, not a replacement WebView application. Implement with existing ZCode React components, services, hooks, tokens and platform APIs.

Figma concept: [Meshwork — Agent Workspace & Connectivity Network](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL). It is retained for optional exploration; it is not the source of truth.

## Architecture principles

1. **Local-first, permissioned nodes.** An install is a node identity and capability participant, not an automatically enabled public router. Sharing, exit-node, relay, hotspot and gateway modes are explicit opt-ins.
2. **Intent is not execution.** LLMs interpret goals and suggest options; typed validators, policy evaluators and deterministic adapters decide what can actually run.
3. **Separate control plane and data plane.** Discovery, quotes, membership, offers and policy are control-plane concerns. Forwarding, bonding, shaping, accounting and failover happen in local gateway/data-plane adapters.
4. **Honest aggregation.** Multi-WAN load balancing, traffic-class routing, failover, cross-node relay and single-flow bonding are distinct capabilities. Never claim single-download acceleration from simple load balancing.
5. **Least privilege.** Network mutation lives behind a narrow privileged helper. Never run model-generated shell commands with unrestricted sudo.
6. **Operator autonomy.** Providers set their own capacity, prices, schedules, caps and acceptable customers, subject to law, upstream ISP terms and marketplace rules.
7. **Auditable economics.** Quotes, payment status, usage, provider attribution, refunds, disputes and settlement are separate verifiable records.
8. **Reuse before reinvention.** Reuse ZCode, Linux networking primitives, established VPN/multipath projects and existing libraries after licensing, compatibility and security review.

## Start here

- [Interactive HTML design](design/index.html)
- [HTML design guide](design/README.md)
- [Reference repository review](docs/REFERENCE_REPOSITORY_REVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Connection aggregation specification](docs/NETWORK_AGGREGATION.md)
- [Security and permission model](docs/SECURITY_MODEL.md)
- [Implementation plan and TL/worker ownership](docs/IMPLEMENTATION_PLAN.md)
- [Network research references](docs/RESEARCH_REFERENCES.md)
- [Figma archive note](docs/FIGMA_DESIGN.md)

## Implementation status

- [x] Upstream ZCode and MeshLink reference repositories inspected at source level.
- [x] Main-page HTML design prototype authored and made canonical.
- [x] Three-page Figma concept retained as secondary reference.
- [x] Initial architecture, aggregation, security, research and milestone requirements written into this repository.
- [ ] Fork/copy ZCode upstream into this repository and preserve all notices/licence obligations.
- [ ] Build and verify baseline Linux and Windows desktop installers before product changes.
- [ ] Implement New Task integration and complete UI regression coverage.
- [ ] Implement the network capability model and Linux node adapter.
- [ ] Demonstrate multi-WAN policy routing, failover, and true single-flow bonding independently.
- [ ] Implement node marketplace, metering, group buying and payment reconciliation.

**Important:** Repository documentation and the HTML design are prepared; this does not claim the ZCode fork, runtime integration, network data plane or live marketplace have been implemented.