"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { buildConnectionsVM } from "@/lib/meshwork/aggregation";
import { useMeshStore } from "@/lib/meshwork/store";
import { useConnections, useUpdateConnections } from "@/hooks/meshwork/use-meshwork-data";
import { PageShell } from "../page-shell";
import { Button } from "@/components/ui/button";
import { AddConnectionDialog } from "./connections-parts/add-connection-dialog";
import { AllocationsTable } from "./connections-parts/allocations-table";
import { CommunityPanel } from "./connections-parts/community-panel";
import { ConnectionsError, ConnectionsSkeleton } from "./connections-parts/loading-states";
import { ConnectionsStats } from "./connections-parts/stat-cards";
import { ModeSection } from "./connections-parts/mode-section";
import { PathInventory } from "./connections-parts/path-inventory";
import { PreferencesPanel } from "./connections-parts/preferences-panel";

/**
 * Connections view (Worker 2 · Task 2-a) — accepted dark Meshwork aggregation
 * design. The server computes the full ConnectionsVM from a config; the same
 * pure domain function runs client-side for instant feedback, and every change
 * is persisted through the API. Every figure carries its provenance —
 * advertised plan rates are never presented as measured throughput.
 */
export function ConnectionsView() {
  const query = useConnections();
  const config = useMeshStore((s) => s.connections);
  const setLocalConfig = useMeshStore((s) => s.setConnections);
  const update = useUpdateConnections();

  const [addOpen, setAddOpen] = useState(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  /* Hydrate the store from the server once it loads (and after external changes) */
  useEffect(() => {
    const server = query.data?.config;
    if (server && JSON.stringify(server) !== JSON.stringify(config)) {
      setLocalConfig(server);
    }
  }, [query.data]);

  const vm = useMemo(() => buildConnectionsVM(config), [config]);

  const apply = (patch: Partial<typeof config>) => {
    setLocalConfig(patch); // optimistic, instant
    update.mutate(patch); // persist via API
  };

  const togglePath = (id: string, use: boolean) => {
    const next = use
      ? [...config.selectedPathIds, id]
      : config.selectedPathIds.filter((pathId) => pathId !== id);
    apply({ selectedPathIds: next });
  };

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const result = await query.refetch();
      if (result.error) throw result.error;
      toast.info("Diagnostics run — figures remain illustrative in this design preview.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Diagnostics failed — try again.");
    } finally {
      setRunningDiagnostics(false);
    }
  };

  return (
    <PageShell
      title="Connections"
      subtitle="See your uplinks, choose how traffic uses them and understand what each mode can actually achieve."
      wide
      actions={
        <>
          {update.isPending && (
            <span role="status" className="text-[11px] text-mesh-quiet">
              Saving…
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={runDiagnostics}
            disabled={runningDiagnostics}
          >
            <RefreshCw className={runningDiagnostics ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            {runningDiagnostics ? "Running…" : "Run diagnostics"}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1 mesh-action text-[12.5px] font-medium"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add connection
          </Button>
        </>
      }
    >
      {query.isLoading ? (
        <ConnectionsSkeleton />
      ) : query.isError && !query.data ? (
        <ConnectionsError onRetry={() => void query.refetch()} />
      ) : (
        <>
          <ConnectionsStats stats={vm.stats} />

          <PathInventory
            paths={vm.paths}
            selectedIds={config.selectedPathIds}
            onTogglePath={togglePath}
          />

          <ModeSection
            modes={vm.modes}
            activeModeId={config.mode}
            onSelectMode={(mode) => apply({ mode })}
          />

          <PreferencesPanel
            optimiseFor={config.optimiseFor}
            maxSpendPerDay={config.maxSpendPerDay}
            selectedCount={vm.config.selectedPathIds.length}
            totalPaths={vm.paths.length}
            estimate={vm.estimate}
            onOptimiseFor={(value) => apply({ optimiseFor: value })}
            onMaxSpendPerDay={(value) => apply({ maxSpendPerDay: value })}
          />

          <AllocationsTable allocations={vm.allocations} />

          <CommunityPanel />
        </>
      )}

      <AddConnectionDialog open={addOpen} onOpenChange={setAddOpen} />
    </PageShell>
  );
}
