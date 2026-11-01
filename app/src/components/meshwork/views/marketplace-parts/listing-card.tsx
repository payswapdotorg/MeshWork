"use client";

/**
 * Marketplace listing row — Figma frame 8:36 "Available connections" cards.
 * Private part of the Marketplace view (Worker 3, Task 2-b).
 */

import { Signal, Wifi, Zap, type LucideIcon } from "lucide-react";
import type { MarketplaceListingVM } from "@/lib/meshwork/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type IconTone = MarketplaceListingVM["iconTone"];

const LISTING_ICONS: Record<IconTone, LucideIcon> = {
  blue: Zap,
  green: Signal,
  grey: Wifi,
};

const ICON_TONE_CLASS: Record<IconTone, string> = {
  blue: "bg-mesh-blue-soft text-mesh-blue",
  green: "bg-mesh-green-soft text-mesh-green",
  grey: "bg-mesh-panel-2 text-mesh-quiet",
};

export function ListingCard({
  listing,
  onViewOffer,
}: {
  listing: MarketplaceListingVM;
  onViewOffer: () => void;
}) {
  const Icon = LISTING_ICONS[listing.iconTone];
  return (
    <article className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-mesh-line-soft bg-mesh-panel px-4 py-3 transition-colors hover:border-mesh-line">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          ICON_TONE_CLASS[listing.iconTone]
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-[150px] flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[13px] font-semibold text-foreground">{listing.name}</h3>
          <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground">
            {listing.badge}
          </span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-mesh-quiet">{listing.provider}</p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-[12.5px] font-semibold text-foreground">Up to {listing.downMbps} Mbps</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{listing.priceBasis}</p>
      </div>
      <Button
        className="h-7 px-3 text-[12px] font-medium mesh-action-blue"
        onClick={onViewOffer}
      >
        View offer
      </Button>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-mesh-line-soft bg-mesh-panel px-4 py-3" aria-hidden>
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-44" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="hidden h-3.5 w-24 sm:block" />
      <Skeleton className="h-7 w-[86px] rounded-md" />
    </div>
  );
}

export function NoListingsMatch({ canClear, onClear }: { canClear: boolean; onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-mesh-line-soft bg-mesh-panel/50 px-4 py-10 text-center">
      <p className="text-[12.5px] text-muted-foreground">No connections match your filters</p>
      {canClear && (
        <Button
          variant="ghost"
          className="mt-1.5 h-7 px-2.5 text-[12px] font-medium text-mesh-blue hover:bg-mesh-blue-soft/60 hover:text-mesh-blue"
          onClick={onClear}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
