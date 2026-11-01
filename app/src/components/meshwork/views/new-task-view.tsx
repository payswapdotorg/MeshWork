"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  Folder,
  Hexagon,
  History,
  Paperclip,
  Plus,
  Search,
  SquareTerminal,
  Waypoints,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { MESH_MODELS, PERMISSION_MODES } from "@/lib/meshwork/data";
import { useConnections, useCreateTask, useTasks } from "@/hooks/meshwork/use-meshwork-data";
import type { ProjectVM } from "@/lib/meshwork/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* Shortcut chips (concept copy — each fills the composer) */
const SHORTCUTS = [
  {
    id: "research",
    icon: Search,
    label: "Research",
    prompt: "Research this market and identify the strongest opportunities.",
  },
  {
    id: "automate",
    icon: History,
    label: "Automate",
    prompt: "Build an automation that runs this workflow every week.",
  },
  {
    id: "browser-terminal",
    icon: SquareTerminal,
    label: "Browser + terminal",
    prompt: "Use the browser and terminal to investigate and fix this issue.",
  },
  {
    id: "aggregate",
    icon: Waypoints,
    label: "Aggregate connections",
    prompt: "Find the best available connections and aggregate them for the task I am doing.",
  },
  {
    id: "buy",
    icon: ArrowLeftRight,
    label: "Buy connectivity",
    prompt: "Find a connection I can buy nearby that fits my speed and budget.",
  },
] as const;

const OPTIMIZE_PROMPT =
  "Compare my available fibre, 5G and satellite paths. Recommend the best combination for high-throughput uploads, with a maximum cost and a reliable failover path.";

/* Illustrative path measurements (concept card — labelled as illustrative) */
const ILLUSTRATIVE_PATHS = [
  { label: "Fibre", pct: 91, speed: "45 Mbps" },
  { label: "5G", pct: 62, speed: "24 Mbps" },
  { label: "Satellite", pct: 39, speed: "15 Mbps" },
] as const;

const CAPABILITIES = [
  "Browser",
  "Terminal",
  "Automations",
  "Plugins",
  "Subagents",
  "Network nodes",
  "Projects",
  "Memory",
] as const;

const COMMANDS = [
  { name: "/plan", note: "Draft a typed execution plan before running anything" },
  { name: "/diagnose", note: "Run path diagnostics on the selected uplinks" },
  { name: "/compare", note: "Compare provider offers and coverage" },
  { name: "/summarize", note: "Summarize the current task session" },
];

const CONTEXT_SUGGESTIONS = [
  { token: "This device", note: "Endpoint node" },
  { token: "Browser", note: "Capability" },
  { token: "Terminal", note: "Capability" },
  { token: "Network nodes", note: "Capability" },
];

export function NewTaskView() {
  const composer = useMeshStore((s) => s.composer);
  const setComposer = useMeshStore((s) => s.setComposer);
  const resetComposer = useMeshStore((s) => s.resetComposer);
  const openTask = useMeshStore((s) => s.openTask);
  const openDockPanel = useMeshStore((s) => s.openDockPanel);

  const tasksQuery = useTasks();
  const connectionsQuery = useConnections();
  const createTask = useCreateTask();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [composerProject, setComposerProject] = useState<ProjectVM | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const projects = tasksQuery.data?.projects ?? [];
  const permission = PERMISSION_MODES.find((p) => p.id === composer.permissionMode) ?? PERMISSION_MODES[0];
  const model = MESH_MODELS.find((m) => m.id === composer.model) ?? MESH_MODELS[0];
  const availablePaths = connectionsQuery.data?.stats.availableLinks ?? 3;
  const combinedMbps = ILLUSTRATIVE_PATHS.reduce((sum, p) => sum + Number(p.speed.split(" ")[0]), 0);

  /* Focus the composer when arriving via ⌘N */
  useEffect(() => {
    const focus = () => textareaRef.current?.focus();
    window.addEventListener("meshwork:focus-composer", focus);
    return () => window.removeEventListener("meshwork:focus-composer", focus);
  }, []);

  /* "@" context and "/" command suggestions, per the composer placeholder */
  const suggestion = useMemo<{ kind: "command" | "context"; items: { token: string; note: string }[] } | null>(() => {
    const text = composer.prompt;
    const cmd = /(?:^|\s)\/([\w-]*)$/.exec(text);
    if (cmd) {
      const q = cmd[1].toLowerCase();
      return {
        kind: "command",
        items: COMMANDS.filter((c) => c.name.slice(1).toLowerCase().startsWith(q)).map((c) => ({
          token: c.name,
          note: c.note,
        })),
      };
    }
    const at = /(?:^|\s)@([\w-]*)$/.exec(text);
    if (at) {
      const q = at[1].toLowerCase();
      const projectItems = projects
        .filter((p) => p.name.toLowerCase().replace(/\s+/g, "").startsWith(q))
        .map((p) => ({ token: p.name, note: "Project" }));
      const contextItems = CONTEXT_SUGGESTIONS.filter((c) =>
        c.token.toLowerCase().replace(/\s+/g, "").startsWith(q)
      );
      return { kind: "context", items: [...projectItems, ...contextItems] };
    }
    return null;
  }, [composer.prompt, projects]);

  const applySuggestion = (token: string, kind: "command" | "context") => {
    const stripped = composer.prompt.replace(/(?:^|\s)(?:\/|@)[\w-]*$/, "");
    const insert = kind === "command" ? token : `@${token}`;
    const glue = stripped === "" || /\s$/.test(stripped) ? "" : " ";
    setComposer({ prompt: `${stripped}${glue}${insert} ` });
    textareaRef.current?.focus();
  };

  const submit = () => {
    if (!composer.prompt.trim()) {
      toast.error("Describe the outcome you want to achieve first.");
      textareaRef.current?.focus();
      return;
    }
    createTask.mutate(
      {
        prompt: composer.prompt.trim(),
        projectKey: composerProject?.key ?? "",
        model: composer.model,
        permissionMode: composer.permissionMode,
      },
      {
        onSuccess: (data) => {
          resetComposer();
          setAttachments([]);
          /* Land straight in the conversation view with the generated trace. */
          openTask(data.task.id);
        },
      }
    );
  };

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { project?: ProjectVM; error?: string };
      if (!res.ok || !data.project) throw new Error(data.error ?? "Could not create the project.");
      setComposerProject(data.project);
      setNewProjectOpen(false);
      setNewProjectName("");
      toast.success(`Project created — ${data.project.name}`);
      tasksQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the project.");
    }
  };

  return (
    <div className="flex min-h-full justify-center px-4 pb-6 pt-9 sm:px-8 md:px-[42px]">
      <div className="mx-auto w-full max-w-[790px] md:-translate-y-[5px]">
        {/* Greeting */}
        <h1 className="text-center text-[22px] font-[650] tracking-[-0.7px] text-[#e9eaec] sm:text-[25px]">
          What would you like to get done?
        </h1>
        <p className="mx-auto mb-6 max-w-[520px] mt-2 text-center text-[13px] leading-[1.55] text-[#92969f] sm:mb-[27px]">
          Describe the outcome. Your agents coordinate projects, tools, devices and available
          connections to make it happen.
        </p>

        {/* Connectivity network summary */}
        <section
          aria-label="Connectivity network summary"
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#383b40] bg-[#1b1d20] px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-lg border border-[#41464c] bg-[#292d32] text-mesh-blue"
              aria-hidden
            >
              <Waypoints className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground">Your connectivity network</p>
              <p className="mt-[3px] text-[10px] text-[#858a92]">
                {availablePaths} paths detected · This device is not sharing
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right sm:text-left">
              <p className="text-[12px] font-[650] text-foreground">{availablePaths}</p>
              <p className="mt-[2px] text-[10px] text-[#868a92]">Available paths</p>
            </div>
            <div>
              <p className="text-[12px] font-[650] text-foreground">{combinedMbps} Mbps</p>
              <p className="mt-[2px] text-[10px] text-[#868a92]">Measured combined*</p>
            </div>
            <button
              type="button"
              onClick={() => openDockPanel("devices")}
              className="whitespace-nowrap text-[11px] text-mesh-link transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
            >
              Manage network ↗
            </button>
          </div>
        </section>

        {/* Composer */}
        <section
          aria-label="Task composer"
          className="overflow-visible rounded-[17px] border border-[#44474d] bg-mesh-panel-2 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
        >
          <div className="relative">
            <div className="flex items-center gap-2 px-3 pb-0 pt-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-[30px] items-center gap-2 rounded-[7px] px-[7px] text-[12px] text-[#d0d2d6] transition-colors hover:bg-[#303237] focus-visible:outline-2 focus-visible:outline-mesh-blue"
                  >
                    <Folder className="h-4 w-4 text-[#858a92]" aria-hidden />
                    {composerProject ? composerProject.name : "Select project"}
                    <ChevronDown className="h-3 w-3 text-[#858a92]" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-[11px] text-mesh-quiet">Project</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="text-[12.5px]"
                    onSelect={() => setComposerProject(null)}
                  >
                    No project
                  </DropdownMenuItem>
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.key}
                      className="text-[12.5px]"
                      onSelect={() => setComposerProject(p)}
                    >
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-[12.5px]" onSelect={() => setNewProjectOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> New project…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="ml-auto text-[10px] text-[#838790]">New task</span>
            </div>

            <textarea
              ref={textareaRef}
              value={composer.prompt}
              onChange={(e) => setComposer({ prompt: e.target.value })}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask Meshwork anything, @ to add context, / for commands or capabilities…"
              aria-label="Task prompt"
              className="min-h-[105px] w-full resize-none bg-transparent px-4 pb-2 pt-3 text-[14px] leading-[1.55] text-[#f0f1f3] outline-none placeholder:text-[#777b83]"
            />

            {/* @ context / slash command suggestions */}
            {suggestion && suggestion.items.length > 0 && (
              <div
                role="listbox"
                aria-label={suggestion.kind === "command" ? "Commands" : "Context suggestions"}
                className="absolute left-3 right-3 top-full z-20 overflow-hidden rounded-xl border border-mesh-line bg-popover shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              >
                {suggestion.items.map((item) => (
                  <button
                    key={item.token}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => applySuggestion(item.token, suggestion.kind)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-mesh-panel-3 focus-visible:bg-mesh-panel-3 focus-visible:outline-none"
                  >
                    <span className="font-mono text-mesh-blue">
                      {suggestion.kind === "command" ? item.token : `@${item.token}`}
                    </span>
                    <span className="truncate text-[11px] text-mesh-quiet">{item.note}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Context chips (attachments) */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1.5">
                {attachments.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#44474d] bg-[#2a2c30] px-2 py-[5px] text-[10px] text-[#b9bec7]"
                  >
                    <Paperclip className="h-3 w-3" aria-hidden /> {a}
                    <button
                      type="button"
                      aria-label={`Remove ${a}`}
                      onClick={() => setAttachments((prev) => prev.filter((p) => p !== a))}
                      className="text-[#777b83] transition-colors hover:text-foreground"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Composer bottom bar */}
            <div className="flex items-center gap-[9px] px-3 pb-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name);
                  if (names.length) {
                    setAttachments((prev) => [...new Set([...prev, ...names])].slice(0, 6));
                    toast.success(names.length === 1 ? `Attached ${names[0]}` : `Attached ${names.length} files`);
                  }
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Attach files"
                title="Attach files"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[#a5a9b0] transition-colors hover:bg-[#35383d] hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Permission selector — orange, per the concept */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-[7px] rounded-[7px] px-[9px] py-[7px] text-[11px] text-[#ff9a45] transition-colors hover:bg-[#39302a] focus-visible:outline-2 focus-visible:outline-mesh-blue"
                  >
                    <Hexagon className="h-3.5 w-3.5" aria-hidden />
                    {permission.name}
                    <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuLabel className="text-[11px] text-mesh-quiet">Access mode</DropdownMenuLabel>
                  {PERMISSION_MODES.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      className="flex-col items-start gap-0.5 text-[12.5px]"
                      onSelect={() => setComposer({ permissionMode: p.id })}
                    >
                      <span className={cn("font-medium", p.id === composer.permissionMode && "text-mesh-blue")}>
                        {p.name}
                      </span>
                      <span className="text-[11px] leading-snug text-mesh-quiet">{p.note}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1" />

              {/* Model selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-[7px] px-[9px] py-[7px] text-[11px] text-[#d0d2d7] transition-colors hover:bg-[#33363b] focus-visible:outline-2 focus-visible:outline-mesh-blue"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border-2 border-[#727a88]"
                      aria-hidden
                    />
                    {model.name}
                    <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-[11px] text-mesh-quiet">Model</DropdownMenuLabel>
                  {MESH_MODELS.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      className="text-[12.5px]"
                      onSelect={() => setComposer({ model: m.id })}
                    >
                      {m.name}
                      {m.id === composer.model && <span className="ml-auto text-[10px] text-mesh-green">active</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={submit}
                disabled={createTask.isPending}
                title="Create task"
                aria-label="Create task"
                className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#d5d6d8] text-[#222] transition-colors hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {/* Shortcut chips */}
        <div className="mx-auto mt-[19px] flex flex-wrap items-center justify-center gap-[9px]">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setComposer({ prompt: s.prompt });
                  textareaRef.current?.focus();
                }}
                className="inline-flex items-center gap-[7px] rounded-[9px] border border-[#393b40] bg-[#17181b] px-[11px] py-2 text-[11px] text-[#adb0b7] transition-colors hover:border-[#626977] hover:bg-[#22252a] hover:text-[#e2e5eb] focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <Icon className="h-[15px] w-[15px]" aria-hidden />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Below-grid: connection paths + orchestrate capabilities */}
        <div className="mt-[22px] grid grid-cols-1 gap-3 md:grid-cols-[1.12fr_.88fr]">
          <section aria-label="Available connection paths" className="rounded-xl border border-mesh-line bg-[#191a1d] p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[12px] font-[620] text-foreground">Available connection paths</h2>
              <span className="text-[10px] text-[#858a92]">Illustrative measurements</span>
            </div>
            {ILLUSTRATIVE_PATHS.map((p) => (
              <div key={p.label} className="grid grid-cols-[68px_1fr_55px] items-center gap-2.5 py-[9px]">
                <span className="flex items-center gap-1.5 text-[10px] text-[#c3c6cc]">
                  <i className="h-1.5 w-1.5 rounded-full bg-[#79cba2]" aria-hidden />
                  {p.label}
                </span>
                <div className="h-[5px] overflow-hidden rounded-full bg-[#34373c]">
                  <i
                    className="block h-full rounded-full"
                    style={{ width: `${p.pct}%`, background: "linear-gradient(90deg,#679bca,#8ac5a4)" }}
                    aria-hidden
                  />
                </div>
                <span className="text-right text-[10px] text-[#aeb2ba]">{p.speed}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-[#303237] pt-2.5 text-[10px] text-[#898e97]">
              <span className="text-[#8ed9b0]">● {ILLUSTRATIVE_PATHS.length} paths healthy</span>
              <button
                type="button"
                onClick={() => {
                  setComposer({ prompt: OPTIMIZE_PROMPT });
                  textareaRef.current?.focus();
                }}
                className="mesh-net-action rounded-[7px] px-2 py-[5px] text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                Optimize paths
              </button>
            </div>
          </section>

          <section aria-label="Orchestrate capabilities" className="rounded-xl border border-mesh-line bg-[#191a1d] p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[12px] font-[620] text-foreground">Orchestrate capabilities</h2>
              <span className="text-[10px] text-[#858a92]">Ready to use</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CAPABILITIES.map((c) => (
                <span
                  key={c}
                  className="rounded-[7px] border border-[#3a3c42] bg-[#27292d] px-2 py-1.5 text-[10px] text-[#bfc3ca]"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#303237] pt-2.5 text-[10px] text-[#898e97]">
              <span>Actions remain permission-scoped</span>
              <button
                type="button"
                onClick={() =>
                  toast.info("Capabilities are composed from local tools, plugins, projects and enrolled network nodes.")
                }
                className="text-mesh-link transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                View capabilities →
              </button>
            </div>
          </section>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-balance text-center text-[10px] leading-relaxed text-[#737881]">
          *Combined throughput depends on transport support, path quality and relay capacity. No
          bandwidth is shared or sold unless you explicitly enable it.
        </p>
      </div>

      {/* New project dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Projects group task sessions. The new project becomes the composer's selected project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-1">
            <Label htmlFor="new-project-name">Project name</Label>
            <Input
              id="new-project-name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Community network pilot"
              onKeyDown={(e) => e.key === "Enter" && createProject()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button className="mesh-action font-medium" onClick={createProject} disabled={!newProjectName.trim()}>
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
