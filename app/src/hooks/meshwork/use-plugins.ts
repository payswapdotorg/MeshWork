"use client";

/**
 * Plugin Marketplace — TanStack Query hooks for the plugin catalog and the
 * marketplace sources. Views own success toasts (copy varies per flow); these
 * hooks surface API errors uniformly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MarketplaceSourceVM, PluginVM } from "@/lib/meshwork/types";

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

export interface PluginsPayload {
  plugins: PluginVM[];
  sources: MarketplaceSourceVM[];
}

export function usePlugins() {
  return useQuery({
    queryKey: ["plugins"],
    queryFn: () => getJson<PluginsPayload>("/api/plugins"),
  });
}

export interface PluginPatch {
  installed?: boolean;
  enabled?: boolean;
  scope?: "user" | "workspace";
}

export function useUpdatePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: PluginPatch & { id: string }) =>
      sendJson<{ plugin: PluginVM }>(`/api/plugins/${id}`, "PATCH", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Update a plugin to its latest known version. */
export function useUpdatePluginVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      sendJson<{ plugin: PluginVM }>(`/api/plugins/${id}/update`, "POST"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Refresh one marketplace source's index. */
export function useRefreshMarketplaceSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key }: { key: string }) =>
      sendJson<{ sources: MarketplaceSourceVM[] }>(`/api/plugins/sources/${key}`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddMarketplaceSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, source }: { name?: string; source: string }) =>
      sendJson<{ source: MarketplaceSourceVM }>("/api/plugins/sources", "POST", { name, source }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveMarketplaceSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key }: { key: string }) =>
      sendJson<{ ok: boolean }>(`/api/plugins/sources/${key}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}
