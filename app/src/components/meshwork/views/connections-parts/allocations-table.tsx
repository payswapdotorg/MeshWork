"use client";

import type { TrafficAllocationRowVM } from "@/lib/meshwork/types";
import { SectionLabel } from "../../page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Traffic allocation table — rows are derived by the planner from the
 * selected mode and enabled paths; the view never invents allocations.
 */
export function AllocationsTable({ allocations }: { allocations: TrafficAllocationRowVM[] }) {
  return (
    <section aria-label="Traffic policies" className="mt-7">
      <SectionLabel>Traffic policies</SectionLabel>
      <p className="mt-1.5 max-w-[560px] text-[12px] leading-relaxed text-muted-foreground">
        Allocation is derived from the selected mode and enabled paths.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-mesh-line-soft bg-mesh-panel">
        <Table className="text-[12.5px]">
          <TableHeader>
            <TableRow className="border-mesh-line-soft hover:bg-transparent">
              <TableHead className="py-2.5 pl-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Traffic class
              </TableHead>
              <TableHead className="py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Preferred path
              </TableHead>
              <TableHead className="py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Fallback
              </TableHead>
              <TableHead className="py-2.5 pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Policy
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((row) => (
              <TableRow key={row.trafficClass} className="border-mesh-line-soft hover:bg-mesh-panel-2/40">
                <TableCell className="py-3 pl-4 font-medium text-foreground">
                  {row.trafficClass}
                </TableCell>
                <TableCell className="py-3 text-foreground">{row.preferredPath}</TableCell>
                <TableCell className="py-3 text-muted-foreground">{row.fallback}</TableCell>
                <TableCell className="py-3 pr-4 text-muted-foreground">{row.policy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
