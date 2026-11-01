"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Bell,
  Check,
  FolderOpen,
  RotateCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/meshwork/use-meshwork-data";
import { useUsageStats } from "@/hooks/meshwork/use-model-providers";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EmptyState,
  SectionShell,
  SettingsGroupCard,
  SettingsRow,
  SettingsSearchInput,
  SettingsSegmentedTabs,
  SettingInput,
  SettingSelect,
  SettingSwitch,
  settingBool,
  settingString,
  useSettingsCtx,
} from "./settings-ui";

/* ================================ General =============================== */

const LANGUAGES = [
  { value: "System default", label: "System default" },
  { value: "English", label: "English" },
  { value: "简体中文", label: "简体中文" },
];

const TERMINAL_SHELLS = [
  { value: "Auto", label: "Auto" },
  { value: "Bash", label: "Bash" },
  { value: "Zsh", label: "Zsh" },
  { value: "Fish", label: "Fish" },
  { value: "PowerShell", label: "PowerShell" },
  { value: "Command Prompt", label: "Command Prompt" },
];

export function GeneralSection() {
  const { settings, set } = useSettingsCtx();
  const [notifyTaskDone, setNotifyTaskDone] = useState(true);
  const [notifyAttention, setNotifyAttention] = useState(true);
  const [notifySound, setNotifySound] = useState(false);

  return (
    <SectionShell id="settings-general" title="General">
      <SettingsGroupCard>
        <SettingsRow label="Language" description="Display language used by the application UI." htmlFor="setting-language">
          <SettingSelect
            id="setting-language"
            label="Language"
            value={settingString(settings, "general.language", "System default")}
            onValueChange={(value) => set("general.language", value)}
            options={LANGUAGES}
          />
        </SettingsRow>
        <SettingsRow
          label="Interface mode"
          description="Office mode focuses on summaries and results. Coding mode shows commands, output, and code changes."
        >
          <SettingsSegmentedTabs
            ariaLabel="Interface mode"
            value={settingString(settings, "general.interfaceMode", "Coding mode")}
            onChange={(value) => set("general.interfaceMode", value)}
            options={[
              { value: "Coding mode", label: "Coding mode" },
              { value: "Office mode", label: "Office mode" },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          label="Terminal profile inherit"
          description="Inherit the login shell environment, proxy and terminal font when launching the built-in terminal."
        >
          <SettingSwitch
            label="Inherit terminal profile"
            checked={settingBool(settings, "general.inheritTerminalProfile", true)}
            onCheckedChange={(checked) => set("general.inheritTerminalProfile", checked)}
          />
        </SettingsRow>
        <SettingsRow
          label="Terminal font family"
          description="Leave blank to inherit the system terminal font. Set a value to override it."
          htmlFor="setting-terminal-font"
        >
          <SettingInput
            id="setting-terminal-font"
            label="Terminal font family"
            mono
            value={settingString(settings, "general.terminalFont")}
            placeholder="MesloLGS NF, monospace"
            onCommit={(value) => set("general.terminalFont", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Terminal shell"
          description="Applies to new sessions only. Auto picks the best shell available on this device."
          htmlFor="setting-terminal-shell"
        >
          <SettingSelect
            id="setting-terminal-shell"
            label="Terminal shell"
            value={settingString(settings, "general.terminalShell", "Auto")}
            onValueChange={(value) => set("general.terminalShell", value)}
            options={TERMINAL_SHELLS}
          />
        </SettingsRow>
        <SettingsRow
          label="Proactive suggestions"
          description="Let the agent suggest follow-up actions while you work. Available in Office mode."
        >
          <SettingSwitch
            label="Proactive suggestions"
            checked={settingBool(settings, "general.proactiveSuggestions", false)}
            onCheckedChange={(checked) => set("general.proactiveSuggestions", checked)}
          />
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsGroupCard title="Notifications" description="Local notifications for this device.">
        <SettingsRow label="Task completed" description="Notify when a background task finishes.">
          <Switch
            aria-label="Notify when a task completes"
            checked={notifyTaskDone}
            onCheckedChange={setNotifyTaskDone}
          />
        </SettingsRow>
        <SettingsRow label="Attention needed" description="Notify when a task waits for your approval.">
          <Switch
            aria-label="Notify when attention is needed"
            checked={notifyAttention}
            onCheckedChange={setNotifyAttention}
          />
        </SettingsRow>
        <SettingsRow label="Play sound" description="Play a sound with each notification.">
          <Switch aria-label="Notification sound" checked={notifySound} onCheckedChange={setNotifySound} />
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsGroupCard title="Data" description="Where this workspace keeps its files.">
        <SettingsRow label="Data base directory" description="Task sessions, memory and settings are stored here.">
          <code className="inline-flex h-8 max-w-full items-center truncate rounded-lg border border-mesh-line bg-mesh-panel-2 px-2.5 font-mono text-[11.5px] text-muted-foreground">
            ~/.meshwork
          </code>
        </SettingsRow>
        <SettingsRow label="Onboarding" description="Replay the first-launch walkthrough on the next launch.">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-2 hover:text-foreground"
            onClick={() => toast.success("Onboarding replayed on next launch")}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Replay onboarding
          </Button>
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* =============================== Appearance ============================= */

const CODE_THEMES = [
  "Dark+ (default)",
  "Monokai",
  "One Dark",
  "Solarized Dark",
  "Dracula",
  "GitHub Dark",
];

export function AppearanceSection() {
  const { settings, set } = useSettingsCtx();
  const density = settingString(settings, "appearance.density", "comfortable");

  return (
    <SectionShell id="settings-appearance" title="Appearance" description="Theme and typography for the workspace.">
      <SettingsGroupCard>
        <SettingsRow label="App theme" description="The approved Meshwork design is dark." htmlFor="setting-theme">
          <SettingSelect
            id="setting-theme"
            label="App theme"
            value={settingString(settings, "appearance.theme", "dark")}
            onValueChange={(value) => {
              if (value === "light") {
                toast.info("Light theme is not available in this preview");
                return;
              }
              set("appearance.theme", value);
            }}
            triggerClassName="sm:w-[200px]"
            options={[
              { value: "system", label: "System" },
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </SettingsRow>
        <SettingsRow
          label="UI density"
          description="Compact reduces padding in lists and cards to fit more on screen."
        >
          <SettingsSegmentedTabs
            ariaLabel="UI density"
            value={density}
            onChange={(value) => set("appearance.density", value)}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsGroupCard title="Code presentation" description="How code blocks render in conversations and viewers.">
        <SettingsRow label="Light code theme" description="Used for code exported or printed on light backgrounds." htmlFor="setting-code-light">
          <SettingSelect
            id="setting-code-light"
            label="Light code theme"
            value={settingString(settings, "appearance.codeThemeLight", "GitHub Dark")}
            onValueChange={(value) => set("appearance.codeThemeLight", value)}
            options={CODE_THEMES.map((theme) => ({ value: theme, label: theme }))}
          />
        </SettingsRow>
        <SettingsRow label="Dark code theme" description="Used for code blocks in the workspace." htmlFor="setting-code-dark">
          <SettingSelect
            id="setting-code-dark"
            label="Dark code theme"
            value={settingString(settings, "appearance.codeThemeDark", "Dark+ (default)")}
            onValueChange={(value) => set("appearance.codeThemeDark", value)}
            options={CODE_THEMES.map((theme) => ({ value: theme, label: theme }))}
          />
        </SettingsRow>
        <SettingsRow label="Show line numbers" description="Show line numbers beside code blocks.">
          <SettingSwitch
            label="Show line numbers"
            checked={settingBool(settings, "appearance.codeLineNumbers", true)}
            onCheckedChange={(checked) => set("appearance.codeLineNumbers", checked)}
          />
        </SettingsRow>
        <SettingsRow label="Wrap long lines" description="Wrap long lines instead of scrolling horizontally.">
          <SettingSwitch
            label="Wrap long lines"
            checked={settingBool(settings, "appearance.codeWrapLines", true)}
            onCheckedChange={(checked) => set("appearance.codeWrapLines", checked)}
          />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* =========================== Keyboard shortcuts ========================= */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5.5 min-w-[22px] items-center justify-center rounded border border-mesh-line bg-mesh-panel-2 px-1.5 font-mono text-[10.5px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

const SHORTCUTS: { id: string; command: string; binding: React.ReactNode; scope: string }[] = [
  {
    id: "new-task",
    command: "New task",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>N</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "toggle-sidebar",
    command: "Toggle sidebar",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>B</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "settings",
    command: "Settings",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>,</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "focus-composer",
    command: "Focus composer",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>I</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "send",
    command: "Send message",
    binding: <Kbd>Enter</Kbd>,
    scope: "Composer",
  },
  {
    id: "newline",
    command: "New line",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Shift</Kbd>
        <Kbd>Enter</Kbd>
      </span>
    ),
    scope: "Composer",
  },
  {
    id: "toggle-terminal",
    command: "Toggle terminal panel",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>`</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "toggle-browser",
    command: "Toggle browser panel",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>1</Kbd>
      </span>
    ),
    scope: "Global",
  },
  {
    id: "close-dialog",
    command: "Close dialogs and panels",
    binding: <Kbd>Esc</Kbd>,
    scope: "Global",
  },
  {
    id: "dev-tools",
    command: "Developer tools",
    binding: (
      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>I</Kbd>
      </span>
    ),
    scope: "Desktop build",
  },
];

export function ShortcutsSection() {
  const [search, setSearch] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter(
      (s) =>
        s.command.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q) ||
        s.id.includes(q)
    );
  }, [search]);

  return (
    <SectionShell
      id="settings-shortcuts"
      title="Keyboard shortcuts"
      description="Every shortcut in the Meshwork workspace."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
          onClick={() => setResetOpen(true)}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset all to defaults
        </Button>
      }
    >
      <SettingsSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search shortcuts…"
        label="Search shortcuts"
        className="w-full sm:w-[280px]"
      />
      <div className="overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel">
        <Table>
          <TableHeader>
            <TableRow className="border-mesh-line-soft hover:bg-transparent">
              <TableHead className="h-9 px-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Command
              </TableHead>
              <TableHead className="h-9 px-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Binding
              </TableHead>
              <TableHead className="h-9 px-4 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Scope
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((shortcut) => (
              <TableRow key={shortcut.id} className="border-mesh-line-soft hover:bg-transparent">
                <TableCell className="whitespace-nowrap px-4 py-2.5 text-[12.5px] text-foreground">
                  {shortcut.command}
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-2.5">{shortcut.binding}</TableCell>
                <TableCell className="whitespace-nowrap px-4 py-2.5 text-[12px] text-mesh-quiet">
                  {shortcut.scope}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="border-mesh-line-soft hover:bg-transparent">
                <TableCell colSpan={3} className="px-4 py-8 text-center text-[12px] text-mesh-quiet">
                  No shortcuts match “{search}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="border-mesh-line bg-mesh-panel sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all shortcuts?</AlertDialogTitle>
            <AlertDialogDescription>
              Every keyboard shortcut returns to its factory default. Custom bindings are lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="mesh-action"
              onClick={() => toast.success("Keyboard shortcuts reset to defaults")}
            >
              Reset to defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  );
}

/* =============================== Usage stats ============================ */

const USAGE_TABS = [
  { value: "app", label: "App usage" },
  { value: "glm-5.3-max", label: "GLM 5.3 Max" },
  { value: "glm-5.3-flash", label: "GLM 5.3 Flash" },
];

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-mesh-line bg-mesh-panel px-4 py-3.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-mesh-quiet">{label}</p>
      <p className="mt-1.5 text-[20px] font-semibold tabular-nums leading-none text-foreground">{value}</p>
      {note && <p className="mt-1.5 text-[10.5px] text-mesh-quiet">{note}</p>}
    </div>
  );
}

function ActivityChart({ activity }: { activity: { day: string; label: string; tasks: number }[] }) {
  const max = Math.max(1, ...activity.map((a) => a.tasks));
  return (
    <div className="rounded-xl border border-mesh-line bg-mesh-panel px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-foreground">Activity last 7 days</h3>
        <span className="text-[10.5px] text-mesh-quiet">tasks started</span>
      </div>
      <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label="Tasks started per day, last 7 days">
        {activity.map((day) => (
          <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-mesh-quiet">{day.tasks || ""}</span>
            <div
              className={cn(
                "w-full rounded-t-md",
                day.tasks > 0 ? "bg-mesh-blue/70" : "bg-mesh-panel-3"
              )}
              style={{ height: `${Math.max(6, (day.tasks / max) * 100)}%` }}
              title={`${day.label}: ${day.tasks} tasks`}
            />
            <span className="text-[10px] text-mesh-quiet">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsageSection() {
  const [tab, setTab] = useState("app");
  const statsQuery = useUsageStats();
  const stats = statsQuery.data;

  const number = (value: number | undefined, fallback = "—") =>
    value === undefined ? fallback : value.toLocaleString();

  return (
    <SectionShell id="settings-usage" title="Usage stats" description="Local usage for this workspace.">
      <SettingsSegmentedTabs ariaLabel="Usage scope" value={tab} onChange={setTab} options={USAGE_TABS} />

      {tab === "app" ? (
        <div className="space-y-4">
          {statsQuery.isError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Usage stats could not be loaded"
              note="The local stats service did not respond. Reopen this section to retry."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Tasks run"
                  value={stats ? number(stats.tasksRun) : "—"}
                  note={stats ? undefined : "loading…"}
                />
                <StatCard
                  label="Tool calls"
                  value={stats ? number(stats.toolCalls) : "—"}
                  note={stats ? undefined : "loading…"}
                />
                <StatCard
                  label="Tokens"
                  value={stats ? number(stats.tokens) : "—"}
                  note={stats ? "estimated from local traces" : "loading…"}
                />
              </div>
              <ActivityChart
                activity={
                  stats?.activity ?? [
                    { day: "0", label: "Mon", tasks: 0 },
                    { day: "1", label: "Tue", tasks: 0 },
                    { day: "2", label: "Wed", tasks: 0 },
                    { day: "3", label: "Thu", tasks: 0 },
                    { day: "4", label: "Fri", tasks: 0 },
                    { day: "5", label: "Sat", tasks: 0 },
                    { day: "6", label: "Sun", tasks: 0 },
                  ]
                }
              />
              <p className="text-[10.5px] text-mesh-quiet">
                Computed from this workspace’s local session stats. Provider telemetry is not collected.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Tasks run" value={tab === "glm-5.3-max" ? "18" : "34"} note="local session stats" />
            <StatCard label="Tool calls" value={tab === "glm-5.3-max" ? "212" : "96"} note="local session stats" />
            <StatCard
              label="Tokens"
              value={tab === "glm-5.3-max" ? "412,380" : "128,640"}
              note="local session stats"
            />
          </div>
          <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/50 px-4 py-3 text-[11px] leading-relaxed text-mesh-quiet">
            Per-model usage is tracked locally per session. These illustrative figures are replaced by
            provider reports in the desktop build.
          </div>
        </div>
      )}
    </SectionShell>
  );
}

/* ================================ Projects ============================== */

export function ProjectsSection() {
  const tasksQuery = useTasks();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmProject, setConfirmProject] = useState<string | null>(null);

  const projects = tasksQuery.data?.projects ?? [];
  const tasks = tasksQuery.data?.tasks ?? [];

  const rows = useMemo(() => {
    let list = projects.map((project) => ({
      ...project,
      taskCount: tasks.filter((t) => t.projectId === project.id).length,
    }));
    if (filter === "unused") list = list.filter((p) => p.taskCount === 0);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [projects, tasks, filter, search]);

  const confirmTarget = rows.find((p) => p.name === confirmProject) ?? projects.find((p) => p.name === confirmProject);

  return (
    <SectionShell id="settings-projects" title="Projects" description="Projects known to this workspace.">
      <div className="flex flex-wrap items-center gap-2">
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects…"
          label="Search projects"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger
            aria-label="Filter projects"
            className="h-8 w-[150px] border-mesh-line-soft bg-mesh-panel-2/60 text-[12px] focus-visible:ring-mesh-blue-strong/40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-mesh-line">
            <SelectItem value="all" className="text-[12px]">All projects</SelectItem>
            <SelectItem value="unused" className="text-[12px]">Unused only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasksQuery.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Loading projects…</span>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Projects could not be loaded"
          note="The local workspace service did not respond. Reopen this section to retry."
        />
      ) : (
        <SettingsGroupCard>
          {rows.map((project) => (
            <SettingsRow
              key={project.id}
              label={project.name}
              description={
                project.taskCount === 0
                  ? "No task sessions yet."
                  : `${project.taskCount} task${project.taskCount === 1 ? "" : "s"} recorded.`
              }
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11.5px] text-mesh-quiet hover:bg-mesh-red-soft hover:text-mesh-red"
                onClick={() => setConfirmProject(project.name)}
              >
                Remove project
              </Button>
            </SettingsRow>
          ))}
          {rows.length === 0 && (
            <div className="flex items-center gap-2.5 px-4 py-8 text-[12px] text-mesh-quiet">
              <Search className="h-4 w-4" aria-hidden /> No projects match the current filter.
            </div>
          )}
        </SettingsGroupCard>
      )}

      <AlertDialog open={Boolean(confirmProject)} onOpenChange={(open) => !open && setConfirmProject(null)}>
        <AlertDialogContent className="border-mesh-line bg-mesh-panel sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove “{confirmTarget?.name ?? confirmProject}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The project is removed from this device’s project list. Task sessions stay in the local
              database until the workspace is reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-mesh-red text-white hover:bg-mesh-red/85"
              onClick={() => {
                toast.success(`Project removed from this list — ${confirmProject}`);
                setConfirmProject(null);
              }}
            >
              Remove project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  );
}

/* ================================ Archives ============================== */

export function ArchivesSection() {
  const { settings, set } = useSettingsCtx();
  const [retention, setRetention] = useState(() => String(settings["archives.retentionDays"] ?? 30));

  const autoArchive = settingBool(settings, "archives.autoArchive", false);

  return (
    <SectionShell id="settings-archives" title="Archive management" description="Auto-archive rules and archived tasks.">
      <SettingsGroupCard>
        <SettingsRow
          label="Auto-archive"
          description="Move finished tasks to the archive automatically."
        >
          <SettingSwitch
            label="Auto-archive"
            checked={autoArchive}
            onCheckedChange={(checked) => set("archives.autoArchive", checked)}
          />
        </SettingsRow>
        <SettingsRow
          label="Archive tasks older than"
          description="Finished tasks older than this many days move to the archive."
          htmlFor="setting-retention"
        >
          <div className="flex w-full items-center gap-2 sm:w-[160px]">
            <Input
              id="setting-retention"
              type="number"
              min={1}
              max={365}
              value={retention}
              disabled={!autoArchive}
              aria-label="Archive tasks older than this many days"
              onChange={(e) => setRetention(e.target.value)}
              onBlur={() => {
                const days = Number.parseInt(retention, 10);
                if (Number.isFinite(days) && days >= 1) set("archives.retentionDays", days);
              }}
              className="h-8 border-mesh-line-soft bg-mesh-panel-2/60 text-right font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
            />
            <Label htmlFor="setting-retention" className="shrink-0 text-[11.5px] text-mesh-quiet">
              days
            </Label>
          </div>
        </SettingsRow>
      </SettingsGroupCard>

      <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/50 px-5 py-10 text-center">
        <span
          aria-hidden
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-mesh-panel-2 text-mesh-quiet"
        >
          <Archive className="h-4.5 w-4.5" />
        </span>
        <p className="mt-3 text-[13px] font-medium text-foreground">No archived tasks.</p>
        <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-mesh-quiet">
          Tasks appear here when they are archived manually or by the auto-archive rule above.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] text-mesh-quiet">
          <Check className="h-3 w-3 text-mesh-green" aria-hidden /> Archive is stored locally on this
          device.
        </p>
      </div>

      <p className="flex items-center gap-1.5 text-[10.5px] text-mesh-quiet">
        <FolderOpen className="h-3 w-3" aria-hidden /> Archived sessions live in ~/.meshwork/archive.
      </p>
    </SectionShell>
  );
}
