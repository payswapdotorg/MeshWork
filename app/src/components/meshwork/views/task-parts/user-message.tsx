"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskMessageVM } from "@/lib/meshwork/types";

/**
 * zcode user message — right-aligned bubble with a hover copy action.
 */
export function UserMessage({ message }: { message: TaskMessageVM }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  return (
    <div className="group flex flex-col items-end">
      <div className="max-w-[36rem] rounded-xl rounded-tr-sm border border-mesh-line bg-mesh-panel-2 px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-foreground">
        {message.text}
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy message"}
        className={cn(
          "mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-opacity hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue",
          copied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-mesh-green" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      </button>
    </div>
  );
}
