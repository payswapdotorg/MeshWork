"use client";

/**
 * Pool terms dialog (Figma frame 8:36) — mirrors the group-buying view's
 * terms flow: no member is charged before the threshold and terms are accepted.
 * Private part of the Marketplace view (Worker 3, Task 2-b).
 */

import { toast } from "sonner";
import type { PoolVM } from "@/lib/meshwork/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PoolTermsDialog({
  pool,
  open,
  onOpenChange,
}: {
  pool: PoolVM | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pool?.name ?? "Group purchase"} — pool terms</DialogTitle>
          <DialogDescription>
            No member is charged before the participation threshold and provider terms have been
            satisfied and accepted.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-2 pl-5 text-[12px] leading-relaxed text-muted-foreground">
          <li>
            The group sets a target price and a minimum number of participants before any provider
            bid is accepted.
          </li>
          <li>
            Each member sees the exact offer, fees, cancellation rules and refund policy before
            committing.
          </li>
          <li>
            Billing starts only after the participation threshold is met and the provider terms are
            accepted by the group.
          </li>
          <li>
            A pool gathers demand to negotiate a bulk connection — it is not the same as bonding
            several internet paths.
          </li>
        </ul>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              toast.success(
                "Request to join recorded — you will see the exact price, expiry, limits and refund terms before any payment."
              );
            }}
          >
            Request to join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
