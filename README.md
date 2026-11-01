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

## Repository layout

| Path | Contents |
|---|---|
| [`zcode/`](zcode) | Vendored [zai-org/ZCode](https://github.com/zai-org/zcode) at pinned commit `a60ba6a7e5` (Apache-2.0, notices preserved) — the desktop/runtime base per [ADR-001](docs/ADR-001-ZCODE-BASE.md); build baseline in [docs/ZCODE_BASELINE.md](docs/ZCODE_BASELINE.md). |
| [`app/`](app) | The Meshwork web workspace (Next.js 16) — the TL design-handoff implementation (see [Get the app](#get-the-app)). |
| [`design/`](design) | Approved HTML design prototypes (reference only). |
| [`docs/`](docs) | Requirements, ADRs, plans, handoffs, reports and evidence. |

## Foundation and upstream

- Base: [zai-org/ZCode](https://github.com/zai-org/ZCode), an Apache-2.0 desktop/web coding-agent workspace with an existing Electron desktop app, shared UI, services/RPC, Agent CLI/runtime, plugins, automations, browser, terminal and dynamic-workflow compiler/runtime.
- Network implementation reference: [meshlink-wifi-gateway](https://github.com/meshlinkfoundation/meshlink-wifi-gateway) and [meshlinkfoundation/broker](https://github.com/meshlinkfoundation/broker).
- Bonding reference to evaluate: [OpenMPTCProuter](https://github.com/Ysurac/openmptcprouter), especially its multi-WAN multipath plus remote relay/VPS approach.

Meshwork should extend the existing ZCode runtime and platform boundaries. Do not replace the task/session runtime, create a second task queue, rebuild browser/terminal/plugin/automation functionality, or create a separate agent framework.

## Design authority and current UI handoff

**Current implementation authority:** [TL handoff — reproduce the approved Meshwork design](docs/TL_HANDOFF_DESIGN_REPRODUCTION.md).

This handoff supersedes older conflicting UI instructions. Its page-specific reference hierarchy is:

- **New Task and workspace shell:** user-approved Meshwork/ZCode workspace screenshot and the approved dark Meshwork reference. Preserve the existing ZCode shell, project/task/runtime behaviour and browser/terminal components.
- **Connections:** the accepted dark Meshwork Connections design, with its full path inventory, five aggregation modes, estimates, traffic allocation and community-connectivity section.
- **Connection Marketplace:** the exact [Figma frame 8:36](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0). The Figma frame supersedes the older HTML marketplace mockup for this page only.
- **Settings and existing ZCode capability pages:** preserve the existing ZCode screens, routes, navigation, controls and persistence. Do not create a separate Meshwork Settings implementation.

The legacy [HTML design prototype](design/index.html) remains useful as an interaction/reference prototype for earlier concepts, but it is not the Marketplace design authority and must not be used to replace existing ZCode Settings. Implement in the existing ZCode React/shared UI stack; do not ship the HTML as a WebView replacement.

### Navigation and interaction invariants

- New Task remains the primary entry point.
- Place **Network immediately below Workspace** in the workspace navigation.
- The Meshwork M logo toggles the left navigation between full and docked/collapsed states. It must preserve the active page and workspace state.
- Settings opens the existing ZCode Settings route. The workspace left pane is removed while Settings is open; **Back to workspace** restores the previous workspace view and sidebar state.
- Browser, Terminal and Devices controls use existing ZCode tool/dock components. Browser and Terminal retain independent visibility state and can remain open together.
- Keep existing projects, task/session, model, permission, automations, plugins and platform window-control behaviour.
- Network sharing, hotspot, relay and exit-node capabilities remain disabled until explicitly authorised.

## Architecture principles

1. **Local-first, permissioned nodes.** An install is a node identity and capability participant, not an automatically enabled public router. Sharing, exit-node, relay, hotspot and gateway modes are explicit opt-ins.
2. **Intent is not execution.** LLMs interpret goals and suggest options; typed validators, policy evaluators and deterministic adapters decide what can actually run.
3. **Separate control plane and data plane.** Discovery, quotes, membership, offers and policy are control-plane concerns. Forwarding, bonding, shaping, accounting and failover happen in local gateway/data-plane adapters.
4. **Honest aggregation.** Multi-WAN load balancing, traffic-class routing, failover, cross-node relay and single-flow bonding are distinct capabilities. Never claim single-download acceleration from simple load balancing.
5. **Least privilege.** Network mutation lives behind a narrow privileged helper. Never run model-generated shell commands with unrestricted sudo.
6. **Operator autonomy.** Providers set their own capacity, prices, schedules, caps and acceptable customers, subject to law, upstream ISP terms and marketplace rules.
7. **Auditable economics.** Quotes, payment status, usage, provider attribution, refunds, disputes and settlement are separate verifiable records.
8. **Reuse before reinvention.** Reuse ZCode, Linux networking primitives, established VPN/multipath projects and existing libraries after licensing, compatibility and security review.

## Get the app

The Meshwork web application lives in [`app/`](app). It is a self-contained Next.js 16 workspace
(Typescript, Tailwind CSS 4, shadcn/ui, Prisma + SQLite) that reproduces the approved ZCode
workspace behavior — tasks with thinking and tool traces, projects and task groups, browser/
terminal/devices dock, automations with run history, the plugin marketplace and the restored
ZCode settings incl. Model settings — plus the Meshwork connectivity network pages
(Connections with all five aggregation modes, Connection Marketplace, devices and nodes).

```bash
git clone https://github.com/payswapdotorg/MeshWork.git
cd MeshWork/app
./setup.sh          # or: bun install && cp .env.example .env && bun run db:push
bun run dev         # http://localhost:3000 — the workspace seeds itself on first run
```

See [`app/README.md`](app/README.md) for the full feature tour, scripts, structure and deployment notes.

## Start here

- [Current TL UI handoff](docs/TL_HANDOFF_DESIGN_REPRODUCTION.md)
- [TL implementation report — workspace UI reproduction](docs/IMPLEMENTATION_REPORT_UI_REPRODUCTION.md) (with evidence screenshots in `docs/evidence/`)
- [Interactive HTML design prototype](design/index.html)
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
- [x] Meshwork web application implemented in [`app/`](app) (ZCode workspace behavior restored: task traces, groups, automations, plugin marketplace, settings incl. Model settings; Meshwork Connections + Connection Marketplace per the approved references).
- [ ] Implement the network capability model and Linux node adapter.
- [ ] Demonstrate multi-WAN policy routing, failover, and true single-flow bonding independently.
- [ ] Implement node marketplace, metering, group buying and payment reconciliation.

**Important:** Repository documentation and the HTML design are prepared; this does not claim the ZCode fork, runtime integration, network data plane or live marketplace have been implemented.