"use client";

import { cn } from "@/lib/utils";

/**
 * Shared page scaffold for Meshwork workspace views — title, subtitle, action
 * row and a scrollable content column, matching the approved layout rhythm.
 */
export function PageShell({
  title,
  subtitle,
  actions,
  children,
  wide,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", wide ? "max-w-[1200px]" : "max-w-[880px]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** Small uppercase section label used across Meshwork pages. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10px] font-semibold uppercase tracking-[0.16em] text-mesh-quiet", className)}>
      {children}
    </div>
  );
}

/** Honesty chip for illustrative/preview data (design language: LOCAL PREVIEW). */
export function PreviewChip({ label = "Local preview" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.12em] text-mesh-quiet">
      {label}
    </span>
  );
}
