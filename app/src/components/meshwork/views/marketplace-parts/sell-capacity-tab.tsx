"use client";

/**
 * "Sell capacity" tab (Figma frame 8:36) — the offer-configuration flow:
 * sharing envelope, publish checklist and the sharing-permission review.
 * Private part of the Marketplace view (Worker 3, Task 2-b).
 */

import { useState } from "react";
import { Info } from "lucide-react";
import { PUBLISH_REQUIREMENTS, SHARING_ENVELOPE } from "@/lib/meshwork/data";
import { SectionLabel } from "../../page-shell";
import { Button } from "@/components/ui/button";
import { SharingConsentDialog } from "../my-offers-view";

export function SellCapacityTab() {
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <div>
      <section aria-label="Offer configuration" className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-5">
        <h2 className="text-[15px] font-semibold text-foreground">Your network. Your rules.</h2>
        <p className="mt-1 max-w-[560px] text-[12px] leading-relaxed text-muted-foreground">
          Choose what can be shared, who can use it, and when the node is available. No sharing
          starts automatically.
        </p>
        <dl className="mt-4 grid gap-2 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-4 sm:grid-cols-2">
          {SHARING_ENVELOPE.map((entry) => (
            <div key={entry.label} className="flex flex-col">
              <dt className="text-[10.5px] uppercase tracking-[0.1em] text-mesh-quiet">
                {entry.label}
              </dt>
              <dd className="mt-0.5 text-[12px] text-muted-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-5" aria-label="Before you publish">
        <SectionLabel>Before you publish</SectionLabel>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {PUBLISH_REQUIREMENTS.map((req) => (
            <div
              key={req.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-mesh-line-soft bg-mesh-panel p-3.5"
            >
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-foreground">{req.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  {req.note}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-[#6b4d23] bg-mesh-amber-soft px-2 py-0.5 text-[9.5px] font-semibold tracking-wide text-mesh-amber">
                {req.state}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            className="h-8 mesh-action text-[12.5px] font-medium"
            onClick={() => setConsentOpen(true)}
          >
            Review sharing permissions
          </Button>
          <p className="flex items-center gap-1.5 text-[11.5px] text-mesh-quiet">
            <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Nothing is shared automatically.
          </p>
        </div>
      </section>

      <SharingConsentDialog open={consentOpen} onOpenChange={setConsentOpen} action="permission" />
    </div>
  );
}
