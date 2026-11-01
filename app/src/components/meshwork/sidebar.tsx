"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  Hash,
  ListFilter,
  MessageCirclePlus,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { NAV_PRIMARY, NAV_SECONDARY, type NavItem } from "@/lib/meshwork/navigation";
import { useNodes, useSettings } from "@/hooks/meshwork/use-meshwork-data";
import {
  useCreateGroup,
  useDeleteGroup,
  useGroups,
  useMoveTaskToGroup,
  useUpdateGroup,
} from "@/hooks/meshwork/use-groups";
import type {
  MeshView,
  ProjectVM,
  TaskGroupColor,
  TaskGroupVM,
  TaskVM,
} from "@/lib/meshwork/types";
import { MeshLogo } from "./mesh-logo";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* Project dot palette (approved concept: #8aa4d9 · #c58f61 · #8f9aab) */
const PROJECT_DOTS = ["#8aa4d9", "#c58f61", "#8f9aab", "#9d8ad9", "#79cba2", "#d9a17c"];

function projectDot(key: string, index: number) {
  if (key === "field-operations") return PROJECT_DOTS[0];
  if (key === "growth-sales") return PROJECT_DOTS[1];
  if (key === "personal") return PROJECT_DOTS[2];
  return PROJECT_DOTS[index % PROJECT_DOTS.length];
}

/** Compact relative time ("12m", "1h", "1d") used by the task list. */
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

/* ------- Task groups (zcode "By group" sidebar view) ------- */

/** Approved group palette (zcode group colors) with hex values for rgba tints. */
const GROUP_HEX: Record<TaskGroupColor, string> = {
  gray: "#9ca3af",
  red: "#f87171",
  orange: "#fb923c",
  yellow: "#facc15",
  green: "#4ade80",
  blue: "#60a5fa",
  purple: "#c084fc",
};

function groupRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** TASKS section view filter (persisted in localStorage). */
type TaskViewMode = "recent" | "grouped" | "unread";
const TASK_VIEW_STORAGE_KEY = "meshwork-task-view";
const TASK_VIEW_OPTIONS: { value: TaskViewMode; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "grouped", label: "By group" },
  { value: "unread", label: "Unread" },
];

/** The 7 color dots shared by the hash-tile menu and the "Change color" submenu. */
function ColorItems({
  current,
  onPick,
}: {
  current: TaskGroupColor;
  onPick: (color: TaskGroupColor) => void;
}) {
  return (Object.keys(GROUP_HEX) as TaskGroupColor[]).map((color) => (
    <DropdownMenuItem
      key={color}
      className="gap-2 text-[12.5px]"
      onSelect={() => onPick(color)}
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ background: GROUP_HEX[color] }}
        aria-hidden
      />
      <span className="capitalize">{color}</span>
      {current === color && <Check className="ml-auto size-3.5" aria-label="Current color" />}
    </DropdownMenuItem>
  ));
}

/** A task row inside a group (or the ungrouped section) with a ⋯ move menu. */
function GroupTaskRow({
  task,
  groups,
  currentGroupId,
  onMoveTask,
}: {
  task: TaskVM;
  groups: TaskGroupVM[];
  currentGroupId: string | null;
  onMoveTask: (taskId: string, groupId: string | null, groupTitle?: string) => void;
}) {
  const openTask = useMeshStore((s) => s.openTask);
  const active = useMeshStore((s) => s.activeTaskId) === task.id;
  const otherGroups = groups.filter((g) => g.id !== currentGroupId);

  return (
    <div className="group/task flex items-center pr-0.5" role="listitem">
      <button
        type="button"
        onClick={() => openTask(task.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1.5 pl-1.5 pr-1 text-left text-[12.5px] transition-colors hover:bg-[#2a2c30] hover:text-white focus-visible:outline-2 focus-visible:outline-mesh-blue",
          active ? "bg-[#2a2c30] text-white" : "text-[#b9bbc1]"
        )}
      >
        <span
          className={cn(
            "h-[3px] w-[3px] shrink-0 rounded-full",
            task.unread ? "bg-mesh-blue" : "bg-transparent"
          )}
          aria-hidden
        />
        {task.unread && <span className="sr-only">Unread</span>}
        <span className="min-w-0 flex-1 truncate">{task.name}</span>
        <small className="shrink-0 text-[10px] text-[#777b83]">{relTime(task.createdAt)}</small>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Task options for ${task.name}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#777b83] opacity-0 transition-opacity hover:bg-[#2a2c30] hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mesh-blue group-hover/task:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2 text-[12.5px]">Move to group</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-44">
                {otherGroups.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    className="gap-2 text-[12.5px]"
                    onSelect={() => onMoveTask(task.id, g.id, g.title)}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: GROUP_HEX[g.color] ?? GROUP_HEX.gray }}
                      aria-hidden
                    />
                    <span className="truncate">{g.title}</span>
                  </DropdownMenuItem>
                ))}
                {otherGroups.length === 0 && (
                  <DropdownMenuLabel className="text-[11px] text-mesh-quiet">
                    No other groups yet
                  </DropdownMenuLabel>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          {currentGroupId && (
            <DropdownMenuItem
              className="gap-2 text-[12.5px]"
              onSelect={() => onMoveTask(task.id, null)}
            >
              Remove from group
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** One group: colored hash header (rename / recolor / collapse / count / +) + rows. */
function GroupSection({
  group,
  tasks,
  allGroups,
  renaming,
  renameValue,
  onRenameValueChange,
  onStartRename,
  onCommitRename,
  onCancelRename,
  collapsed,
  onToggleCollapsed,
  onDeleteRequest,
  onMoveTask,
}: {
  group: TaskGroupVM;
  tasks: TaskVM[];
  allGroups: TaskGroupVM[];
  renaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onStartRename: (group: TaskGroupVM) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onDeleteRequest: (group: TaskGroupVM) => void;
  onMoveTask: (taskId: string, groupId: string | null, groupTitle?: string) => void;
}) {
  const hex = GROUP_HEX[group.color] ?? GROUP_HEX.gray;
  const updateGroup = useUpdateGroup();
  const setView = useMeshStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Focus after paint so closing dropdown menus can't steal focus back. */
  useEffect(() => {
    if (!renaming) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [renaming]);

  return (
    <div>
      {renaming ? (
        <Input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename();
            if (e.key === "Escape") onCancelRename();
          }}
          aria-label="Group name"
          className="h-7 border-[#3b3d42] bg-[#242629] text-[12.5px] placeholder:text-[#777b83] focus-visible:ring-mesh-blue-strong/40"
        />
      ) : (
        <div className="group/grp flex h-8 items-center gap-1.5 rounded-lg px-1.5 transition-colors hover:bg-[#2a2c30]">
          {/* Colored hash mark — opens the color menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Change color for group ${group.title}`}
                className="flex size-5 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-mesh-blue"
                style={{ backgroundColor: groupRgba(hex, 0.32) }}
              >
                <Hash className="size-3" style={{ color: hex }} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuLabel className="text-[11px] text-mesh-quiet">Group color</DropdownMenuLabel>
              <ColorItems
                current={group.color}
                onPick={(color) => updateGroup.mutate({ id: group.id, color })}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Title — click to rename inline */}
          <button
            type="button"
            onClick={() => onStartRename(group)}
            title="Rename group"
            className="min-w-0 flex-1 truncate rounded text-left text-[12.5px] font-medium text-[#d7d9dd] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            {group.title}
          </button>

          {/* Collapse chevron */}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#777b83] transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", collapsed && "-rotate-90")}
              aria-hidden
            />
          </button>

          {/* Count badge */}
          <span
            className="ml-auto min-w-[18px] rounded-full bg-[#36383b] px-1.5 text-center text-[10px] leading-4 text-mesh-quiet"
            aria-label={`${tasks.length} tasks in ${group.title}`}
          >
            {tasks.length}
          </span>

          {/* New task in this group */}
          <button
            type="button"
            onClick={() => {
              setView("new-task");
              toast.info(`New task in "${group.title}"`);
            }}
            aria-label={`New task in ${group.title}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#777b83] opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mesh-blue group-hover/grp:opacity-100 data-[state=open]:opacity-100"
          >
            <MessageCirclePlus className="size-3.5" aria-hidden />
          </button>

          {/* ⋯ menu: rename / change color / delete */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Group options for ${group.title}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#777b83] opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-mesh-blue group-hover/grp:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem className="gap-2 text-[12.5px]" onSelect={() => onStartRename(group)}>
                <Pencil className="size-3.5" aria-hidden /> Rename
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2 text-[12.5px]">
                  <Palette className="size-3.5" aria-hidden /> Change color
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-40">
                    <ColorItems
                      current={group.color}
                      onPick={(color) => updateGroup.mutate({ id: group.id, color })}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
                onSelect={() => onDeleteRequest(group)}
              >
                <Trash2 className="size-3.5" aria-hidden /> Delete group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {!collapsed && (
        <div
          className="ml-4 border-l pl-2"
          style={{ borderColor: groupRgba(hex, 0.4) }}
          role="list"
          aria-label={`Tasks in ${group.title}`}
        >
          {tasks.map((t) => (
            <GroupTaskRow
              key={t.id}
              task={t}
              groups={allGroups}
              currentGroupId={group.id}
              onMoveTask={onMoveTask}
            />
          ))}
          {tasks.length === 0 && (
            <div className="m-1 rounded-lg border border-dashed border-[#3b3d42] px-2.5 py-2 text-[11px] leading-snug text-[#777b83]">
              No tasks here yet — use ⋯ on a task to move it in.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The "By group" task list: New group row, group sections, ungrouped tasks. */
function GroupedTaskList({ groups, tasks }: { groups: TaskGroupVM[]; tasks: TaskVM[] }) {
  const qc = useQueryClient();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const moveTask = useMoveTaskToGroup();
  const updateGroup = useUpdateGroup();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TaskGroupVM | null>(null);

  const byGroup = useMemo(() => {
    const map = new Map<string, TaskVM[]>();
    for (const g of groups) map.set(g.id, []);
    const ungrouped: TaskVM[] = [];
    for (const t of tasks) {
      if (t.groupId && map.has(t.groupId)) map.get(t.groupId)!.push(t);
      else ungrouped.push(t);
    }
    return { map, ungrouped };
  }, [groups, tasks]);

  const startRename = (group: TaskGroupVM) => {
    setRenameValue(group.title);
    setRenamingGroupId(group.id);
  };

  const commitRename = () => {
    const group = groups.find((g) => g.id === renamingGroupId);
    const title = renameValue.trim();
    setRenamingGroupId(null);
    if (group && title && title !== group.title) updateGroup.mutate({ id: group.id, title });
  };

  const handleNewGroup = async () => {
    try {
      const { group } = await createGroup.mutateAsync({});
      await qc.invalidateQueries({ queryKey: ["groups"] });
      /* Immediately inline-rename the fresh group. */
      startRename(group);
    } catch {
      /* toast handled in the hook */
    }
  };

  const handleMoveTask = (taskId: string, groupId: string | null, groupTitle?: string) =>
    moveTask.mutate({ taskId, groupId, groupTitle });

  return (
    <div className="flex flex-col gap-0.5" aria-label="Tasks by group">
      {/* New group (ghost row) */}
      <button
        type="button"
        onClick={handleNewGroup}
        disabled={createGroup.isPending}
        className="flex h-8 w-full items-center gap-1.5 rounded-lg px-1.5 text-[12px] text-[#9a9ea6] transition-colors hover:bg-[#2a2c30] hover:text-white focus-visible:outline-2 focus-visible:outline-mesh-blue disabled:opacity-60"
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-[#4a4d52]"
          aria-hidden
        >
          <Hash className="size-3" />
        </span>
        <span>New group</span>
      </button>

      {groups.map((g) => (
        <GroupSection
          key={g.id}
          group={g}
          tasks={byGroup.map.get(g.id) ?? []}
          allGroups={groups}
          renaming={renamingGroupId === g.id}
          renameValue={renamingGroupId === g.id ? renameValue : g.title}
          onRenameValueChange={setRenameValue}
          onStartRename={startRename}
          onCommitRename={commitRename}
          onCancelRename={() => setRenamingGroupId(null)}
          collapsed={collapsedGroups.has(g.id)}
          onToggleCollapsed={() =>
            setCollapsedGroups((prev) => {
              const next = new Set(prev);
              if (next.has(g.id)) next.delete(g.id);
              else next.add(g.id);
              return next;
            })
          }
          onDeleteRequest={setDeleteTarget}
          onMoveTask={handleMoveTask}
        />
      ))}

      {/* Ungrouped tasks */}
      <div>
        <div className="flex h-8 items-center gap-1.5 px-1.5 text-[11px] font-medium text-[#82868e]">
          <span className="ml-5">Ungrouped</span>
          <span
            className="min-w-[18px] rounded-full bg-[#36383b] px-1.5 text-center text-[10px] leading-4 text-mesh-quiet"
            aria-label={`${byGroup.ungrouped.length} ungrouped tasks`}
          >
            {byGroup.ungrouped.length}
          </span>
        </div>
        <div className="ml-4 border-l border-[#4a4d52]/40 pl-2" role="list" aria-label="Ungrouped tasks">
          {byGroup.ungrouped.map((t) => (
            <GroupTaskRow
              key={t.id}
              task={t}
              groups={groups}
              currentGroupId={null}
              onMoveTask={handleMoveTask}
            />
          ))}
          {byGroup.ungrouped.length === 0 && (
            <p className="py-1.5 pl-1.5 text-[11px] text-[#777b83]">Nothing ungrouped.</p>
          )}
        </div>
      </div>

      {/* Delete-group confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group “{deleteTarget?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Tasks in this group are kept — they return to the ungrouped list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-mesh-red text-white hover:bg-mesh-red/90"
              onClick={() => {
                if (deleteTarget) deleteGroup.mutate({ id: deleteTarget.id });
                setDeleteTarget(null);
              }}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  badge,
  hint,
  secondary,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  hint?: string;
  secondary?: boolean;
  onSelect: (view: MeshView) => void;
}) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      onClick={() => onSelect(item.view)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-[9px] text-left transition-colors",
        secondary ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-2.5 text-[13px]",
        collapsed && "justify-center px-0",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
        active
          ? "bg-[#36383d] text-white"
          : "text-[#c4c6ca] hover:bg-[#2a2c30] hover:text-white"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active ? "text-white" : "text-[#a5a8ae] group-hover:text-[#d6d8dc]"
        )}
        aria-hidden
      />
      {!collapsed && (
        <>
          <span className={cn("truncate", active && "font-medium text-white")}>{item.label}</span>
          {item.shortcut && (
            <span className="ml-auto text-[10px] text-[#777b83]">{item.shortcut}</span>
          )}
          {item.hint && badge !== undefined && (
            <span className="ml-auto text-[10px] text-[#8ed9b0]">{badge} online</span>
          )}
          {item.badge === "tasks" && badge !== undefined && (
            <span className="ml-auto text-[10px] text-[#777b83]">{badge}</span>
          )}
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}

export function Sidebar({
  projects,
  tasks,
  badges,
  onProjectCreated,
  className,
}: {
  projects: ProjectVM[];
  tasks: TaskVM[];
  badges?: Partial<Record<"tasks" | "connections", number>>;
  onProjectCreated?: () => void;
  className?: string;
}) {
  const view = useMeshStore((s) => s.view);
  const setView = useMeshStore((s) => s.setView);
  const openTask = useMeshStore((s) => s.openTask);
  const activeTaskId = useMeshStore((s) => s.activeTaskId);
  const collapsed = useMeshStore((s) => s.sidebarCollapsed);
  const openSettings = useMeshStore((s) => s.openSettings);
  const selectedProjectKey = useMeshStore((s) => s.selectedProjectKey);
  const setProject = useMeshStore((s) => s.setProject);

  const nodesQuery = useNodes();
  const settingsQuery = useSettings();
  const thisDevice = nodesQuery.data?.nodes.find((n) => n.id === "this-device");
  const profileName =
    typeof settingsQuery.data?.settings["profile.name"] === "string"
      ? (settingsQuery.data?.settings["profile.name"] as string)
      : "Ali19";
  const workspaceName =
    typeof settingsQuery.data?.settings["profile.workspace"] === "string"
      ? (settingsQuery.data?.settings["profile.workspace"] as string)
      : "Personal workspace";

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortByName, setSortByName] = useState(false);

  /* Task groups ("By group" view) + the persisted TASKS view filter. */
  const groupsQuery = useGroups();
  const groups = groupsQuery.data?.groups ?? [];

  const [taskView, setTaskViewState] = useState<TaskViewMode>("recent");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TASK_VIEW_STORAGE_KEY);
      if (stored === "recent" || stored === "grouped" || stored === "unread") {
        setTaskViewState(stored);
      }
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);
  const setTaskView = (mode: TaskViewMode) => {
    setTaskViewState(mode);
    try {
      window.localStorage.setItem(TASK_VIEW_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable */
    }
  };

  /* Project + search filter shared by every view mode. */
  const filteredTasks = useMemo(() => {
    let list = selectedProjectKey
      ? tasks.filter((t) => t.projectId === (projects.find((p) => p.key === selectedProjectKey)?.id ?? ""))
      : tasks;
    if (taskSearch.trim()) {
      const q = taskSearch.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, projects, selectedProjectKey, taskSearch]);

  const sortedTasks = useMemo(
    () =>
      sortByName
        ? [...filteredTasks].sort((a, b) => a.name.localeCompare(b.name))
        : [...filteredTasks].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
    [filteredTasks, sortByName]
  );

  const visibleTasks = useMemo(() => sortedTasks.slice(0, 7), [sortedTasks]);
  const unreadTasks = useMemo(() => sortedTasks.filter((t) => t.unread), [sortedTasks]);

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { project?: ProjectVM; error?: string };
      if (!res.ok || !data.project) throw new Error(data.error ?? "Could not create the project.");
      setProject(data.project.key);
      setNewProjectOpen(false);
      setNewProjectName("");
      toast.success(`Project created — ${data.project.name}`);
      onProjectCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the project.");
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-mesh-line-soft bg-mesh-topbar",
          "pt-[14px] px-[10px] pb-[12px]",
          collapsed ? "w-[58px]" : "w-[252px]",
          "transition-[width] duration-200 ease-in-out",
          className
        )}
        aria-label="Workspace navigation"
      >
        {/* Brand — the M logo toggles the pane between docked and expanded.
            Spacing per approved reference: 14px above the brand row, brand
            height 38px, then 14px before the nav (new_task.html). */}
        <div
          className={cn(
            "mb-[14px] flex h-[38px] items-center gap-2.5 px-[7px]",
            collapsed && "justify-center px-0"
          )}
        >
          <MeshLogo onClick={() => useMeshStore.getState().toggleSidebar()} collapsed={collapsed} size={24} />
          {!collapsed && (
            <>
              <span className="text-[15px] font-[650] tracking-[0.15px] text-foreground">Meshwork</span>
              <span className="ml-auto rounded-md border border-[#414348] px-1.5 py-[3px] text-[10px] text-[#777b83]">
                PREVIEW
              </span>
            </>
          )}
        </div>

        {/* Primary navigation (approved concept rail) */}
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {NAV_PRIMARY.map((item) => (
            <NavRow
              key={item.view}
              item={item}
              active={view === item.view}
              collapsed={collapsed}
              badge={item.badge === "connections" ? badges?.connections : badges?.tasks}
              hint={item.hint}
              onSelect={setView}
            />
          ))}
        </nav>

        {/* Secondary navigation (workspace extras — nothing is removed) */}
        {!collapsed ? (
          <div className="mt-3">
            <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#878b93]">
              More
            </div>
            <div className="flex flex-col gap-0.5">
              {NAV_SECONDARY.map((item) => (
                <NavRow
                  key={item.view}
                  item={item}
                  active={view === item.view}
                  collapsed={collapsed}
                  secondary
                  badge={item.badge === "tasks" ? badges?.tasks : undefined}
                  onSelect={setView}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-0.5">
            {NAV_SECONDARY.map((item) => (
              <NavRow key={item.view} item={item} active={view === item.view} collapsed={collapsed} secondary onSelect={setView} />
            ))}
          </div>
        )}

        <div aria-hidden className="mx-0 my-3 h-px bg-[#36383b]" />

        {/* Projects */}
        {!collapsed ? (
          <div className="min-h-0 flex-1 overflow-y-auto pb-1">
            <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold tracking-[0.03em] text-[#888c94]">
              <span>PROJECTS</span>
              <button
                type="button"
                onClick={() => setNewProjectOpen(true)}
                aria-label="New project"
                className="flex h-5 w-5 items-center justify-center rounded text-[#888c94] transition-colors hover:bg-[#2a2c30] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5" role="list" aria-label="Projects">
              {projects.map((p, i) => {
                const selected = p.key === selectedProjectKey;
                return (
                  <button
                    key={p.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setProject(selected ? "" : p.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-mesh-blue",
                      selected
                        ? "bg-[#2a2c30] text-white"
                        : "text-[#c4c6ca] hover:bg-[#2a2c30] hover:text-white"
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-[3px]"
                      style={{ background: projectDot(p.key, i) }}
                      aria-hidden
                    />
                    <span className="truncate">{p.name}</span>
                    {selected && <Check className="ml-auto h-3 w-3 text-[#777b83]" aria-hidden />}
                  </button>
                );
              })}
              {projects.length === 0 && (
                <p className="px-2.5 py-1.5 text-[11.5px] text-[#777b83]">No projects yet.</p>
              )}
            </div>

            {/* Tasks */}
            <div className="mt-4 flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold tracking-[0.03em] text-[#888c94]">
              <span>TASKS</span>
              <span className="flex items-center gap-0.5">
                {/* View filter: Recent / By group / Unread (zcode ListFilter) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Task list view filter"
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[#2a2c30] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue",
                        taskView === "recent" ? "text-[#888c94]" : "text-mesh-blue"
                      )}
                    >
                      <ListFilter className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuLabel className="text-[11px] text-mesh-quiet">View</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={taskView}
                      onValueChange={(value) => setTaskView(value as TaskViewMode)}
                    >
                      {TASK_VIEW_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          className="text-[12.5px]"
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search tasks"
                  aria-pressed={searchOpen}
                  className="flex h-5 w-5 items-center justify-center rounded text-[#888c94] transition-colors hover:bg-[#2a2c30] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
                >
                  {searchOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortByName((v) => {
                      toast.info(v ? "Sorting tasks by recency" : "Sorting tasks by name");
                      return !v;
                    });
                  }}
                  aria-label="Toggle task sort"
                  className="flex h-5 w-5 items-center justify-center rounded text-[#888c94] transition-colors hover:bg-[#2a2c30] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
                >
                  <ArrowDownUp className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
            {searchOpen && (
              <div className="px-1 pb-1.5">
                <Input
                  autoFocus
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Filter tasks…"
                  aria-label="Filter tasks"
                  className="h-7 border-[#3b3d42] bg-[#242629] text-[12px] placeholder:text-[#777b83] focus-visible:ring-mesh-blue-strong/40"
                />
              </div>
            )}
            {taskView === "grouped" ? (
              /* "By group" — colored hash headers, inline rename, move menu */
              <GroupedTaskList groups={groups} tasks={sortedTasks} />
            ) : taskView === "unread" ? (
              /* "Unread" — flat list of unread tasks with blue dots */
              <div className="flex flex-col" role="list" aria-label="Unread tasks">
                {unreadTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="listitem"
                    onClick={() => openTask(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 truncate py-2 pl-7 pr-2.5 text-left text-[12.5px] transition-colors hover:bg-[#2a2c30] hover:text-white focus-visible:outline-2 focus-visible:outline-mesh-blue",
                      activeTaskId === t.id ? "bg-[#2a2c30] text-white" : "text-[#b9bbc1]"
                    )}
                  >
                    <span className="h-[3px] w-[3px] shrink-0 rounded-full bg-mesh-blue" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <small className="ml-1.5 shrink-0 text-[10px] text-[#777b83]">
                      {relTime(t.createdAt)}
                    </small>
                  </button>
                ))}
                {unreadTasks.length === 0 && (
                  <p className="py-1.5 pl-7 pr-2.5 text-[11.5px] text-[#777b83]">No unread tasks</p>
                )}
              </div>
            ) : (
              /* "Recent" — the flat task list exactly as before */
              <div className="flex flex-col" role="list" aria-label="Tasks">
                {visibleTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="listitem"
                    onClick={() => openTask(t.id)}
                    className={cn(
                      "truncate py-2 pl-7 pr-2.5 text-left text-[12.5px] transition-colors hover:bg-[#2a2c30] hover:text-white focus-visible:outline-2 focus-visible:outline-mesh-blue",
                      activeTaskId === t.id ? "bg-[#2a2c30] text-white" : "text-[#b9bbc1]"
                    )}
                  >
                    <span className="truncate">{t.name}</span>
                    <small className="ml-1.5 text-[10px] text-[#777b83]">{relTime(t.createdAt)}</small>
                  </button>
                ))}
                {visibleTasks.length === 0 && (
                  <p className="py-1.5 pl-7 pr-2.5 text-[11.5px] text-[#777b83]">No tasks here yet.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1" />
        )}

        {/* This device node state (approved concept card) */}
        {!collapsed && (
          <div className="mx-1 mb-2.5 rounded-[11px] border border-[#3b3d42] bg-mesh-node p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-foreground">This device</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#8ed9b0]" role="status">
                <span
                  className="h-[7px] w-[7px] rounded-full bg-mesh-green"
                  style={{ boxShadow: "0 0 8px #47c88a55" }}
                  aria-hidden
                />
                {thisDevice?.online === false ? "Offline" : "Online"}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-[#969aa2]">
              Endpoint node · Sharing off
            </p>
          </div>
        )}

        {/* Profile */}
        <div className={cn("flex items-center gap-2.5 px-1.5 pt-1.5", collapsed && "justify-center px-0")}>
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f39a28] text-[12px] font-bold text-[#222]"
          >
            {profileName.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] font-medium text-foreground">{profileName}</span>
                <span className="block truncate text-[10px] text-[#82868e]">{workspaceName}</span>
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => openSettings()}
                    aria-label="Open settings"
                    className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[#9b9ea6] transition-colors hover:bg-[#2a2c30] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Settings</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* New project dialog */}
        <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Projects group task sessions. The new project becomes your active project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-1">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Community network pilot"
                onKeyDown={(e) => e.key === "Enter" && createProject()}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>
                Cancel
              </Button>
              <Button className="mesh-action font-medium" onClick={createProject} disabled={!newProjectName.trim()}>
                Create project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  );
}
