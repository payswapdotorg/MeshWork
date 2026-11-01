"use client";

/**
 * "Group purchase" tab (Figma frame 8:36) — the active demand pool at full
 * size plus a compact "Create a group purchase" form. Private part of the
 * Marketplace view (Worker 3, Task 2-b).
 */

import { useState } from "react";
import { toast } from "sonner";
import type { PoolVM } from "@/lib/meshwork/types";
import { SectionLabel } from "../../page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PoolCard, PoolCardSkeleton } from "./pool-card";
import { PoolTermsDialog } from "./pool-terms-dialog";

export function GroupPurchaseTab({
  pool,
  poolLoading,
}: {
  pool: PoolVM | undefined;
  poolLoading: boolean;
}) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [area, setArea] = useState("");
  const [participants, setParticipants] = useState("");
  const [bidWindow, setBidWindow] = useState("");

  const canStart = area.trim().length > 0 && Number(participants) >= 2;

  const startPool = () => {
    if (!canStart) return;
    toast.success(
      "Draft pool recorded — no member can be charged before the threshold and terms are accepted."
    );
    setArea("");
    setParticipants("");
    setBidWindow("");
  };

  return (
    <div>
      {pool ? (
        <PoolCard pool={pool} variant="full" onJoin={() => setTermsOpen(true)} />
      ) : poolLoading ? (
        <PoolCardSkeleton full />
      ) : null}

      <section className="mt-6" aria-label="Create a group purchase">
        <SectionLabel>Create a group purchase</SectionLabel>
        <div className="mt-2.5 rounded-xl border border-mesh-line-soft bg-mesh-panel p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="marketplace-pool-area">Choose service area</Label>
              <Input
                id="marketplace-pool-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. East Legon"
                className="border-mesh-line bg-mesh-panel-2/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="marketplace-pool-participants">Minimum participants</Label>
              <Input
                id="marketplace-pool-participants"
                type="number"
                min={2}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Set target"
                className="border-mesh-line bg-mesh-panel-2/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="marketplace-pool-bid-window">Provider bid window</Label>
              <Input
                id="marketplace-pool-bid-window"
                type="date"
                value={bidWindow}
                onChange={(e) => setBidWindow(e.target.value)}
                className="border-mesh-line bg-mesh-panel-2/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Member allocation</Label>
              <div className="flex h-9 items-center rounded-md border border-mesh-line-soft bg-mesh-panel-2/40 px-3 text-[12.5px] text-muted-foreground">
                Transparent formula
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-mesh-quiet">
            Members must see the offer, fees, cancellation rules and refund policy before making
            any financial commitment.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              className="h-8 mesh-action text-[12.5px] font-medium"
              disabled={!canStart}
              onClick={startPool}
            >
              Start a pool
            </Button>
          </div>
        </div>
      </section>

      <PoolTermsDialog pool={pool} open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}
