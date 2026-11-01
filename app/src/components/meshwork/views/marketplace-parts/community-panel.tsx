"use client";

/**
 * Right community panel (Figma frame 8:36) — constant across marketplace tabs:
 * group purchases, offer spare capacity and the sharing envelope.
 * Stacks below the main column on <lg. Private part of the Marketplace view
 * (Worker 3, Task 2-b).
 */

import { useState } from "react";
import { SHARING_ENVELOPE } from "@/lib/meshwork/data";
import type { PoolVM } from "@/lib/meshwork/types";
import { useMeshStore } from "@/lib/meshwork/store";
import { Button } from "@/components/ui/button";
import { SharingConsentDialog } from "../my-offers-view";
import { PoolCard, PoolCardSkeleton } from "./pool-card";
import { PoolTermsDialog } from "./pool-terms-dialog";

export function CommunityPanel({
  pool,
  poolLoading,
}: {
  pool: PoolVM | undefined;
  poolLoading: boolean;
}) {
  const setView = useMeshStore((s) => s.setView);
  const [termsOpen, setTermsOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <aside
      aria-label="Community"
      className="w-full shrink-0 rounded-xl border border-mesh-line-soft bg-mesh-panel p-4 lg:w-[330px] lg:self-start"
    >
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          className="h-7 rounded-full mesh-action px-3 text-[12px] font-medium"
          onClick={() => setView("group-buying")}
        >
          Community network
        </Button>
      </div>

      {/* Group purchases */}
      <section aria-label="Group purchases" className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-foreground">Group purchases</h2>
          <span className="rounded-full bg-mesh-blue-soft px-2.5 py-0.5 text-[10px] font-medium text-mesh-blue">
            Community initiated
          </span>
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">
          Pool demand to negotiate a better upstream connection.
        </p>
        {pool ? (
          <div className="mt-3">
            <PoolCard pool={pool} onJoin={() => setTermsOpen(true)} />
          </div>
        ) : poolLoading ? (
          <div className="mt-3">
            <PoolCardSkeleton />
          </div>
        ) : null}
      </section>

      <div className="my-4 border-t border-mesh-line-soft" role="presentation" />

      {/* Offer spare capacity */}
      <section aria-label="Offer spare capacity">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-foreground">Offer spare capacity</h2>
          <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Sharing is off
          </span>
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">
          Turn an eligible connection into a local service offer.
        </p>

        <div className="mt-3 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-3.5">
          <h3 className="text-[12.5px] font-medium text-foreground">Your network. Your rules.</h3>
          <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">
            Choose what can be shared, who can use it, and when the node is available. No sharing
            starts automatically.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
            {SHARING_ENVELOPE.map((entry) => (
              <div key={entry.label} className="flex flex-col">
                <dt className="text-[10px] uppercase tracking-[0.1em] text-mesh-quiet">
                  {entry.label}
                </dt>
                <dd className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
          <Button
            size="sm"
            className="mt-3.5 h-8 w-full mesh-action text-[12.5px] font-medium"
            onClick={() => setConsentOpen(true)}
          >
            Configure offer
          </Button>
        </div>
      </section>

      <PoolTermsDialog pool={pool} open={termsOpen} onOpenChange={setTermsOpen} />
      <SharingConsentDialog open={consentOpen} onOpenChange={setConsentOpen} action="offer" />
    </aside>
  );
}
