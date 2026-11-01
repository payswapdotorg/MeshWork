import { db } from "@/lib/db";
import { getNextCronRun } from "@/app/api/automations/cron";
import {
  DEFAULT_SETTINGS,
  LEGACY_AUTOMATION_NAMES,
  LEGACY_PLUGIN_KEYS,
  LEGACY_PROJECT_KEYS,
  LEGACY_TASK_NAMES,
  SEED_AUTOMATIONS,
  SEED_MARKETPLACE_SOURCES,
  SEED_MODEL_PROVIDERS,
  SEED_PLUGINS,
  SEED_PROJECTS,
  SEED_TASK_GROUPS,
  SEED_TASKS,
  SEED_TASK_TRACES,
} from "@/lib/meshwork/data";
import { DEFAULT_CONNECTIONS_CONFIG } from "@/lib/meshwork/aggregation";
import type { ConnectionsConfigVM } from "@/lib/meshwork/types";

/**
 * Idempotent local seeding of the workspace (projects, tasks, traces, groups,
 * automations, plugins, model providers, settings). Uses upserts and a shared
 * in-process promise so concurrent first requests never race on the unique
 * keys. Rows from earlier design previews are migrated away once, then the
 * approved concept set is seeded.
 */
let seedPromise: Promise<void> | null = null;

function parseJsonArray<T>(raw: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function seed(): Promise<void> {
  /* One-time migration away from earlier preview rows */
  const legacyProjects = await db.project.findMany({
    where: { key: { in: [...LEGACY_PROJECT_KEYS] } },
    select: { id: true },
  });
  if (legacyProjects.length > 0) {
    await db.task.deleteMany({ where: { projectId: { in: legacyProjects.map((p) => p.id) } } });
    await db.project.deleteMany({ where: { key: { in: [...LEGACY_PROJECT_KEYS] } } });
  }
  await db.task.deleteMany({ where: { name: { in: [...LEGACY_TASK_NAMES] } } });
  await db.automation.deleteMany({ where: { name: { in: [...LEGACY_AUTOMATION_NAMES] } } });
  await db.plugin.deleteMany({ where: { key: { in: [...LEGACY_PLUGIN_KEYS] } } });

  for (const p of SEED_PROJECTS) {
    await db.project.upsert({ where: { key: p.key }, update: {}, create: { key: p.key, name: p.name } });
  }

  /* Task groups (zcode "By group" sidebar view) */
  for (const g of SEED_TASK_GROUPS) {
    await db.taskGroup.upsert({
      where: { key: g.key },
      update: { title: g.title, color: g.color, position: g.position },
      create: { key: g.key, title: g.title, color: g.color, position: g.position },
    });
  }
  const groups = await db.taskGroup.findMany();
  const groupByKey = new Map(groups.map((g) => [g.key, g.id]));

  /* Seed tasks: create any concept task that is missing (self-healing) and
     keep the concept presentation fields (pinned/unread/group/status) synced. */
  const projects = await db.project.findMany();
  const byKey = new Map(projects.map((p) => [p.key, p.id]));
  for (const t of SEED_TASKS) {
    const groupId = t.groupKey ? (groupByKey.get(t.groupKey) ?? null) : null;
    const existing = await db.task.findFirst({ where: { name: t.name } });
    const data = {
      name: t.name,
      prompt: t.prompt,
      status: t.status,
      pinned: t.pinned,
      unreadAt: t.unread ? new Date() : null,
      groupId,
    };
    const task = existing
      ? await db.task.update({ where: { id: existing.id }, data })
      : await db.task.create({
          data: {
            ...data,
            projectId: byKey.get(t.projectKey) ?? projects[0].id,
            createdAt: new Date(Date.now() - t.ageMinutes * 60_000),
          },
        });

    /* Seed the conversation trace (thinking + tool calls + assistant text)
       exactly once per task — never overwrite an edited trace. */
    const trace = SEED_TASK_TRACES[t.name];
    if (trace && trace.length > 0) {
      const count = await db.taskMessage.count({ where: { taskId: task.id } });
      if (count === 0) {
        let seq = 0;
        const base = new Date(task.createdAt).getTime();
        for (const row of trace) {
          await db.taskMessage.create({
            data: {
              taskId: task.id,
              seq: seq++,
              kind: row.kind,
              text: row.text ?? "",
              payload: JSON.stringify(row.payload ?? {}),
              durationMs: row.durationMs ?? null,
              status: row.status ?? null,
              createdAt: new Date(base + seq * 30_000),
            },
          });
        }
      }
    }
  }

  /* Plugins — upsert with the full zcode-style catalog fields. */
  for (const p of SEED_PLUGINS) {
    const components = (p.components ?? []).map((c) => ({ ...c }));
    await db.plugin.upsert({
      where: { key: p.key },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        enabled: p.enabled,
        version: p.version,
        latestVersion: p.latestVersion,
        author: p.author,
        publisherType: p.publisherType,
        sourceKey: p.sourceKey,
        featured: p.featured,
        components: JSON.stringify(components),
        icon: p.icon,
      },
      create: {
        key: p.key,
        name: p.name,
        description: p.description,
        category: p.category,
        installed: p.installed,
        enabled: p.enabled,
        version: p.version,
        latestVersion: p.latestVersion,
        author: p.author,
        publisherType: p.publisherType,
        sourceKey: p.sourceKey,
        featured: p.featured,
        components: JSON.stringify(components),
        icon: p.icon,
      },
    });
  }

  /* Marketplace sources. */
  for (const s of SEED_MARKETPLACE_SOURCES) {
    await db.marketplaceSource.upsert({
      where: { key: s.key },
      update: { name: s.name, source: s.source, official: s.official, removable: s.removable },
      create: {
        key: s.key,
        name: s.name,
        source: s.source,
        official: s.official,
        removable: s.removable,
      },
    });
  }

  /* Automations (zcode scheduled tasks) + one-time run history seeds. */
  for (const a of SEED_AUTOMATIONS) {
    const existing = await db.automation.findFirst({ where: { name: a.name } });
    const data = {
      name: a.name,
      description: a.description,
      schedule: a.schedule,
      cronExpr: a.cronExpr,
      prompt: a.prompt,
      target: a.target,
      mode: a.mode,
      model: a.model,
      status: a.status,
      enabled: a.enabled,
      runCount: a.runCount,
      lastRunAt: a.runs[0] ? new Date(Date.now() - a.runs[0].hoursAgo * 3_600_000) : null,
      lastError:
        a.runs.find((r): r is typeof r & { error?: string } => "error" in r && !!r.error)?.error ??
        null,
      nextRunAt: a.status === "active" ? (getNextCronRun(a.cronExpr) ?? null) : null,
    };
    const automation = existing
      ? await db.automation.update({ where: { id: existing.id }, data })
      : await db.automation.create({
          data: { ...data, createdAt: new Date(Date.now() - a.ageMinutes * 60_000) },
        });
    const runCount = await db.automationRun.count({ where: { automationId: automation.id } });
    if (runCount === 0) {
      for (const r of a.runs) {
        await db.automationRun.create({
          data: {
            automationId: automation.id,
            trigger: r.trigger,
            status: r.status,
            startedAt: new Date(Date.now() - r.hoursAgo * 3_600_000),
            durationMs: r.durationMs,
            error: "error" in r ? (r.error ?? null) : null,
            sessionId: null,
          },
        });
      }
    }
  }

  /* Model providers + models (zcode Settings → Model settings). */
  for (const provider of SEED_MODEL_PROVIDERS) {
    const existing = await db.modelProvider.findUnique({ where: { key: provider.key } });
    const data = {
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiFormat: provider.apiFormat,
      apiKey: provider.apiKey,
      enabled: provider.enabled,
      builtin: provider.builtin,
      account: provider.account,
      logoKey: provider.logoKey,
      displayOrder: provider.displayOrder,
    };
    const row = existing
      ? await db.modelProvider.update({ where: { id: existing.id }, data })
      : await db.modelProvider.create({ data: { key: provider.key, ...data } });
    for (const m of provider.models) {
      await db.modelEntry.upsert({
        where: { providerId_modelId: { providerId: row.id, modelId: m.modelId } },
        update: {
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          inputTypes: JSON.stringify([...m.inputTypes]),
          capabilities: JSON.stringify({ ...m.capabilities }),
          reasoningLevels: JSON.stringify([...m.reasoningLevels]),
          builtin: m.builtin,
        },
        create: {
          providerId: row.id,
          modelId: m.modelId,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          inputTypes: JSON.stringify([...m.inputTypes]),
          capabilities: JSON.stringify({ ...m.capabilities }),
          reasoningLevels: JSON.stringify([...m.reasoningLevels]),
          builtin: m.builtin,
        },
      });
    }
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }
  await db.setting.upsert({
    where: { key: "connections" },
    update: {},
    create: { key: "connections", value: JSON.stringify(DEFAULT_CONNECTIONS_CONFIG) },
  });
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seed().catch((error) => {
      seedPromise = null; // allow a retry on the next request
      throw error;
    });
  }
  await seedPromise;
}

export async function getSettingsMap(): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany();
  const map: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key === "connections") continue;
    try {
      map[row.key] = JSON.parse(row.value);
    } catch {
      map[row.key] = row.value;
    }
  }
  return map;
}

export async function putSettingsMap(patch: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    if (key === "connections") continue;
    await db.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }
}

export async function getConnectionsConfig(): Promise<ConnectionsConfigVM> {
  const row = await db.setting.findUnique({ where: { key: "connections" } });
  if (!row) return DEFAULT_CONNECTIONS_CONFIG;
  try {
    const parsed = JSON.parse(row.value) as ConnectionsConfigVM;
    return {
      mode: parsed.mode ?? DEFAULT_CONNECTIONS_CONFIG.mode,
      optimiseFor: parsed.optimiseFor ?? DEFAULT_CONNECTIONS_CONFIG.optimiseFor,
      maxSpendPerDay: parsed.maxSpendPerDay ?? null,
      selectedPathIds: parsed.selectedPathIds?.length
        ? parsed.selectedPathIds
        : DEFAULT_CONNECTIONS_CONFIG.selectedPathIds,
    };
  } catch {
    return DEFAULT_CONNECTIONS_CONFIG;
  }
}

export async function putConnectionsConfig(config: ConnectionsConfigVM): Promise<void> {
  await db.setting.upsert({
    where: { key: "connections" },
    update: { value: JSON.stringify(config) },
    create: { key: "connections", value: JSON.stringify(config) },
  });
}

export { parseJsonArray };
