"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDashed,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { useTasks } from "@/hooks/meshwork/use-meshwork-data";
import { usePatchTask } from "@/hooks/meshwork/use-task-messages";
import type { ProjectVM, TaskVM } from "@/lib/meshwork/types";
import { PageShell, SectionLabel } from "../page-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RenameTaskDialog, DeleteTaskDialog } from "./task-parts/task-dialogs";

/**
 * zcode-style Tasks list — pinned tasks first, then project sections with
 * the project dot colour, matching the sidebar. Rows open the conversation
 * view via openTask().
 */

/* Project dot palette — kept in sync with the sidebar (approved concept). */
const PROJECT_DOTS = ["#8aa4d9", "#c58f61", "#8f9aab", "#9d8ad9", "#79cba2", "#d9a17c"];

function projectDot(key: string, index: number) {
  if (key === "field-operations") return PROJECT_DOTS[0];
  if (key === "growth-sales") return PROJECT_DOTS[1];
  if (key === "personal") return PROJECT_DOTS[2];
  return PROJECT_DOTS[index % PROJECT_DOTS.length];
}

/** Compact relative time ("12m", "1h", "1d") used by task rows. */
function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.round(days / 7)}w`;
}

function StatusIcon({ status }: { status: TaskVM["status"] }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 shrink-0 text-mesh-green" aria-hidden />;
  if (status === "in_progress")
    return <CircleDashed className="h-4 w-4 shrink-0 animate-pulse text-mesh-blue" aria-hidden />;
  if (status === "error") return <CircleAlert className="h-4 w-4 shrink-0 text-mesh-red" aria-hidden />;
  return <Circle className="h-4 w-4 shrink-0 text-mesh-quiet" aria-hidden />;
}

function TaskRow({ task }: { task: TaskVM }) {
  const openTask = useMeshStore((s) => s.openTask);
  const activeTaskId = useMeshStore((s) => s.activeTaskId);
  const patch = usePatchTask();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open task ${task.name}`}
        onClick={() => openTask(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openTask(task.id);
          }
        }}
        className={cn(
          "group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-mesh-panel-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mesh-blue",
          activeTaskId === task.id && "bg-mesh-panel-2"
        )}
      >
        <StatusIcon status={task.status} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{task.name}</span>
        <span className="flex shrink-0 items-center gap-2">
          {task.unread && (
            <span className="h-1.5 w-1.5 rounded-full bg-mesh-blue" aria-label="Unread" role="img" />
          )}
          <span className="text-[11px] text-mesh-quiet" title={task.updatedAt}>
            {relTime(task.updatedAt)}
          </span>
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Options for ${task.name}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-opacity hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue",
                  menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                )}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem className="text-[12.5px]" onSelect={() => openTask(task.id)}>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12.5px]"
                onSelect={() => {
                  patch.mutate(
                    { id: task.id, pinned: !task.pinned },
                    { onSuccess: () => toast.success(task.pinned ? "Task unpinned" : "Task pinned") }
                  );
                }}
              >
                {task.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
                {task.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[12.5px]" onSelect={() => setRenameOpen(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[12.5px] text-mesh-red focus:text-mesh-red"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <RenameTaskDialog task={task} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteTaskDialog task={task} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

function TaskSection({
  label,
  dot,
  tasks,
}: {
  label: string;
  dot?: string;
  tasks: TaskVM[];
}) {
  return (
    <section aria-label={label}>
      <div className="flex items-center gap-2 px-1 pb-1.5 pt-1">
        {dot && (
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: dot }} aria-hidden />
        )}
        <SectionLabel>{label}</SectionLabel>
        <span className="text-[10px] text-mesh-quiet/70">{tasks.length}</span>
      </div>
      <div className="flex flex-col">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}

export function TasksView() {
  const setView = useMeshStore((s) => s.setView);
  const tasksQuery = useTasks();
  const [filter, setFilter] = useState("");

  const tasks = tasksQuery.data?.tasks ?? [];
  const projects = tasksQuery.data?.projects ?? [];

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return tasks.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q)
    );
  }, [tasks, filter]);

  const pinned = visible.filter((t) => t.pinned);
  const unpinned = visible.filter((t) => !t.pinned);

  /* Project sections (matches sidebar grouping); tasks without a known
     project fall into "Other". */
  const sections = useMemo(() => {
    const byProject = new Map<string, TaskVM[]>();
    for (const task of unpinned) {
      const list = byProject.get(task.projectId) ?? [];
      list.push(task);
      byProject.set(task.projectId, list);
    }
    const ordered: { project: ProjectVM; tasks: TaskVM[] }[] = [];
    for (const project of projects) {
      const list = byProject.get(project.id);
      if (list && list.length > 0) {
        ordered.push({ project, tasks: list });
        byProject.delete(project.id);
      }
    }
    for (const [projectId, list] of byProject) {
      const name = list[0]?.projectName || "Other";
      ordered.push({ project: { id: projectId, key: projectId, name }, tasks: list });
    }
    return ordered;
  }, [unpinned, projects]);

  return (
    <PageShell
      title="Tasks"
      subtitle={
        tasks.length > 0
          ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} in this workspace — open one to continue its conversation.`
          : "Task sessions from your workspace, grouped by project."
      }
      actions={
        <Button
          size="sm"
          className="h-8 gap-1.5 mesh-action text-[12.5px] font-medium"
          onClick={() => setView("new-task")}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> New task
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="h-8 w-52 border-mesh-line bg-mesh-panel-2/60 text-[12px] placeholder:text-mesh-quiet"
        />
        <span className="text-[11px] text-mesh-quiet">{visible.length} shown</span>
      </div>

      <div className="mt-4 space-y-5">
        {tasksQuery.isLoading && (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg border border-mesh-line-soft bg-mesh-panel/60" />
            ))}
          </div>
        )}

        {!tasksQuery.isLoading && visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/40 p-8 text-center">
            <p className="text-[13px] font-medium text-foreground">
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your search"}
            </p>
            <p className="mx-auto mt-1 max-w-[380px] text-[12px] leading-relaxed text-muted-foreground">
              {tasks.length === 0
                ? "Create one from New task — describe the outcome and Meshwork coordinates the rest."
                : "Try a different search term."}
            </p>
            {tasks.length === 0 && (
              <Button
                size="sm"
                className="mt-4 h-8 gap-1.5 mesh-action text-[12.5px] font-medium"
                onClick={() => setView("new-task")}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> New task
              </Button>
            )}
          </div>
        )}

        {pinned.length > 0 && <TaskSection label="Pinned" tasks={pinned} />}

        {sections.map(({ project, tasks: projectTasks }) => (
          <TaskSection
            key={project.id}
            label={project.name}
            dot={projectDot(project.key, projects.findIndex((p) => p.id === project.id))}
            tasks={projectTasks}
          />
        ))}
      </div>
    </PageShell>
  );
}
