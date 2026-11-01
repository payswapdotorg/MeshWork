import { AGGREGATION_MODES, DESIGN_PATHS } from "./data";
import type {
  AggregationMode,
  ConnectionsConfigVM,
  ConnectionsVM,
  EstimateVM,
  NetworkPathVM,
  TrafficAllocationRowVM,
} from "./types";

/**
 * Deterministic aggregation planner (domain service).
 *
 * UI selection never mutates routing tables — this module only produces typed
 * view models with explicit provenance for every number shown to the user.
 * Never claim combined speed as a fact based on summing plan rates.
 */

export const DEFAULT_CONNECTIONS_CONFIG: ConnectionsConfigVM = {
  mode: "load-balance",
  optimiseFor: "latency",
  maxSpendPerDay: null,
  selectedPathIds: ["home-fibre", "5g-hotspot", "starlink"],
};

function selectedPaths(paths: NetworkPathVM[], ids: string[]): NetworkPathVM[] {
  const set = new Set(ids.length > 0 ? ids : paths.map((p) => p.id));
  return paths.filter((p) => set.has(p.id));
}

function fmtRate(p: NetworkPathVM): string {
  return `${p.downMbps} Mbps ↓ / ${p.upMbps} Mbps ↑`;
}

function lowestLatency(paths: NetworkPathVM[]): NetworkPathVM {
  return [...paths].sort((a, b) => a.observation.rttMs - b.observation.rttMs)[0];
}

function primary(paths: NetworkPathVM[]): NetworkPathVM | undefined {
  return paths.find((p) => p.interface.includes("Primary")) ?? paths[0];
}

function unmetered(paths: NetworkPathVM[]): NetworkPathVM | undefined {
  return paths.find((p) => !p.metered);
}

export function computeEstimate(
  mode: AggregationMode,
  paths: NetworkPathVM[],
  ids: string[]
): EstimateVM {
  const sel = selectedPaths(paths, ids);
  if (sel.length === 0) {
    return {
      label: "Estimated aggregate",
      value: "No paths selected",
      provenance: "unavailable",
      note: "Enable at least one path to see an estimate.",
    };
  }
  const best = lowestLatency(sel);
  const pri = primary(sel);

  switch (mode) {
    case "single":
      return {
        label: "Best single path",
        value: pri ? fmtRate(pri) : fmtRate(best),
        provenance: "advertised-single",
        note: `Advertised plan rate for ${pri?.name ?? best.name} — not measured goodput.`,
      };
    case "load-balance": {
      const down = sel.reduce((s, p) => s + p.downMbps, 0);
      const up = sel.reduce((s, p) => s + p.upMbps, 0);
      return {
        label: "Advertised capacity across selected links",
        value: `${down} Mbps ↓ / ${up} Mbps ↑ (sum)`,
        provenance: "advertised-sum",
        note: "Upper bound for independent flows — a sum of advertised plan speeds is not a promise of usable throughput and does not accelerate one transfer.",
      };
    }
    case "bond":
      return {
        label: "Bonded single-flow estimate",
        value: "Not set up",
        provenance: "unavailable",
        note: "Bonding requires a compatible multipath transport and relay endpoint. An honest estimate is only possible after a measured bonding session.",
      };
    case "failover":
      return {
        label: "Primary path with automatic failover",
        value: pri ? fmtRate(pri) : fmtRate(best),
        provenance: "advertised-single",
        note: `New flows move to a healthy alternate when ${pri?.name ?? best.name} breaches health thresholds. Existing sessions may reset unless the transport supports migration.`,
      };
    case "redundancy": {
      const slowest = [...sel].sort((a, b) => a.downMbps - b.downMbps)[0];
      return {
        label: "Duplicated critical traffic",
        value: `Bounded by ${slowest.name} (${slowest.downMbps} Mbps ↓ advertised)`,
        provenance: "advertised-single",
        note: "Redundancy does not add throughput. Duplicated traffic consumes bandwidth on every selected link, including metered ones.",
      };
    }
  }
}

export function computeAllocations(
  mode: AggregationMode,
  paths: NetworkPathVM[],
  ids: string[]
): TrafficAllocationRowVM[] {
  const sel = selectedPaths(paths, ids);
  if (sel.length === 0) {
    return [
      { trafficClass: "—", preferredPath: "No paths selected", fallback: "—", policy: "—" },
    ];
  }
  const best = lowestLatency(sel);
  const pri = primary(sel) ?? best;
  const alt = sel.find((p) => p.id !== pri.id);
  const bg = unmetered(sel) ?? pri;

  switch (mode) {
    case "single":
      return [
        { trafficClass: "Video calls", preferredPath: pri.name, fallback: "—", policy: "Single path" },
        { trafficClass: "Large transfers", preferredPath: pri.name, fallback: "—", policy: "Single path" },
        { trafficClass: "Background", preferredPath: pri.name, fallback: "—", policy: "Single path" },
      ];
    case "load-balance":
      return [
        { trafficClass: "Video calls", preferredPath: best.name, fallback: alt?.name ?? "—", policy: "Lowest latency" },
        { trafficClass: "Large transfers", preferredPath: "Distributed across selected links", fallback: best.name, policy: "Throughput · per-flow balance" },
        { trafficClass: "Background", preferredPath: bg.name, fallback: alt?.name ?? "—", policy: "Lowest cost" },
      ];
    case "bond":
      return [
        { trafficClass: "Video calls", preferredPath: best.name, fallback: alt?.name ?? "—", policy: "Latency first · bond not used" },
        { trafficClass: "Large transfers", preferredPath: "Multipath across selected paths", fallback: "Best single path", policy: "Throughput / bonding when supported" },
        { trafficClass: "Background", preferredPath: bg.name, fallback: "—", policy: "Lowest cost" },
      ];
    case "failover":
      return [
        { trafficClass: "Video calls", preferredPath: pri.name, fallback: alt?.name ?? "—", policy: "Failover on health breach" },
        { trafficClass: "Large transfers", preferredPath: pri.name, fallback: alt?.name ?? "—", policy: "Failover for new flows" },
        { trafficClass: "Background", preferredPath: bg.name, fallback: alt?.name ?? "—", policy: "Failover on health breach" },
      ];
    case "redundancy":
      return [
        { trafficClass: "Video calls", preferredPath: `Duplicated · ${best.name} + ${alt?.name ?? "—"}`, fallback: "—", policy: "Availability first" },
        { trafficClass: "Large transfers", preferredPath: pri.name, fallback: "—", policy: "Not duplicated (bandwidth cost)" },
        { trafficClass: "Background", preferredPath: bg.name, fallback: "—", policy: "Not duplicated" },
      ];
  }
}

export function buildConnectionsVM(
  config: ConnectionsConfigVM
): ConnectionsVM {
  const paths = DESIGN_PATHS;
  const sel = selectedPaths(paths, config.selectedPathIds);
  const activeMode = AGGREGATION_MODES.find((m) => m.id === config.mode);
  const modes = AGGREGATION_MODES.map((m) => ({
    ...m,
    status:
      m.id === config.mode
        ? ("active" as const)
        : m.id === "bond"
          ? ("not-configured" as const)
          : ("available" as const),
  }));
  const advertisedDown = sel.reduce((s, p) => s + p.downMbps, 0);

  return {
    paths,
    modes,
    config: { ...config, selectedPathIds: sel.map((p) => p.id) },
    stats: {
      availableLinks: paths.length,
      advertisedCapacityMbps: advertisedDown,
      activePolicyName: activeMode?.name ?? "—",
      activePolicyNote: activeMode?.summary ?? "",
      networkHealth: "Good",
      telemetryNote: "Prototype telemetry · 8 sec ago",
    },
    allocations: computeAllocations(config.mode, paths, config.selectedPathIds),
    estimate: computeEstimate(config.mode, paths, config.selectedPathIds),
  };
}
