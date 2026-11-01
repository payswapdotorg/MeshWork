"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton layout mirroring the page rhythm while the connections query loads. */
export function ConnectionsSkeleton() {
  return (
    <div role="status" aria-label="Loading connections">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
        {["links", "capacity", "policy", "health"].map((key) => (
          <Skeleton key={key} className="h-[94px] rounded-xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-3" aria-hidden>
        {["fibre", "5g", "starlink"].map((key) => (
          <Skeleton key={key} className="h-[228px] rounded-xl" />
        ))}
      </div>
      <div className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {["single", "balance", "bond", "failover", "redundancy"].map((key) => (
          <Skeleton key={key} className="h-[96px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Small inline error state shown when the connections service cannot be reached. */
export function ConnectionsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-5">
      <div className="flex items-center gap-2.5">
        <TriangleAlert className="h-4 w-4 shrink-0 text-mesh-red" aria-hidden />
        <h2 className="text-[13.5px] font-medium text-foreground">Could not load connections</h2>
      </div>
      <p className="mt-1.5 max-w-[520px] text-[12px] leading-relaxed text-muted-foreground">
        The connections service did not respond. Your local preferences are kept and re-applied
        once it recovers.
      </p>
      <Button
        size="sm"
        className="mt-4 h-8 gap-1.5 mesh-action text-[12.5px] font-medium"
        onClick={onRetry}
      >
        <RefreshCw className="h-3.5 w-3.5" /> Try again
      </Button>
    </div>
  );
}
