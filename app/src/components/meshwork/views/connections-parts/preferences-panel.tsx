"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EstimateVM, OptimiseFor } from "@/lib/meshwork/types";
import { SectionLabel } from "../../page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Mirrors the API validation range for maxSpendPerDay (0–1000). */
const MAX_SPEND_LIMIT = 1000;

const OPTIMISE_OPTIONS: { value: OptimiseFor; label: string }[] = [
  { value: "cost", label: "Lowest cost" },
  { value: "latency", label: "Lowest latency" },
  { value: "throughput", label: "Highest throughput" },
  { value: "availability", label: "Availability" },
];

interface PreferencesPanelProps {
  optimiseFor: OptimiseFor;
  maxSpendPerDay: number | null;
  selectedCount: number;
  totalPaths: number;
  estimate: EstimateVM;
  onOptimiseFor: (value: OptimiseFor) => void;
  onMaxSpendPerDay: (value: number | null) => void;
}

/**
 * Preferences + estimate — a single two-column card. The estimate wording is
 * produced by the domain model and states its own provenance; it is never
 * replaced with a simple sum claim.
 */
export function PreferencesPanel({
  optimiseFor,
  maxSpendPerDay,
  selectedCount,
  totalPaths,
  estimate,
  onOptimiseFor,
  onMaxSpendPerDay,
}: PreferencesPanelProps) {
  /* Local draft keeps typing stable (committed on blur / Enter). While no
     edit is in flight the input mirrors the persisted value, so external
     changes (server hydration) flow through without an effect. */
  const [spendDraft, setSpendDraft] = useState<string | null>(null);
  const spendValue = spendDraft ?? (maxSpendPerDay === null ? "" : String(maxSpendPerDay));

  const commitSpend = () => {
    const trimmed = spendValue.trim();
    setSpendDraft(null);
    if (trimmed === "") {
      if (maxSpendPerDay !== null) onMaxSpendPerDay(null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_SPEND_LIMIT) {
      toast.error(`Enter a maximum spend between 0 and ${MAX_SPEND_LIMIT}, or clear the field.`);
      return;
    }
    if (parsed !== maxSpendPerDay) onMaxSpendPerDay(parsed);
  };

  return (
    <section
      aria-label="Preferences and estimate"
      className="mt-7 overflow-hidden rounded-xl border border-mesh-line-soft bg-mesh-panel"
    >
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-mesh-line-soft">
        {/* Preferences */}
        <div className="p-5">
          <SectionLabel>Preferences</SectionLabel>
          <div className="mt-3.5 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="optimise-for">Optimise for</Label>
              <Select value={optimiseFor} onValueChange={(value) => onOptimiseFor(value as OptimiseFor)}>
                <SelectTrigger
                  id="optimise-for"
                  className="h-9 w-full border-mesh-line bg-mesh-panel-2/60 text-[12.5px]"
                >
                  <SelectValue placeholder="Choose an objective" />
                </SelectTrigger>
                <SelectContent>
                  {OPTIMISE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-[12.5px]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="max-spend">Maximum spend per day</Label>
              <Input
                id="max-spend"
                type="number"
                inputMode="decimal"
                min={0}
                max={MAX_SPEND_LIMIT}
                value={spendValue}
                onChange={(e) => setSpendDraft(e.target.value)}
                onBlur={commitSpend}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder="No limit set"
                aria-describedby="max-spend-note"
                className="h-9 border-mesh-line bg-mesh-panel-2/60 text-[12.5px]"
              />
              <p id="max-spend-note" className="text-[11px] leading-relaxed text-mesh-quiet">
                Recorded locally — enforcement requires a configured payment rail.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-mesh-line-soft pt-3.5">
              <span className="text-[12px] text-muted-foreground">Paths selected</span>
              <span className="text-[13px] font-semibold text-foreground">
                {selectedCount}
                <span className="font-normal text-mesh-quiet"> / {totalPaths}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Estimate — provenance wording comes from the domain model */}
        <div className="border-t border-mesh-line-soft p-5 lg:border-t-0">
          <SectionLabel>Estimated aggregate</SectionLabel>
          <p className="mt-3 text-[12px] font-medium text-foreground">{estimate.label}</p>
          <p
            className={cn(
              "mt-1.5 text-[19px] font-semibold leading-snug",
              estimate.provenance === "unavailable" ? "text-mesh-amber" : "text-foreground"
            )}
          >
            {estimate.value}
          </p>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {estimate.note}
          </p>
        </div>
      </div>
    </section>
  );
}
