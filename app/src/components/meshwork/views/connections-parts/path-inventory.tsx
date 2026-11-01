"use client";

import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { NetworkPathVM, PathHealth } from "@/lib/meshwork/types";
import { PreviewChip, SectionLabel } from "../../page-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/* Health status chips — green for healthy, amber for degraded states, red for offline. */
const HEALTH_META: Record<PathHealth, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "border-mesh-green-line bg-mesh-green-soft text-[#8ed9b0]" },
  degraded: { label: "Degraded", className: "border-[#6b4d23] bg-mesh-amber-soft text-mesh-amber" },
  "high-latency": { label: "High latency", className: "border-[#6b4d23] bg-mesh-amber-soft text-mesh-amber" },
  offline: { label: "Offline", className: "border-[#5a2c31] bg-[#361b1f] text-mesh-red" },
};

interface PathInventoryProps {
  paths: NetworkPathVM[];
  selectedIds: string[];
  onTogglePath: (id: string, use: boolean) => void;
}

/**
 * Path inventory — one card per local uplink with download/upload shown
 * separately, probe-derived RTT/loss, metering tag and a per-path "Use" toggle.
 */
export function PathInventory({ paths, selectedIds, onTogglePath }: PathInventoryProps) {
  const connected = paths.filter((p) => p.health !== "offline").length;

  const toggle = (path: NetworkPathVM, use: boolean) => {
    /* The planner treats an empty selection as "every path" (and the server
       normalises it back), so keep at least one explicit path enabled — the
       UI must never disagree with the domain model. */
    if (!use && selectedIds.length === 1 && selectedIds.includes(path.id)) {
      toast.info("Keep at least one path enabled — an empty selection is treated as every path.");
      return;
    }
    onTogglePath(path.id, use);
  };

  return (
    <section aria-label="Your internet connections" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Your internet connections</SectionLabel>
        <div className="flex items-center gap-2">
          <PreviewChip label="Example data" />
          <span className="rounded-full border border-mesh-green-line bg-mesh-green-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#8ed9b0]">
            {connected} connected
          </span>
        </div>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-mesh-quiet">
        Link estimates are illustrative. Production must show live probe data and freshness.
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {paths.map((path) => (
          <PathCard
            key={path.id}
            path={path}
            selected={selectedIds.includes(path.id)}
            onToggle={toggle}
          />
        ))}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-mesh-quiet">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        These links are examples, not live measurements. A sum of advertised plan speeds is not a
        promise of usable throughput.
      </p>
    </section>
  );
}

function PathCard({
  path,
  selected,
  onToggle,
}: {
  path: NetworkPathVM;
  selected: boolean;
  onToggle: (path: NetworkPathVM, use: boolean) => void;
}) {
  const health = HEALTH_META[path.health];

  return (
    <article className="flex h-full flex-col rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13.5px] font-medium text-foreground">{path.name}</h3>
          <p className="mt-0.5 text-[11px] text-mesh-quiet">{path.interface}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.1em]",
            health.className
          )}
        >
          {health.label}
        </span>
      </div>

      {/* Advertised plan rates — download and upload shown separately, never summed here */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-mesh-quiet">
            Download
          </p>
          <p className="mt-1.5 flex items-baseline gap-1 text-[17px] font-semibold leading-none text-foreground">
            {path.downMbps}
            <span className="text-[10.5px] font-medium text-mesh-quiet">Mbps</span>
            <ArrowDown className="ml-0.5 h-3.5 w-3.5 self-center text-mesh-green" aria-hidden />
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-mesh-quiet">
            Upload
          </p>
          <p className="mt-1.5 flex items-baseline gap-1 text-[17px] font-semibold leading-none text-foreground">
            {path.upMbps}
            <span className="text-[10.5px] font-medium text-mesh-quiet">Mbps</span>
            <ArrowUp className="ml-0.5 h-3.5 w-3.5 self-center text-mesh-blue" aria-hidden />
          </p>
        </div>
      </div>

      <p className="mb-4 mt-3 text-[11.5px] text-muted-foreground">
        RTT {path.observation.rttMs} ms · Loss {path.observation.lossPct}%
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-mesh-line-soft pt-3">
        {path.metered ? (
          <span className="rounded-full border border-[#6b4d23] bg-mesh-amber-soft px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.1em] text-mesh-amber">
            Metered
          </span>
        ) : (
          <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.1em] text-mesh-quiet">
            Unmetered
          </span>
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`use-path-${path.id}`}
            checked={selected}
            onCheckedChange={(checked) => onToggle(path, checked === true)}
            aria-label={`Use ${path.name} for aggregation`}
          />
          <Label
            htmlFor={`use-path-${path.id}`}
            className="cursor-pointer text-[12px] text-muted-foreground"
          >
            Use
          </Label>
        </div>
      </div>
    </article>
  );
}
