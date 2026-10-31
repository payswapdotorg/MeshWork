# MeshLink reference repository review

Audit date: 2026-10-31. Reviewed the public default-branch source, tree, README/roadmap, installer, broker routes, network manager, service profiles, schemas and recent commits. This is a source-based architectural review, not an independent penetration test or a claim that the projects were built/run in this environment.

## Executive conclusion

The repositories provide a useful working reference for one operator-controlled Linux hotspot node:

- meshlink-wifi-gateway provisions a Raspberry Pi/Linux guest Wi-Fi network, DHCP/DNS, captive-portal redirection, firewall gating, NAT, systemd services and optional HaLow bridge attachment.
- broker is the local application/control-plane service for portal presentation, customer access tiers, checkout, access-session persistence, operator dashboard, bandwidth shaping/accounting and service profiles.

They are complementary layers, not a complete distributed mesh or multi-WAN bonding solution. Meshwork should reuse the domain model and UX ideas, and isolate a replaceable Linux gateway adapter behind its own capability contract. Do not simply embed both repositories into the desktop application.

## Repository A — meshlink-wifi-gateway

Source: https://github.com/meshlinkfoundation/meshlink-wifi-gateway  
Reviewed main commit: b906e94a8605d72b4d0470b5f2b1cb8f813c2fdc (2026-10-30)

### What it actually does

The install script (888 lines at the reviewed revision) configures a Raspberry Pi 5 / Debian 13 Trixie system with:
- hostapd access point and dnsmasq DHCP/DNS;
- a guest bridge, default guest isolation and Linux IP forwarding;
- captive portal HTTP redirect plus optional HTTPS for the portal hostname;
- iptables/ipset allow-list gating;
- NAT/masquerading through one configured WAN interface;
- systemd boot persistence and a broker systemd service;
- an optional HaLow USB Ethernet adapter attached to the guest bridge;
- Node.js installation and broker build/install steps.

Defaults in the installer are WLAN_IFACE=wlan0, WAN_IFACE=eth0, guest bridge br-guest and HaLow interface eth1. The HaLow adapter is attached to the guest bridge in the examined field setup. It is not configured as a second upstream WAN link. NAT points at the single configured WAN interface.

The README is explicit about the Ethernet-backhaul assumption on first installation. The installer checks that the AP radio advertises AP mode support and offers AP interface, WAN interface, security mode, portal hostname and TLS certificate/key options.

### Reusable ideas

- Separate guest bridge, WAN interface and AP interface.
- Default-deny guest forwarding with explicit authorization.
- Keep captive portal interception narrowly scoped; do not hijack arbitrary internet TLS or device connectivity-check hosts.
- Treat boot/service lifecycle as part of gateway correctness.
- Validate hardware/driver AP-mode capability before promising hotspot support.
- Expose a clear installer report and health checks.

### Risks and gaps before adapting

1. **Single WAN only.** No multi-WAN routing table, path manager, bonding tunnel, relay pool, flow scheduler or upstream path-health optimizer is implemented by the examined installer.
2. **Broad firewall mutation.** The installer flushes existing FORWARD and NAT chains before rebuilding its rules. That is unsafe as a generic operation on a host with existing firewall policy, VPNs, containers or custom routing. Meshwork must use namespaced chains and preserve unrelated rules; changes need dry-run, backup and rollback.
3. **Privileged surface.** The installer writes a sudoers rule granting the broker user passwordless invocation of iptables, ipset, iptables-save/restore and tc. This is a large authority surface. Meshwork must use a dedicated helper with a constrained typed command API and validate every argument at the privileged boundary.
4. **Fixed network assumptions.** Static guest bridge addressing, default interface names, regulatory-domain defaults and US-specific comments cannot be promoted to a globally safe configuration. Use OS/hardware discovery, country/regulatory settings from the operator, conflict detection and an explicit topology preview.
5. **NetworkManager coexistence.** The installer coordinates NetworkManager, hostapd, dnsmasq and systemd. Meshwork must verify current owner/state of each interface and refuse unsafe takeover rather than silently breaking an existing network.
6. **License unresolved.** No LICENSE file was found at the reviewed default-branch root. Do not copy or modify its source until the repository owner clarifies the applicable licence. Architecture and observed behaviour can inform Meshwork; code reuse is a separate legal decision.
7. **Roadmap drift.** ROADMAP.md at the reviewed revision lists speed shaping, data tracking and Stripe as upcoming, while the current broker already contains code for per-client shaping/accounting and Stripe checkout. Treat source as more authoritative than stale roadmap statements and update docs as part of future upstream sync.

## Repository B — broker

Source: https://github.com/meshlinkfoundation/broker  
Reviewed main commit: bdec91608ce380119748927d83f0842db7e14db7 (2026-10-30)  
Licence: MIT (LICENSE present)

### What it actually does

A TypeScript/Express local service with React/Vite portal and operator dashboard. Its package is currently named rest-express, Node >=20, Express 4, better-sqlite3, Stripe, viem, Zod, React 18 and Drizzle.

Notable modules:
- server/routes.ts: public portal routes, payment checkout/completion, access/session APIs, health and admin routes.
- server/network-manager.ts: local Linux firewall, IP-set authorization, traffic control and usage accounting.
- server/service-profiles.ts: Zod-validated offer profiles and profile activation.
- server/sqlite-storage.ts: local SQLite persistence.
- shared/schema.ts: access session, user, package, transaction and related schema definitions.
- server/index.ts: HTTP listener on the local node plus optional portal HTTPS listener.

The broker uses Stripe Checkout. It grants short temporary access to reach checkout, verifies the completed Checkout Session server-side (paid status, requested tier, customer reference, amount and currency), then creates an access session and applies the kernel policy. It also includes a returning-device restoration path and payment-reference idempotency handling.

The Linux NetworkManager module is the fast-path adapter for the local gateway:
- ipset authorizes client IPs with kernel-managed expiry;
- tc HTB classes and ingress policing apply per-client speed limits;
- iptables byte counters are sampled to estimate client upload/download usage;
- it has a non-Linux/dev simulation path.

The 2026-10-27 commit 107df8a570639db59b27ca7385cb66466ade585c removed an 80 Mbps enforcement floor and added actual ingress policing so advertised tier speeds are enforced up and down. The free-tier example was raised to 5 Mbps each way. This is useful evidence that tier UX must be tied to measured enforcement, not merely labels.

### Reusable ideas

- Service profiles as validated operator-owned data, separate from privileged runtime settings.
- Access session fields: opaque session ID, user/device identifier, tier, payment reference, start/expiry, data cap, used bytes, speed cap, status and node operator.
- Payment verified on the server before access is granted.
- Idempotent payment-to-session mapping.
- Kernel handles expiry and packet shaping; application handles policy and commerce.
- Free and paid service tiers can share the same access enforcement pipeline.
- Per-client and node-level usage, session and revenue telemetry belongs in operator views.

### Risks and gaps before adapting

1. **Admin token lifetime.** The reviewed admin token is an HMAC token over a static payload and the configured admin password. The visible token has no expiry or issued-at claim. Meshwork should use short-lived signed sessions with rotation/revocation and explicit device/operator identity.
2. **Credential model.** Admin login compares against local configured password material. Meshwork should store a strong password hash or use OS-backed/local account credentials; never expose reusable passwords to task context or logs.
3. **Session identity.** Device identifiers and client IP are distinct concepts. A client-provided userIdentifier or browser-held identifier is not proof of device ownership. Bind access restoration to an opaque, revocable credential and enforce node/network context.
4. **Public endpoints.** Captive portal checkout/completion and user session endpoints must remain reachable for unauthenticated customers, but need strict Zod validation, rate limits, anti-replay, payment binding, abuse controls and a clear exposure matrix. Public does not mean trusted.
5. **Network Manager implementation.** The current module builds shell command strings and executes through sudo. Interface/IP checks reduce risk but do not provide a sufficient privilege boundary for a general-purpose desktop agent. Replace with typed IPC to a constrained helper. Do not permit arbitrary command strings.
6. **IP-derived tc class IDs.** Class identifiers are derived from the last IPv4 octet. That can collide across overlapping/subnet-expanded designs and is unsuitable as a general identity model. Meshwork should allocate stable policy class IDs from its own allocator and use explicit address/subnet-aware classifiers.
7. **Counter accuracy.** iptables counters are sampled and accumulated in process memory. Counter resets/reboots, rule recreation and process restart can produce gaps/double counting. Persist monotonic counter snapshots with boot/interface identity and reconcile them; use a more precise accounting source where requirements justify it.
8. **Data-limit enforcement.** The schema contains data limits and the service tracks usage, but verify current enforcement end-to-end before treating it as hard quota enforcement. Add fault tests that cross the quota at a packet boundary and after process reboot.
9. **Payment lifecycle.** Client-return verification works for a node behind NAT but is not a complete financial ledger. Add central payment-event reconciliation where feasible, signed provider events, durable idempotency keys, dispute/refund states and a recovery job. Never grant access from a browser redirect alone.
10. **Operational hardening.** Verify rate limiting, CORS/CSRF policy, request-size bounds, secret redaction, audit logging and TLS trust behavior for the exact deployment profile. This review did not run an independent penetration test.

## Architectural mapping into Meshwork

| MeshLink concept | Meshwork destination |
|---|---|
| AP, guest bridge, WAN interface | Network topology and gateway adapters |
| Captive portal | Access purchase UX, exposed by a node offer |
| Service profile / bandwidth tier | Typed service offer and capability contract |
| Access session | Entitlement and access grant |
| ipset/tc/iptables | Local Linux data-plane adapter |
| SQLite node state | Local durable journal/cache; central coordinator has its own authority and records |
| Stripe Checkout | Pluggable payment connector and payment reconciliation |
| Operator dashboard | Meshwork Connections / My Nodes surfaces |
| HaLow guest bridge | L2/L3 backhaul or guest coverage extension; not assumed to aggregate WAN bandwidth |

## Decision

Reuse the **ideas and validated domain patterns** now. Consider direct MIT broker code adaptation later, after inspecting the full code/tests and isolating business logic from OS privilege. Do not copy gateway code until its licence is established. Neither repository is a multi-WAN/bonding implementation; OpenMPTCProuter and Linux MPTCP should be evaluated as the next technical references.

## Primary source links

- Gateway README: https://github.com/meshlinkfoundation/meshlink-wifi-gateway
- Gateway installer: https://github.com/meshlinkfoundation/meshlink-wifi-gateway/blob/main/install.sh
- Gateway guest bridge script: https://github.com/meshlinkfoundation/meshlink-wifi-gateway/blob/main/scripts/meshlink-guest-up.sh
- Gateway roadmap: https://github.com/meshlinkfoundation/meshlink-wifi-gateway/blob/main/ROADMAP.md
- Broker routes: https://github.com/meshlinkfoundation/broker/blob/main/server/routes.ts
- Broker network manager: https://github.com/meshlinkfoundation/broker/blob/main/server/network-manager.ts
- Broker service profiles: https://github.com/meshlinkfoundation/broker/blob/main/server/service-profiles.ts
- Broker schema: https://github.com/meshlinkfoundation/broker/blob/main/shared/schema.ts
- Broker access-management reference: https://github.com/meshlinkfoundation/broker/blob/main/ACCESS_MANAGEMENT.md
- Broker MIT licence: https://github.com/meshlinkfoundation/broker/blob/main/LICENSE