# Research references for network and agent architecture

Research checked: 2026-10-31. These references guide implementation spikes; they are not a substitute for compatibility testing or legal review.

## Multi-WAN policy routing versus single-flow bonding

### Multipath TCP
- IETF RFC 8684 — TCP Extensions for Multipath Operation with Multiple Addresses: https://www.rfc-editor.org/rfc/rfc8684.html
- IETF datatracker record and errata: https://datatracker.ietf.org/doc/rfc8684/
- Linux kernel MPTCP documentation: https://docs.kernel.org/networking/mptcp.html

RFC 8684 describes MPTCP subflows, multiple addresses, connection-level sequence numbering, data reassembly and retransmission. Linux documents kernel and userspace path managers, address announcements, subflow management and packet schedulers.

Meshwork consequence: single-flow bonding requires a supported multipath transport or a split/relay design; it is not a switch on top of normal policy routing. Implement a Linux adapter spike using current kernel MPTCP endpoint/path-manager APIs and verify peer/relay compatibility, path scheduling, subflow creation and end-to-end goodput.

### OpenMPTCProuter
- Main repository: https://github.com/Ysurac/openmptcprouter
- Project wiki: https://github.com/Ysurac/openmptcprouter/wiki
- Official project overview: https://www.openmptcprouter.com/
- Technical overview: https://www.openmptcprouter.com/about
- WAN wizard documentation: https://github.com/openmptcprouter/openmptcprouter-feeds/blob/develop/luci-app-openmptcprouter/docs/wizard-guide.md

OpenMPTCProuter combines OpenWrt with a remote VPS endpoint and supports MPTCP-based aggregation/failover. Its published v0.64 release (2026-08-31) highlights MQVPN, a multipath-QUIC VPN, as the default VPN, additional MPTCP schedulers (weight, weighted round-robin and DSCP), per-path quality monitoring, subflow metrics, diagnostic tooling, and Layer 2/Layer 3 VXLAN modes. The project documents a VPS requirement and supports multiple WAN link types. The wizard describes WAN roles including MPTCP Master, Enabled, Backup and Disabled, plus speed measurements for QoS/SQM sizing.

Meshwork consequence: evaluate it as a proven reference for router+relay topology, path roles, scheduler controls, per-path metrics, health scoring and operational diagnosis. Avoid embedding its whole firmware distribution into the desktop app. First determine licence, kernel/firmware constraints, VPS operational economics and whether a Meshwork adapter can drive/observe it safely.

### Multi-WAN load balancing and failover
- OpenWrt mwan3 traditional documentation: https://openwrt.org/docs/guide-user/network/wan/multiwan/mwan3
- OpenWrt mwan3 nftables community port documentation: https://openwrt.org/docs/guide-user/network/wan/multiwan/mwan3-nft

mwan3 models WAN members, policies and traffic rules, with weighted per-connection distribution, failover and health monitoring. The traditional iptables documentation explicitly states that outbound load balancing is performed per IP connection, not single-connection channel bonding. It also documents version compatibility concerns: its traditional iptables path is not recommended on OpenWrt 25.12, while an nftables community port exists for 25.12+ and remains separately documented as community-tested.

Meshwork consequence: reuse the conceptual policy/member/rule model, but select a maintained firewall/routing backend per supported OpenWrt/Linux version. Do not treat old iptables rules or legacy mwan3 config as a universal cross-platform network controller.

## MeshLink reference applications
- MeshLink gateway installer and AP bridge: https://github.com/meshlinkfoundation/meshlink-wifi-gateway
- MeshLink broker: https://github.com/meshlinkfoundation/broker

See REFERENCE_REPOSITORY_REVIEW.md for the source audit and licensing boundary. Broker is MIT; gateway default-branch licence was not found at audit time.

## Runtime and deterministic-agent principles
- ZCode upstream: https://github.com/zai-org/ZCode
- ZCode dynamic-workflow package: https://github.com/zai-org/ZCode/tree/main/apps/zcode-cli/packages/dynamic-workflow
- ZCode dynamic-workflow runtime: https://github.com/zai-org/ZCode/tree/main/apps/zcode-cli/packages/dynamic-workflow-runtime

Use ZCode's typed workflow compiler/analysis and sandboxed execution driver pattern. Meshwork should model network operations as typed capabilities with JSON-schema validation, side-effect classes, approvals, idempotency, durable journal/replay and postcondition checks. The LLM may interpret intent and propose a plan; deterministic policy code validates constraints and chooses an executable plan.

## Research questions to resolve during M0–M6

1. Which OpenMPTCProuter components can be independently adapted rather than depending on a complete OpenWrt image?
2. What is the lowest operational-cost relay footprint for first single-flow bonding experiments?
3. How do MQVPN and MPTCP compare under asymmetric RTT, loss, metered links and NAT?
4. Which Linux distributions/kernels expose the required MPTCP features by default?
5. Which per-flow policy features can be delivered consistently on Windows and Linux without kernel drivers?
6. What provider/ISP approvals are required for paid hotspot and capacity resale in each launch jurisdiction?
7. Can gateway metering survive process restart, kernel counter reset and coordinator outage with acceptable reconciliation error?