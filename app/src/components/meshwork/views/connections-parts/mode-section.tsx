"use client";

import { cn } from "@/lib/utils";
import type { AggregationMode, AggregationModeVM } from "@/lib/meshwork/types";
import { SectionLabel } from "../../page-shell";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ModeSectionProps {
  modes: AggregationModeVM[];
  activeModeId: AggregationMode;
  onSelectMode: (mode: AggregationMode) => void;
}

/**
 * Aggregation strategy — all five modes are always selectable; the honest
 * per-mode explanation and its prerequisites come from the domain model.
 * Bond stays selectable but is flagged "not set up" because it requires a
 * relay endpoint that is not configured on this node.
 */
export function ModeSection({ modes, activeModeId, onSelectMode }: ModeSectionProps) {
  const active = modes.find((m) => m.id === activeModeId);

  return (
    <section aria-label="Aggregation modes" className="mt-7">
      <SectionLabel>Aggregation modes</SectionLabel>
      <p className="mt-1.5 max-w-[560px] text-[12px] leading-relaxed text-muted-foreground">
        Choose the outcome that matters for your traffic.
      </p>

      <RadioGroup
        value={activeModeId}
        onValueChange={(value) => onSelectMode(value as AggregationMode)}
        aria-label="Aggregation mode"
        className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {modes.map((mode) => {
          const selected = mode.id === activeModeId;
          return (
            <label
              key={mode.id}
              htmlFor={`mode-${mode.id}`}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-mesh-blue",
                selected
                  ? "border-mesh-blue-strong/60 bg-mesh-blue-soft/40"
                  : "border-mesh-line-soft bg-mesh-panel hover:border-mesh-blue-strong/40 hover:bg-mesh-panel-2/60"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <RadioGroupItem value={mode.id} id={`mode-${mode.id}`} />
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {mode.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {selected && (
                    <span className="rounded-full border border-mesh-blue-strong/50 bg-mesh-blue-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-mesh-blue">
                      Active
                    </span>
                  )}
                  {mode.id === "bond" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help rounded-full border border-[#6b4d23] bg-mesh-amber-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-mesh-amber">
                          Not set up
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px]">
                        Bonding needs a compatible multipath transport and a relay endpoint — not
                        configured on this node.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </span>
              <span className="text-[11.5px] leading-relaxed text-muted-foreground">
                {mode.summary}
              </span>
            </label>
          );
        })}
      </RadioGroup>

      {/* Strategy explanation — updates with the selected mode */}
      {active && (
        <div className="mt-3 rounded-xl border border-mesh-line-soft border-l-2 border-l-mesh-blue bg-mesh-panel p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] font-medium text-foreground">{active.name}</h3>
            <span className="rounded-full border border-mesh-blue-strong/50 bg-mesh-blue-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-mesh-blue">
              Active strategy
            </span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {active.explanation}
          </p>
        </div>
      )}

      {/* Important distinction — load balancing vs bonding (aggregation specification) */}
      <div className="mt-3 rounded-xl border border-mesh-line-soft border-l-2 border-l-mesh-amber bg-mesh-panel p-4">
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-mesh-amber">Important distinction:</span> regular
          load balancing distributes separate connections. A single download only benefits from
          bonding when its transport or tunnel endpoint can split and reassemble that one logical
          transfer.
        </p>
      </div>
    </section>
  );
}
