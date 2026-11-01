import type {
  AggregationModeVM,
  MarketplaceListingVM,
  NetworkPathVM,
  NodePermissionVM,
  NodeVM,
  PoolVM,
} from "./types";

/**
 * Meshwork domain data.
 *
 * Path inventory, listings, nodes and pools reproduce the approved design
 * references (accepted dark Meshwork design + Figma frame 8:36). All rates are
 * ADVERTISED plan figures, never measured throughput — the UI labels them as
 * such. Production must bind these slots to live typed observations.
 */

export const MESH_MODELS = [
  { id: "glm-5.3-flash", name: "GLM 5.3 Flash" },
  { id: "glm-5.3-max", name: "GLM 5.3 Max" },
  { id: "glm-5.2-air", name: "GLM 5.2 Air" },
] as const;

export const DEFAULT_MODEL = "glm-5.3-max";

export const PERMISSION_MODES = [
  { id: "ask", name: "Ask before actions", note: "Nothing network-related changes until you approve it." },
  { id: "safe", name: "Auto-run safe commands", note: "Read-only diagnostics run automatically; changes still need approval." },
  { id: "full", name: "Approval required for network changes", note: "Workspace actions run; network mutations always require explicit approval." },
] as const;

export const QUICK_ACTIONS = [
  {
    id: "aggregate",
    icon: "waypoints",
    title: "Aggregate my connections",
    subtitle: "Fibre + 5G + Starlink",
    prompt:
      "Combine home fibre, 5G and Starlink for the best connection. Show me what each aggregation mode can actually achieve before changing anything.",
  },
  {
    id: "find-better",
    icon: "radar",
    title: "Find better internet",
    subtitle: "Compare providers and coverage",
    prompt:
      "Find better internet: compare available providers and coverage at my location, including community and marketplace offers.",
  },
  {
    id: "group-buy",
    icon: "arrow-left-right",
    title: "Organize a group buy",
    subtitle: "Pool demand in my community",
    prompt:
      "Organize a group buy: pool demand in my community to negotiate a better upstream connection, and show the terms members must accept.",
  },
] as const;

export const DESIGN_PATHS: NetworkPathVM[] = [
  {
    id: "home-fibre",
    name: "Home fibre",
    interface: "Ethernet · WAN 1 · Primary",
    downMbps: 300,
    upMbps: 100,
    rateProvenance: "advertised",
    metered: false,
    health: "healthy",
    observation: { rttMs: 12, lossPct: 0.1, freshness: "8 sec ago", source: "probed" },
  },
  {
    id: "5g-hotspot",
    name: "5G hotspot",
    interface: "USB tether · WAN 2 · Backup",
    downMbps: 150,
    upMbps: 30,
    rateProvenance: "advertised",
    metered: true,
    health: "healthy",
    observation: { rttMs: 31, lossPct: 0.8, freshness: "8 sec ago", source: "probed" },
  },
  {
    id: "starlink",
    name: "Starlink",
    interface: "Ethernet · WAN 3 · Satellite",
    downMbps: 220,
    upMbps: 25,
    rateProvenance: "advertised",
    metered: false,
    health: "healthy",
    observation: { rttMs: 58, lossPct: 0.4, freshness: "8 sec ago", source: "probed" },
  },
];

export const AGGREGATION_MODES: AggregationModeVM[] = [
  {
    id: "single",
    name: "Single path",
    summary: "Route everything over one selected link.",
    status: "available",
    explanation:
      "All traffic uses the primary path. Simple and predictable — no aggregation claims, no extra moving parts. Other links stay idle as backup inventory.",
  },
  {
    id: "load-balance",
    name: "Load balance",
    summary: "Spread separate flows across available links.",
    status: "active",
    explanation:
      "Multi-WAN load balancing distributes independent flows across uplinks. It does not accelerate a single TCP flow — one download still uses one path.",
  },
  {
    id: "bond",
    name: "Bond",
    summary: "One transfer stripes across paths via multipath transport.",
    status: "not-configured",
    explanation:
      "Single-flow bonding splits one logical transfer over multiple paths using MPTCP, multipath QUIC or a bonding tunnel. It requires a compatible remote endpoint or relay — not configured on this node yet.",
  },
  {
    id: "failover",
    name: "Failover",
    summary: "Move new flows when a path degrades.",
    status: "available",
    explanation:
      "New and recoverable flows move to a healthy alternate when configured health thresholds are breached. Existing sessions may reset unless the transport supports migration.",
  },
  {
    id: "redundancy",
    name: "Redundancy",
    summary: "Replicate critical traffic across paths.",
    status: "available",
    explanation:
      "Active-active redundancy uses multiple paths for availability and can duplicate selected critical traffic. It does not add throughput and consumes extra bandwidth on every duplicated link.",
  },
];

export const MARKETPLACE_LISTINGS: MarketplaceListingVM[] = [
  {
    id: "community-fibre",
    name: "Community fibre",
    provider: "Community ISP · Fixed access",
    badge: "Verified operator",
    downMbps: 100,
    priceBasis: "Monthly / shared",
    iconTone: "blue",
    description: "Community-operated fixed access with a verified operator and shared upstream capacity.",
  },
  {
    id: "5g-backup",
    name: "5G backup link",
    provider: "Local mobile operator",
    badge: "Coverage varies",
    downMbps: 80,
    priceBasis: "Metered / daily",
    iconTone: "green",
    description: "Mobile backup capacity from a local operator. Metered daily allowance; coverage varies by site.",
  },
  {
    id: "venue-wifi",
    name: "Venue Wi-Fi",
    provider: "Market / coworking hotspot",
    badge: "Guest network",
    downMbps: 25,
    priceBasis: "Day pass / hourly",
    iconTone: "grey",
    description: "Guest-network access at a market or coworking venue. Day pass or hourly billing.",
  },
];

export const MARKETPLACE_NOTE =
  "Illustrative listings and figures for layout only. Live offers must come from verified provider advertisements and fresh node telemetry.";

export const EAST_LEGON_POOL: PoolVM = {
  id: "east-legon",
  name: "Community fibre for East Legon",
  subtitle: "Neighbourhood demand pool · Example only",
  state: "OPEN",
  members: 23,
  target: 50,
  pct: 46,
  note: "A pool gathers demand to negotiate a bulk connection. It is not the same as bonding several internet paths.",
  targetPrice: "Quote pending",
  deadline: "Shown before joining",
  billing: "Only after threshold + terms",
};

export const DESIGN_NODES: NodeVM[] = [
  {
    id: "this-device",
    name: "This device",
    subtitle: "Desktop endpoint · Local identity",
    online: true,
    capabilities: ["Agent workspace", "Path diagnostics"],
    note: "Sharing is off. This device is not acting as a gateway, public relay or exit node.",
  },
  {
    id: "rpi-gateway",
    name: "Raspberry Pi gateway",
    subtitle: "MeshLink reference node · Not enrolled",
    online: false,
    capabilities: ["Hotspot capable", "Guest network"],
    note: "A gateway can expose a captive portal and a managed guest network, subject to local permissions and ISP terms.",
  },
];

export const NODE_PERMISSIONS: NodePermissionVM[] = [
  { id: "hotspot", label: "Hotspot / guest access", state: "Off", enabled: false },
  { id: "relay", label: "Relay / exit traffic", state: "Off", enabled: false },
  { id: "sell", label: "Sell spare capacity", state: "Off", enabled: false },
  { id: "multipath", label: "Multipath endpoint", state: "Not configured", enabled: false },
];

export const NODE_PERMISSION_NOTE =
  "Separate grants for separate activities. Installing the application does not enable sharing.";

export const SHARING_ENVELOPE = [
  { label: "Max capacity offered", value: "20% of measured available bandwidth" },
  { label: "Data allowance", value: "20 GB per day" },
  { label: "Availability", value: "08:00–20:00 · editable schedule" },
  { label: "Client isolation", value: "Guest network only" },
] as const;

export const PUBLISH_REQUIREMENTS = [
  { label: "Owner consent", note: "Explicit grant for this node and uplink.", state: "REQUIRED" },
  { label: "ISP authorisation", note: "Evidence that resale or hotspot service is permitted.", state: "REQUIRED" },
  { label: "Guest isolation", note: "No access to your management LAN or devices.", state: "REQUIRED" },
  { label: "Metering and price", note: "Limits, price and reconciliation.", state: "REQUIRED" },
] as const;

export const SEED_PROJECTS = [
  { key: "field-operations", name: "Field operations" },
  { key: "growth-sales", name: "Growth & sales" },
  { key: "personal", name: "Personal" },
] as const;

/** Seed tasks of the approved new-task concept sidebar (relative ages included). */
export const SEED_TASKS = [
  {
    projectKey: "field-operations",
    name: "Prepare site connectivity plan",
    status: "in_progress",
    prompt: "Prepare the connectivity plan for the new site: available uplinks, failover order and rollout steps.",
    ageMinutes: 12,
    pinned: true,
    unread: false,
    groupKey: "site-rollouts",
  },
  {
    projectKey: "personal",
    name: "Compare mobile data bundles",
    status: "completed",
    prompt: "Compare mobile data bundles that fit my usage and budget, including community offers.",
    ageMinutes: 60,
    pinned: false,
    unread: false,
    groupKey: null,
  },
  {
    projectKey: "growth-sales",
    name: "Weekly customer research",
    status: "completed",
    prompt: "Run the weekly customer research summary: interviews, churn signals and follow-ups.",
    ageMinutes: 60 * 24,
    pinned: false,
    unread: true,
    groupKey: "research",
  },
] as const;

/** Seed task groups (zcode "By group" sidebar view). */
export const SEED_TASK_GROUPS = [
  { key: "site-rollouts", title: "Site rollouts", color: "blue", position: 0 },
  { key: "research", title: "Research", color: "green", position: 1 },
] as const;

/**
 * Seed conversation traces for the concept tasks — zcode conversation rows:
 * user bubbles, reasoning (thinking trace), tool calls and assistant text.
 * `offsetMinutes` is relative to the task's creation time.
 */
export const SEED_TASK_TRACES: Record<
  string,
  Array<{
    kind: "user" | "assistant" | "reasoning" | "tool" | "marker" | "error";
    text?: string;
    payload?: Record<string, unknown>;
    durationMs?: number;
    status?: string;
    offsetMinutes?: number;
  }>
> = {
  "Prepare site connectivity plan": [
    {
      kind: "user",
      text: "Prepare the connectivity plan for the new site: available uplinks, failover order and rollout steps.",
    },
    {
      kind: "reasoning",
      text: "The user needs a connectivity plan for a new site. I should first inspect what we already know about this site in the workspace, then check the local node's interfaces and available uplinks before proposing a failover order. A good plan needs measured latency, not just advertised rates, so I'll probe the paths after inventory.",
      durationMs: 14000,
    },
    {
      kind: "tool",
      payload: {
        tool: "search",
        primary: "site connectivity",
        secondary: "workspace",
        status: "completed",
        args: "query: site connectivity · scope: workspace",
        output: "docs/site-brief.md\ndocs/network-notes/rollout-template.md\n2 files matched.",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "read",
        primary: "site-brief.md",
        secondary: "docs/site-brief.md",
        status: "completed",
        output: "New site: Tema community office. 40 staff, hybrid work. Requires: video calls, cloud POS backup link, weekly offsite backup upload (~180 GB). Existing coverage: one FTTH provider quoted 300/100 Mbps; no SLA. Two mobile operators report 5G coverage at good level.",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "terminal",
        primary: "network status --probe",
        secondary: "meshwork@node · session 01",
        status: "completed",
        output:
          "fibre0   online   300/100 Mbps   rtt 12 ms   loss 0.1%\nwlan0    online   150/30  Mbps   rtt 31 ms   loss 0.8%   (metered)\nsatellite0  online 220/25  Mbps   rtt 58 ms   loss 0.4%",
      },
    },
    {
      kind: "reasoning",
      text: "Path inventory checks out. The FTTH quote is the obvious primary. For failover I'd rank 5G before satellite on latency and cost per GB, but the weekly 180 GB offsite upload makes satellite attractive as a scheduled bulk path — 25 Mbps uplink can move ~11 GB/hour overnight without touching the metered 5G allowance. I'll propose primary/backup plus a scheduled bulk transfer window, and an explicit aggregation stance: single-path with failover, no bonding claims until a relay is available.",
      durationMs: 21000,
    },
    {
      kind: "tool",
      payload: {
        tool: "todo",
        primary: "Connectivity plan checklist",
        status: "completed",
        output: "☐ Uplink inventory (done)\n☐ Failover order (drafting)\n☐ Rollout steps (drafting)\n☐ Cost envelope (pending)",
      },
    },
    {
      kind: "assistant",
      text: "## Connectivity plan — Tema community office\n\n**Uplink inventory (measured from this node):**\n\n| Path | Rate (advertised) | RTT | Loss | Role |\n| --- | --- | --- | --- | --- |\n| FTTH (fibre0) | 300 / 100 Mbps | 12 ms | 0.1% | Primary — all interactive traffic |\n| 5G (wlan0) | 150 / 30 Mbps | 31 ms | 0.8% | Backup — takes over within seconds |\n| Satellite (satellite0) | 220 / 25 Mbps | 58 ms | 0.4% | Bulk — scheduled overnight uploads |\n\n**Failover order:** fibre0 → wlan0 → satellite0, with connection-health probing every 30 s and a 3-strike demotion rule.\n\n**Rollout steps:**\n1. Order the FTH circuit; confirm install date and the /29 if POS equipment needs static addresses.\n2. Keep the existing 5G CPE as warm backup — SIM with a 50 GB monthly cap, alerts at 80%.\n3. Schedule the weekly 180 GB backup for Saturday 01:00–18:00 over the satellite path (metering-safe).\n4. Enable diagnostics-only telemetry for the first 30 days, then review the numbers together.\n\n**Aggregation stance:** single path with failover for now — bonding needs a compatible relay endpoint and we won't claim combined throughput we haven't measured. Say the word and I'll draft the provider emails next.",
    },
  ],
  "Compare mobile data bundles": [
    {
      kind: "user",
      text: "Compare mobile data bundles that fit my usage and budget, including community offers.",
    },
    {
      kind: "reasoning",
      text: "I need the user's actual usage pattern before comparing bundles. The workspace has a recent data-usage export, so I'll read that first, then pull current bundle pricing from the operator pages and the community marketplace listings.",
      durationMs: 9000,
    },
    {
      kind: "tool",
      payload: {
        tool: "read",
        primary: "data-usage-export.csv",
        secondary: "personal/exports/data-usage-export.csv",
        status: "completed",
        output: "Last 3 months: avg 14.2 GB/mo mobile data, peak month 19 GB. Top apps: video calls 41%, maps 22%, streaming 18%. Wi-Fi offload available at the workshop.",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "webFetch",
        primary: "operator bundle pages",
        secondary: "3 providers · current pricing",
        status: "completed",
        output: "Operator A: 15 GB @ ₵85/mo · 25 GB @ ₵120/mo\nOperator B: 12 GB @ ₵70/mo · 30 GB @ ₵135/mo (5G where covered)\nOperator C: 18 GB @ ₵95/mo + ₵0.10/GB overage",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "search",
        primary: "community data bundles",
        secondary: "meshwork marketplace",
        status: "completed",
        output: "1 pooled community bundle: 4 members sharing 60 GB @ ₵300/mo total — needs group commitment by Friday.",
      },
    },
    {
      kind: "assistant",
      text: "Here's how the bundles land against your ~15 GB/month usage (peak 19 GB):\n\n| Bundle | Price | Fits? | Notes |\n| --- | --- | --- | --- |\n| Operator A · 15 GB | ₵85/mo | Tight | One peak month goes over |\n| Operator A · 25 GB | ₵120/mo | Yes | Priced per GB worse than B |\n| Operator B · 30 GB | ₵135/mo | Yes | 5G where covered, best overage terms |\n| Operator C · 18 GB | ₵95/mo | Tight | ₵0.10/GB overage is cheap insurance |\n| Community pool · 60 GB shared | ₵75/mo your share | Yes | Needs 4 members; Friday deadline |\n\n**Recommendation:** Operator C 18 GB as the safe solo option — the cheap overage covers peak months for about ₵1–2. If you can commit to the community pool by Friday, the shared 60 GB is the best value and matches your video-call-heavy mix.\n\nNothing has been purchased — purchases always need your explicit approval.",
    },
  ],
  "Weekly customer research": [
    {
      kind: "user",
      text: "Run the weekly customer research summary: interviews, churn signals and follow-ups.",
    },
    {
      kind: "marker",
      payload: { marker: "modelChange", label: "Using GLM 5.3 Max" },
    },
    {
      kind: "reasoning",
      text: "Weekly research summary. Sources: interview notes from the growth folder, support tickets tagged churn-risk, and last week's follow-up list to close out. I'll gather all three, look for recurring themes, and keep the summary honest about sample sizes.",
      durationMs: 11000,
    },
    {
      kind: "tool",
      payload: {
        tool: "search",
        primary: "customer interviews",
        secondary: "growth-sales",
        status: "completed",
        output: "interviews/2026-10/*.md — 6 files\nfollow-ups/last-week.md\ntickets/churn-risk.csv",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "terminal",
        primary: "groupby --theme interviews/2026-10",
        secondary: "meshwork@node · session 01",
        status: "completed",
        output: "themes (6 interviews):\n  pricing-transparency   5 mentions\n  upload-speed           4 mentions\n  support-response-time  3 mentions\n  bundle-flexibility     2 mentions",
      },
    },
    {
      kind: "tool",
      payload: {
        tool: "read",
        primary: "churn-risk.csv",
        secondary: "tickets/churn-risk.csv",
        status: "completed",
        output: "9 open churn-risk tickets (was 12 last week). 3 mention the new 5G backup pilot positively. Median first-response time improved 41 min → 29 min.",
      },
    },
    {
      kind: "assistant",
      text: "## Weekly customer research — week of Oct 26\n\n**Interviews (6):** pricing transparency dominates (5/6) — customers understand the base price but not overage and fair-use terms. Upload speed a close second (4/6), mostly from the offsite-backup segment.\n\n**Churn signals:** open churn-risk tickets down 12 → 9. The 5G backup pilot is landing well; two accounts explicitly cited it staying.\n\n**Follow-ups from last week:**\n- ✅ Share the overage explainer draft — done, sent Tuesday\n- ✅ Call the two upload-speed complainers — done, one converted to the satellite bulk-window offer\n- ⚠️ Pricing page rewrite — still open, blocked on legal wording\n\n**This week's follow-ups:** rewrite the pricing page FAQ, quote the bulk-window offer to the remaining upload-speed account, and re-survey the pilot cohort on support response time.",
    },
  ],
};

/** Seed automations — zcode scheduled tasks (name, schedule, prompt, status). */
export const SEED_AUTOMATIONS = [
  {
    name: "Morning standup summary",
    description: "Summarize yesterday's commits and open PRs for the team standup.",
    schedule: "Daily at 09:00",
    cronExpr: "0 9 * * *",
    prompt: "Summarize yesterday's commits and open pull requests across the workspace projects. Highlight risky changes and anything blocked on review.",
    target: "Field operations",
    mode: "ask",
    model: "glm-5.3-max",
    status: "active",
    enabled: true,
    runCount: 24,
    ageMinutes: 60 * 24 * 30,
    runs: [
      { trigger: "schedule", status: "succeeded", hoursAgo: 24, durationMs: 84000 },
      { trigger: "schedule", status: "succeeded", hoursAgo: 48, durationMs: 91000 },
      { trigger: "manual", status: "failed", hoursAgo: 50, durationMs: 12000, error: "Model provider rate limit — retried once, then skipped." },
      { trigger: "schedule", status: "succeeded", hoursAgo: 72, durationMs: 78000 },
    ],
  },
  {
    name: "Weekly customer research",
    description: "Run the weekly customer research summary and post follow-ups.",
    schedule: "Weekly on Monday at 10:00",
    cronExpr: "0 10 * * 1",
    prompt: "Run the weekly customer research summary: interviews, churn signals and follow-ups. Post the summary to the growth channel.",
    target: "Growth & sales",
    mode: "ask",
    model: "glm-5.3-max",
    status: "active",
    enabled: true,
    runCount: 6,
    ageMinutes: 60 * 24 * 45,
    runs: [
      { trigger: "schedule", status: "succeeded", hoursAgo: 24, durationMs: 240000 },
      { trigger: "schedule", status: "succeeded", hoursAgo: 168, durationMs: 210000 },
    ],
  },
  {
    name: "Dependency risk scan",
    description: "Scan project dependencies for vulnerabilities and license risks.",
    schedule: "Every weekday at 18:30",
    cronExpr: "30 18 * * 1-5",
    prompt: "Scan workspace project dependencies for known vulnerabilities and license risks. Open an issue per finding with severity labels.",
    target: "Field operations",
    mode: "safe",
    model: "glm-5.3-flash",
    status: "paused",
    enabled: false,
    runCount: 41,
    ageMinutes: 60 * 24 * 60,
    runs: [
      { trigger: "schedule", status: "succeeded", hoursAgo: 96, durationMs: 155000 },
      { trigger: "schedule", status: "failed", hoursAgo: 120, durationMs: 60000, error: "Registry timeout while resolving transitive dependencies." },
    ],
  },
  {
    name: "Offsite backup verification",
    description: "Verify the Saturday offsite backup completed and alert on gaps.",
    schedule: "Weekly on Sunday at 06:00",
    cronExpr: "0 6 * * 0",
    prompt: "Check that the Saturday offsite backup upload finished. Compare the uploaded bytes against the manifest and alert on any gap larger than 1%.",
    target: "Personal",
    mode: "ask",
    model: "glm-5.3-flash",
    status: "active",
    enabled: true,
    runCount: 12,
    ageMinutes: 60 * 24 * 90,
    runs: [
      { trigger: "schedule", status: "succeeded", hoursAgo: 60, durationMs: 45000 },
    ],
  },
] as const;

/** zcode automation template catalog (seed templates for "New from template"). */
export const AUTOMATION_TEMPLATES = [
  {
    id: "morning-standup",
    title: "Morning standup",
    description: "Summarize yesterday's commits and open reviews for the team standup.",
    schedule: "Daily at 09:00",
    cronExpr: "0 9 * * *",
    prompt: "Summarize yesterday's commits and open pull requests. Highlight risky changes and anything blocked on review.",
    icon: "target",
  },
  {
    id: "weekly-report",
    title: "Weekly report",
    description: "Compile the week's activity into a structured report with follow-ups.",
    schedule: "Weekly on Monday at 10:00",
    cronExpr: "0 10 * * 1",
    prompt: "Compile this week's project activity into a report: progress, risks, and follow-ups with owners.",
    icon: "file",
  },
  {
    id: "ci-flaky-report",
    title: "CI flaky tests",
    description: "Detect flaky tests from the last 24 hours and summarize likely causes.",
    schedule: "Every day at 07:30",
    cronExpr: "30 7 * * *",
    prompt: "Analyze CI runs from the last 24 hours. List flaky tests with failure rates and likely causes.",
    icon: "activity",
  },
  {
    id: "churn-watch",
    title: "Churn watch",
    description: "Review churn-risk signals weekly and draft outreach messages.",
    schedule: "Weekly on Friday at 16:00",
    cronExpr: "0 16 * * 5",
    prompt: "Review churn-risk tickets and usage drops from this week. Draft a short outreach message for each at-risk account.",
    icon: "list",
  },
] as const;

/** Marketplace sources (zcode plugin store sources dialog). */
export const SEED_MARKETPLACE_SOURCES = [
  {
    key: "meshwork-official",
    name: "Meshwork Official",
    source: "https://cdn.meshwork.local/official-plugin/marketplace.json",
    official: true,
    removable: false,
  },
  {
    key: "claude-plugins-official",
    name: "Claude Code Plugins",
    source: "anthropics/claude-plugins-official",
    official: true,
    removable: false,
  },
  {
    key: "team-plugins",
    name: "Team plugins",
    source: "payswapdotorg/team-plugins",
    official: false,
    removable: true,
  },
] as const;

/** Legacy rows from earlier previews — removed on the next seed run.
 *  "personal" must NOT be listed: it is also a current project key, and the
 *  legacy wipe deletes every task in a legacy project — listing it here
 *  destroyed all Personal tasks on every server restart. Project order is
 *  preserved without it: SEED_PROJECTS upserts are ordered by createdAt. */
export const LEGACY_PROJECT_KEYS = ["meshwork-build", "network-research"];
export const LEGACY_TASK_NAMES = ["Audit MeshLink gateway", "Aggregation planner", "Figma workspace"];
export const LEGACY_AUTOMATION_NAMES = ["Check WAN health", "Alert on link degradation"];
export const LEGACY_PLUGIN_KEYS = [
  "browser-automation",
  "web-search",
  "network-diagnostics",
  "markdown-export",
];

export const SEED_PLUGINS = [
  // Featured (zcode store "Featured" section)
  {
    key: "pdf",
    name: "PDF",
    description: "PDF production skills and a PDF viewer pane for reading and annotating documents.",
    category: "Productivity",
    installed: true,
    enabled: true,
    version: "3.2.1",
    latestVersion: "3.2.1",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: true,
    icon: "📄",
    components: [
      { kind: "skill", name: "pdf-production", description: "Generate polished PDF documents from structured content." },
      { kind: "command", name: "pdf:view", description: "Open a PDF in the side panel viewer." },
    ],
  },
  {
    key: "presentations",
    name: "Presentations",
    description: "PPTX presentation production skills and a Presentation viewer pane.",
    category: "Productivity",
    installed: true,
    enabled: true,
    version: "2.8.0",
    latestVersion: "2.9.0",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: true,
    icon: "📊",
    components: [
      { kind: "skill", name: "presentations-production", description: "Create slide decks from outlines." },
      { kind: "command", name: "slides:view", description: "Open a deck in the viewer pane." },
    ],
  },
  {
    key: "browser-use",
    name: "Browser Use",
    description: "Let the agent complete browser workflows with site-scoped permissions.",
    category: "Utilities",
    installed: true,
    enabled: true,
    version: "1.4.3",
    latestVersion: "1.4.3",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: true,
    icon: "🌐",
    components: [
      { kind: "mcp", name: "browser-use", description: "Navigate, click, type and snapshot pages." },
    ],
  },
  // Productivity
  {
    key: "spreadsheets",
    name: "Spreadsheets",
    description: "XLSX spreadsheet production skills and an Excel viewer pane.",
    category: "Productivity",
    installed: true,
    enabled: true,
    version: "2.4.0",
    latestVersion: "2.4.0",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: false,
    icon: "📈",
    components: [
      { kind: "skill", name: "spreadsheets-production", description: "Build workbooks with formulas and charts." },
    ],
  },
  {
    key: "documents",
    name: "Documents",
    description: "DOCX document production skills and a Word viewer pane.",
    category: "Productivity",
    installed: true,
    enabled: true,
    version: "2.4.0",
    latestVersion: "2.4.0",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: false,
    icon: "📝",
    components: [
      { kind: "skill", name: "documents-production", description: "Create and edit Word documents." },
    ],
  },
  // Developer Tools
  {
    key: "github",
    name: "Github",
    description: "GitHub CLI workflows for commits, pull requests and issues.",
    category: "Developer Tools",
    installed: false,
    enabled: true,
    version: "1.1.0",
    latestVersion: "1.2.0",
    author: "community",
    publisherType: "community",
    sourceKey: "claude-plugins-official",
    featured: false,
    icon: "🐙",
    components: [
      { kind: "command", name: "gh:pr", description: "Open a pull request from current changes." },
      { kind: "command", name: "gh:issue", description: "Create or list issues." },
    ],
  },
  {
    key: "android-emulator",
    name: "Android Emulator",
    description: "Create and control Android virtual devices from the workspace.",
    category: "Developer Tools",
    installed: true,
    enabled: true,
    version: "1.0.6",
    latestVersion: "1.0.6",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: false,
    icon: "🤖",
    components: [
      { kind: "mcp", name: "android-emulator", description: "Manage and drive Android virtual devices." },
    ],
  },
  {
    key: "code-security-protection",
    name: "Code Security Protection",
    description: "Scan dependencies and code for known vulnerabilities and license risks.",
    category: "Developer Tools",
    installed: false,
    enabled: true,
    version: "0.9.2",
    latestVersion: "0.9.2",
    author: "community",
    publisherType: "community",
    sourceKey: "claude-plugins-official",
    featured: false,
    icon: "🛡️",
    components: [
      { kind: "skill", name: "dependency-scan", description: "Audit dependencies for CVEs and licenses." },
    ],
  },
  // Utilities
  {
    key: "zcode-sites",
    name: "ZCode Sites",
    description: "Publish new or throwaway web projects to ZCode Sites in one step.",
    category: "Utilities",
    installed: true,
    enabled: true,
    version: "1.3.0",
    latestVersion: "1.3.0",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: false,
    icon: "🚀",
    components: [
      { kind: "command", name: "sites:publish", description: "Publish the current project to a preview URL." },
    ],
  },
  {
    key: "jupyter-notebook",
    name: "Jupyter Notebook",
    description: "Work on Jupyter notebooks in a side panel: code, outputs and kernels.",
    category: "Utilities",
    installed: false,
    enabled: true,
    version: "0.7.1",
    latestVersion: "0.7.1",
    author: "community",
    publisherType: "community",
    sourceKey: "claude-plugins-official",
    featured: false,
    icon: "📓",
    components: [
      { kind: "mcp", name: "jupyter", description: "Run notebooks with kernel management." },
    ],
  },
  {
    key: "image-search",
    name: "Image Search",
    description: "Find and embed real web images with reachable hosted URLs.",
    category: "Utilities",
    installed: true,
    enabled: true,
    version: "1.2.0",
    latestVersion: "1.2.0",
    author: "Meshwork",
    publisherType: "official",
    sourceKey: "meshwork-official",
    featured: false,
    icon: "🖼️",
    components: [
      { kind: "skill", name: "image-search", description: "Search the web for images and cite sources." },
    ],
  },
  // Legal (community source)
  {
    key: "contract-review",
    name: "Contract Review",
    description: "Review supplier contracts for risky clauses and missing terms.",
    category: "Legal",
    installed: false,
    enabled: true,
    version: "0.4.0",
    latestVersion: "0.4.0",
    author: "team-plugins",
    publisherType: "community",
    sourceKey: "team-plugins",
    featured: false,
    icon: "⚖️",
    components: [
      { kind: "agent", name: "contract-reviewer", description: "Subagent that reads contracts and flags clauses." },
    ],
  },
] as const;

/** zcode model provider presets (Settings → Model settings). */
export const SEED_MODEL_PROVIDERS = [
  {
    key: "zai",
    name: "Z.ai",
    baseUrl: "https://api.z.ai/api/paas/v4",
    apiFormat: "openai-chat-completions",
    apiKey: "zai-demo-key",
    enabled: true,
    builtin: true,
    account: true,
    logoKey: "zai",
    displayOrder: 0,
    models: [
      {
        modelId: "glm-5.3-max",
        contextWindow: 1000000,
        maxOutputTokens: 32768,
        inputTypes: ["text", "image", "pdf"],
        capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
        reasoningLevels: ["low", "medium", "high"],
        builtin: true,
      },
      {
        modelId: "glm-5.3-flash",
        contextWindow: 200000,
        maxOutputTokens: 16384,
        inputTypes: ["text", "image"],
        capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
        reasoningLevels: ["low", "medium", "high"],
        builtin: true,
      },
      {
        modelId: "glm-5.2-air",
        contextWindow: 128000,
        maxOutputTokens: 8192,
        inputTypes: ["text"],
        capabilities: { structuredOutput: false, webSearch: false, systemMessages: true },
        reasoningLevels: [],
        builtin: true,
      },
    ],
  },
  {
    key: "bigmodel",
    name: "BigModel",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    apiFormat: "openai-chat-completions",
    apiKey: "",
    enabled: true,
    builtin: true,
    account: true,
    logoKey: "bigmodel",
    displayOrder: 1,
    models: [
      {
        modelId: "glm-5.3-max",
        contextWindow: 1000000,
        maxOutputTokens: 32768,
        inputTypes: ["text", "image", "pdf"],
        capabilities: { structuredOutput: true, webSearch: true, systemMessages: true },
        reasoningLevels: ["low", "medium", "high"],
        builtin: true,
      },
      {
        modelId: "glm-5.3-flash",
        contextWindow: 200000,
        maxOutputTokens: 16384,
        inputTypes: ["text", "image"],
        capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
        reasoningLevels: ["low", "medium", "high"],
        builtin: true,
      },
    ],
  },
  {
    key: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiFormat: "openai-chat-completions",
    apiKey: "",
    enabled: true,
    builtin: false,
    account: false,
    logoKey: "openrouter",
    displayOrder: 2,
    models: [
      {
        modelId: "anthropic/claude-sonnet-4",
        contextWindow: 200000,
        maxOutputTokens: 16384,
        inputTypes: ["text", "image", "pdf"],
        capabilities: { structuredOutput: true, webSearch: false, systemMessages: true },
        reasoningLevels: ["low", "medium", "high"],
        builtin: false,
      },
    ],
  },
  {
    key: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiFormat: "openai-responses",
    apiKey: "",
    enabled: false,
    builtin: false,
    account: false,
    logoKey: "openai",
    displayOrder: 3,
    models: [],
  },
] as const;

export const DEFAULT_SETTINGS: Record<string, string | number | boolean> = {
  // General (ZCode General settings page)
  "general.language": "System default",
  "general.interfaceMode": "Coding mode",
  "general.proactiveSuggestions": false,
  "general.inheritTerminalProfile": true,
  "general.terminalFont": "",
  "general.terminalShell": "Auto",
  // Automations (ZCode automations page banner)
  "automations.keepAwake": true,
  // Basics / profile
  "profile.name": "Ali19",
  "profile.workspace": "Personal workspace",
  "profile.email": "ali19@local.node",
  // Appearance
  "appearance.theme": "dark",
  "appearance.density": "comfortable",
  // Model
  "model.default": DEFAULT_MODEL,
  "model.provider": "ZAI",
  // Browser use
  "browser.enabled": true,
  "browser.searchEngine": "DuckDuckGo",
  "browser.privateSession": true,
  // Remote devices
  "devices.remoteAccess": false,
  "devices.pairing": "Not configured",
  // Computer use
  "computer.enabled": false,
  // Personalization
  "personal.addressAs": "Ali",
  "personal.tone": "Concise and technical",
  // Memory
  "memory.enabled": true,
  // Keyboard shortcuts (immutable, informational)
  // Data & statistics are computed, not stored
  // Meshwork network extension
  "network.discovery": false,
  "network.adapter": "diagnostics-only",
  "network.routingPreference": "latency",
  // Node
  "node.id": "mesh-local-01",
  "node.enrolled": false,
  // Privacy
  "privacy.locationSharing": false,
  "privacy.telemetry": false,
  // Marketplace
  "marketplace.paymentMethods": "",
  // Advanced
  "advanced.relayEndpoint": "",
  "advanced.multipath": "not-configured",
};
