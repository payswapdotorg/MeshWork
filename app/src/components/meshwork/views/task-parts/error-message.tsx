"use client";

import { TriangleAlert } from "lucide-react";
import type { TaskMessageVM } from "@/lib/meshwork/types";

/**
 * zcode error row — a bordered failure notice. Stack-trace-like text
 * (indented "at …" frames, "Error:"/"Traceback" prefixes) renders in mono.
 */
export function ErrorMessage({ message }: { message: TaskMessageVM }) {
  const isStack = /^\s*(at\s|Traceback|\w+Error:)/m.test(message.text);

  return (
    <div
      role="alert"
      className="rounded-lg border border-mesh-red/30 bg-mesh-red-soft px-4 py-3 text-[12.5px] leading-relaxed text-mesh-red"
    >
      <div className="flex items-start gap-2.5">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className={isStack ? "whitespace-pre-wrap break-words font-mono text-[12px]" : "whitespace-pre-wrap break-words"}>
          {message.text || "Something went wrong while running this task."}
        </p>
      </div>
    </div>
  );
}
