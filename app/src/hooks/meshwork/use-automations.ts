"use client";

/**
 * Automations (zcode scheduled tasks) — TanStack Query hooks.
 * Success toasts are owned by the views (copy differs per flow); these hooks
 * surface API errors uniformly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AutomationRunVM, AutomationVM, ProjectVM } from "@/lib/meshwork/types";

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

export interface AutomationInput {
  name: string;
  description?: string;
  cronExpr: string;
  schedule?: string;
  prompt: string;
  target?: string;
  mode?: string;
  model?: string;
}

export type AutomationPatch = Partial<
  Omit<AutomationInput, "name" | "prompt"> & {
    name: string;
    prompt: string;
    status: "active" | "paused";
    enabled: boolean;
  }
>;

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: () => getJson<{ automations: AutomationVM[] }>("/api/automations"),
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => getJson<{ projects: ProjectVM[] }>("/api/projects"),
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AutomationInput) =>
      sendJson<{ automation: AutomationVM }>("/api/automations", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: AutomationPatch & { id: string }) =>
      sendJson<{ automation: AutomationVM }>(`/api/automations/${id}`, "PATCH", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      sendJson<{ ok: boolean }>(`/api/automations/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Trigger "Run now" — creates a manual run and bumps the counters. */
export function useRunAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      sendJson<{ run: AutomationRunVM; automation: AutomationVM }>(
        `/api/automations/${id}/run`,
        "POST"
      ),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["automations"] });
      qc.invalidateQueries({ queryKey: ["automations", id, "runs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAutomationRuns(id: string | null) {
  return useQuery({
    queryKey: ["automations", id, "runs"],
    queryFn: () =>
      getJson<{ runs: AutomationRunVM[] }>(`/api/automations/${id as string}/runs`),
    enabled: id !== null,
  });
}

export function useDeleteAutomationRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ automationId, runId }: { automationId: string; runId: string }) =>
      sendJson<{ ok: boolean }>(`/api/automations/${automationId}/runs/${runId}`, "DELETE"),
    onSuccess: (_data, { automationId }) => {
      qc.invalidateQueries({ queryKey: ["automations", automationId, "runs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
