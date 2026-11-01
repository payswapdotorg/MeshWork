// Meshwork — typed view models shared between the API services and the UI.
// Visual components read these models and dispatch commands; they never
// perform privileged network operations directly (TL handoff §10.4).

export type MeshView =
  | "new-task"
  | "task"
  | "tasks"
  | "automations"
  | "plugin-marketplace"
  | "connections"
  | "marketplace"
  | "my-offers"
  | "nodes"
  | "group-buying";

export type DockPanelId = "browser" | "terminal" | "devices";

export type TaskStatus = "draft" | "in_progress" | "completed" | "error";

export interface ProjectVM {
  id: string;
  key: string;
  name: string;
}

export interface TaskVM {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  prompt: string;
  status: TaskStatus;
  model: string;
  permissionMode: string;
  pinned: boolean;
  unread: boolean;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------- Task conversation trace (zcode conversation rows) ------- */

export type TaskMessageKind = "user" | "assistant" | "reasoning" | "tool" | "marker" | "error";

export type ToolStatus = "pending" | "running" | "completed" | "failed" | "denied" | "stopped";

export interface ToolPayloadVM {
  tool:
    | "read"
    | "edit"
    | "write"
    | "delete"
    | "terminal"
    | "search"
    | "webFetch"
    | "skill"
    | "todo"
    | "browser"
    | "taskStop";
  /** main summary content — file name, command or query */
  primary: string;
  /** context line — full path, URL, … */
  secondary?: string;
  status: ToolStatus;
  /** expanded: raw arguments */
  args?: string;
  /** expanded: tool output */
  output?: string;
  diff?: { added: number; removed: number };
}

export interface MarkerPayloadVM {
  marker: "modelChange" | "forkNotice" | "compact" | "goal";
  label: string;
}

export interface TaskMessageVM {
  id: string;
  taskId: string;
  seq: number;
  kind: TaskMessageKind;
  text: string;
  payload: ToolPayloadVM | MarkerPayloadVM | null;
  durationMs: number | null;
  status: ToolStatus | null;
  createdAt: string;
}

/* ------- Task groups (zcode "By group" sidebar view) ------- */

export type TaskGroupColor = "gray" | "red" | "orange" | "yellow" | "green" | "blue" | "purple";

export interface TaskGroupVM {
  id: string;
  key: string;
  title: string;
  color: TaskGroupColor;
  position: number;
}

export interface AutomationRunVM {
  id: string;
  automationId: string;
  trigger: "schedule" | "manual";
  status: "running" | "succeeded" | "failed" | "stopped" | "skipped";
  startedAt: string;
  durationMs: number | null;
  error: string | null;
  sessionId: string | null;
}

export interface AutomationVM {
  id: string;
  name: string;
  description: string;
  schedule: string;
  cronExpr: string;
  prompt: string;
  target: string;
  mode: string;
  model: string;
  status: "active" | "paused" | "completed" | "failed";
  enabled: boolean;
  runCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastError: string | null;
}

export interface PluginComponentVM {
  kind: "mcp" | "skill" | "command" | "agent" | "hook";
  name: string;
  description: string;
}

export interface PluginVM {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  installed: boolean;
  enabled: boolean;
  version: string;
  latestVersion: string;
  author: string;
  publisherType: "official" | "community";
  sourceKey: string;
  featured: boolean;
  components: PluginComponentVM[];
  scope: "user" | "workspace";
  icon: string;
}

export interface MarketplaceSourceVM {
  id: string;
  key: string;
  name: string;
  source: string;
  official: boolean;
  removable: boolean;
  lastUpdated: string;
}

/* ------- Model providers (zcode Settings → Model settings) ------- */

export type ApiFormat = "anthropic-messages" | "openai-chat-completions" | "openai-responses";

export interface ModelEntryVM {
  id: string;
  modelId: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputTypes: string[];
  capabilities: Record<string, boolean>;
  reasoningLevels: string[];
  enabled: boolean;
  builtin: boolean;
}

export interface ModelProviderVM {
  id: string;
  key: string;
  name: string;
  baseUrl: string;
  apiFormat: ApiFormat;
  hasApiKey: boolean;
  apiKeyPreview: string;
  enabled: boolean;
  builtin: boolean;
  account: boolean;
  logoKey: string;
  models: ModelEntryVM[];
}

/* ---------------- Connections (typed aggregation view models) ---------------- */

export type AggregationMode =
  | "single"
  | "load-balance"
  | "bond"
  | "failover"
  | "redundancy";

export type OptimiseFor = "cost" | "latency" | "throughput" | "availability";

export type PathHealth = "healthy" | "degraded" | "high-latency" | "offline";

export interface PathObservationVM {
  rttMs: number;
  lossPct: number;
  freshness: string;
  /** where the numbers come from — never present advertised rates as measured */
  source: "advertised" | "probed";
}

export interface NetworkPathVM {
  id: string;
  name: string;
  /** access type / interface, e.g. "Ethernet · WAN 1 · Primary" */
  interface: string;
  downMbps: number;
  upMbps: number;
  rateProvenance: "advertised";
  metered: boolean;
  health: PathHealth;
  observation: PathObservationVM;
}

export interface AggregationModeVM {
  id: AggregationMode;
  name: string;
  summary: string;
  status: "active" | "available" | "not-configured";
  explanation: string;
}

export interface TrafficAllocationRowVM {
  trafficClass: string;
  preferredPath: string;
  fallback: string;
  policy: string;
}

export interface ConnectionsConfigVM {
  mode: AggregationMode;
  optimiseFor: OptimiseFor;
  maxSpendPerDay: number | null;
  selectedPathIds: string[];
}

export interface EstimateVM {
  label: string;
  value: string;
  provenance: "advertised-sum" | "advertised-single" | "unavailable";
  note: string;
}

export interface ConnectionsVM {
  paths: NetworkPathVM[];
  modes: AggregationModeVM[];
  config: ConnectionsConfigVM;
  stats: {
    availableLinks: number;
    advertisedCapacityMbps: number;
    activePolicyName: string;
    activePolicyNote: string;
    networkHealth: string;
    telemetryNote: string;
  };
  allocations: TrafficAllocationRowVM[];
  estimate: EstimateVM;
}

/* ---------------- Marketplace ---------------- */

export interface MarketplaceListingVM {
  id: string;
  name: string;
  provider: string;
  badge: string;
  downMbps: number;
  priceBasis: string;
  iconTone: "blue" | "green" | "grey";
  description: string;
}

export interface PoolVM {
  id: string;
  name: string;
  subtitle: string;
  state: string;
  members: number;
  target: number;
  pct: number;
  note: string;
  targetPrice: string;
  deadline: string;
  billing: string;
}

/* ---------------- Nodes ---------------- */

export interface NodeVM {
  id: string;
  name: string;
  subtitle: string;
  online: boolean;
  capabilities: string[];
  note: string;
}

export interface NodePermissionVM {
  id: string;
  label: string;
  state: string;
  enabled: boolean;
}

export interface NodesVM {
  nodes: NodeVM[];
  permissions: NodePermissionVM[];
}

/* ---------------- Settings ---------------- */

export type SettingsValue = string | number | boolean;
export type SettingsMap = Record<string, SettingsValue>;

/* ---------------- API payloads ---------------- */

export interface TasksPayload {
  tasks: TaskVM[];
  projects: ProjectVM[];
}

export interface MarketplacePayload {
  listings: MarketplaceListingVM[];
  pools: PoolVM[];
  note: string;
}
