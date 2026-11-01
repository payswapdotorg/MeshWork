"use client";

import { useState } from "react";
import { Info, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PUBLISH_REQUIREMENTS, SHARING_ENVELOPE } from "@/lib/meshwork/data";
import { useMeshStore } from "@/lib/meshwork/store";
import { PageShell, PreviewChip, SectionLabel } from "../page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SharingConsentDialog({
  open,
  onOpenChange,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "offer" | "permission";
}) {
  const [checks, setChecks] = useState([false, false, false]);
  const allChecked = checks.every(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review sharing permissions</DialogTitle>
          <DialogDescription>
            A real node must verify each grant and the ISP terms before applying a gateway or
            marketplace change. In this preview, your consent is recorded locally only.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5 py-1">
          {[
            "I am the owner or authorised operator of this connection and this node.",
            "My internet plan permits the intended sharing or resale.",
            "I agree to guest-network isolation and the stated capacity/data/schedule limits.",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-3">
              <Checkbox
                id={`consent-${i}`}
                checked={checks[i]}
                onCheckedChange={(v) =>
                  setChecks((prev) => prev.map((c, idx) => (idx === i ? v === true : c)))
                }
                className="mt-0.5"
              />
              <Label htmlFor={`consent-${i}`} className="cursor-pointer text-[12px] font-normal leading-relaxed text-muted-foreground">
                {text}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!allChecked}
            onClick={() => {
              onOpenChange(false);
              setChecks([false, false, false]);
              toast.success(
                action === "offer"
                  ? "Offer consent recorded — publishing still requires ISP authorisation evidence and a verified node."
                  : "Grant recorded as pending — activation requires owner consent, ISP terms verification and guest isolation."
              );
            }}
          >
            Confirm review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MyOffersView() {
  const setView = useMeshStore((s) => s.setView);
  const [consentOpen, setConsentOpen] = useState(false);

  return (
    <PageShell
      title="My Offers"
      subtitle="Your published capacity offers and their status. Sharing is off — nothing is shared automatically."
    >
      {/* Honest empty state — no offer service is configured */}
      <section className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mesh-panel-2 text-mesh-quiet" aria-hidden>
            <Tag className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-medium text-foreground">No offers published</h2>
            <p className="text-[11.5px] text-mesh-quiet">Sharing is off on this node</p>
          </div>
          <span className="ml-auto rounded-full border border-mesh-line bg-mesh-panel-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
            Sharing off
          </span>
        </div>
        <p className="mt-3 max-w-[560px] text-[12px] leading-relaxed text-muted-foreground">
          Turn an eligible connection into a local offer. Nothing is shared automatically — an offer
          only goes live after owner consent, ISP authorisation evidence, guest isolation and
          metering are all in place.
        </p>

        <div className="mt-4 grid gap-2 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-4 sm:grid-cols-2">
          {SHARING_ENVELOPE.map((e) => (
            <div key={e.label} className="flex flex-col">
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-mesh-quiet">{e.label}</span>
              <span className="mt-0.5 text-[12px] text-muted-foreground">{e.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="h-8 mesh-action text-[12.5px] font-medium"
            onClick={() => setConsentOpen(true)}
          >
            Configure offer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-mesh-line bg-mesh-panel-2 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => setView("marketplace")}
          >
            Explore the marketplace
          </Button>
          <span className="ml-auto">
            <PreviewChip />
          </span>
        </div>
      </section>

      {/* Before you publish */}
      <section className="mt-5" aria-label="Before you publish">
        <SectionLabel>Before you publish</SectionLabel>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {PUBLISH_REQUIREMENTS.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 rounded-lg border border-mesh-line-soft bg-mesh-panel p-3.5">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-foreground">{r.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">{r.note}</p>
              </div>
              <span className="shrink-0 rounded-full border border-[#6b4d23] bg-mesh-amber-soft px-2 py-0.5 text-[9.5px] font-semibold tracking-wide text-mesh-amber">
                {r.state}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-mesh-quiet">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          A provider pool and a group purchase are different concepts — selling spare capacity is
          neither. All capacity-sharing actions stay behind their approval flow.
        </p>
      </section>

      <SharingConsentDialog open={consentOpen} onOpenChange={setConsentOpen} action="offer" />
    </PageShell>
  );
}
