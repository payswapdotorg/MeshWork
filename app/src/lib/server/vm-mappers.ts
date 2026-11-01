import { db } from "@/lib/db";
import type {
  AutomationRunVM,
  AutomationVM,
  MarketplaceSourceVM,
  ModelEntryVM,
  ModelProviderVM,
  PluginComponentVM,
  PluginVM,
  TaskGroupVM,
  TaskVM,
} from "@/lib/meshwork/types";
import type { Automation, AutomationRun, Plugin, Task, TaskGroup } from "@prisma/client";

/** Shared Prisma-row → view-model mappers (single source of truth for APIs). */

type TaskRow = Task & { project?: { name: string } };

export function toTaskVM(t: TaskRow, projectName?: string): TaskVM {
  return {
    id: t.id,
    name: t.name,
    projectId: t.projectId,
    projectName: projectName ?? t.project?.name ?? "",
    prompt: t.prompt,
    status: t.status as TaskVM["status"],
    model: t.model,
    permissionMode: t.permissionMode,
    pinned: t.pinned,
    unread: t.unreadAt !== null,
    groupId: t.groupId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function toTaskGroupVM(g: TaskGroup): TaskGroupVM {
  return {
    id: g.id,
    key: g.key,
    title: g.title,
    color: g.color as TaskGroupVM["color"],
    position: g.position,
  };
}

export function toAutomationVM(a: Automation): AutomationVM {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    schedule: a.schedule,
    cronExpr: a.cronExpr,
    prompt: a.prompt,
    target: a.target,
    mode: a.mode,
    model: a.model,
    status: a.status as AutomationVM["status"],
    enabled: a.enabled,
    runCount: a.runCount,
    lastRunAt: a.lastRunAt?.toISOString() ?? null,
    nextRunAt: a.nextRunAt?.toISOString() ?? null,
    lastError: a.lastError,
  };
}

export function toAutomationRunVM(r: AutomationRun): AutomationRunVM {
  return {
    id: r.id,
    automationId: r.automationId,
    trigger: r.trigger as AutomationRunVM["trigger"],
    status: r.status as AutomationRunVM["status"],
    startedAt: r.startedAt.toISOString(),
    durationMs: r.durationMs,
    error: r.error,
    sessionId: r.sessionId,
  };
}

export function toPluginVM(p: Plugin): PluginVM {
  let components: PluginComponentVM[] = [];
  try {
    const parsed = JSON.parse(p.components) as PluginComponentVM[];
    if (Array.isArray(parsed)) components = parsed;
  } catch {
    components = [];
  }
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description,
    category: p.category,
    installed: p.installed,
    enabled: p.enabled,
    version: p.version,
    latestVersion: p.latestVersion,
    author: p.author,
    publisherType: p.publisherType as PluginVM["publisherType"],
    sourceKey: p.sourceKey,
    featured: p.featured,
    components,
    scope: p.scope as PluginVM["scope"],
    icon: p.icon,
  };
}

export async function toMarketplaceSourceVMs(): Promise<MarketplaceSourceVM[]> {
  const sources = await db.marketplaceSource.findMany({ orderBy: { key: "asc" } });
  return sources.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    source: s.source,
    official: s.official,
    removable: s.removable,
    lastUpdated: s.lastUpdated.toISOString(),
  }));
}

type ProviderRow = Awaited<ReturnType<typeof db.modelProvider.findMany>>[number];

export function toModelProviderVM(
  p: ProviderRow,
  models: Awaited<ReturnType<typeof db.modelEntry.findMany>>
): ModelProviderVM {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    baseUrl: p.baseUrl,
    apiFormat: p.apiFormat as ModelProviderVM["apiFormat"],
    hasApiKey: p.apiKey.length > 0,
    apiKeyPreview: p.apiKey ? `${p.apiKey.slice(0, 3)}••••${p.apiKey.slice(-2)}` : "",
    enabled: p.enabled,
    builtin: p.builtin,
    account: p.account,
    logoKey: p.logoKey,
    models: models
      .filter((m) => m.providerId === p.id)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.modelId.localeCompare(b.modelId))
      .map(
        (m): ModelEntryVM => ({
          id: m.id,
          modelId: m.modelId,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          inputTypes: safeArray<string>(m.inputTypes, ["text"]),
          capabilities: safeRecord(m.capabilities),
          reasoningLevels: safeArray<string>(m.reasoningLevels, []),
          enabled: m.enabled,
          builtin: m.builtin,
        })
      ),
  };
}

function safeArray<T>(raw: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeRecord(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}
