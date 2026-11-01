"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * zcode working indicator — shown after the last trace row while the task
 * runs: a spinning loader, the "Working" label and a live elapsed timer
 * counting up from the task's last update.
 */
export function WorkingIndicator({ since, label = "Working" }: { since: string; label?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsedMs = Math.max(0, now - new Date(since).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const clock =
    minutes > 0
      ? `${minutes}:${String(seconds).padStart(2, "0")}`
      : `0:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 py-1.5" role="status" aria-live="polite" aria-label={`${label} — elapsed ${clock}`}>
      <Loader2 className="h-3.5 w-3.5 animate-spin text-mesh-quiet" aria-hidden />
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <span className="text-[11px] tabular-nums text-mesh-quiet">{clock}</span>
    </div>
  );
}
