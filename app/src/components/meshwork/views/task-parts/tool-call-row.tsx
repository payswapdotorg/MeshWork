"use client";

import { useState } from "react";
import {
  ChevronRight,
  FilePlus,
  Globe,
  ListChecks,
  Pencil,
  Search,
  Square,
  SquareTerminal,
  Trash2,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TaskMessageVM, ToolPayloadVM } from "@/lib/meshwork/types";

/**
 * zcode tool summary row — a one-line collapsed summary per tool call that
 * expands into an arguments/output detail panel.
 */

const TOOL_META: Record<ToolPayloadVM["tool"], { icon: LucideIcon; label: string }> = {
  read: { icon: Search, label: "Read" },
  edit: { icon: Pencil, label: "Edit" },
  write: { icon: FilePlus, label: "Write" },
  delete: { icon: Trash2, label: "Delete" },
  terminal: { icon: SquareTerminal, label: "Terminal" },
  search: { icon: Search, label: "Search" },
  webFetch: { icon: Globe, label: "Fetch" },
  skill: { icon: WandSparkles, label: "Skill" },
  todo: { icon: ListChecks, label: "Todos" },
  browser: { icon: Globe, label: "Browser" },
  taskStop: { icon: Square, label: "Stop" },
};

const STATUS_META: Record<ToolPayloadVM["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-mesh-quiet" },
  running: { label: "Running", className: "text-mesh-blue" },
  completed: { label: "Completed", className: "text-mesh-green" },
  failed: { label: "Failed", className: "text-mesh-red" },
  denied: { label: "Denied", className: "text-mesh-amber" },
  stopped: { label: "Stopped", className: "text-mesh-quiet" },
};

function normalizePayload(message: TaskMessageVM): ToolPayloadVM {
  const payload = (message.payload ?? {}) as Partial<ToolPayloadVM>;
  return {
    tool: payload.tool ?? "search",
    primary: payload.primary ?? (message.text || "tool call"),
    secondary: payload.secondary,
    status: payload.status ?? "completed",
    args: payload.args,
    output: payload.output,
    diff: payload.diff,
  };
}

export function ToolCallRow({ message }: { message: TaskMessageVM }) {
  const [open, setOpen] = useState(false);
  const payload = normalizePayload(message);
  const meta = TOOL_META[payload.tool] ?? TOOL_META.search;
  const status = STATUS_META[payload.status] ?? STATUS_META.completed;
  const Icon = meta.icon;
  const isTerminal = payload.tool === "terminal";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex w-full flex-col">
      <CollapsibleTrigger
        className={cn(
          "group/tool inline-flex cursor-pointer items-center gap-2 self-start rounded-md py-0.5 text-left text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-mesh-quiet" aria-hidden />
        <span className="shrink-0 font-medium text-mesh-quiet">{meta.label}</span>
        <span
          className={cn(
            "min-w-0 max-w-[22rem] truncate text-[#c4c6ca]",
            isTerminal ? "font-mono text-[12.5px]" : "text-[13px]"
          )}
        >
          {payload.primary}
        </span>
        {payload.secondary && (
          <span className="hidden min-w-0 max-w-[16rem] truncate text-[12px] text-mesh-quiet md:inline">
            {payload.secondary}
          </span>
        )}
        {payload.diff && (
          <span className="shrink-0 font-mono text-[11px]" aria-label={`${payload.diff.added} added, ${payload.diff.removed} removed`}>
            <span className="text-mesh-green">+{payload.diff.added}</span>{" "}
            <span className="text-mesh-red">-{payload.diff.removed}</span>
          </span>
        )}
        <span className={cn("shrink-0 text-[11.5px]", status.className)} title={payload.status === "failed" ? "Tool call failed" : undefined}>
          {status.label}
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-mesh-quiet transition-transform duration-200",
            open ? "rotate-90 opacity-100" : "opacity-40 group-hover/tool:opacity-100"
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full">
        <div className="my-1 w-full space-y-3 rounded-xl border border-mesh-line bg-mesh-panel-2 px-4 py-3">
          {payload.args && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mesh-quiet">Arguments</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-[#c4c6ca]">
                {payload.args}
              </pre>
            </div>
          )}
          {payload.output && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-mesh-quiet">
                {isTerminal ? "Output" : "Result"}
              </p>
              <pre className="max-h-72 overflow-y-auto rounded-lg bg-mesh-dock p-3 font-mono text-[12px] leading-relaxed text-[#c5d0c8]">
                {payload.output}
              </pre>
            </div>
          )}
          {!payload.args && !payload.output && (
            <p className="text-[12px] text-mesh-quiet">No output.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
