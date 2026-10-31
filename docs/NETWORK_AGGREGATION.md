# Connection aggregation specification

## 1. Product rule

Users express the desired outcome; Meshwork chooses a technically feasible composition. The UI and planner must distinguish the following modes rather than using one ambiguous “combine connections” switch.

| Mode | What it does | What it does not guarantee |
|---|---|---|
| Multi-WAN load balancing | Distributes independent flows across uplinks | Does not accelerate a single TCP flow |
| Policy routing | Routes traffic by app, domain, destination, port, QoS class or task | Does not combine bandwidth within a single flow |
| Failover | Switches new/recoverable flows to a healthy alternate path | Existing sessions may reset unless the transport supports migration |
| Active-active redundancy | Uses multiple paths for availability and/or duplicate critical traffic | Does not imply additive throughput |
| Single-flow bonding | Splits/stripes one logical transfer over multiple paths using MPTCP, multipath QUIC or a tunnel/proxy designed for bonding | Requires compatible endpoints/relay and can be limited by remote relay, congestion, ordering and bottlenecks |
| Cross-node relay | Uses another permissioned node as an intermediate path or egress | A relay is not necessarily an additive WAN path |
| Provider pooling | Buys/coordinates upstream capacity from multiple providers | Pooling a bill or offer is not network-layer bonding |
| Group buying | Aggregates demand to obtain a better offer | Does not physically aggregate customer network paths |

The app must show the exact supported mode, tested capability, relay requirement, expected constraints and measured result. Never show combined speed as a fact based on summing plan rates.

## 2. Connection lifecycle

1. Discover local interfaces: Ethernet, Wi-Fi, cellular tether, USB modem, satellite/router uplink, VPN, remote gateway and supported virtual links.
2. Identify role: WAN, LAN, AP/guest, relay, tunnel, management or unknown.
3. Probe path: address/gateway, reachability, DNS, RTT, jitter, loss, observed bandwidth, MTU, route, data-cost/metering, carrier/provider and interface state.
4. Normalize observations: direction, units, timestamp, probe type, confidence, freshness and source.
5. Check owner permissions and provider terms. Do not assume the user has resale rights.
6. Build candidate plans for the user's objective.
7. Validate routing compatibility, path independence, relay reachability, tunnel support, link costs and security.
8. Apply policy through the adapter, observe real traffic, verify and journal.

Each observation has a TTL. Stale or missing telemetry must reduce confidence and cannot be silently treated as a current measured fact.

## 3. Typed user intent

Initial schema proposal (adapt names to repo conventions):

- objective: lowest_cost | lowest_latency | highest_throughput | single_flow_bonding | availability | coverage | privacy | community_access
- trafficScope: all_traffic | selected_apps | selected_destinations | single_transfer
- allowedPathIds, excludedPathIds
- maxSpend: integer minor amount, ISO currency, period (session/day/month)
- meteredDataLimitBytes
- minDownMbps, minUpMbps, maxLatencyMs, maxJitterMs, maxPacketLossPct
- requireEncryptedTunnel, requireNoThirdPartyExit
- allowRelay, allowCrossNodePaths, allowPaidPaths
- requireSingleFlowBonding
- deadlineAt
- failoverPolicy: none | new_flows | session_migration
- approvalMode: ask_each | ask_for_changes | preapproved_policy

Use integer minor currency units for monetary computation. Validate ISO currency and precision from the selected payment rail; do not rely on binary floating-point money calculations.

## 4. Candidate planning and scoring

Generate only plans that satisfy hard constraints:
- interface is present and healthy enough;
- path is not excluded;
- node/provider has a valid current capability advertisement;
- owner has granted the requested capability;
- offer/quote is valid for the requested period/volume;
- upstream provider policy permits the intended service;
- supported data-plane adapter can execute the requested mode;
- requested endpoint/relay is reachable;
- spend/data/usage ceilings can be enforced;
- policy does not bridge guest and management networks.

For surviving candidates, compute a deterministic score from the user's objective. Example weighted utility:

score = w_throughput * log(1 + predicted_throughput) - w_latency * latency - w_loss * loss - w_cost * expected_cost - w_risk * reliability_penalty

Weights and normalization must be versioned and visible in plan provenance. Hard safety constraints are not soft penalties. Use deterministic tie-breakers such as path priority, stable provider ID and policy version.

Evaluate counterfactuals:
- best single path;
- multi-WAN policy routing;
- single-flow bond (when compatible);
- failover-only configuration;
- no network change;
- alternative cost/latency choices.

Show why rejected options were rejected.

## 5. Feasibility and network science

For a set of independent WAN paths with capacities Cᵢ, sum(Cᵢ) is an upper bound on aggregate throughput in the ideal case—not a promise. Real throughput is limited by path loss, latency heterogeneity, tunnel overhead, relay egress, shared carrier backhaul, Wi-Fi airtime, NAT, server support, congestion control and protocol scheduling.

A single flow only benefits when the end-to-end transport supports multipath or a tunnel/proxy splits and reassembles the transfer. MPTCP requires compatible MPTCP endpoints or a proxy arrangement that terminates the path and forwards to a regular internet endpoint. Multipath QUIC similarly needs a compatible peer/relay. A generic WireGuard tunnel alone provides encryption/routing, not multipath striping.

Use Linux MPTCP as an adapter candidate, not a universal assumption. Investigate OpenMPTCProuter as a reference for OpenWrt plus remote VPS bonding. Preserve simpler policy-routing and failover for environments without MPTCP compatibility.

## 6. Traffic classes

Initial traffic class templates:
- Interactive realtime: calls, remote desktop, gaming; optimize latency, jitter and loss; avoid expensive relay unless needed.
- Interactive browsing: moderate bandwidth, low latency.
- Large upload/download: optimize throughput and/or cost; use single-flow bond only when end-to-end supported.
- Background transfer: lowest cost / off-peak scheduling.
- Privacy-sensitive: encrypted route, approved exit only; show exit operator and jurisdiction where known.
- Critical continuity: failover first; optionally duplicate low-volume traffic where protocol supports safe duplication.

Users can set app, domain, process, destination, port, subnet or task-level rules subject to OS capability and privacy constraints. App-level discovery on desktop platforms can be limited; planner must advertise that honestly.

## 7. Bonding session

A BondingSession requires:
- selected path IDs and endpoint identities;
- chosen protocol/adapter version;
- relay endpoint and its capacity/region/cost;
- encryption and peer-authentication mode;
- congestion/path scheduler;
- health thresholds;
- session start/expiry and byte counters;
- per-path subflow observations;
- failure and rejoin state;
- actual throughput and end-to-end verification.

Acceptance requires evidence that one logical transfer created or used multiple subflows/paths and that measured throughput/quality changed as expected. Merely observing packets across two interfaces from different flows is not a bonding test.

## 8. Offer and provider capacity

A provider advertises a capacity envelope, not a raw ISP bill:
- link/path type;
- measured rate range and confidence;
- geographic/coverage scope;
- latency/loss distribution and recent uptime;
- metered/unmetered status and data budget;
- schedule/availability;
- price model;
- max concurrent users;
- max sold capacity and reserved headroom;
- guest isolation and access method;
- permitted service/ISP authorization status;
- capability and firmware versions.

A provider can withdraw an offer; existing paid entitlements follow the offer's cancellation/refund policy.

## 9. Aggregation test matrix

Required tests:
- Three WANs with independent routes; verify flow distribution and policy constraints.
- Same three WANs behind a shared upstream bottleneck; ensure planner recognizes lack of independent capacity.
- Fail WAN 1; verify new-flow re-routing and report effects on existing sessions.
- Recover WAN 1; verify hysteresis avoids route flapping.
- Single large file transfer on two links with MPTCP/relay enabled; verify both subflows and compare against best single link.
- Same test without remote/compatible peer; bonding plan must be rejected.
- Unequal latency links and reordering; verify transport recovery and actual goodput.
- Metered link cap reached; ensure it is removed from eligible candidates.
- Cost cap reached while transfer running; pause or ask for approval before further spend.
- Relay outage; session recovers or falls back according to approved policy.
- Link telemetry stale; no unverified active/healthy status.
- Provider revokes capacity; existing grants and refunds follow explicit state transitions.
- Restart gateway and coordinator; restore durable state without granting expired access.

All speed figures in design mockups are illustrative; production UI must bind to live typed observations and label advertised versus measured rates.