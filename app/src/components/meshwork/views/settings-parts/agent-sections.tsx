"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Blocks,
  Cable,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Store,
  Terminal,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { MESH_MODELS } from "@/lib/meshwork/data";
import { usePlugins, useTasks } from "@/hooks/meshwork/use-meshwork-data";
import { useModelProviders } from "@/hooks/meshwork/use-model-providers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PluginVM } from "@/lib/meshwork/types";
import {
  EmptyState,
  SectionShell,
  SettingsGroupCard,
  SettingsRow,
  SettingsSearchInput,
  SettingsSegmentedTabs,
  SettingSwitch,
  settingBool,
  useSettingsCtx,
} from "./settings-ui";

/* ============================= Personalization ========================== */

const DEFAULT_INSTRUCTIONS = `# Instructions

- Address me as Ali.
- Prefer concise, technical answers with next-step suggestions.
- Show measured numbers with units and never present advertised rates as measured throughput.
- Ask before changing anything network-related.`;

export function PersonalizationSection() {
  const { settings, set } = useSettingsCtx();
  const stored = typeof settings["personal.instructions"] === "string" ? settings["personal.instructions"] : "";
  const [draft, setDraft] = useState(stored || DEFAULT_INSTRUCTIONS);
  const dirty = draft !== (stored || DEFAULT_INSTRUCTIONS);

  return (
    <SectionShell
      id="settings-personalization"
      title="Personalization"
      description="Instructions that apply to every session. Stored locally."
    >
      <SettingsGroupCard
        title="Instructions (AGENTS.md)"
        description="These instructions are prepended to every task in this workspace."
        bodyClassName="divide-y-0"
      >
        <div className="space-y-3 p-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Personal instructions"
            rows={12}
            className="min-h-[220px] resize-y border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] leading-relaxed text-foreground placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40"
            placeholder="Write instructions for the agent…"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed text-mesh-quiet">
              Applies to all sessions. Stored locally.
            </p>
            <Button
              size="sm"
              className="mesh-action h-8 gap-1.5 px-3.5 text-[12px] font-medium"
              disabled={!dirty}
              onClick={() => {
                set("personal.instructions", draft);
                toast.success("Instructions saved");
              }}
            >
              <Save className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </div>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ================================= Memory =============================== */

const MEMORY_FILES = [
  {
    name: "MEMORY.md",
    updated: "Updated 2h ago",
    preview: "User prefers measurable numbers. Fibre + 5G bond active. GLM 5.3 Max is the default model.",
  },
  {
    name: "nodes.md",
    updated: "Updated yesterday",
    preview: "mesh-local-01 (this device), office-node-02 (offline), field-krill-03 (enrolled, sharing off).",
  },
];

export function MemorySection() {
  const { settings, set } = useSettingsCtx();

  return (
    <SectionShell id="settings-memory" title="Memory" description="Agent memory across task sessions.">
      <SettingsGroupCard>
        <SettingsRow
          label="Enable agent memory"
          description="Memory lets the agent recall context and preferences across task sessions in this workspace."
        >
          <SettingSwitch
            label="Enable agent memory"
            checked={settingBool(settings, "memory.enabled", true)}
            onCheckedChange={(checked) => set("memory.enabled", checked)}
          />
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsGroupCard title="Workspace memory" description="Files the agent reads for long-term context." bodyClassName="divide-y-0">
        <ul className="divide-y divide-mesh-line-soft">
          {MEMORY_FILES.map((file) => (
            <li key={file.name} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-mesh-line bg-mesh-panel-2 text-mesh-quiet"
              >
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12px] font-medium text-foreground">{file.name}</span>
                  <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.08em] text-mesh-quiet">
                    {file.updated}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-mesh-quiet">{file.preview}</p>
              </div>
            </li>
          ))}
        </ul>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ================================ Subagents ============================= */

const SUBAGENTS = [
  {
    id: "researcher",
    name: "Researcher",
    description: "Gathers sources, compares options and returns a cited brief.",
    tools: ["web-search", "browser", "read"],
    model: "Z.ai / glm-5.3-max",
    thought: "Medium",
  },
  {
    id: "network-diagnostics",
    name: "Network diagnostics",
    description: "Runs read-only path diagnostics and summarises measured latency and loss.",
    tools: ["terminal", "read"],
    model: "Z.ai / glm-5.3-flash",
    thought: "Low",
  },
  {
    id: "contract-reviewer",
    name: "Contract reviewer",
    description: "Reads contracts and flags risky clauses with references.",
    tools: ["read", "pdf", "write"],
    model: "Z.ai / glm-5.3-max",
    thought: "High",
  },
];

const THOUGHT_LEVELS = ["Minimal", "Low", "Medium", "High"];

function SubagentCard({ agent }: { agent: (typeof SUBAGENTS)[number] }) {
  const providersQuery = useModelProviders();
  const [model, setModel] = useState(agent.model);
  const [thought, setThought] = useState(agent.thought);

  const modelOptions = useMemo(() => {
    const providers = providersQuery.data?.providers ?? [];
    const options = providers
      .filter((p) => p.enabled)
      .flatMap((p) => p.models.filter((m) => m.enabled).map((m) => `${p.name} / ${m.modelId}`));
    return options.length > 0 ? options : MESH_MODELS.map((m) => `Z.ai / ${m.id}`);
  }, [providersQuery.data]);

  return (
    <li className="rounded-xl border border-mesh-line bg-mesh-panel px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground">{agent.name}</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-mesh-quiet">{agent.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger
              aria-label={`Model for ${agent.name}`}
              className="h-8 w-[210px] border-mesh-line-soft bg-mesh-panel-2/60 text-[11.5px] focus-visible:ring-mesh-blue-strong/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-mesh-line">
              {modelOptions.map((option) => (
                <SelectItem key={option} value={option} className="text-[11.5px]">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={thought} onValueChange={setThought}>
            <SelectTrigger
              aria-label={`Thought level for ${agent.name}`}
              className="h-8 w-[110px] border-mesh-line-soft bg-mesh-panel-2/60 text-[11.5px] focus-visible:ring-mesh-blue-strong/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-mesh-line">
              {THOUGHT_LEVELS.map((level) => (
                <SelectItem key={level} value={level} className="text-[11.5px]">
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {agent.tools.map((tool) => (
          <span
            key={tool}
            className="rounded-md border border-mesh-line bg-mesh-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-mesh-quiet"
          >
            {tool}
          </span>
        ))}
      </div>
    </li>
  );
}

export function SubagentsSection() {
  const openSettings = useMeshStore((s) => s.openSettings);
  const providersQuery = useModelProviders();
  const [search, setSearch] = useState("");

  const filtered = SUBAGENTS.filter(
    (a) =>
      !search.trim() ||
      a.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      a.description.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <SectionShell
      id="settings-subagents"
      title="Subagents"
      description="Delegated workers with their own model and tool grants."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh subagents"
            title="Refresh subagents"
            className="h-8 w-8 border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => {
              void providersQuery.refetch();
              toast.success("Subagents refreshed");
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
            onClick={() => toast.info("The subagent editor opens with the agent runtime in the desktop build.")}
          >
            <Plus className="h-3.5 w-3.5" /> New subagent
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SettingsSearchInput value={search} onChange={setSearch} placeholder="Search subagents…" label="Search subagents" />
        <button
          type="button"
          onClick={() => openSettings("modelProvider")}
          className="text-[11.5px] text-mesh-blue underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
        >
          Manage models →
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Blocks}
          title="No subagents match your search."
          note="Subagents are delegated workers with their own model and tool grants."
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((agent) => (
            <SubagentCard key={agent.id} agent={agent} />
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

/* ================================= Plugins ============================== */

function pluginEnabledKey(plugin: PluginVM): string {
  return `plugins.enabled.${plugin.key}`;
}

export function PluginsSection() {
  const { settings, set } = useSettingsCtx();
  const pluginsQuery = usePlugins();
  const [scope, setScope] = useState<"user" | "workspace">("user");
  const [search, setSearch] = useState("");

  const installed = useMemo(() => {
    const plugins = pluginsQuery.data?.plugins ?? [];
    return plugins
      .filter((p) => p.installed)
      .filter((p) => p.scope === scope)
      .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [pluginsQuery.data, scope, search]);

  return (
    <SectionShell
      id="settings-plugins"
      title="Plugins"
      description="Installed plugins extend what the agent can do."
      actions={
        <Button
          className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
          onClick={() => useMeshStore.getState().setView("plugin-marketplace")}
        >
          <Store className="h-3.5 w-3.5" /> Browse plugin marketplace
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SettingsSegmentedTabs
          ariaLabel="Plugin scope"
          value={scope}
          onChange={(value) => setScope(value as "user" | "workspace")}
          options={[
            { value: "user", label: "User" },
            { value: "workspace", label: "This workspace" },
          ]}
        />
        <SettingsSearchInput value={search} onChange={setSearch} placeholder="Search plugins…" label="Search plugins" />
      </div>

      {pluginsQuery.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Loading plugins…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-mesh-panel" />
          ))}
        </div>
      ) : pluginsQuery.isError ? (
        <EmptyState
          icon={Blocks}
          title="Plugins could not be loaded"
          note="The local plugins service did not respond. Reopen this section to retry."
        />
      ) : installed.length === 0 ? (
        <EmptyState
          icon={Blocks}
          title={`No installed plugins in this scope`}
          note="Install plugins from the marketplace to extend what agent tasks can do."
        />
      ) : (
        <SettingsGroupCard>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mesh-quiet">
              Installed ({installed.length})
            </span>
            <span className="text-[10.5px] text-mesh-quiet">
              {scope === "user" ? "available in every workspace" : "this workspace only"}
            </span>
          </div>
          {installed.map((plugin) => (
            <SettingsRow
              key={plugin.id}
              label={
                <span className="flex flex-wrap items-center gap-2">
                  <span aria-hidden>{plugin.icon || "🧩"}</span>
                  {plugin.name}
                </span>
              }
              description={plugin.description}
            >
              <span className="mr-1 font-mono text-[10.5px] text-mesh-quiet">v{plugin.version}</span>
              <Switch
                aria-label={`Enable ${plugin.name}`}
                checked={settingBool(settings, pluginEnabledKey(plugin), true)}
                onCheckedChange={(checked) => set(pluginEnabledKey(plugin), checked)}
              />
            </SettingsRow>
          ))}
        </SettingsGroupCard>
      )}

      <p className="text-[10.5px] text-mesh-quiet">
        Plugin enablement is stored locally per device. Disabling a plugin turns off its commands,
        skills and MCP servers on the next session.
      </p>
    </SectionShell>
  );
}

/* =============================== MCP servers ============================ */

interface McpServerRow {
  name: string;
  command: string;
  source: string;
  connected: boolean;
}

function slashName(componentName: string): string {
  const [head, tail] = componentName.split(":");
  if (!tail || tail === "view") return `/${head}`;
  return `/${head}-${tail}`;
}

export function McpSection() {
  const pluginsQuery = usePlugins();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [env, setEnv] = useState("");

  const pluginServers: McpServerRow[] = useMemo(() => {
    const plugins = pluginsQuery.data?.plugins ?? [];
    return plugins
      .filter((p) => p.installed)
      .flatMap((p) =>
        p.components
          .filter((c) => c.kind === "mcp")
          .map((c) => ({ name: c.name, command: `${c.name} --stdio`, source: p.name, connected: true }))
      );
  }, [pluginsQuery.data]);

  const [localServers, setLocalServers] = useState<McpServerRow[]>([]);
  const servers = [...pluginServers, ...localServers];

  const submit = () => {
    const trimmedName = name.trim();
    const trimmedCommand = command.trim();
    if (!trimmedName || !trimmedCommand) {
      toast.error("A server name and command are required.");
      return;
    }
    setLocalServers((prev) => [
      ...prev,
      {
        name: trimmedName,
        command: `${trimmedCommand}${args.trim() ? ` ${args.trim()}` : ""}`,
        source: "This device",
        connected: true,
      },
    ]);
    setDialogOpen(false);
    setName("");
    setCommand("");
    setArgs("");
    setEnv("");
    toast.success("Server added — restarts on next session");
  };

  return (
    <SectionShell
      id="settings-mcp"
      title="MCP servers"
      description="External tool connections provided by plugins or configured locally."
      actions={
        <Button
          className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add MCP server
        </Button>
      }
    >
      <SettingsGroupCard>
        {servers.map((server) => (
          <SettingsRow
            key={server.name}
            label={
              <span className="flex items-center gap-2">
                <span
                  role="status"
                  aria-label="Connected"
                  title="Connected"
                  className="h-1.5 w-1.5 rounded-full bg-mesh-green"
                  style={{ boxShadow: "0 0 6px #47c88a66" }}
                />
                <span className="font-mono">{server.name}</span>
              </span>
            }
            description={`${server.command} · from ${server.source}`}
          >
            <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-mesh-green">Connected</span>
          </SettingsRow>
        ))}
        {servers.length === 0 && (
          <div className="flex items-center gap-2.5 px-4 py-8 text-[12px] text-mesh-quiet">
            <Cable className="h-4 w-4" aria-hidden /> No MCP servers configured yet.
          </div>
        )}
      </SettingsGroupCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-mesh-line bg-mesh-panel sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add MCP server</DialogTitle>
            <DialogDescription>
              Configure a local Model Context Protocol server. It starts with the next session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="mcp-name">Name</Label>
              <Input
                id="mcp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. filesystem"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcp-command">Command</Label>
              <Input
                id="mcp-command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx -y @modelcontextprotocol/server-filesystem"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcp-args">Args</Label>
              <Input
                id="mcp-args"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="--root ~/projects"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mcp-env">Env</Label>
              <Textarea
                id="mcp-env"
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                rows={3}
                placeholder={"API_TOKEN=…\nLOG_LEVEL=info"}
                className="border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button className="mesh-action h-8 px-4 text-[12.5px] font-medium" onClick={submit}>
              Add server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

/* ================================= Skills =============================== */

export function SkillsSection() {
  const { settings, set } = useSettingsCtx();
  const pluginsQuery = usePlugins();

  const skills = useMemo(() => {
    const plugins = pluginsQuery.data?.plugins ?? [];
    return plugins
      .filter((p) => p.installed)
      .flatMap((p) =>
        p.components
          .filter((c) => c.kind === "skill")
          .map((c) => ({ name: c.name, description: c.description, source: p.name }))
      );
  }, [pluginsQuery.data]);

  return (
    <SectionShell id="settings-skills" title="Skills" description="Reusable abilities the agent can call in chat.">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Manage workspace and user skills. Enabled skills can be referenced in chat with{" "}
        <code className="rounded border border-mesh-line bg-mesh-panel-2 px-1 font-mono text-[11px] text-foreground">
          $skill-name
        </code>
        .
      </p>

      {pluginsQuery.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Loading skills…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-mesh-panel" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="No skills installed"
          note="Install plugins that ship skills, or add workspace skills to ~/.meshwork/skills."
        />
      ) : (
        <ul className="space-y-2.5">
          {skills.map((skill) => (
            <li
              key={skill.name}
              className="flex items-start justify-between gap-3 rounded-xl border border-mesh-line bg-mesh-panel px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[12.5px] font-medium text-foreground">{skill.name}</span>
                  <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.08em] text-mesh-quiet">
                    {skill.source}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-mesh-quiet">{skill.description}</p>
              </div>
              <Switch
                aria-label={`Enable skill ${skill.name}`}
                checked={settingBool(settings, `skills.enabled.${skill.name}`, true)}
                onCheckedChange={(checked) => set(`skills.enabled.${skill.name}`, checked)}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

/* ================================ Commands ============================== */
const BUILTIN_COMMANDS = [
  { name: "/model", description: "Switch the model for the current task.", source: "Built-in" },
  { name: "/compact", description: "Summarise the conversation to free context.", source: "Built-in" },
  { name: "/clear", description: "Clear the conversation and start fresh.", source: "Built-in" },
];

export function CommandsSection() {
  const pluginsQuery = usePlugins();
  const [search, setSearch] = useState("");

  const commands = useMemo(() => {
    const plugins = pluginsQuery.data?.plugins ?? [];
    const pluginCommands = plugins
      .filter((p) => p.installed)
      .flatMap((p) =>
        p.components
          .filter((c) => c.kind === "command")
          .map((c) => ({
            name: slashName(c.name),
            description: c.description,
            source: "Plugin",
            plugin: p.name,
          }))
      );
    return [...pluginCommands, ...BUILTIN_COMMANDS.map((c) => ({ ...c, plugin: undefined }))];
  }, [pluginsQuery.data]);

  const filtered = commands.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      c.description.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <SectionShell id="settings-commands" title="Commands" description="Slash commands available in the composer.">
      <SettingsSearchInput value={search} onChange={setSearch} placeholder="Search commands…" label="Search commands" />

      <SettingsGroupCard>
        {filtered.map((command) => (
          <SettingsRow
            key={`${command.name}-${command.plugin ?? "builtin"}`}
            label={<span className="font-mono">{command.name}</span>}
            description={command.description}
          >
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]",
                command.source === "Plugin"
                  ? "border-mesh-line bg-mesh-panel-2 text-mesh-blue"
                  : "border-mesh-line bg-mesh-panel-2 text-mesh-quiet"
              )}
            >
              {command.source}
              {command.plugin ? ` · ${command.plugin}` : ""}
            </span>
          </SettingsRow>
        ))}
        {filtered.length === 0 && (
          <div className="flex items-center gap-2.5 px-4 py-8 text-[12px] text-mesh-quiet">
            <Terminal className="h-4 w-4" aria-hidden /> No commands match “{search}”.
          </div>
        )}
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ================================== Hooks =============================== */

interface HookRow {
  id: string;
  event: string;
  matcher: string;
  command: string;
}

const SEED_HOOKS: HookRow[] = [
  { id: "lint-after-edit", event: "AfterToolUse", matcher: "write|edit", command: "meshwork lint --fix" },
  { id: "notify-stop", event: "Stop", matcher: "*", command: "notify-send 'Task finished'" },
  { id: "guard-terminal", event: "PreToolUse", matcher: "terminal", command: "meshwork guard --cmd" },
];

const HOOK_EVENTS = ["PreToolUse", "AfterToolUse", "Notification", "Stop", "SubagentStop"];

export function HooksSection() {
  const { settings, set } = useSettingsCtx();
  const [hooks, setHooks] = useState<HookRow[]>(SEED_HOOKS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [event, setEvent] = useState("AfterToolUse");
  const [matcher, setMatcher] = useState("");
  const [command, setCommand] = useState("");

  const submit = () => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      toast.error("A command is required.");
      return;
    }
    setHooks((prev) => [
      ...prev,
      {
        id: `hook-${prev.length + 1}`,
        event,
        matcher: matcher.trim() || "*",
        command: trimmedCommand,
      },
    ]);
    setDialogOpen(false);
    setMatcher("");
    setCommand("");
    toast.success("Hook added — runs from the next session");
  };

  return (
    <SectionShell
      id="settings-hooks"
      title="Hooks"
      description="Deterministic commands that run on workspace events."
      actions={
        <Button
          className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> New hook
        </Button>
      }
    >
      <SettingsGroupCard>
        {hooks.map((hook) => (
          <SettingsRow
            key={hook.id}
            label={
              <span className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-mesh-line bg-mesh-panel-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-mesh-blue">
                  {hook.event}
                </span>
                <span className="font-mono text-[11.5px] text-mesh-quiet">{hook.matcher}</span>
              </span>
            }
            description={<code className="font-mono text-[11px] text-muted-foreground">{hook.command}</code>}
          >
            <Switch
              aria-label={`Enable ${hook.event} hook`}
              checked={settingBool(settings, `hooks.enabled.${hook.id}`, true)}
              onCheckedChange={(checked) => set(`hooks.enabled.${hook.id}`, checked)}
            />
          </SettingsRow>
        ))}
        {hooks.length === 0 && (
          <div className="flex items-center gap-2.5 px-4 py-8 text-[12px] text-mesh-quiet">
            <Webhook className="h-4 w-4" aria-hidden /> No hooks configured.
          </div>
        )}
      </SettingsGroupCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-mesh-line bg-mesh-panel sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New hook</DialogTitle>
            <DialogDescription>
              Run a shell command when a workspace event matches. Hooks apply from the next session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="hook-event">Event</Label>
              <Select value={event} onValueChange={setEvent}>
                <SelectTrigger
                  id="hook-event"
                  aria-label="Hook event"
                  className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 text-[12px] focus-visible:ring-mesh-blue-strong/40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-mesh-line">
                  {HOOK_EVENTS.map((hookEvent) => (
                    <SelectItem key={hookEvent} value={hookEvent} className="text-[12px]">
                      {hookEvent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hook-matcher">Matcher</Label>
              <Input
                id="hook-matcher"
                value={matcher}
                onChange={(e) => setMatcher(e.target.value)}
                placeholder="* or a tool name pattern"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hook-command">Command</Label>
              <Input
                id="hook-command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="meshwork lint --fix"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button className="mesh-action h-8 px-4 text-[12.5px] font-medium" onClick={submit}>
              Add hook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
