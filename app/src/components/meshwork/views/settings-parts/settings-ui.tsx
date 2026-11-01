"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsMap, SettingsValue } from "@/lib/meshwork/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

/* ------------------------------------------------------------------ */
/* Settings data context — every control persists through the API      */
/* ------------------------------------------------------------------ */

export interface SettingsContextValue {
  settings: SettingsMap;
  /** Persist a single settings key via PUT /api/settings. */
  set: (key: string, value: SettingsValue) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsCtx(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsCtx must be used within SettingsView");
  return ctx;
}

/** Read a string setting with a fallback matching DEFAULT_SETTINGS. */
export function settingString(settings: SettingsMap, key: string, fallback = ""): string {
  const value = settings[key];
  return typeof value === "string" ? value : fallback;
}

/** Read a boolean setting with a fallback matching DEFAULT_SETTINGS. */
export function settingBool(settings: SettingsMap, key: string, fallback = false): boolean {
  const value = settings[key];
  return typeof value === "boolean" ? value : fallback;
}

/* ------------------------------------------------------------------ */
/* Section scaffold (zcode SettingsPage content column)                */
/* ------------------------------------------------------------------ */

/**
 * One settings page: h2 title (text-lg font-semibold), optional description,
 * optional header actions, then stacked groups separated by space-y-8.
 */
export function SectionShell({
  id,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

/**
 * zcode settings group card — rounded-xl border on the panel background.
 * Optional title/description header; direct rows are separated by border-t.
 */
export function SettingsGroupCard({
  title,
  description,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = Boolean(title || description);
  return (
    <section
      className={cn("overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel", className)}
    >
      {hasHeader && (
        <div className="px-4 pb-3 pt-4">
          {title && <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>}
          {description && <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">{description}</p>}
        </div>
      )}
      <div
        className={cn(
          hasHeader && "border-t border-mesh-line-soft",
          "divide-y divide-mesh-line-soft",
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * One control row: label + optional description on the left, the control on
 * the right (~192–280px). Rows are separated by border-t inside SettingsGroupCard.
 */
export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  className,
  controlClassName,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
  className?: string;
  controlClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]",
        className
      )}
    >
      <div className="min-w-0">
        {typeof label === "string" ? (
          <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-foreground">
            {label}
          </label>
        ) : (
          <div className="text-[12.5px] font-medium text-foreground">{label}</div>
        )}
        {description && (
          <div className="mt-0.5 text-[11.5px] leading-relaxed text-mesh-quiet">{description}</div>
        )}
      </div>
      {children && (
        <div className={cn("col-start-1 flex items-center justify-end gap-2 sm:col-start-2", controlClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

export interface SegmentedTabOption {
  value: string;
  label: string;
}

/** zcode pill segmented tabs (e.g. Interface mode, scope pickers, stat pills). */
export function SettingsSegmentedTabs({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SegmentedTabOption[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-mesh-line bg-mesh-panel-2 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 shrink-0 whitespace-nowrap rounded-full px-3 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
              active
                ? "bg-mesh-panel-3 text-white"
                : "text-mesh-quiet hover:bg-mesh-panel-3/60 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Search field used by list-style settings sections. */
export function SettingsSearchInput({
  id,
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mesh-quiet"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full border-mesh-line-soft bg-mesh-panel-2/60 pl-8 text-[12px] placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40 sm:w-[240px]"
      />
    </div>
  );
}

/** Toggle bound to a settings key. */
export function SettingSwitch({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  id?: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return <Switch id={id} aria-label={label} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />;
}

/**
 * Text input bound to a settings key. Keeps a local draft and commits on
 * blur / Enter so typing never fights the query refetch.
 */
export function SettingInput({
  id,
  label,
  value,
  onCommit,
  placeholder,
  className,
  mono,
  type = "text",
  autoComplete = "off",
}: {
  id?: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  mono?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  const [draft, setDraft] = useState(value);
  const lastServer = useRef(value);

  /* Adopt fresh server values unless the user has uncommitted edits. */
  useEffect(() => {
    const prev = lastServer.current;
    lastServer.current = value;
    setDraft((d) => (d === prev ? value : d));
  }, [value]);

  const commit = () => {
    const next = draft.trim();
    if (next !== draft) setDraft(next);
    if (next !== value) onCommit(next);
  };

  return (
    <Input
      id={id}
      type={type}
      autoComplete={autoComplete}
      aria-label={label}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={cn(
        "h-8 w-full border-mesh-line-soft bg-mesh-panel-2/60 text-[12px] placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40 sm:w-[220px]",
        mono && "font-mono",
        className
      )}
    />
  );
}

export interface SettingSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Small inline note shown inside the item (used to explain disabled items). */
  hint?: string;
}

/** Select bound to a settings key. */
export function SettingSelect({
  id,
  label,
  value,
  options,
  onValueChange,
  triggerClassName,
  disabled,
}: {
  id?: string;
  label: string;
  value: string;
  options: readonly SettingSelectOption[];
  onValueChange: (value: string) => void;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        disabled={disabled}
        className={cn(
          "h-8 w-full border-mesh-line-soft bg-mesh-panel-2/60 text-[12px] text-foreground hover:bg-mesh-panel-2 focus-visible:ring-mesh-blue-strong/40 sm:w-[220px]",
          triggerClassName
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-mesh-line">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="text-[12px]">
            {option.hint ? (
              <span className="flex flex-col items-start gap-0.5">
                <span>{option.label}</span>
                <span className="text-[10.5px] leading-snug text-mesh-quiet">{option.hint}</span>
              </span>
            ) : (
              option.label
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Read-only value display for rows the user cannot change in this build. */
export function StaticValue({
  value,
  tone = "default",
  mono = false,
}: {
  value: string;
  tone?: "default" | "quiet" | "warn";
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center truncate rounded-full border px-2.5 text-[11px] font-medium",
        tone === "warn"
          ? "border-mesh-line bg-mesh-amber-soft/50 text-mesh-amber"
          : tone === "quiet"
            ? "border-mesh-line bg-mesh-panel-2 text-mesh-quiet"
            : "border-mesh-line bg-mesh-panel-2 text-muted-foreground",
        mono && "font-mono text-[10.5px]"
      )}
    >
      {value}
    </span>
  );
}

/** Honest empty state for capabilities that are not configured in this build. */
export function EmptyState({
  icon: Icon,
  title,
  note,
}: {
  icon: LucideIcon;
  title: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/50 px-5 py-8 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-mesh-panel-2 text-mesh-quiet"
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-3 text-[13px] font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-mesh-quiet">{note}</p>
    </div>
  );
}

/** Small skeleton shown while the settings map loads. */
export function SectionSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading settings…</span>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-2.5 h-3.5 w-72" />
      <div className="mt-5 overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn("flex items-center justify-between gap-6 px-4 py-4", i > 0 && "border-t border-mesh-line-soft")}
          >
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
