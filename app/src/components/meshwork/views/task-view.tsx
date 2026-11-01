"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  ArrowUp,
  CheckCheck,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { MESH_MODELS, PERMISSION_MODES } from "@/lib/meshwork/data";
import type { MarkerPayloadVM, TaskStatus } from "@/lib/meshwork/types";
import { usePatchTask, useSendTaskMessage, useTaskDetail } from "@/hooks/meshwork/use-task-messages";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserMessage } from "./task-parts/user-message";
import { AssistantMessage } from "./task-parts/assistant-message";
import { ThinkingTrace } from "./task-parts/thinking-trace";
import { ToolCallRow } from "./task-parts/tool-call-row";
import { TimelineMarker } from "./task-parts/timeline-marker";
import { ErrorMessage } from "./task-parts/error-message";
import { WorkingIndicator } from "./task-parts/working-indicator";
import { DeleteTaskDialog, RenameTaskDialog } from "./task-parts/task-dialogs";

/**
 * zcode task/conversation view — the full trace of a previously run task:
 * user bubbles, thinking traces, tool call rows, timeline markers and the
 * assistant answer, plus a composer to continue the task.
 */

const STATUS_CHIP: Record<TaskStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "border-mesh-green-line bg-mesh-green-soft text-[#8ed9b0]" },
  in_progress: { label: "In progress", className: "border-mesh-blue-strong/40 bg-mesh-blue-soft text-mesh-blue" },
  error: { label: "Failed", className: "border-mesh-red/30 bg-mesh-red-soft text-mesh-red" },
  draft: { label: "Draft", className: "border-mesh-line bg-mesh-panel-2 text-muted-foreground" },
};

function modelName(id: string): string {
  return MESH_MODELS.find((m) => m.id === id)?.name ?? id;
}

export function TaskView() {
  const activeTaskId = useMeshStore((s) => s.activeTaskId);
  const closeTask = useMeshStore((s) => s.closeTask);

  const detail = useTaskDetail(activeTaskId);
  const send = useSendTaskMessage(activeTaskId);
  const patch = usePatchTask();

  const [draft, setDraft] = useState("");
  const [modelOverride, setModelOverride] = useState<string | null>(null);
  const [modeOverride, setModeOverride] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const task = detail.data?.task;
  const messages = useMemo(() => detail.data?.messages ?? [], [detail.data]);
  const model = modelOverride ?? task?.model ?? MESH_MODELS[0].id;
  const permissionMode = modeOverride ?? task?.permissionMode ?? "ask";

  /* Keep the newest rows in view when the trace grows. */
  const lastSeq = messages.length > 0 ? messages[messages.length - 1].seq : 0;
  useEffect(() => {
    const el = timelineRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastSeq]);

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
  };

  const sendReply = () => {
    const text = draft.trim();
    if (!text || !activeTaskId || send.isPending) return;
    setRunStartedAt(new Date().toISOString());
    send.mutate(
      { text, model },
      {
        onSettled: () => setRunStartedAt(null),
      }
    );
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  /* The run is "live" while the reply is being processed or the task itself
     is still in progress — the send button becomes a Stop control (zcode). */
  const runLive = send.isPending || task?.status === "in_progress";

  const stopTask = () => {
    if (!task) return;
    toast.info("Task stopped");
    patch.mutate({ id: task.id, status: "completed" });
  };

  /* --- no task open (e.g. restored stale state) --- */
  if (!activeTaskId) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-mesh-line-soft bg-mesh-panel p-6 text-center">
          <p className="text-[13.5px] font-medium text-foreground">No task open</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-mesh-quiet">
            Pick a task from the sidebar or the Tasks list to open its conversation.
          </p>
          <Button size="sm" className="mt-4 h-8 mesh-action text-[12.5px] font-medium" onClick={closeTask}>
            Browse tasks
          </Button>
        </div>
      </div>
    );
  }

  /* --- task not found / failed to load --- */
  if (detail.isError) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-mesh-red/30 bg-mesh-red-soft p-6 text-center">
          <p className="text-[13.5px] font-medium text-mesh-red">Couldn&apos;t open this task</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-mesh-red/80">
            It may have been deleted. Try another task from the list.
          </p>
          <Button size="sm" variant="outline" className="mt-4 h-8 border-mesh-line text-[12.5px]" onClick={closeTask}>
            Back to tasks
          </Button>
        </div>
      </div>
    );
  }

  /* --- loading skeleton --- */
  if (detail.isLoading || !task) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-mesh-line-soft bg-mesh-panel px-4">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-mesh-panel-3" />
          <div className="h-3.5 w-56 animate-pulse rounded bg-mesh-panel-3" />
        </div>
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
          <div className="ml-auto h-14 w-2/3 animate-pulse rounded-xl bg-mesh-panel-2" />
          <div className="h-4 w-40 animate-pulse rounded bg-mesh-panel-2" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-mesh-panel-2" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-mesh-panel-2" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-mesh-panel-2" />
        </div>
      </div>
    );
  }

  const chip = STATUS_CHIP[task.status] ?? STATUS_CHIP.draft;
  const updated = formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Slim task header (inside the view — the app Topbar stays above) */}
      <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-mesh-line-soft bg-mesh-panel px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-mesh-quiet hover:text-foreground"
          aria-label="Back to tasks"
          onClick={closeTask}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
        <h1 className="min-w-0 truncate text-[13.5px] font-medium text-foreground">{task.name}</h1>
        <span
          className={cn(
            "inline-flex h-[22px] shrink-0 items-center rounded-full border px-2.5 text-[10.5px] font-medium",
            chip.className
          )}
        >
          {chip.label}
        </span>
        <span className="hidden shrink-0 font-mono text-[11px] text-mesh-quiet lg:inline" title={task.model}>
          {modelName(task.model)}
        </span>
        <span className="hidden shrink-0 text-[11px] text-mesh-quiet sm:inline" title={task.updatedAt}>
          {updated}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 shrink-0 text-mesh-quiet hover:text-foreground"
              aria-label="Task options"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
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
            {task.unread && (
              <DropdownMenuItem
                className="text-[12.5px]"
                onSelect={() => {
                  patch.mutate(
                    { id: task.id, markRead: true },
                    { onSuccess: () => toast.success("Marked as read") }
                  );
                }}
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[12.5px] text-mesh-red focus:text-mesh-red"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Scrollable conversation timeline */}
      <div ref={timelineRef} className="min-h-0 flex-1 overflow-y-auto" aria-label="Task conversation">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 lg:px-6">
          {messages.map((message, i) => {
            switch (message.kind) {
              case "user":
                return <UserMessage key={message.id} message={message} />;
              case "assistant":
                return <AssistantMessage key={message.id} message={message} />;
              case "reasoning":
                return (
                  <ThinkingTrace
                    key={message.id}
                    text={message.text}
                    durationMs={message.durationMs}
                    active={task.status === "in_progress" && i === messages.length - 1}
                  />
                );
              case "tool":
                return <ToolCallRow key={message.id} message={message} />;
              case "marker":
                return message.payload ? (
                  <TimelineMarker key={message.id} payload={message.payload as MarkerPayloadVM} />
                ) : null;
              case "error":
                return <ErrorMessage key={message.id} message={message} />;
              default:
                return null;
            }
          })}

          {(task.status === "in_progress" || send.isPending) && (
            <WorkingIndicator since={runStartedAt ?? task.updatedAt} />
          )}
        </div>
      </div>

      {/* Sticky composer */}
      <footer className="shrink-0 border-t border-mesh-line-soft bg-mesh-panel px-3 py-2.5">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-xl border border-mesh-line bg-mesh-panel-2 transition-colors focus-within:border-mesh-blue/50">
            <label htmlFor="task-composer" className="sr-only">
              Reply to this task
            </label>
            <textarea
              id="task-composer"
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={autoResize}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              placeholder="Reply to this task…"
              className="max-h-44 w-full resize-none bg-transparent px-3.5 pb-1.5 pt-3 text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-mesh-quiet"
            />
            <div className="flex items-center gap-2 px-2.5 pb-2.5">
              <Select value={model} onValueChange={(v) => setModelOverride(v)}>
                <SelectTrigger
                  aria-label="Model"
                  className="h-7 rounded-lg border-mesh-line bg-transparent px-2.5 text-[11.5px] text-mesh-quiet shadow-none hover:bg-mesh-panel-3 focus-visible:border-mesh-blue/50 focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-mesh-line bg-mesh-panel-2">
                  {MESH_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-[12.5px] focus:bg-mesh-panel-3">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={permissionMode} onValueChange={(v) => setModeOverride(v)}>
                <SelectTrigger
                  aria-label="Permission mode"
                  className="h-7 max-w-[220px] rounded-lg border-mesh-line bg-transparent px-2.5 text-[11.5px] text-mesh-quiet shadow-none hover:bg-mesh-panel-3 focus-visible:border-mesh-blue/50 focus-visible:ring-0"
                >
                  <span className="truncate">
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="border-mesh-line bg-mesh-panel-2">
                  {PERMISSION_MODES.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-[12.5px] focus:bg-mesh-panel-3">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                {runLive ? (
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Stop task"
                    onClick={stopTask}
                    className="h-8 w-8 rounded-full border border-mesh-line bg-mesh-panel-3 text-foreground hover:bg-mesh-panel-3/60"
                  >
                    <Square className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Send message"
                    onClick={sendReply}
                    disabled={!draft.trim()}
                    className="h-8 w-8 rounded-full mesh-action"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-1.5 px-1 text-[10.5px] text-mesh-quiet/70">
            Enter to send · Shift+Enter for a new line · network changes always need your approval
          </p>
        </div>
      </footer>

      <RenameTaskDialog task={task} open={renameOpen} onOpenChange={setRenameOpen} />
      <DeleteTaskDialog task={task} open={deleteOpen} onOpenChange={setDeleteOpen} onDeleted={() => closeTask()} />
    </div>
  );
}
