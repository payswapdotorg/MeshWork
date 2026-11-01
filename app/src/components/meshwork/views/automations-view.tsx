"use client";

/**
 * Automations (zcode scheduled tasks) — list / create / edit internal views.
 *
 * List: status filter pills, task cards with ⋯ actions (run now, pause,
 * restart, delete) and the template catalog. Editor: title, schedule builder
 * (frequency → cron), instructions composer (project / permission mode /
 * model) and, when editing, Settings | History tabs with the run table.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  CircleCheck,
  CirclePause,
  Clock,
  FileText,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { AUTOMATION_TEMPLATES, DEFAULT_MODEL, MESH_MODELS, PERMISSION_MODES } from "@/lib/meshwork/data";
import type { AutomationRunVM, AutomationVM } from "@/lib/meshwork/types";
import {
  useAutomationRuns,
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
  useDeleteAutomationRun,
  useProjects,
  useRunAutomation,
  useUpdateAutomation,
} from "@/hooks/meshwork/use-automations";
import { getNextCronRun, parseCronExpr } from "@/app/api/automations/cron";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/* Schedule builder model                                              */
/* ------------------------------------------------------------------ */

type Frequency = "hourly" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";

interface ScheduleDraft {
  frequency: Frequency;
  /** hourly — minute of the hour, e.g. "30" */
  minute: string;
  /** daily/weekdays/weekly/monthly — "HH:mm" (24h) */
  time: string;
  /** weekly — selected weekdays, 0 = Sunday … 6 = Saturday */
  weekdays: number[];
  /** monthly — day of month, e.g. "1" */
  dayOfMonth: string;
  /** custom — raw 5-field cron expression */
  cronExpr: string;
}

const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "hourly", label: "Every hour" },
  { id: "daily", label: "Every day" },
  { id: "weekdays", label: "Every weekday" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
  { id: "custom", label: "Custom" },
];

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

const DEFAULT_DRAFT: ScheduleDraft = {
  frequency: "daily",
  minute: "00",
  time: "09:00",
  weekdays: [1],
  dayOfMonth: "1",
  cronExpr: "",
};

function timeParts(time: string): { h: number; m: number } {
  const [h, m] = time.split(":");
  const hour = Number.parseInt(h ?? "", 10);
  const minute = Number.parseInt(m ?? "", 10);
  return {
    h: Number.isFinite(hour) ? hour : 9,
    m: Number.isFinite(minute) ? minute : 0,
  };
}

/** Build the 5-field cron expression from the builder selection. */
function draftToCron(d: ScheduleDraft): string {
  switch (d.frequency) {
    case "hourly":
      return `${Number.parseInt(d.minute, 10) || 0} * * * *`;
    case "daily": {
      const { h, m } = timeParts(d.time);
      return `${m} ${h} * * *`;
    }
    case "weekdays": {
      const { h, m } = timeParts(d.time);
      return `${m} ${h} * * 1-5`;
    }
    case "weekly": {
      const { h, m } = timeParts(d.time);
      const dows = [...d.weekdays].sort((a, b) => a - b).join(",") || "1";
      return `${m} ${h} * * ${dows}`;
    }
    case "monthly": {
      const { h, m } = timeParts(d.time);
      return `${m} ${h} ${Number.parseInt(d.dayOfMonth, 10) || 1} * *`;
    }
    case "custom":
      return d.cronExpr.trim();
  }
}

/** Human label derived from the selection, e.g. "Daily at 09:00". */
function draftToLabel(d: ScheduleDraft): string {
  switch (d.frequency) {
    case "hourly":
      return `Every hour at :${d.minute.padStart(2, "0")}`;
    case "daily":
      return `Daily at ${d.time}`;
    case "weekdays":
      return `Every weekday at ${d.time}`;
    case "weekly": {
      const names = [...d.weekdays].sort((a, b) => a - b).map((i) => WEEKDAY_NAMES[i]);
      return `Weekly on ${names.length > 0 ? names.join(", ") : "Monday"} at ${d.time}`;
    }
    case "monthly":
      return `Every month on day ${d.dayOfMonth} at ${d.time}`;
    case "custom":
      return d.cronExpr.trim() || "Custom schedule";
  }
}

function draftValid(d: ScheduleDraft): boolean {
  if (d.frequency === "weekly" && d.weekdays.length === 0) return false;
  if (d.frequency === "custom" && !parseCronExpr(d.cronExpr)) return false;
  return true;
}

/** Best-effort reverse mapping: cron expression → builder draft. */
function cronToDraft(expr: string): ScheduleDraft | null {
  const trimmed = expr.trim();
  if (!trimmed || !parseCronExpr(trimmed)) return null;
  const [m, h, dom, mon, dow] = trimmed.split(/\s+/);
  const time = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  if (dom === "*" && mon === "*" && dow === "*") {
    if (h === "*" && /^\d+$/.test(m)) {
      return { ...DEFAULT_DRAFT, frequency: "hourly", minute: m, cronExpr: trimmed };
    }
    if (h !== "*" && m !== "*") {
      return { ...DEFAULT_DRAFT, frequency: "daily", time, cronExpr: trimmed };
    }
  }
  if (dom === "*" && mon === "*") {
    if (dow === "1-5") return { ...DEFAULT_DRAFT, frequency: "weekdays", time, cronExpr: trimmed };
    if (/^\d$/.test(dow)) {
      return {
        ...DEFAULT_DRAFT,
        frequency: "weekly",
        weekdays: [Number.parseInt(dow, 10)],
        time,
        cronExpr: trimmed,
      };
    }
    if (/^\d+(,\d+)+$/.test(dow) && dow.split(",").every((v) => /^\d$/.test(v))) {
      return {
        ...DEFAULT_DRAFT,
        frequency: "weekly",
        weekdays: dow.split(",").map((v) => Number.parseInt(v, 10)),
        time,
        cronExpr: trimmed,
      };
    }
  }
  if (dow === "*" && mon === "*" && /^\d+$/.test(dom)) {
    return { ...DEFAULT_DRAFT, frequency: "monthly", dayOfMonth: dom, time, cronExpr: trimmed };
  }
  return { ...DEFAULT_DRAFT, frequency: "custom", cronExpr: trimmed };
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const CARD_STATUS: Record<
  AutomationVM["status"],
  { label: string; icon: typeof Clock; cls: string }
> = {
  active: { label: "Active", icon: Clock, cls: "text-mesh-green" },
  paused: { label: "Paused", icon: CirclePause, cls: "text-mesh-quiet" },
  completed: { label: "Completed", icon: CircleCheck, cls: "text-mesh-quiet" },
  failed: { label: "Failure", icon: TriangleAlert, cls: "text-mesh-red" },
};

const EDITOR_STATUS: Record<AutomationVM["status"], { label: string; dot: string }> = {
  active: { label: "Active", dot: "bg-mesh-green" },
  paused: { label: "Paused", dot: "bg-mesh-amber" },
  failed: { label: "Failure", dot: "bg-mesh-red" },
  completed: { label: "Completed", dot: "bg-mesh-quiet" },
};

const RUN_STATUS: Record<AutomationRunVM["status"], { label: string; dot: string; text: string }> = {
  running: { label: "In progress", dot: "bg-mesh-blue", text: "text-mesh-blue" },
  succeeded: { label: "Succeeded", dot: "bg-mesh-green", text: "text-mesh-green" },
  failed: { label: "Failure", dot: "bg-mesh-red", text: "text-mesh-red" },
  stopped: { label: "Stopped", dot: "bg-mesh-quiet", text: "text-muted-foreground" },
  skipped: { label: "Skipped", dot: "bg-mesh-amber", text: "text-mesh-amber" },
};

const TEMPLATE_ICONS: Record<string, typeof Target> = {
  target: Target,
  file: FileText,
  activity: Activity,
  list: List,
};

const LIST_FILTERS = [
  { id: "all", label: "All" },
  { id: "progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
] as const;

type ListFilter = (typeof LIST_FILTERS)[number]["id"];

function matchesFilter(a: AutomationVM, filter: ListFilter): boolean {
  switch (filter) {
    case "progress":
      return a.status === "active" || a.status === "paused";
    case "completed":
      return a.status === "completed";
    case "failed":
      return a.status === "failed";
    default:
      return true;
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "—";
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Next-run date for the card badge — stored value or computed from cron. */
function nextRunOf(a: AutomationVM): Date | null {
  if (a.status !== "active") return null;
  if (a.nextRunAt) return new Date(a.nextRunAt);
  return getNextCronRun(a.cronExpr);
}

function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-3.5 w-3.5 animate-spin", className)} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* Schedule builder                                                    */
/* ------------------------------------------------------------------ */

function ScheduleBuilder({
  draft,
  attempted,
  onChange,
  onClear,
}: {
  draft: ScheduleDraft;
  attempted: boolean;
  onChange: (draft: ScheduleDraft) => void;
  onClear: () => void;
}) {
  const set = (patch: Partial<ScheduleDraft>) => onChange({ ...draft, ...patch });
  const customInvalid = attempted && draft.frequency === "custom" && !parseCronExpr(draft.cronExpr);
  const weekdaysInvalid = attempted && draft.frequency === "weekly" && draft.weekdays.length === 0;

  return (
    <div className="rounded-xl border border-mesh-line bg-mesh-panel p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={draft.frequency} onValueChange={(v) => set({ frequency: v as Frequency })}>
          <SelectTrigger
            aria-label="How often this task runs"
            className="h-8 w-[136px] border-mesh-line bg-mesh-panel-2 text-[12.5px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCIES.map((f) => (
              <SelectItem key={f.id} value={f.id} className="text-[12.5px]">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {draft.frequency === "hourly" && (
          <Select value={draft.minute} onValueChange={(minute) => set({ minute })}>
            <SelectTrigger aria-label="Minute of the hour" className="h-8 w-[76px] border-mesh-line bg-mesh-panel-2 text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {MINUTE_OPTIONS.map((m) => (
                <SelectItem key={m} value={m} className="text-[12.5px]">
                  :{m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(draft.frequency === "daily" ||
          draft.frequency === "weekdays" ||
          draft.frequency === "weekly" ||
          draft.frequency === "monthly") && (
          <Input
            type="time"
            value={draft.time}
            onChange={(e) => set({ time: e.target.value })}
            aria-label="Run time"
            className="h-8 w-[112px] border-mesh-line bg-mesh-panel-2 text-[12.5px]"
          />
        )}

        {draft.frequency === "weekly" && (
          <div className="flex items-center gap-0.5" role="group" aria-label="Days of the week">
            {WEEKDAY_LETTERS.map((letter, i) => {
              const active = draft.weekdays.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={WEEKDAY_NAMES[i]}
                  aria-pressed={active}
                  onClick={() =>
                    set({
                      weekdays: active
                        ? draft.weekdays.filter((d) => d !== i)
                        : [...draft.weekdays, i],
                    })
                  }
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                    active ? "bg-mesh-panel-3 text-white" : "text-mesh-quiet hover:bg-mesh-panel-2"
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {draft.frequency === "monthly" && (
          <Select value={draft.dayOfMonth} onValueChange={(dayOfMonth) => set({ dayOfMonth })}>
            <SelectTrigger aria-label="Day of the month" className="h-8 w-[86px] border-mesh-line bg-mesh-panel-2 text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {DAY_OPTIONS.map((d) => (
                <SelectItem key={d} value={d} className="text-[12.5px]">
                  Day {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {draft.frequency === "custom" && (
          <Input
            value={draft.cronExpr}
            onChange={(e) => set({ cronExpr: e.target.value })}
            placeholder="*/30 * * * *"
            aria-label="Cron expression"
            aria-invalid={customInvalid}
            className={cn(
              "h-8 w-[168px] border-mesh-line bg-mesh-panel-2 font-mono text-[12.5px]",
              customInvalid && "border-mesh-red/70"
            )}
          />
        )}

        <span className="ml-auto text-[12px] text-mesh-quiet" aria-live="polite">
          {draftToLabel(draft)}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          aria-label="Remove schedule"
          className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-3 hover:text-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {weekdaysInvalid && (
        <p className="mt-2 text-[11.5px] text-mesh-red">Pick at least one day of the week.</p>
      )}
      {customInvalid && (
        <p className="mt-2 text-[11.5px] text-mesh-red">Enter a valid cron expression.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task card (list view)                                               */
/* ------------------------------------------------------------------ */

function AutomationCard({
  automation,
  onOpen,
}: {
  automation: AutomationVM;
  onOpen: () => void;
}) {
  const runMutation = useRunAutomation();
  const updateMutation = useUpdateAutomation();
  const deleteMutation = useDeleteAutomation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = CARD_STATUS[automation.status];
  const StatusIcon = status.icon;
  const nextRun = useMemo(() => nextRunOf(automation), [automation]);
  const busy = runMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${automation.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border border-mesh-line bg-mesh-panel p-3 text-left transition-colors hover:bg-mesh-panel-2 focus-visible:outline-2 focus-visible:outline-mesh-blue",
        automation.status === "completed" && "opacity-60"
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13.5px] font-medium text-foreground">{automation.name}</h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-mesh-quiet">
          {automation.prompt}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={cn("flex items-center gap-1.5 text-[12px]", status.cls)}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {status.label}
          </span>
          <span className="rounded-md border border-mesh-green-line bg-mesh-green-soft px-1.5 py-0.5 text-[11px] text-[#8ed9b0]">
            {automation.schedule}
            {nextRun && ` · Next run ${formatDistanceToNow(nextRun, { addSuffix: true })}`}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${automation.name} actions`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-colors hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              className="gap-2 text-[12.5px]"
              disabled={busy}
              onSelect={() =>
                runMutation.mutate(
                  { id: automation.id },
                  { onSuccess: () => toast.success("Triggered — starting soon") }
                )
              }
            >
              <Play className="h-3.5 w-3.5" /> Run now
            </DropdownMenuItem>
            {automation.status === "failed" && (
              <DropdownMenuItem
                className="gap-2 text-[12.5px]"
                disabled={busy}
                onSelect={() =>
                  updateMutation.mutate(
                    { id: automation.id, status: "active" },
                    { onSuccess: () => toast.success("Scheduled task restarted") }
                  )
                }
              >
                <RotateCw className="h-3.5 w-3.5" /> Restart
              </DropdownMenuItem>
            )}
            {automation.status === "active" && (
              <DropdownMenuItem
                className="gap-2 text-[12.5px]"
                disabled={busy}
                onSelect={() =>
                  updateMutation.mutate(
                    { id: automation.id, status: "paused" },
                    { onSuccess: () => toast.success("Scheduled task paused") }
                  )
                }
              >
                <CirclePause className="h-3.5 w-3.5" /> Pause
              </DropdownMenuItem>
            )}
            {automation.status === "paused" && (
              <DropdownMenuItem
                className="gap-2 text-[12.5px]"
                disabled={busy}
                onSelect={() =>
                  updateMutation.mutate(
                    { id: automation.id, status: "active" },
                    { onSuccess: () => toast.success("Scheduled task continued") }
                  )
                }
              >
                <Play className="h-3.5 w-3.5" /> Continue
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="gap-2 text-[12.5px]" onSelect={onOpen}>
              <Pencil className="h-3.5 w-3.5" /> Edit scheduled task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
              onSelect={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="rounded-md bg-mesh-panel-2 px-2 py-0.5 text-[11px] text-mesh-quiet">
          Ran {automation.runCount} times
        </span>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{automation.name}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-mesh-red text-white hover:bg-mesh-red/85"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(
                  { id: automation.id },
                  {
                    onSuccess: () => {
                      setConfirmDelete(false);
                      toast.success("Scheduled task deleted");
                    },
                  }
                );
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Run history table (edit view → History tab)                         */
/* ------------------------------------------------------------------ */

const RUNS_PAGE_SIZE = 8;

function RunHistory({ automationId }: { automationId: string }) {
  const runsQuery = useAutomationRuns(automationId);
  const deleteRun = useDeleteAutomationRun();
  const openTask = useMeshStore((s) => s.openTask);
  const [page, setPage] = useState(0);

  const runs = runsQuery.data?.runs ?? [];
  const pageCount = Math.max(1, Math.ceil(runs.length / RUNS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRuns = runs.slice(safePage * RUNS_PAGE_SIZE, safePage * RUNS_PAGE_SIZE + RUNS_PAGE_SIZE);

  if (runsQuery.isLoading) {
    return (
      <div className="rounded-xl border border-mesh-line-soft bg-mesh-panel/60 p-6">
        <div className="mx-auto h-4 w-40 animate-pulse rounded bg-mesh-panel-3" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/40 px-6 py-10 text-center">
        <p className="text-[13px] text-muted-foreground">No runs yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-mesh-line">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wide text-mesh-quiet">
                Triggered
              </TableHead>
              <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wide text-mesh-quiet">
                Source
              </TableHead>
              <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wide text-mesh-quiet">
                Status
              </TableHead>
              <TableHead className="h-9 text-[11px] font-medium uppercase tracking-wide text-mesh-quiet">
                Duration
              </TableHead>
              <TableHead className="h-9 w-10" aria-label="Run actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRuns.map((run) => {
              const meta = RUN_STATUS[run.status] ?? RUN_STATUS.stopped;
              return (
                <TableRow key={run.id} className="border-mesh-line-soft">
                  <TableCell className="py-2.5 text-[12.5px] text-muted-foreground">
                    {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {run.trigger === "schedule" ? "Scheduled" : "Manual"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span
                      title={run.error ?? undefined}
                      className={cn("flex items-center gap-1.5 text-[12.5px]", meta.text)}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
                      {meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-[12.5px] text-muted-foreground">
                    {formatDuration(run.durationMs)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Run actions — started ${run.startedAt}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-colors hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          className="gap-2 text-[12.5px]"
                          disabled={!run.sessionId}
                          onSelect={() => {
                            if (run.sessionId) {
                              openTask(run.sessionId);
                            } else {
                              toast.info("This run has no session — runs before this build kept no transcript.");
                            }
                          }}
                        >
                          <ArrowLeft className="h-3.5 w-3.5" /> Go to session
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
                          disabled={deleteRun.isPending}
                          onSelect={() =>
                            deleteRun.mutate(
                              { automationId, runId: run.id },
                              { onSuccess: () => toast.success("Run deleted") }
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete run
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <nav
          className="mt-3 flex items-center justify-center gap-1"
          aria-label="Run history pages"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="h-7 px-2 text-[12px] text-mesh-quiet hover:text-foreground"
          >
            Previous
          </Button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === safePage ? "page" : undefined}
              onClick={() => setPage(i)}
              className={cn(
                "h-7 w-7 rounded-md text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                i === safePage
                  ? "bg-mesh-panel-3 font-medium text-white"
                  : "text-mesh-quiet hover:bg-mesh-panel-2 hover:text-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
            className="h-7 px-2 text-[12px] text-mesh-quiet hover:text-foreground"
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor (create + edit)                                              */
/* ------------------------------------------------------------------ */

interface EditorPrefill {
  name?: string;
  prompt?: string;
  cronExpr?: string;
  schedule?: string;
}

function AutomationEditor({
  mode,
  automation,
  prefill,
  onBack,
  onDone,
}: {
  mode: "create" | "edit";
  automation: AutomationVM;
  prefill: EditorPrefill | null;
  onBack: () => void;
  /** return to the list after create/delete */
  onDone: () => void;
}) {
  const isEdit = mode === "edit";
  const createMutation = useCreateAutomation();
  const updateMutation = useUpdateAutomation();
  const runMutation = useRunAutomation();
  const deleteMutation = useDeleteAutomation();
  const projectsQuery = useProjects();

  const projects = projectsQuery.data?.projects ?? [];

  const [name, setName] = useState(isEdit ? automation.name : (prefill?.name ?? ""));
  const [prompt, setPrompt] = useState(isEdit ? automation.prompt : (prefill?.prompt ?? ""));
  const [description] = useState(isEdit ? automation.description : "");
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft | null>(() =>
    isEdit
      ? cronToDraft(automation.cronExpr)
      : prefill?.cronExpr
        ? cronToDraft(prefill.cronExpr)
        : null
  );
  const [target, setTarget] = useState(isEdit ? automation.target : "");
  const [targetTouched, setTargetTouched] = useState(false);
  const [permissionMode, setPermissionMode] = useState(isEdit ? automation.mode : "ask");
  const [model, setModel] = useState(isEdit ? automation.model : DEFAULT_MODEL);
  const [attempted, setAttempted] = useState(false);
  const [tab, setTab] = useState<"settings" | "history">("settings");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  /* The composer project defaults to the first workspace project (create
   * only) until the user picks one — derived at render, never synced in an
   * effect, so the Select, snapshot and payload always agree. */
  const effectiveTarget =
    !isEdit && !targetTouched && target === "" && projects.length > 0
      ? projects[0].name
      : target;

  const valid =
    name.trim() !== "" &&
    prompt.trim() !== "" &&
    scheduleDraft !== null &&
    draftValid(scheduleDraft);

  const snapshot = useMemo(
    () =>
      JSON.stringify([
        name.trim(),
        description,
        prompt.trim(),
        scheduleDraft ? draftToCron(scheduleDraft) : "",
        scheduleDraft ? draftToLabel(scheduleDraft) : "",
        effectiveTarget,
        permissionMode,
        model,
      ]),
    [name, description, prompt, scheduleDraft, effectiveTarget, permissionMode, model]
  );

  /* Dirty-check baseline, derived from the source data instead of a
   * state-freezing effect: the saved automation (edit) or the untouched form
   * (create). Saving stamps an override inside the save handlers below. */
  const savedBaseline = useMemo(() => {
    if (isEdit) {
      const draft = cronToDraft(automation.cronExpr);
      return JSON.stringify([
        automation.name.trim(),
        automation.description,
        automation.prompt.trim(),
        draft ? draftToCron(draft) : "",
        draft ? draftToLabel(draft) : "",
        automation.target,
        automation.mode,
        automation.model,
      ]);
    }
    const draft = prefill?.cronExpr ? cronToDraft(prefill.cronExpr) : null;
    return JSON.stringify([
      (prefill?.name ?? "").trim(),
      "",
      (prefill?.prompt ?? "").trim(),
      draft ? draftToCron(draft) : "",
      draft ? draftToLabel(draft) : "",
      projects.length > 0 ? projects[0].name : "",
      "ask",
      DEFAULT_MODEL,
    ]);
  }, [isEdit, automation, prefill, projects]);
  /* the create form is only comparable once its project default has resolved */
  const baselineReady =
    isEdit || (!projectsQuery.isLoading && (effectiveTarget !== "" || projects.length === 0));
  const [savedOverride, setSavedOverride] = useState<string | null>(null);
  const savedSnapshot = savedOverride ?? savedBaseline;
  const dirty = baselineReady && snapshot !== savedSnapshot;

  const buildPayload = () => ({
    name: name.trim(),
    description,
    cronExpr: scheduleDraft ? draftToCron(scheduleDraft) : "",
    schedule: scheduleDraft ? draftToLabel(scheduleDraft) : "",
    prompt: prompt.trim(),
    target: effectiveTarget,
    mode: permissionMode,
    model,
  });

  const handleBack = () => {
    if (dirty) setConfirmDiscard(true);
    else onBack();
  };

  const submitCreate = () => {
    setAttempted(true);
    if (!valid) return;
    createMutation.mutate(
      { ...buildPayload(), target: effectiveTarget || undefined },
      {
        onSuccess: () => {
          toast.success("Scheduled task created");
          onDone();
        },
      }
    );
  };

  const save = () => {
    setAttempted(true);
    if (!valid) return;
    const snap = snapshot;
    updateMutation.mutate(
      { id: automation.id, ...buildPayload() },
      {
        onSuccess: () => {
          setSavedOverride(snap);
          toast.success("Scheduled task saved");
        },
      }
    );
  };

  const runNow = () => {
    setAttempted(true);
    if (!valid) return;
    const snap = snapshot;
    updateMutation.mutate(
      { id: automation.id, ...buildPayload() },
      {
        onSuccess: () => {
          setSavedOverride(snap);
          runMutation.mutate(
            { id: automation.id },
            {
              onSuccess: () => {
                toast.success("Triggered — starting soon");
                setTab("history");
              },
            }
          );
        },
      }
    );
  };

  const autoSizePrompt = () => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(116, el.scrollHeight)}px`;
  };

  useEffect(autoSizePrompt, [prompt]);

  const editorStatus = EDITOR_STATUS[automation.status];
  const titleError = attempted && name.trim() === "";
  const promptError = attempted && prompt.trim() === "";
  const scheduleError = attempted && scheduleDraft === null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Back to automations"
            className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-2 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {isEdit ? "Edit scheduled task" : "New scheduled task"}
          </h1>
          <p className="mt-1 max-w-[520px] text-[12.5px] leading-relaxed text-muted-foreground">
            {isEdit
              ? "Adjust when this task runs, what it does, and how it works."
              : "Configure when this task runs, what it does, and how it works."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEdit ? (
            <>
              <Button
                onClick={save}
                disabled={updateMutation.isPending}
                className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
              >
                {updateMutation.isPending && <Spinner />}
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={runNow}
                disabled={updateMutation.isPending || runMutation.isPending}
                className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12.5px] hover:bg-mesh-panel-3"
              >
                {runMutation.isPending ? <Spinner /> : <Play className="h-3.5 w-3.5" />}
                {runMutation.isPending ? "Starting…" : "Run now"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Scheduled task actions"
                    className="h-8 w-8 border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {automation.status === "active" && (
                    <DropdownMenuItem
                      className="gap-2 text-[12.5px]"
                      disabled={updateMutation.isPending}
                      onSelect={() =>
                        updateMutation.mutate(
                          { id: automation.id, status: "paused" },
                          { onSuccess: () => toast.success("Scheduled task paused") }
                        )
                      }
                    >
                      <CirclePause className="h-3.5 w-3.5" /> Pause
                    </DropdownMenuItem>
                  )}
                  {automation.status === "paused" && (
                    <DropdownMenuItem
                      className="gap-2 text-[12.5px]"
                      disabled={updateMutation.isPending}
                      onSelect={() =>
                        updateMutation.mutate(
                          { id: automation.id, status: "active" },
                          { onSuccess: () => toast.success("Scheduled task continued") }
                        )
                      }
                    >
                      <Play className="h-3.5 w-3.5" /> Continue
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={submitCreate}
              disabled={!valid || createMutation.isPending}
              className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
            >
              {createMutation.isPending && <Spinner />}
              {createMutation.isPending ? "Creating…" : "Create scheduled task"}
            </Button>
          )}
        </div>
      </div>

      {isEdit && (
        <div
          className="mt-5 inline-flex rounded-lg border border-mesh-line bg-mesh-panel p-0.5"
          role="tablist"
          aria-label="Scheduled task sections"
        >
          {(["settings", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-3 py-1 text-[12.5px] capitalize transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                tab === t
                  ? "bg-mesh-panel-3 font-medium text-white"
                  : "text-mesh-quiet hover:text-foreground"
              )}
            >
              {t === "settings" ? "Settings" : "History"}
            </button>
          ))}
        </div>
      )}

      {(!isEdit || tab === "settings") && (
        <div className="mt-5 max-w-2xl space-y-5">
          {isEdit && (
            <div>
              <Label className="text-[11px] font-medium uppercase tracking-wide text-mesh-quiet">
                Status
              </Label>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", editorStatus.dot)} aria-hidden />
                {editorStatus.label}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="automation-title" className="text-[12.5px] text-foreground">
              Task title
            </Label>
            <Input
              id="automation-title"
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setAttempted(true)}
              placeholder="Untitled Automation"
              aria-invalid={titleError}
              className={cn(
                "mt-1.5 h-9 border-mesh-line bg-mesh-panel-2 text-[13px]",
                titleError && "border-mesh-red/70"
              )}
            />
            {titleError && <p className="mt-1.5 text-[11.5px] text-mesh-red">Title is required.</p>}
          </div>

          <div>
            <Label className="text-[12.5px] text-foreground">Schedule</Label>
            <div className="mt-1.5">
              {scheduleDraft === null ? (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScheduleDraft({ ...DEFAULT_DRAFT })}
                    aria-label="Add a schedule"
                    className={cn(
                      "h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12.5px] hover:bg-mesh-panel-3",
                      scheduleError && "border-mesh-red/70"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add schedule
                  </Button>
                  {scheduleError && (
                    <p className="mt-1.5 text-[11.5px] text-mesh-red">Schedule is required.</p>
                  )}
                </div>
              ) : (
                <ScheduleBuilder
                  draft={scheduleDraft}
                  attempted={attempted}
                  onChange={setScheduleDraft}
                  onClear={() => setScheduleDraft(null)}
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="automation-prompt" className="text-[12.5px] text-foreground">
              Instructions
            </Label>
            <div
              className={cn(
                "mt-1.5 overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel focus-within:border-mesh-blue/50",
                promptError && "border-mesh-red/70"
              )}
            >
              <Textarea
                id="automation-prompt"
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={() => setAttempted(true)}
                placeholder="e.g. Review commits from the last 24 hours and summarize likely bugs and fixes"
                aria-invalid={promptError}
                className="min-h-[116px] resize-none border-0 bg-transparent p-3.5 text-[13px] leading-relaxed shadow-none focus-visible:ring-0 focus-visible:border-transparent placeholder:text-mesh-quiet"
              />
              <div className="flex flex-wrap items-center gap-2 border-t border-mesh-line-soft bg-mesh-panel-2/60 px-2.5 py-2">
                <Select
                  value={effectiveTarget || undefined}
                  onValueChange={(v) => {
                    setTargetTouched(true);
                    setTarget(v);
                  }}
                >
                  <SelectTrigger
                    aria-label="Project"
                    className="h-7 w-[150px] border-mesh-line bg-mesh-panel-2 text-[12px]"
                  >
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.name} className="text-[12.5px]">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={permissionMode} onValueChange={setPermissionMode}>
                  <SelectTrigger
                    aria-label="Permission mode"
                    className="h-7 w-[210px] border-mesh-line bg-mesh-panel-2 text-[12px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_MODES.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-[12.5px]">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger
                    aria-label="Model"
                    className="h-7 w-[150px] border-mesh-line bg-mesh-panel-2 text-[12px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESH_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-[12.5px]">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {promptError && (
              <p className="mt-1.5 text-[11.5px] text-mesh-red">Instructions are required.</p>
            )}
          </div>
        </div>
      )}

      {isEdit && tab === "history" && (
        <div className="mt-5">
          <RunHistory automationId={automation.id} />
        </div>
      )}

      {/* Discard draft */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard scheduled task draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to this scheduled task will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-mesh-red text-white hover:bg-mesh-red/85"
              onClick={() => onBack()}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete (edit mode) */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete “{automation.name}”? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-mesh-red text-white hover:bg-mesh-red/85"
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate(
                  { id: automation.id },
                  {
                    onSuccess: () => {
                      setConfirmDelete(false);
                      toast.success("Scheduled task deleted");
                      onDone();
                    },
                  }
                );
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view (internal router: list | create | edit)                   */
/* ------------------------------------------------------------------ */

/* AutomationVM stand-in for create mode (only static fields are read). */
const AUTOMATION_PLACEHOLDER: AutomationVM = {
  id: "",
  name: "",
  description: "",
  schedule: "",
  cronExpr: "",
  prompt: "",
  target: "",
  mode: "ask",
  model: DEFAULT_MODEL,
  status: "active",
  enabled: true,
  runCount: 0,
  lastRunAt: null,
  nextRunAt: null,
  lastError: null,
};

export function AutomationsView() {
  const automationsQuery = useAutomations();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<EditorPrefill | null>(null);
  const [filter, setFilter] = useState<ListFilter>("all");
  const [sessionKey, setSessionKey] = useState(0);

  const automations = automationsQuery.data?.automations ?? [];
  const editing = useMemo(
    () => automations.find((a) => a.id === editingId) ?? null,
    [automations, editingId]
  );

  const openCreate = (template?: EditorPrefill) => {
    setPrefill(template ?? null);
    setSessionKey((k) => k + 1);
    setView("create");
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setSessionKey((k) => k + 1);
    setView("edit");
  };

  if (view === "create") {
    return (
      <ViewFrame>
        <AutomationEditor
          key={`create-${sessionKey}`}
          mode="create"
          automation={AUTOMATION_PLACEHOLDER}
          prefill={prefill}
          onBack={() => setView("list")}
          onDone={() => setView("list")}
        />
      </ViewFrame>
    );
  }

  /* An open editor whose automation no longer exists (deleted elsewhere)
   * simply falls through to the list below — derived at render, no effect. */
  if (view === "edit" && editing) {
    return (
      <ViewFrame>
        <AutomationEditor
          key={`edit-${sessionKey}`}
          mode="edit"
          automation={editing}
          prefill={null}
          onBack={() => setView("list")}
          onDone={() => setView("list")}
        />
      </ViewFrame>
    );
  }

  const filtered = automations.filter((a) => matchesFilter(a, filter));

  return (
    <ViewFrame>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Automations</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Run tasks on a schedule or whenever you need them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh automations"
            title="Refresh automations"
            onClick={() => {
              void automationsQuery.refetch().then(() => toast.success("Automations refreshed"));
            }}
            className="h-8 w-8 text-muted-foreground hover:bg-mesh-panel-2 hover:text-foreground"
          >
            <RotateCw className={cn("h-3.5 w-3.5", automationsQuery.isFetching && "animate-spin")} />
          </Button>
          <div className="flex">
            <Button
              onClick={() => openCreate()}
              className="mesh-action h-8 gap-1.5 rounded-r-none px-3.5 text-[12.5px] font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Create scheduled task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="More create options"
                  className="mesh-action h-8 rounded-l-none border-l border-black/25 px-1.5"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem
                  className="gap-2 text-[12.5px]"
                  onSelect={() =>
                    toast.info("Switch to a chat and ask Meshwork to schedule it for you")
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Create in chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Loading */}
      {automationsQuery.isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[118px] animate-pulse rounded-xl border border-mesh-line-soft bg-mesh-panel/60"
            />
          ))}
        </div>
      ) : automations.length === 0 ? (
        /* Empty state */
        <div className="mt-5 flex h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-mesh-line bg-mesh-panel/60 px-6 text-center">
          <p className="text-[14px] text-muted-foreground">No scheduled tasks yet.</p>
          <Button
            onClick={() => openCreate()}
            className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Create scheduled task
          </Button>
          <p className="text-[11.5px] text-mesh-quiet">Templates below get you started faster.</p>
        </div>
      ) : (
        <>
          {/* Status filter pills */}
          <div
            className="mt-5 flex flex-wrap items-center gap-1"
            role="group"
            aria-label="Filter scheduled tasks by status"
          >
            {LIST_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                  filter === f.id
                    ? "bg-mesh-panel-3 text-white"
                    : "text-mesh-quiet hover:bg-mesh-panel-2"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Task cards */}
          <section className="mt-4" aria-label="Created tasks">
            <h2 className="text-[13px] font-medium text-foreground">Task created</h2>
            <div className="mt-2.5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((a) => (
                <AutomationCard key={a.id} automation={a} onOpen={() => openEdit(a.id)} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-2.5 rounded-xl border border-mesh-line bg-mesh-panel/60 px-6 py-8 text-center">
                <p className="text-[13px] text-muted-foreground">No tasks match this filter.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Templates */}
      <section className="mt-8" aria-label="Scheduled task templates">
        <h2 className="text-[13px] font-medium text-foreground">Scheduled task template</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AUTOMATION_TEMPLATES.map((t) => {
            const Icon = TEMPLATE_ICONS[t.icon] ?? Target;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  openCreate({
                    name: t.title,
                    prompt: t.prompt,
                    cronExpr: t.cronExpr,
                    schedule: t.schedule,
                  })
                }
                className="rounded-xl border border-mesh-line bg-mesh-panel p-4 text-left transition-colors hover:bg-mesh-panel-2 focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mesh-panel-3 text-muted-foreground"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-[13px] font-medium text-foreground">{t.title}</h3>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <span className="mt-3 inline-block rounded-md border border-mesh-green-line bg-mesh-green-soft px-1.5 py-0.5 text-[11px] text-[#8ed9b0]">
                  {t.schedule}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </ViewFrame>
  );
}

/** Page scaffold matching the sibling views' layout rhythm. */
function ViewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-10">{children}</div>
  );
}
