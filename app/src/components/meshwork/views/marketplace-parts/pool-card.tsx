"use client";

/**
 * Community demand-pool card (Figma frame 8:36) — used compactly inside the
 * right community panel and at full size in the "Group purchase" tab.
 * Private part of the Marketplace view (Worker 3, Task 2-b).
 */

import type { PoolVM } from "@/lib/meshwork/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function PoolCard({
  pool,
  onJoin,
  variant = "panel",
}: {
  pool: PoolVM;
  onJoin: () => void;
  variant?: "panel" | "full";
}) {
  const full = variant === "full";
  return (
    <article
      aria-label={`${pool.name} demand pool`}
      className={cn(
        "rounded-xl border border-mesh-line-soft",
        full ? "bg-mesh-panel p-5" : "bg-mesh-panel-2/40 p-3.5"
      )}
    >
      <h3 className={cn("font-medium text-foreground", full ? "text-[13.5px]" : "text-[12.5px]")}>
        {pool.name}
      </h3>
      <p className={cn("mt-0.5 text-mesh-quiet", full ? "text-[11.5px]" : "text-[11px]")}>
        {pool.members} people committed · target {pool.target}
      </p>

      <Progress
        value={pool.pct}
        className={cn(
          "mt-2.5 h-1.5 bg-mesh-panel-3 [&>[data-slot=progress-indicator]]:bg-mesh-blue-strong"
        )}
        aria-label={`${pool.pct}% of target`}
      />
      <p
        className={cn(
          "mt-1.5 text-right font-medium text-mesh-blue",
          full ? "text-[11.5px]" : "text-[11px]"
        )}
      >
        {pool.pct}% of target
      </p>

      <p className={cn("mt-2 leading-relaxed text-mesh-quiet", full ? "text-[11.5px]" : "text-[11px]")}>
        The group sets a target price and minimum participants. No one is charged until the offer
        and terms are accepted.
      </p>

      <Button
        size="sm"
        className={cn(
          "mesh-action-blue text-[12.5px] font-medium",
          full ? "mt-4" : "mt-3 w-full"
        )}
        onClick={onJoin}
      >
        Join this pool
      </Button>
    </article>
  );
}

export function PoolCardSkeleton({ full = false }: { full?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-mesh-line-soft",
        full ? "bg-mesh-panel p-5" : "bg-mesh-panel-2/40 p-3.5"
      )}
      aria-hidden
    >
      <Skeleton className={cn("rounded-md", full ? "h-4 w-52" : "h-3.5 w-44")} />
      <Skeleton className="mt-2 h-3 w-32 rounded-md" />
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-3.5 h-8 w-full rounded-md" />
    </div>
  );
}
