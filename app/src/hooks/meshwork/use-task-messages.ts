"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MarkerPayloadVM, TaskMessageVM, TaskVM, ToolPayloadVM } from "@/lib/meshwork/types";

/**
 * Task conversation state — the detail query (task + trace rows) and the
 * mutations the conversation view and task rows need (send reply, pin/rename/
 * mark-read, delete). Lives beside use-meshwork-data but is owned by the
 * task view feature.
 */

interface RawTaskMessage {
  id: string;
  taskId: string;
  seq: number;
  kind: TaskMessageVM["kind"];
  text: string;
  payload: Record<string, unknown> | null;
  durationMs: number | null;
  status: string | null;
  createdAt: string;
}

export interface TaskDetailPayload {
  task: TaskVM;
  messages: TaskMessageVM[];
}

/** Cast the JSON payload column to the typed tool/marker view models. */
function mapMessage(m: RawTaskMessage): TaskMessageVM {
  const payload =
    m.kind === "tool"
      ? ((m.payload ?? null) as ToolPayloadVM | null)
      : m.kind === "marker"
        ? ((m.payload ?? null) as MarkerPayloadVM | null)
        : null;
  return {
    ...m,
    payload,
    status: (m.status as TaskMessageVM["status"]) ?? null,
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function sendJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`);
  return data;
}

export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const raw = await getJson<{ task: TaskVM; messages: RawTaskMessage[] }>(`/api/tasks/${taskId}`);
      return { task: raw.task, messages: raw.messages.map(mapMessage) } satisfies TaskDetailPayload;
    },
    enabled: Boolean(taskId),
  });
}

export function useSendTaskMessage(taskId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, model }: { text: string; model: string }) =>
      sendJson<{ messages: TaskMessageVM[] }>(`/api/tasks/${taskId}/messages`, "POST", { text, model }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task", taskId] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface TaskPatch {
  pinned?: boolean;
  name?: string;
  markRead?: boolean;
  status?: string;
}

export function usePatchTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: TaskPatch & { id: string }) =>
      sendJson<{ task: TaskVM }>(`/api/tasks/${id}`, "PATCH", patch),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["task", data.task.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendJson<{ ok: boolean }>(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      toast.success("Task deleted");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
