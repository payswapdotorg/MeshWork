"use client";

/**
 * Plugin Marketplace (zcode plugin store) — store / detail / manage views.
 *
 * Store: Public/Community/Personal segments + search, Featured and category
 * sections, install/enable/update/uninstall actions and the marketplace
 * sources dialog (with the "add marketplace" risk flow). Detail: component
 * breakdown (MCP servers, skills, commands, subagents, hooks), information
 * card and advanced details. Manage: installed plugins with "Update all",
 * built-in plugins with "Restore", and a link to the full plugin settings.
 */

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Anchor,
  ArrowLeft,
  Blocks,
  Bot,
  Cable,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Plus,
  RotateCw,
  Search,
  Settings,
  Store,
  Terminal,
  Trash2,
  TriangleAlert,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import type { MarketplaceSourceVM, PluginComponentVM, PluginVM } from "@/lib/meshwork/types";
import {
  useAddMarketplaceSource,
  usePlugins,
  useRefreshMarketplaceSource,
  useRemoveMarketplaceSource,
  useUpdatePlugin,
  useUpdatePluginVersion,
} from "@/hooks/meshwork/use-plugins";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/* ------------------------------------------------------------------ */
/* Segments and sections                                               */
/* ------------------------------------------------------------------ */

const SEGMENTS = [
  { id: "public", label: "Public" },
  { id: "community", label: "Community" },
  { id: "personal", label: "Personal" },
] as const;

type SegmentId = (typeof SEGMENTS)[number]["id"];

/** Known official source keys — used until (or if) the sources list is empty. */
const FALLBACK_OFFICIAL_KEYS = new Set(["meshwork-official", "claude-plugins-official"]);

/** Category section order for the Public and Community segments. */
const CATEGORY_ORDER = ["Productivity", "Developer Tools", "Utilities", "Legal"];

/** Component sections on the detail page, in zcode's order. */
const COMPONENT_SECTIONS: { kind: PluginComponentVM["kind"]; title: string; icon: LucideIcon }[] = [
  { kind: "mcp", title: "MCP servers", icon: Cable },
  { kind: "skill", title: "Skills", icon: WandSparkles },
  { kind: "command", title: "Commands", icon: Terminal },
  { kind: "agent", title: "Subagents", icon: Bot },
  { kind: "hook", title: "Hooks", icon: Anchor },
];

interface Section {
  id: string;
  title: string;
  plugins: PluginVM[];
}

function inSegment(plugin: PluginVM, segment: SegmentId, officialKeys: Set<string>): boolean {
  const fromOfficialSource = officialKeys.has(plugin.sourceKey);
  switch (segment) {
    case "public":
      return plugin.publisherType === "official";
    case "community":
      return plugin.publisherType === "community" && fromOfficialSource;
    case "personal":
      return !fromOfficialSource;
  }
}

function matchesQuery(plugin: PluginVM, q: string): boolean {
  return (
    plugin.name.toLowerCase().includes(q) ||
    plugin.description.toLowerCase().includes(q) ||
    plugin.category.toLowerCase().includes(q)
  );
}

function byName(a: PluginVM, b: PluginVM): number {
  return a.name.localeCompare(b.name);
}

/** Category sections (in zcode's fixed order, leftovers under "Other"). */
function categorySections(plugins: PluginVM[]): Section[] {
  const sections: Section[] = [];
  for (const category of CATEGORY_ORDER) {
    const inCategory = plugins.filter((p) => p.category === category);
    if (inCategory.length > 0) sections.push({ id: category, title: category, plugins: inCategory });
  }
  const other = plugins.filter((p) => !CATEGORY_ORDER.includes(p.category));
  if (other.length > 0) sections.push({ id: "other", title: "Other", plugins: other });
  return sections;
}

/** Personal segment — grouped by marketplace source name. */
function sourceSections(plugins: PluginVM[], sources: MarketplaceSourceVM[]): Section[] {
  const bySource = new Map<string, PluginVM[]>();
  for (const plugin of plugins) {
    const list = bySource.get(plugin.sourceKey) ?? [];
    list.push(plugin);
    bySource.set(plugin.sourceKey, list);
  }
  return [...bySource.entries()]
    .map(([key, list]) => ({
      id: key,
      title: sources.find((s) => s.key === key)?.name ?? key,
      plugins: list,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function Spinner() {
  return <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />;
}

function PluginAvatar({ plugin, large = false }: { plugin: PluginVM; large?: boolean }) {
  const emoji = plugin.icon?.trim();
  return (
    <span
      role="img"
      aria-label={plugin.name}
      className={cn(
        "flex shrink-0 items-center justify-center bg-mesh-panel-3",
        large ? "size-16 rounded-2xl text-3xl" : "size-10 rounded-xl text-lg"
      )}
    >
      {emoji ? emoji : <Blocks className="h-5 w-5 text-muted-foreground" aria-hidden />}
    </span>
  );
}

function PublisherBadge({ plugin }: { plugin: PluginVM }) {
  return plugin.publisherType === "official" ? (
    <span className="rounded-full border border-mesh-green-line bg-mesh-green-soft px-2 py-0.5 text-[10.5px] font-medium text-[#8ed9b0]">
      Official
    </span>
  ) : (
    <span className="rounded-full border border-mesh-line bg-mesh-panel-2 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
      Community
    </span>
  );
}

function UpdateBadge() {
  return (
    <span className="shrink-0 rounded-full border border-mesh-amber/40 bg-mesh-amber-soft px-1.5 py-0.5 text-[10.5px] font-medium text-mesh-amber">
      Update
    </span>
  );
}

/** Uninstall confirm — shared by store cards, manage rows and the detail page. */
function UninstallConfirm({
  plugin,
  open,
  onOpenChange,
}: {
  plugin: PluginVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updatePlugin = useUpdatePlugin();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Uninstall {plugin.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the plugin’s cached files, its data directory, and any saved
            configuration. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={updatePlugin.isPending}
            className="bg-mesh-red text-white hover:bg-mesh-red/85"
            onClick={(e) => {
              e.preventDefault();
              updatePlugin.mutate(
                { id: plugin.id, installed: false },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    toast.success(`${plugin.name} uninstalled`);
                  },
                }
              );
            }}
          >
            {updatePlugin.isPending ? "Uninstalling…" : "Uninstall"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Plugin card (store grid, manage rows)                               */
/* ------------------------------------------------------------------ */

function PluginCard({
  plugin,
  onOpen,
  restore = false,
}: {
  plugin: PluginVM;
  onOpen: () => void;
  /** Manage view "Built-in" rows restore instead of installing. */
  restore?: boolean;
}) {
  const updatePlugin = useUpdatePlugin();
  const updateVersion = useUpdatePluginVersion();
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const outdated = plugin.installed && plugin.latestVersion !== plugin.version;
  const busy = updatePlugin.isPending || updateVersion.isPending;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${plugin.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-mesh-panel-2 focus-visible:outline-2 focus-visible:outline-mesh-blue"
    >
      <PluginAvatar plugin={plugin} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-[13px] font-medium text-foreground">{plugin.name}</h3>
          {outdated && <UpdateBadge />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] leading-relaxed text-mesh-quiet">
          {plugin.description}
        </p>
      </div>

      {/* Actions — clicks here never open the detail page. */}
      <div
        className="flex shrink-0 items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {plugin.installed ? (
          <>
            <Switch
              aria-label={`${plugin.name} enabled`}
              checked={plugin.enabled}
              onCheckedChange={(checked) => updatePlugin.mutate({ id: plugin.id, enabled: checked })}
            />
            {outdated && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  updateVersion.mutate(
                    { id: plugin.id },
                    { onSuccess: () => toast.success(`Updated ${plugin.name}`) }
                  )
                }
                className="h-7 rounded-full border-mesh-amber/40 px-3 text-[11.5px] font-medium text-mesh-amber hover:bg-mesh-amber-soft hover:text-mesh-amber"
              >
                {updateVersion.isPending && <Spinner />} Update
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${plugin.name} actions`}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-mesh-quiet transition-colors hover:bg-mesh-panel-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
                  onSelect={() => setConfirmUninstall(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Uninstall
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : restore ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={updatePlugin.isPending}
            onClick={() =>
              updatePlugin.mutate(
                { id: plugin.id, installed: true },
                { onSuccess: () => toast.success("Restored") }
              )
            }
            className="h-7 rounded-full px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            {updatePlugin.isPending ? <Spinner /> : null} Restore
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={updatePlugin.isPending}
            onClick={() =>
              updatePlugin.mutate(
                { id: plugin.id, installed: true },
                { onSuccess: () => toast.success(`${plugin.name} installed`) }
              )
            }
            className="h-7 rounded-full border-mesh-line bg-mesh-panel-2 px-3.5 text-[12px] font-medium text-foreground hover:bg-mesh-panel-3 hover:text-foreground"
          >
            {updatePlugin.isPending && <Spinner />}
            {updatePlugin.isPending ? "Installing…" : "Install"}
          </Button>
        )}
      </div>

      <UninstallConfirm plugin={plugin} open={confirmUninstall} onOpenChange={setConfirmUninstall} />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Marketplace sources dialog (+ add marketplace, remove confirm)      */
/* ------------------------------------------------------------------ */

function SourcesDialog({
  open,
  onOpenChange,
  sources,
  plugins,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: MarketplaceSourceVM[];
  plugins: PluginVM[];
  /** called after a source is added — switches the store to Personal */
  onAdded: () => void;
}) {
  const refreshSource = useRefreshMarketplaceSource();
  const removeSource = useRemoveMarketplaceSource();
  const addSource = useAddMarketplaceSource();

  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [riskAck, setRiskAck] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const plugin of plugins) {
      map.set(plugin.sourceKey, (map.get(plugin.sourceKey) ?? 0) + 1);
    }
    return map;
  }, [plugins]);

  const removing = removingKey !== null ? sources.find((s) => s.key === removingKey) ?? null : null;
  const canAdd = addInput.trim() !== "" && riskAck && !addSource.isPending;

  const submitAdd = () => {
    const source = addInput.trim();
    if (!source || !riskAck) return;
    addSource.mutate(
      { source },
      {
        onSuccess: () => {
          toast.success("Marketplace added");
          setAddOpen(false);
          onOpenChange(false);
          setAddInput("");
          setRiskAck(false);
          onAdded();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marketplace sources</DialogTitle>
          <DialogDescription>
            Manage where plugins and skills are installed from.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {sources.map((source) => {
            const count = counts.get(source.key) ?? 0;
            const refreshing = refreshingKey === source.key;
            return (
              <div
                key={source.key}
                className="flex items-center gap-1.5 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/60 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{source.name}</p>
                  <p className="truncate text-[11.5px] text-mesh-quiet">
                    {count} {count === 1 ? "plugin" : "plugins"} · Updated{" "}
                    {formatDistanceToNow(new Date(source.lastUpdated), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Refresh ${source.name}`}
                  title="Refresh"
                  disabled={refreshSource.isPending}
                  onClick={() => {
                    setRefreshingKey(source.key);
                    refreshSource.mutate(
                      { key: source.key },
                      {
                        onSuccess: () => toast.success("Source refreshed"),
                        onSettled: () => setRefreshingKey(null),
                      }
                    );
                  }}
                  className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-3 hover:text-foreground"
                >
                  {refreshing ? <Spinner /> : <RotateCw className="h-3.5 w-3.5" />}
                </Button>
                {source.removable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${source.name}`}
                    title="Remove"
                    onClick={() => setRemovingKey(source.key)}
                    className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-3 hover:text-mesh-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={() => setAddOpen(true)}
          className="h-8 w-full gap-1.5 border-mesh-line bg-mesh-panel-2 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add marketplace
        </Button>

        {/* Add marketplace — nested dialog with the trust warning */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add marketplace</DialogTitle>
              <DialogDescription>Point the workspace at a marketplace you trust.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-2.5 rounded-lg border border-mesh-amber/30 bg-mesh-amber-soft p-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-mesh-amber" aria-hidden />
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Marketplaces run third-party code. Only add sources you trust.
              </p>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
            >
              <Input
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="GitHub repo, git URL, file, or directory"
                aria-label="Marketplace source"
                className="h-9 border-mesh-line bg-mesh-panel-2 text-[12.5px] placeholder:text-mesh-quiet"
              />
              <label
                htmlFor="marketplace-risk-ack"
                className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-muted-foreground"
              >
                <Checkbox
                  id="marketplace-risk-ack"
                  checked={riskAck}
                  onCheckedChange={(checked) => setRiskAck(checked === true)}
                  className="mt-0.5"
                />
                I understand the risks
              </label>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddOpen(false)}
                  className="h-8 px-3.5 text-[12.5px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!canAdd}
                  className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
                >
                  {addSource.isPending && <Spinner />} Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Remove confirm */}
        <AlertDialog
          open={removing !== null}
          onOpenChange={(o) => {
            if (!o) setRemovingKey(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove marketplace</AlertDialogTitle>
              <AlertDialogDescription>
                Remove “{removing?.name}”? Plugins from this marketplace are uninstalled but stay
                in the catalog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={removeSource.isPending}
                className="bg-mesh-red text-white hover:bg-mesh-red/85"
                onClick={(e) => {
                  e.preventDefault();
                  if (!removing) return;
                  const key = removing.key;
                  removeSource.mutate(
                    { key },
                    {
                      onSuccess: () => {
                        setRemovingKey(null);
                        toast.success("Marketplace removed");
                      },
                    }
                  );
                }}
              >
                {removeSource.isPending ? "Removing…" : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Detail view                                                         */
/* ------------------------------------------------------------------ */

function PluginDetail({
  plugin,
  sources,
  onBack,
}: {
  plugin: PluginVM;
  sources: MarketplaceSourceVM[];
  onBack: () => void;
}) {
  const updatePlugin = useUpdatePlugin();
  const updateVersion = useUpdatePluginVersion();
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const outdated = plugin.installed && plugin.latestVersion !== plugin.version;
  const sourceName = sources.find((s) => s.key === plugin.sourceKey)?.name ?? plugin.sourceKey;
  const website = `https://meshwork.dev/plugins/${plugin.key}`;

  const componentSections = COMPONENT_SECTIONS.map((section) => ({
    ...section,
    items: plugin.components.filter((c) => c.kind === section.kind),
  })).filter((section) => section.items.length > 0);

  const infoRows: { label: string; value: string; link?: boolean }[] = [];
  if (plugin.author) infoRows.push({ label: "Developer", value: plugin.author });
  if (plugin.category) infoRows.push({ label: "Category", value: plugin.category });
  infoRows.push({ label: "Version", value: `v${plugin.version}` });
  infoRows.push({ label: "Source", value: sourceName });
  infoRows.push({ label: "Website", value: website, link: true });

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Back to plugin marketplace"
        className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-2 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="mt-3 max-w-2xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <PluginAvatar plugin={plugin} large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{plugin.name}</h1>
              <span className="text-[12px] text-mesh-quiet">v{plugin.version}</span>
              {outdated && <UpdateBadge />}
              <PublisherBadge plugin={plugin} />
            </div>
            <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-muted-foreground">
              {plugin.description}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {plugin.installed ? (
                <>
                  <Button
                    onClick={() => {
                      toast.success("Prompt sent to a new task");
                      useMeshStore.getState().setView("new-task");
                    }}
                    className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
                  >
                    Try now
                  </Button>
                  {outdated && (
                    <Button
                      variant="outline"
                      disabled={updateVersion.isPending}
                      onClick={() =>
                        updateVersion.mutate(
                          { id: plugin.id },
                          { onSuccess: () => toast.success(`Updated ${plugin.name}`) }
                        )
                      }
                      className="h-8 gap-1.5 border-mesh-amber/40 bg-transparent px-3 text-[12.5px] text-mesh-amber hover:bg-mesh-amber-soft hover:text-mesh-amber"
                    >
                      {updateVersion.isPending ? <Spinner /> : null} Update
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`${plugin.name} actions`}
                        className="h-8 w-8 border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        className="gap-2 text-[12.5px]"
                        onSelect={() =>
                          updatePlugin.mutate(
                            { id: plugin.id, enabled: !plugin.enabled },
                            {
                              onSuccess: () =>
                                toast.success(
                                  plugin.enabled ? `${plugin.name} disabled` : `${plugin.name} enabled`
                                ),
                            }
                          )
                        }
                      >
                        {plugin.enabled ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-[12.5px] text-mesh-red focus:text-mesh-red"
                        onSelect={() => setConfirmUninstall(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Uninstall
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  onClick={() =>
                    updatePlugin.mutate(
                      { id: plugin.id, installed: true },
                      { onSuccess: () => toast.success(`${plugin.name} installed`) }
                    )
                  }
                  disabled={updatePlugin.isPending}
                  className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
                >
                  {updatePlugin.isPending && <Spinner />}
                  {updatePlugin.isPending ? "Installing…" : "Install"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Components */}
        {componentSections.map((section) => (
          <section key={section.kind} className="mt-7" aria-label={section.title}>
            <div className="flex items-center gap-2">
              <section.icon className="h-4 w-4 text-mesh-quiet" aria-hidden />
              <h2 className="text-[13px] font-medium text-foreground">{section.title}</h2>
              <span className="text-[12px] text-mesh-quiet">{section.items.length}</span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {section.items.map((component) => (
                <div
                  key={component.name}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-mesh-panel-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mesh-panel-3 text-muted-foreground"
                    aria-hidden
                  >
                    <section.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12.5px] text-foreground">
                      {component.name}
                    </p>
                    {component.description && (
                      <p className="line-clamp-1 text-[12px] text-mesh-quiet">
                        {component.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Information */}
        <section className="mt-7" aria-label="Plugin information">
          <h2 className="text-[13px] font-medium text-foreground">Information</h2>
          <dl className="mt-2.5 space-y-2.5 rounded-xl border border-mesh-line bg-mesh-panel p-4">
            {infoRows.map((row) => (
              <div key={row.label} className="flex gap-4">
                <dt className="w-24 shrink-0 text-[12px] text-mesh-quiet">{row.label}</dt>
                <dd className="min-w-0 break-words text-[12.5px] text-foreground">
                  {row.link ? (
                    <a
                      href={row.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-mesh-blue underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-mesh-blue"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Advanced details */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-5">
          <CollapsibleTrigger className="group/adv flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue">
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform group-data-[state=open]/adv:rotate-180"
              aria-hidden
            />
            Advanced details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-xl border border-mesh-line bg-mesh-panel p-4">
              <div className="flex flex-wrap gap-4">
                <span className="w-24 shrink-0 text-[12px] text-mesh-quiet">Root path</span>
                <code className="min-w-0 break-all font-mono text-[12.5px] text-foreground">
                  ~/.meshwork/plugins/{plugin.key}
                </code>
              </div>
              <p className="mt-2 text-[11.5px] text-mesh-quiet">Takes effect in new sessions.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <UninstallConfirm plugin={plugin} open={confirmUninstall} onOpenChange={setConfirmUninstall} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Manage view                                                         */
/* ------------------------------------------------------------------ */

function ManagePlugins({
  plugins,
  sources,
  officialKeys,
  isLoading,
  isFetching,
  onBack,
  onRefresh,
}: {
  plugins: PluginVM[];
  sources: MarketplaceSourceVM[];
  officialKeys: Set<string>;
  isLoading: boolean;
  isFetching: boolean;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const openSettings = useMeshStore((s) => s.openSettings);
  const updateVersion = useUpdatePluginVersion();
  const [updatingAll, setUpdatingAll] = useState(false);

  const installed = plugins.filter((p) => p.installed);
  const outdated = installed.filter((p) => p.latestVersion !== p.version);
  const builtins = plugins.filter((p) => !p.installed && officialKeys.has(p.sourceKey));

  const updateAll = async () => {
    if (outdated.length === 0 || updatingAll) return;
    setUpdatingAll(true);
    let updated = 0;
    for (const plugin of outdated) {
      try {
        await updateVersion.mutateAsync({ id: plugin.id });
        updated += 1;
      } catch {
        break; /* the failing update already surfaced its toast */
      }
    }
    setUpdatingAll(false);
    if (updated > 0) toast.success(`Updated ${updated} plugin(s)`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back to plugin marketplace"
            className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-2 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Manage plugins
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => openSettings("plugins")}
          className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" /> Plugin settings
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-mesh-line-soft bg-mesh-panel/60"
            />
          ))}
        </div>
      ) : installed.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-mesh-line bg-mesh-panel/40 px-6 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">No plugins installed</p>
          <Button onClick={onBack} className="mesh-action h-8 px-3.5 text-[12.5px] font-medium">
            Browse plugin marketplace
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-medium text-foreground">
              Installed ({installed.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateAll}
                disabled={outdated.length === 0 || updatingAll}
                className="h-7 gap-1.5 rounded-full border-mesh-amber/40 bg-transparent px-3 text-[11.5px] font-medium text-mesh-amber hover:bg-mesh-amber-soft hover:text-mesh-amber"
              >
                {updatingAll && <Spinner />} Update all ({outdated.length})
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                aria-label="Check for plugin updates"
                title="Check for updates"
                className="h-7 w-7 text-mesh-quiet hover:bg-mesh-panel-2 hover:text-foreground"
              >
                <RotateCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              </Button>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 md:grid-cols-2">
            {installed.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} onOpen={() => onBack()} />
            ))}
          </div>
        </>
      )}

      {builtins.length > 0 && (
        <section className="mt-8" aria-label="Built-in plugins">
          <h2 className="text-[13px] font-medium text-foreground">Built-in ({builtins.length})</h2>
          <div className="mt-2.5 grid grid-cols-1 gap-2 md:grid-cols-2">
            {builtins.map((plugin) => (
              <PluginCard key={plugin.id} plugin={plugin} onOpen={() => onBack()} restore />
            ))}
          </div>
        </section>
      )}

      {/* keep sources referenced for stable section semantics */}
      <span className="sr-only">{sources.length} marketplace sources connected</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view (internal router: store | detail | manage)                */
/* ------------------------------------------------------------------ */

export function PluginMarketplaceView() {
  const pluginsQuery = usePlugins();
  const [view, setView] = useState<"store" | "detail" | "manage">("store");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [segment, setSegment] = useState<SegmentId>("public");
  const [query, setQuery] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const plugins = pluginsQuery.data?.plugins ?? [];
  const sources = pluginsQuery.data?.sources ?? [];

  /* official source keys — from the sources list, with the seeded fallback */
  const officialKeys = useMemo(() => {
    const keys = new Set(sources.filter((s) => s.official).map((s) => s.key));
    return keys.size > 0 ? keys : FALLBACK_OFFICIAL_KEYS;
  }, [sources]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setView("detail");
  };

  const handleRefresh = async () => {
    const result = await pluginsQuery.refetch();
    const fresh = result.data;
    if (!fresh) return;
    const updates = fresh.plugins.filter(
      (p) => p.installed && p.latestVersion !== p.version
    ).length;
    if (updates > 0) toast.info(`Found ${updates} plugin update(s) available`);
    else toast.success("All installed plugins are up to date");
  };

  if (view === "detail" && detailId !== null) {
    const detail = plugins.find((p) => p.id === detailId) ?? null;
    if (detail) {
      return (
        <ViewFrame>
          <PluginDetail
            plugin={detail}
            sources={sources}
            onBack={() => setView("store")}
          />
        </ViewFrame>
      );
    }
    /* still loading, or the plugin vanished — fall through to the store */
  }

  if (view === "manage") {
    return (
      <ViewFrame>
        <ManagePlugins
          plugins={plugins}
          sources={sources}
          officialKeys={officialKeys}
          isLoading={pluginsQuery.isLoading}
          isFetching={pluginsQuery.isFetching}
          onBack={() => setView("store")}
          onRefresh={() => void handleRefresh()}
        />
      </ViewFrame>
    );
  }

  const q = query.trim().toLowerCase();
  const segmentLabel = SEGMENTS.find((s) => s.id === segment)?.label ?? segment;
  const segmentPlugins = plugins.filter((p) => inSegment(p, segment, officialKeys));

  let sections: Section[];
  if (q) {
    const results = segmentPlugins.filter((p) => matchesQuery(p, q)).sort(byName);
    sections = [{ id: "search", title: `Search results (${results.length})`, plugins: results }];
  } else if (segment === "public") {
    const featured = segmentPlugins.filter((p) => p.featured);
    sections = [
      ...(featured.length > 0
        ? [{ id: "featured", title: "Featured", plugins: featured }]
        : []),
      ...categorySections(segmentPlugins),
    ];
  } else if (segment === "community") {
    sections = categorySections(segmentPlugins);
  } else {
    sections = sourceSections(segmentPlugins, sources);
  }

  return (
    <ViewFrame>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Plugin Marketplace
          </h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Extend the workspace with skills, commands, MCP servers and panes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh plugins"
            title="Refresh plugins"
            onClick={() => void handleRefresh()}
            className="h-8 w-8 text-muted-foreground hover:bg-mesh-panel-2 hover:text-foreground"
          >
            <RotateCw className={cn("h-3.5 w-3.5", pluginsQuery.isFetching && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            onClick={() => setSourcesOpen(true)}
            className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
          >
            <Store className="h-3.5 w-3.5" /> Marketplace sources
          </Button>
          <Button
            onClick={() => setView("manage")}
            className="mesh-action h-8 px-3.5 text-[12.5px] font-medium"
          >
            Manage plugins
          </Button>
        </div>
      </div>

      {/* Segments + search */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label="Plugin marketplace segments"
        >
          {SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              type="button"
              aria-pressed={segment === seg.id}
              onClick={() => setSegment(seg.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                segment === seg.id
                  ? "bg-mesh-panel-3 text-white"
                  : "text-mesh-quiet hover:bg-mesh-panel-2"
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mesh-quiet"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plugins"
            aria-label="Search plugins"
            className="h-8 border-mesh-line bg-mesh-panel-2 pl-8 text-[12.5px] placeholder:text-mesh-quiet"
          />
        </div>
      </div>

      {/* Sections */}
      {pluginsQuery.isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-mesh-line-soft bg-mesh-panel/60"
            />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-mesh-line bg-mesh-panel/40 px-6 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">
            {q ? "No plugins match your search" : `No ${segmentLabel.toLowerCase()} plugins yet.`}
          </p>
          {segment === "personal" && !q && (
            <p className="mt-1 text-[11.5px] text-mesh-quiet">
              Add a marketplace source to see personal plugins here.
            </p>
          )}
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.id} className="mt-6" aria-label={section.title}>
            <h2 className="text-[13px] font-medium text-foreground">{section.title}</h2>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {section.plugins.map((plugin) => (
                <PluginCard
                  key={`${section.id}-${plugin.id}`}
                  plugin={plugin}
                  onOpen={() => openDetail(plugin.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Sources dialog */}
      <SourcesDialog
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        sources={sources}
        plugins={plugins}
        onAdded={() => setSegment("personal")}
      />
    </ViewFrame>
  );
}

/** Page scaffold matching the sibling views' layout rhythm. */
function ViewFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-10">{children}</div>;
}
