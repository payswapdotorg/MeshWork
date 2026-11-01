"use client";

import { Archive, ArrowRightLeft, GitBranch, Goal, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MarkerPayloadVM } from "@/lib/meshwork/types";

/**
 * zcode timeline marker — a full-width centered divider noting model
 * switches, forks, compaction or goal updates in the conversation.
 */

const MARKER_ICONS: Record<MarkerPayloadVM["marker"], LucideIcon> = {
  modelChange: ArrowRightLeft,
  forkNotice: GitBranch,
  compact: Archive,
  goal: Goal,
};

export function TimelineMarker({ payload }: { payload: MarkerPayloadVM }) {
  const marker = payload.marker ?? "modelChange";
  const Icon = MARKER_ICONS[marker] ?? ArrowRightLeft;
  const label = payload.label || marker;

  return (
    <div className="flex items-center gap-3 py-2 text-mesh-quiet">
      <span aria-hidden className="h-px flex-1 bg-mesh-line/60" />
      {marker === "forkNotice" ? (
        <button
          type="button"
          onClick={() =>
            toast.info("This point forked into a separate task session — the fork keeps its own trace.")
          }
          className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
          aria-label={`${label} — show fork details`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className="text-[12px]">{label}</span>
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <span className={cn("text-[12px]")}>{label}</span>
        </span>
      )}
      <span aria-hidden className="h-px flex-1 bg-mesh-line/60" />
    </div>
  );
}
