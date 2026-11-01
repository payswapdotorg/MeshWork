"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { TaskGroupVM } from "@/lib/meshwork/types";

/**
 * Task groups hooks (zcode "By group" sidebar view) — one query + the
 * create / rename-recolor / delete mutations, plus moving tasks between
 * groups via the existing PATCH /api/tasks/[id] endpoint.
 */

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

export interface GroupsPayloadVM {
  groups: TaskGroupVM[];
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => getJson<GroupsPayloadVM>("/api/groups"),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; color?: string }) =>
      sendJson<{ group: TaskGroupVM }>("/api/groups", "POST", input),
    onSuccess: () => {
      toast.success("Group created — give it a name");
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, color }: { id: string; title?: string; color?: string }) =>
      sendJson<{ group: TaskGroupVM }>(`/api/groups/${id}`, "PATCH", { title, color }),
    onSuccess: (data, vars) => {
      if (vars.color) toast.success("Group color updated");
      else toast.success(`Group renamed — ${data.group.title}`);
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      sendJson<{ ok: boolean }>(`/api/groups/${id}`, "DELETE"),
    onSuccess: () => {
      toast.success("Group deleted — its tasks return to the ungrouped list");
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Move a task into another group (groupId = null removes it) — PATCH /api/tasks/[id]. */
export function useMoveTaskToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      groupId,
      groupTitle,
    }: {
      taskId: string;
      groupId: string | null;
      groupTitle?: string;
    }) => sendJson<{ ok?: boolean }>(`/api/tasks/${taskId}`, "PATCH", { groupId }),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.groupId ? `Moved to “${vars.groupTitle ?? "group"}”` : "Removed from group"
      );
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
