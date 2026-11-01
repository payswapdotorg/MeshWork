"use client";

/**
 * "View offer" dialog — what to compare before committing to a marketplace
 * listing, with an honest disabled purchase state (Figma frame 8:36).
 * Private part of the Marketplace view (Worker 3, Task 2-b).
 */

import { ShieldAlert } from "lucide-react";
import type { MarketplaceListingVM } from "@/lib/meshwork/types";
import { PreviewChip, SectionLabel } from "../../page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COMPARE_POINTS: ReadonlyArray<{ label: string; detail: string }> = [
  { label: "Measured path quality", detail: "Latency, jitter, loss" },
  { label: "Price basis", detail: "Per session / GB / month" },
  { label: "Access scope", detail: "Device and duration" },
  { label: "Provider eligibility", detail: "Permission evidence" },
];

export function OfferDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: MarketplaceListingVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {listing && (
          <>
            <DialogHeader>
              <DialogTitle>{listing.name}</DialogTitle>
              <DialogDescription>{listing.provider}</DialogDescription>
            </DialogHeader>

            <div>
              <SectionLabel>What to compare</SectionLabel>
              <ul className="mt-2 space-y-1.5">
                {COMPARE_POINTS.map((point) => (
                  <li
                    key={point.label}
                    className="rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 px-3 py-2 text-[12px] leading-relaxed"
                  >
                    <span className="font-medium text-foreground">{point.label}</span>
                    <span className="text-mesh-quiet"> — {point.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mesh-amber" aria-hidden />
              Do not pay or commit until the exact price, provider, expiry, limits and refund terms
              are shown.
            </p>

            <div>
              <PreviewChip label="Design preview — not a live offer" />
            </div>

            <DialogFooter className="flex-col items-stretch gap-1.5 sm:flex-col sm:items-stretch">
              <Button
                disabled
                size="sm"
                className="h-8 mesh-action text-[12.5px] font-medium"
              >
                Purchase access
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-mesh-quiet">
                Purchasing requires a verified provider offer and a configured payment method.
              </p>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
