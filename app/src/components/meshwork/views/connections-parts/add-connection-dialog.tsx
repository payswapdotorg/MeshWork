"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REAL_ADD_REQUIREMENTS = [
  "Interface enumeration from the local adapter, with owner approval for each new path.",
  "A measured baseline — latency, loss and goodput — before a path joins the inventory.",
  "Advertised plan rates stay labelled as advertised until a measurement exists.",
];

/**
 * Add-connection dialog — honest about the current mode: the local network
 * adapter is diagnostics-only, so no path can be created. The click is
 * recorded as an intent only (design preview).
 */
export function AddConnectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a connection</DialogTitle>
          <DialogDescription>
            The local network adapter is running in diagnostics-only mode. It can observe and
            probe interfaces, but it cannot create or enrol a new internet path.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5 py-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
            What a real add flow requires
          </p>
          <ul className="grid gap-2">
            {REAL_ADD_REQUIREMENTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/40 p-3 text-[12px] leading-relaxed text-muted-foreground"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mesh-quiet"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11.5px] leading-relaxed text-mesh-quiet">
            In this design preview, adding a connection is recorded as an intent only — no path
            is created and no setting changes.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="mesh-action font-medium"
            onClick={() => {
              onOpenChange(false);
              toast.success(
                "Intent recorded — the adapter is diagnostics-only, so no path was added."
              );
            }}
          >
            Record intent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
