"use client";

import { useState } from "react";
import { ArrowLeftRight, Users } from "lucide-react";
import { toast } from "sonner";
import { useMarketplace } from "@/hooks/meshwork/use-meshwork-data";
import { useMeshStore } from "@/lib/meshwork/store";
import { PageShell, PreviewChip, SectionLabel } from "../page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GroupBuyingView() {
  const marketplaceQuery = useMarketplace();
  const setView = useMeshStore((s) => s.setView);

  const [termsOpen, setTermsOpen] = useState(false);
  const [area, setArea] = useState("");
  const [participants, setParticipants] = useState("");
  const [deadline, setDeadline] = useState("");

  const pool = marketplaceQuery.data?.pools[0];

  return (
    <PageShell
      title="Group buying"
      subtitle="Pool neighbourhood demand to negotiate better upstream connectivity."
      actions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
          onClick={() => setView("marketplace")}
        >
          <Users className="h-3.5 w-3.5" /> Explore pools
        </Button>
      }
    >
      {/* Active pool */}
      {pool && (
        <section aria-label="Active demand pool" className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mesh-blue-soft text-mesh-blue" aria-hidden>
                  <ArrowLeftRight className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-[13.5px] font-medium text-foreground">{pool.name}</h2>
                  <p className="text-[11px] text-mesh-quiet">{pool.subtitle}</p>
                </div>
              </div>
            </div>
            <span className="rounded-full border border-mesh-green-line bg-mesh-green-soft px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.1em] text-[#8ed9b0]">
              {pool.state}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{pool.members}</span> / {pool.target} members
              </span>
              <span className="text-mesh-blue">{pool.pct}% of participation target</span>
            </div>
            <Progress value={pool.pct} className="mt-2 h-1.5 bg-mesh-panel-3" aria-label={`${pool.pct}% of participation target`} />
            <p className="mt-2 text-[11.5px] leading-relaxed text-mesh-quiet">{pool.note}</p>
          </div>

          <dl className="mt-4 grid gap-2 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.1em] text-mesh-quiet">Target monthly price</dt>
              <dd className="mt-0.5 text-[12.5px] text-foreground">{pool.targetPrice}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.1em] text-mesh-quiet">Commitment deadline</dt>
              <dd className="mt-0.5 text-[12.5px] text-foreground">{pool.deadline}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.1em] text-mesh-quiet">Billing</dt>
              <dd className="mt-0.5 text-[12.5px] text-foreground">{pool.billing}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 mesh-action text-[12.5px] font-medium"
              onClick={() => setTermsOpen(true)}
            >
              View pool terms
            </Button>
            <PreviewChip label="Example pool" />
          </div>
        </section>
      )}

      {/* Create a group purchase */}
      <section className="mt-6" aria-label="Create a group purchase">
        <SectionLabel>Create a group purchase</SectionLabel>
        <p className="mt-1.5 max-w-[560px] text-[12px] leading-relaxed text-muted-foreground">
          Coordinate demand before negotiating with upstream providers.
        </p>
        <div className="mt-3 rounded-xl border border-mesh-line-soft bg-mesh-panel p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pool-area">Choose service area</Label>
              <Input
                id="pool-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={area || "Not selected"}
                className="border-mesh-line bg-mesh-panel-2/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pool-participants">Minimum participants</Label>
              <Input
                id="pool-participants"
                type="number"
                min={2}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Set target"
                className="border-mesh-line bg-mesh-panel-2/60"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pool-deadline">Provider bid window</Label>
              <Input
                id="pool-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
            Members must see the offer, fees, cancellation rules and refund policy before making any
            financial commitment.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              className="h-8 mesh-action text-[12.5px] font-medium"
              disabled={!area.trim() || !participants || Number(participants) < 2}
              onClick={() => {
                toast.success(
                  `Draft pool recorded for “${area.trim()}” — no members can be charged until the threshold, provider terms and refund policy are accepted.`
                );
                setArea("");
                setParticipants("");
                setDeadline("");
              }}
            >
              Start a pool
            </Button>
          </div>
        </div>
      </section>

      {/* Pool terms dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pool?.name} — pool terms</DialogTitle>
            <DialogDescription>
              No member is charged before the participation threshold and provider terms have been
              satisfied and accepted.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-[12px] leading-relaxed text-muted-foreground">
            <li>The group sets a target price and a minimum number of participants before any provider bid is accepted.</li>
            <li>Each member sees the exact offer, fees, cancellation rules and refund policy before committing.</li>
            <li>Billing starts only after the participation threshold is met and the provider terms are accepted by the group.</li>
            <li>A pool gathers demand to negotiate a bulk connection — it is not the same as bonding several internet paths.</li>
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTermsOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setTermsOpen(false);
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
    </PageShell>
  );
}
