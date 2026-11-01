"use client";

import { cn } from "@/lib/utils";

/**
 * The Meshwork M logo — the left-pane docking control.
 * Clicking it toggles the navigation pane between docked and expanded states
 * (it never navigates away from the current page).
 */
export function MeshLogo({
  onClick,
  collapsed,
  className,
  size = 28,
}: {
  onClick?: () => void;
  collapsed?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        collapsed
          ? "Expand navigation pane (M logo)"
          : "Collapse navigation pane to icon rail (M logo)"
      }
      title={collapsed ? "Meshwork — expand navigation" : "Meshwork — collapse navigation"}
      className={cn(
        "mesh-brand-mark inline-flex shrink-0 items-center justify-center rounded-[9px] font-extrabold tracking-tight",
        "transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.56 }}
    >
      M
    </button>
  );
}
