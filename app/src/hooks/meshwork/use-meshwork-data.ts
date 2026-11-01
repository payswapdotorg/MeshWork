"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AutomationVM,
  ConnectionsVM,
  MarketplacePayload,
  NodesVM,
  PluginVM,
  ProjectVM,
  SettingsMap,
  TaskVM,
} from "@/lib/meshwork/types";

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

/* ---------------- Tasks + projects ---------------- */

export interface TasksPayloadVM {
  tasks: TaskVM[];
  projects: ProjectVM[];
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: () => getJson<TasksPayloadVM>("/api/tasks"),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      prompt: string;
      projectKey: string;
      model: string;
      permissionMode: string;
    }) => sendJson<{ task: TaskVM }>("/api/tasks", "POST", input),
    onSuccess: (data) => {
      toast.success(`Task created — ${data.task.name}`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      sendJson<{ task: TaskVM }>(`/api/tasks/${id}`, "PATCH", { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Automations ---------------- */

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: () => getJson<{ automations: AutomationVM[] }>("/api/automations"),
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; schedule?: string; target?: string }) =>
      sendJson<{ automation: AutomationVM }>("/api/automations", "POST", input),
    onSuccess: () => {
      toast.success("Automation created");
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      sendJson<{ automation: AutomationVM }>(`/api/automations/${id}`, "PATCH", { enabled }),
    onSuccess: (data) => {
      toast.success(
        data.automation.enabled ? `${data.automation.name} enabled` : `${data.automation.name} disabled`
      );
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Plugins ---------------- */

export function usePlugins() {
  return useQuery({
    queryKey: ["plugins"],
    queryFn: () => getJson<{ plugins: PluginVM[] }>("/api/plugins"),
  });
}

export function useTogglePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, installed }: { id: string; installed: boolean }) =>
      sendJson<{ plugin: PluginVM }>(`/api/plugins/${id}`, "PATCH", { installed }),
    onSuccess: (data) => {
      toast.success(
        data.plugin.installed ? `${data.plugin.name} installed` : `${data.plugin.name} uninstalled`
      );
      qc.invalidateQueries({ queryKey: ["plugins"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Settings ---------------- */

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => getJson<{ settings: SettingsMap }>("/api/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, string | number | boolean>) =>
      sendJson<{ settings: SettingsMap }>("/api/settings", "PUT", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Connections ---------------- */

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => getJson<ConnectionsVM>("/api/connections"),
  });
}

export function useUpdateConnections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ConnectionsVM["config"]>) =>
      sendJson<ConnectionsVM>("/api/connections", "PUT", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connections"] }),
    onError: (error: Error) => toast.error(error.message),
  });
}

/* ---------------- Marketplace + nodes ---------------- */

export function useMarketplace() {
  return useQuery({
    queryKey: ["marketplace"],
    queryFn: () => getJson<MarketplacePayload>("/api/marketplace"),
  });
}

export function useNodes() {
  return useQuery({
    queryKey: ["nodes"],
    queryFn: () => getJson<NodesVM & { note: string }>("/api/nodes"),
  });
}
