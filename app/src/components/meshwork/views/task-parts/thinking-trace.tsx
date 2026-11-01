"use client";

import { useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * zcode thinking trace (Reasoning) — a collapsible reasoning row. Collapsed
 * it is one subtle line with the duration; expanded it reveals the raw
 * reasoning text in a left-bordered scroll area.
 */
export function ThinkingTrace({
  text,
  durationMs,
  active = false,
}: {
  text: string;
  durationMs: number | null;
  /** in-progress task and this is the live reasoning row → "Thinking" */
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const seconds = durationMs !== null ? Math.max(1, Math.round(durationMs / 1000)) : null;
  const preview = text.replace(/\s+/g, " ").trim().slice(0, 60);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Collapse thinking trace" : "Expand thinking trace"}
        className="group flex w-full items-center gap-2 rounded-md py-0.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
      >
        <Brain className="h-4 w-4 shrink-0 text-mesh-quiet" aria-hidden />
        <span
          className={cn(
            "shrink-0 text-[12.5px] text-mesh-quiet",
            active && "animate-pulse"
          )}
        >
          <span className="font-medium">{active ? "Thinking" : "Thought"}</span>
          {!active && (seconds !== null ? ` · ${seconds} second${seconds === 1 ? "" : "s"}` : " · a few seconds")}
        </span>
        {!open && (
          <span className="min-w-0 flex-1 truncate text-[12px] text-mesh-quiet/70" aria-hidden>
            {preview}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-mesh-quiet transition-transform duration-200",
            open ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="ml-2 mt-2 max-h-60 overflow-y-auto border-l border-mesh-line pl-3.5">
          <p className="whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-mesh-quiet">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
