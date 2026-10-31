# Meshwork security and permission model

## 1. Default-deny product posture

A Meshwork installation is not an internet-sharing router by default. It is a local endpoint/node identity with capabilities discovered and advertised privately to the owner.

These activities require separate, explicit consent:
- enabling Wi-Fi access point or guest bridge;
- routing/forwarding traffic for other devices;
- serving as an exit node or relay;
- offering local WAN capacity for sale;
- making a metered connection available to other nodes;
- participating in a multipath bonding endpoint;
- accepting group-purchase commitments or recurring payments.

Consent is recorded per device, capability, network/interface, scope, limits, schedule, price and expiry. Revocation must immediately block new sessions and trigger orderly termination/reconciliation for active sessions.

## 2. Capability grants

A grant binds:
- owner/operator identity;
- node/device identity and public-key fingerprint;
- capability ID and schema/version;
- interface/path/resource scope;
- direction and traffic scope;
- rate/data/concurrency limits;
- spend/price/revenue policy;
- schedule and expiry;
- permitted regions/peer classes where applicable;
- revocation generation and issuer signature.

Never infer authority from a model response, natural-language request, marketplace listing or successful UI action. The authorization service validates every privileged operation independently.

## 3. Local privileged helper

All firewall, routing, qdisc, bridge, AP and VPN mutations go through a narrow local helper:
- renderer and agent workflow cannot call sudo directly;
- helper exposes typed RPC methods, not generic exec(command);
- validate interface names, routes, IP prefixes, table IDs, MTU, rate units and all policy parameters again inside the privileged process;
- allow only managed interface/rule namespace;
- never flush global firewall chains or destroy unrelated routes;
- stage configuration, validate, atomically apply, verify and retain a rollback generation;
- privileged audit entries record actor, approved capability grant, requested diff, effective diff and result;
- separate management, guest and WAN planes;
- fail closed where a safe rollback cannot be guaranteed.

The MeshLink installer’s broad firewall flush and passwordless sudo command allowlist are not acceptable as a generic Meshwork desktop integration pattern.

## 4. Network isolation

- Guest clients must not reach host management services, local user workspaces, LAN devices or another guest by default.
- Management plane is bound to explicit trusted interfaces/addresses or an authenticated overlay.
- Do not expose SSH, RDP, local ZCode APIs or admin dashboards to guest Wi-Fi.
- Use guest isolation and explicit egress firewall policy.
- IPv6 must be configured and tested, not silently disabled or accidentally left open. Prevent IPv6 bypass of IPv4 access policy.
- DNS, captive portal and local network exceptions are explicit allowlists.
- Do not intercept arbitrary HTTPS; captive portal redirects must be narrow and tested on Android/iOS/Windows/macOS.
- Encrypted tunnels authenticate both peer identity and expected endpoint.

## 5. Node and control plane security

- Node identities use hardware-backed keys where practical, otherwise OS-protected keys.
- Join flow uses an expiring one-time enrollment challenge and operator confirmation.
- Heartbeats and capability advertisements are signed and freshness-checked.
- Marketplace listings are not authorization; the local node validates a signed access grant before opening traffic.
- Relay access is scoped to a session/traffic quota and expires.
- Revoke a stolen/lost node by key revocation and grant invalidation.
- Do not store raw Wi-Fi PSKs, provider account credentials or payment secrets in task transcripts or logs.
- Encrypt local databases/backups that contain personal identifiers, entitlements or payment references.
- Keep data minimization: publish coarse availability/capacity regions rather than exact home location unless necessary and consented.

## 6. Payments and marketplace trust

- Never ask users to type card numbers into a captive portal served over plain HTTP. Redirect to the payment processor’s trusted hosted checkout.
- Grant limited pre-checkout access only to the payment host and required portal endpoints.
- Verify payment server-side; validate expected product/offer/version, account reference, amount and currency.
- Persist idempotency keys and payment events; client redirect is not proof of payment.
- Separate authorization, capture, settlement, refund and dispute states.
- Quote locks, offer expiry, payment expiry, access entitlement and network session expiry are separate.
- Meter usage at the gateway; reconcile periodic snapshots and counter resets.
- Provider payout and customer chargeback decisions need immutable event trails.
- Show fee breakdown and who receives payment before purchase/commit.
- Group-buy funds must not be released before stated threshold, provider offer and cancellation/refund rules have been met.
- Use signed provider events/webhooks where connectivity permits and a polling/reconciliation path when nodes are behind NAT.

## 7. ISP and legal permissions

Do not market or activate resale based only on a user's possession of internet access. The product must ask the provider/operator to confirm that their plan permits the intended sharing/resale/hotspot service, retain evidence of that confirmation where appropriate, and disable public sales when authorization is missing or expired.

Rules vary by country, ISP, product and service model. Public resale, WISP operation, hotspot authorisation, spectrum use, tax, consumer terms, lawful intercept and data-retention obligations require jurisdiction-specific review. Ghana deployment needs current NCA/regulatory advice and ISP contract review before public commercial operation.

## 8. Threat model and acceptance tests

Threats:
- malicious guest client attempts lateral movement or attacks the host;
- compromised model proposes route/firewall changes outside approval;
- compromised node advertises fake capacity or false usage;
- malicious provider sells non-existent/unavailable bandwidth;
- client replays or steals an access token;
- provider/consumer disputes metering or price;
- tunnel/relay operator observes user metadata;
- local privileged helper accepts arbitrary or forged IPC;
- stale grants survive node revocation or account cancellation.

Required tests:
- guest cannot reach management subnet/services via IPv4 or IPv6;
- renderer cannot invoke arbitrary shell or privileged commands;
- invalid/stale/incorrectly signed capability grants are rejected;
- duplicate payment event creates one entitlement;
- payment redirect without paid status never grants access;
- helper rejects interface, route, subnet, rate and table injection inputs;
- config apply failure restores prior known-safe generation;
- node revoked while online loses access immediately; offline node uses short-lived grants and expires safely;
- expired quote/entitlement is not extended by retry/replay;
- metering survives restart and flags counter reset;
- sharing mode stays off after install, upgrade and restore unless explicit persisted consent is valid.

## 9. Privacy boundaries

Browser/agent context should reveal the minimum needed to complete the request. Exact location, SSID/BSSID, public IP, Wi-Fi identifiers and other link-layer details are sensitive metadata. Use coarse locations for discovery by default and ask before sharing exact location with providers or community peers. Do not include user workspace files, prompts or browsing history in node advertisements.