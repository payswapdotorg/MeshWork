"use client";

import { useState } from "react";
import { House, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNodes } from "@/hooks/meshwork/use-meshwork-data";
import { PageShell, PreviewChip, SectionLabel } from "../page-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SharingConsentDialog } from "./my-offers-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function NodesView() {
  const nodesQuery = useNodes();
  const [consentOpen, setConsentOpen] = useState(false);
  const [enrolOpen, setEnrolOpen] = useState(false);
  const [nodeName, setNodeName] = useState("");

  const nodes = nodesQuery.data?.nodes ?? [];
  const permissions = nodesQuery.data?.permissions ?? [];
  const note = nodesQuery.data?.note;

  return (
    <PageShell
      title="Devices & Nodes"
      subtitle="Each node advertises only the capabilities its owner has explicitly enabled."
      actions={
        <Button
          size="sm"
          className="h-8 gap-1.5 mesh-action text-[12.5px] font-medium"
          onClick={() => setEnrolOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Enrol a node
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {nodesQuery.isLoading &&
          [0, 1].map((i) => (
            <div key={i} className="h-[168px] animate-pulse rounded-xl border border-mesh-line-soft bg-mesh-panel/60" />
          ))}
        {nodes.map((n) => (
          <article key={n.id} className="rounded-xl border border-mesh-line-soft bg-mesh-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    n.online ? "bg-mesh-green-soft text-mesh-green" : "bg-mesh-panel-2 text-mesh-quiet"
                  )}
                  aria-hidden
                >
                  <House className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-medium text-foreground">{n.name}</h3>
                  <p className="mt-0.5 text-[11.5px] text-mesh-quiet">{n.subtitle}</p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 text-[9.5px] font-semibold tracking-[0.1em]",
                  n.online
                    ? "border-mesh-green-line bg-mesh-green-soft text-[#8ed9b0]"
                    : "border-mesh-line bg-mesh-panel-2 text-mesh-quiet"
                )}
              >
                {n.online ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {n.capabilities.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2.5 py-1 text-[10.5px] text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-mesh-quiet">{n.note}</p>
          </article>
        ))}
      </div>

      {/* Node permission policy */}
      <section className="mt-6" aria-label="Node permission policy">
        <div className="flex items-center justify-between">
          <SectionLabel>Node permission policy</SectionLabel>
          <PreviewChip />
        </div>
        {note && <p className="mt-1.5 text-[11.5px] text-mesh-quiet">{note}</p>}
        <div className="mt-2.5 overflow-hidden rounded-xl border border-mesh-line-soft bg-mesh-panel">
          {permissions.map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3",
                i > 0 && "border-t border-mesh-line-soft"
              )}
            >
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-foreground">{p.label}</p>
                <p className="text-[11px] text-mesh-quiet">
                  {p.state} · explicit, scoped authorisation required
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Label htmlFor={`perm-${p.id}`} className="sr-only">
                  {p.label}
                </Label>
                <span className={p.enabled ? "text-[11px] text-[#8ed9b0]" : "text-[11px] text-mesh-quiet"}>
                  {p.enabled ? "On" : p.state}
                </span>
                <Switch
                  id={`perm-${p.id}`}
                  checked={p.enabled}
                  disabled={p.id === "multipath"}
                  onCheckedChange={() => setConsentOpen(true)}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-mesh-quiet">
          Hotspot, relay, exit-node and capacity-sharing grants are separate. Installing the
          application does not enable sharing.
        </p>
      </section>

      <SharingConsentDialog open={consentOpen} onOpenChange={setConsentOpen} action="permission" />

      {/* Enrol a node — honest not-configured state */}
      <Dialog open={enrolOpen} onOpenChange={setEnrolOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enrol a node</DialogTitle>
            <DialogDescription>
              Enrollment pairs a device with this workspace through the local node service. The
              enrollment service is not configured in this preview — your intent is recorded locally.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1">
            <Label htmlFor="node-name">Node name</Label>
            <Input
              id="node-name"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="e.g. Hallway gateway"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEnrolOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!nodeName.trim()}
              onClick={() => {
                setEnrolOpen(false);
                toast.success(`Enrollment intent recorded for “${nodeName.trim()}” — requires the local node service to pair.`);
                setNodeName("");
              }}
            >
              Record enrollment intent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
