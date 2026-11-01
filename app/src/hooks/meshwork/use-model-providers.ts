"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ModelProviderVM } from "@/lib/meshwork/types";

/**
 * Model provider queries + mutations (Settings → Model settings).
 * Everything shares the ["model-providers"] cache so the provider nav,
 * detail pane and pickers stay consistent after every edit.
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

export interface ProviderPatch {
  name?: string;
  baseUrl?: string;
  apiFormat?: string;
  apiKey?: string;
  enabled?: boolean;
  displayOrder?: number;
}

export interface ModelPatch {
  contextWindow?: number;
  maxOutputTokens?: number;
  inputTypes?: string[];
  capabilities?: Record<string, boolean>;
  reasoningLevels?: string[];
  enabled?: boolean;
}

export function useModelProviders() {
  return useQuery({
    queryKey: ["model-providers"],
    queryFn: () => getJson<{ providers: ModelProviderVM[] }>("/api/settings/model-providers"),
  });
}

export function useCreateModelProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { templateKey: string; name?: string }) =>
      sendJson<{ provider: ModelProviderVM }>("/api/settings/model-providers", "POST", input),
    onSuccess: (data) => {
      toast.success(`Provider added — ${data.provider.name}`);
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateModelProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; message?: string } & ProviderPatch) => {
      const { id: _id, message: _message, ...patch } = input;
      return sendJson<{ provider: ModelProviderVM }>(
        `/api/settings/model-providers/${input.id}`,
        "PATCH",
        patch
      );
    },
    onSuccess: (data, vars) => {
      toast.success(vars.message ?? `${data.provider.name} saved`);
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteModelProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      sendJson<{ ok: boolean }>(`/api/settings/model-providers/${input.id}`, "DELETE"),
    onSuccess: (_data, vars) => {
      toast.success(`Provider deleted — ${vars.name}`);
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpsertModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      providerId: string;
      modelId: string;
      contextWindow?: number;
      maxOutputTokens?: number;
      inputTypes?: string[];
      capabilities?: Record<string, boolean>;
      reasoningLevels?: string[];
    }) => {
      const { providerId: _providerId, ...payload } = input;
      return sendJson<{ provider: ModelProviderVM }>(
        `/api/settings/model-providers/${input.providerId}/models`,
        "POST",
        payload
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { providerId: string; modelId: string } & ModelPatch) => {
      const { providerId, modelId, ...patch } = input;
      return sendJson<{ provider: ModelProviderVM }>(
        `/api/settings/model-providers/${providerId}/models/${encodeURIComponent(modelId)}`,
        "PATCH",
        patch
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { providerId: string; modelId: string }) =>
      sendJson<{ ok: boolean }>(
        `/api/settings/model-providers/${input.providerId}/models/${encodeURIComponent(input.modelId)}`,
        "DELETE"
      ),
    onSuccess: () => {
      toast.success("Model deleted");
      void qc.invalidateQueries({ queryKey: ["model-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Usage stats ---------------- */

export interface UsageStatsVM {
  tasksRun: number;
  toolCalls: number;
  tokens: number;
  activity: { day: string; label: string; tasks: number }[];
}

export function useUsageStats() {
  return useQuery({
    queryKey: ["settings-usage"],
    queryFn: () => getJson<UsageStatsVM>("/api/settings/usage"),
  });
}
