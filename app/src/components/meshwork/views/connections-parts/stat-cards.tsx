"use client";

import type { ConnectionsVM } from "@/lib/meshwork/types";

/**
 * Four overview stat cards (accepted dark Meshwork Connections design).
 * Every figure states its provenance — advertised rates are never presented
 * as measured throughput (TL handoff §5).
 */
export function ConnectionsStats({ stats }: { stats: ConnectionsVM["stats"] }) {
  return (
    <dl aria-label="Connection overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
          Available links
        </dt>
        <dd className="mt-2.5 text-[18px] font-semibold leading-none text-foreground">
          {stats.availableLinks}
        </dd>
        <p className="mt-2 text-[11px] leading-snug text-mesh-quiet">Local paths detected</p>
      </div>

      <div className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
          Advertised capacity
        </dt>
        <dd className="mt-2.5 flex items-baseline gap-1 text-[18px] font-semibold leading-none text-foreground">
          {stats.advertisedCapacityMbps}
          <span className="text-[11px] font-medium text-mesh-quiet">Mbps</span>
        </dd>
        <p className="mt-2 text-[11px] leading-snug text-mesh-quiet">
          Not measured aggregate throughput
        </p>
      </div>

      <div className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
          Active policy
        </dt>
        <dd className="mt-2.5 text-[18px] font-semibold leading-none text-foreground">
          {stats.activePolicyName}
        </dd>
        <p className="mt-2 text-[11px] leading-snug text-mesh-quiet">{stats.activePolicyNote}</p>
      </div>

      <div className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
          Network health
        </dt>
        <dd className="mt-2.5 flex items-center gap-2 text-[18px] font-semibold leading-none">
          <span className="h-2 w-2 rounded-full bg-mesh-green" aria-hidden />
          <span className="text-mesh-green">{stats.networkHealth}</span>
        </dd>
        <p className="mt-2 text-[11px] leading-snug text-mesh-quiet">{stats.telemetryNote}</p>
      </div>
    </dl>
  );
}
