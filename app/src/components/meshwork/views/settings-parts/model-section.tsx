"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  TriangleAlert,
  Unplug,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ModelEntryVM, ModelProviderVM } from "@/lib/meshwork/types";
import { PROVIDER_TEMPLATE_GROUPS, type ProviderTemplate } from "@/lib/meshwork/provider-templates";
import {
  useCreateModelProvider,
  useDeleteModel,
  useDeleteModelProvider,
  useModelProviders,
  useUpdateModel,
  useUpdateModelProvider,
  useUpsertModel,
} from "@/hooks/meshwork/use-model-providers";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionShell, SettingSelect, settingString, useSettingsCtx } from "./settings-ui";

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

const API_FORMAT_OPTIONS = [
  { value: "anthropic-messages", label: "Anthropic messages (/v1/messages)" },
  { value: "openai-chat-completions", label: "Chat completions (/chat/completions)" },
  { value: "openai-responses", label: "Responses (/responses)" },
] as const;

const TILE_PALETTE = ["#f39a28", "#47c88a", "#c58f61", "#9d8ad9", "#79cba2", "#d9a17c"];

function tileColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return TILE_PALETTE[hash % TILE_PALETTE.length];
}

function ProviderTile({ provider, size = 16 }: { provider: ModelProviderVM; size?: 16 | 20 | 24 }) {
  const dim = size === 16 ? "h-4 w-4 text-[9px] rounded-[4px]" : size === 20 ? "h-5 w-5 text-[10px] rounded-[5px]" : "h-6 w-6 text-[12px] rounded-md";
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center font-bold text-[#222]", dim)}
      style={{ background: tileColor(provider.logoKey || provider.key) }}
    >
      {provider.name.charAt(0).toUpperCase()}
    </span>
  );
}

function contextBadgeLabel(contextWindow: number): string {
  if (contextWindow >= 1_000_000) return `${Math.round(contextWindow / 1_000_000)}M`;
  if (contextWindow >= 1_000) return `${Math.round(contextWindow / 1_000)}K`;
  return String(contextWindow);
}

type ProviderStatus = { tone: "ready" | "notready" | "disabled"; label: string };

function providerStatus(provider: ModelProviderVM): ProviderStatus {
  if (!provider.enabled) return { tone: "disabled", label: "Disabled" };
  if (provider.hasApiKey) return { tone: "ready", label: "Ready" };
  return { tone: "notready", label: "Not ready" };
}

function StatusDot({ status }: { status: ProviderStatus }) {
  return (
    <span
      role="status"
      aria-label={status.label}
      title={status.label}
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        status.tone === "ready"
          ? "bg-mesh-green"
          : status.tone === "notready"
            ? "bg-mesh-amber"
            : "bg-[#777b83]"
      )}
      style={status.tone === "ready" ? { boxShadow: "0 0 6px #47c88a66" } : undefined}
    />
  );
}

/** Provider console URLs, keyed by logo (used for the "Get API key" link). */
const CONSOLE_URLS: Record<string, string> = {};
for (const group of PROVIDER_TEMPLATE_GROUPS) {
  for (const template of group.templates) {
    if (template.consoleUrl && !CONSOLE_URLS[template.logoKey]) {
      CONSOLE_URLS[template.logoKey] = template.consoleUrl;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function ModelProviderSection() {
  const query = useModelProviders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingProvider, setAddingProvider] = useState(false);

  const providers = query.data?.providers ?? [];
  const preset = providers.filter((p) => p.builtin && p.account);
  const custom = providers.filter((p) => !(p.builtin && p.account));
  const selected = providers.find((p) => p.id === selectedId) ?? providers[0] ?? null;

  return (
    <SectionShell
      id="settings-model"
      title="Model settings"
      description="Manage custom model providers. Once configured, they can be selected during chat."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh providers"
            title="Refresh providers"
            className="h-8 w-8 border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => {
              void query.refetch();
              toast.success("Providers refreshed");
            }}
          >
            <RotateCw className={cn("h-4 w-4", query.isFetching && "animate-spin")} />
          </Button>
          <Button
            className="mesh-action h-8 gap-1.5 px-3.5 text-[12.5px] font-medium"
            onClick={() => setAddingProvider(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Add provider
          </Button>
        </div>
      }
    >
      {query.isLoading ? (
        <ModelSectionSkeleton />
      ) : query.isError ? (
        <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/50 px-6 py-10 text-center">
          <TriangleAlert className="mx-auto h-5 w-5 text-mesh-amber" aria-hidden />
          <p className="mt-2 text-[13px] font-medium text-foreground">Model providers could not be loaded</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-8 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => void query.refetch()}
          >
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel">
          <div className="flex min-h-[460px] flex-col lg:flex-row">
            {/* Provider nav — 224px */}
            <nav
              className="w-full shrink-0 border-b border-mesh-line p-3 lg:w-[224px] lg:border-b-0 lg:border-r"
              aria-label="Model providers"
            >
              <div className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                Providers
              </div>
              <ul className="space-y-0.5">
                {preset.map((provider) => (
                  <ProviderNavRow
                    key={provider.id}
                    provider={provider}
                    active={selected?.id === provider.id}
                    onSelect={setSelectedId}
                  />
                ))}
              </ul>
              {custom.length > 0 && (
                <>
                  <div className="mt-4 px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
                    Custom providers
                  </div>
                  <ul className="space-y-0.5">
                    {custom.map((provider) => (
                      <ProviderNavRow
                        key={provider.id}
                        provider={provider}
                        active={selected?.id === provider.id}
                        onSelect={setSelectedId}
                      />
                    ))}
                  </ul>
                </>
              )}
            </nav>

            {/* Detail pane */}
            <div className="min-h-0 min-w-0 flex-1 p-6">
              {addingProvider ? (
                <AddProviderPane
                  onBack={() => setAddingProvider(false)}
                  onCreated={(provider) => {
                    setSelectedId(provider.id);
                    setAddingProvider(false);
                  }}
                />
              ) : selected ? (
                <ProviderDetail key={selected.id} provider={selected} />
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-mesh-line px-6 text-center">
                  <p className="text-[12px] text-mesh-quiet">
                    No providers configured. Use “Add provider” to create one.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function ModelSectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-mesh-line bg-mesh-panel" aria-busy="true">
      <span className="sr-only">Loading model providers…</span>
      <div className="flex min-h-[460px] flex-col lg:flex-row">
        <div className="w-full space-y-2 border-b border-mesh-line p-3 lg:w-[224px] lg:border-b-0 lg:border-r">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full max-w-[380px]" />
          <Skeleton className="h-9 w-full max-w-[380px]" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function ProviderNavRow({
  provider,
  active,
  onSelect,
}: {
  provider: ModelProviderVM;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const status = providerStatus(provider);
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(provider.id)}
        aria-current={active ? "true" : undefined}
        title={`${provider.name} — ${status.label}`}
        aria-label={`${provider.name} — ${status.label}`}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[12.5px] transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
          active
            ? "bg-mesh-panel-3 font-medium text-white"
            : "text-[#c4c6ca] hover:bg-[#2a2c30] hover:text-white"
        )}
      >
        <ProviderTile provider={provider} />
        <span className="min-w-0 flex-1 truncate">{provider.name}</span>
        <StatusDot status={status} />
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Provider detail pane                                                 */
/* ------------------------------------------------------------------ */

function ProviderDetail({ provider }: { provider: ModelProviderVM }) {
  const update = useUpdateModelProvider();
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isAccount = provider.account;
  const isCustom = !provider.builtin;

  return (
    <div className="space-y-6">
      {/* Header: avatar + name + enable switch + ⋯ menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProviderTile provider={provider} size={20} />
          {renaming ? (
            <ProviderNameEditor
              provider={provider}
              onDone={() => setRenaming(false)}
            />
          ) : isCustom ? (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              title="Rename provider"
              className="truncate rounded-md px-1 py-0.5 text-base font-semibold text-foreground transition-colors hover:bg-mesh-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
            >
              {provider.name}
            </button>
          ) : (
            <h3 className="truncate text-base font-semibold text-foreground">{provider.name}</h3>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!isAccount && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) =>
                      update.mutate({
                        id: provider.id,
                        enabled: checked,
                        message: `${provider.name} ${checked ? "enabled" : "disabled"}`,
                      })
                    }
                    aria-label={provider.enabled ? "Disable provider" : "Enable provider"}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>{provider.enabled ? "Disable provider" : "Enable provider"}</TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Provider options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-mesh-line">
              <DropdownMenuItem className="text-[12.5px]" onSelect={() => setRenaming(true)}>
                Rename
              </DropdownMenuItem>
              {isCustom && (
                <DropdownMenuItem
                  className="text-[12.5px] text-mesh-red focus:text-mesh-red"
                  onSelect={() => setDeleteOpen(true)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteProviderDialog
        provider={provider}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {/* Account providers: connection mode + plan status card */}
      {isAccount && <AccountProviderCard provider={provider} />}

      {/* Connection */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`base-url-${provider.id}`} className="text-[12px] text-muted-foreground">
            Base URL
          </Label>
          {isAccount ? (
            <div className="relative">
              <Input
                id={`base-url-${provider.id}`}
                readOnly
                value={provider.baseUrl}
                aria-readonly="true"
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/40 pr-24 font-mono text-[12px] text-muted-foreground"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10.5px] text-mesh-quiet">
                <LockKeyhole className="h-3 w-3" aria-hidden /> read only
              </span>
            </div>
          ) : (
            <BaseUrlField provider={provider} />
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`api-format-${provider.id}`} className="text-[12px] text-muted-foreground">
            API format
          </Label>
          <SettingSelect
            id={`api-format-${provider.id}`}
            label="API format"
            value={provider.apiFormat}
            options={API_FORMAT_OPTIONS}
            disabled={isAccount}
            onValueChange={(value) =>
              update.mutate({ id: provider.id, apiFormat: value, message: `${provider.name} saved` })
            }
            triggerClassName="h-9 w-full max-w-[380px]"
          />
          {isAccount && (
            <p className="text-[10.5px] text-mesh-quiet">Managed by the provider connection.</p>
          )}
        </div>
      </div>

      {/* API key */}
      <ApiKeyField provider={provider} />

      {/* Model list */}
      <ModelListSection provider={provider} />
    </div>
  );
}

/** Inline rename input — Enter/blur commits via PATCH, Esc cancels. */
function ProviderNameEditor({
  provider,
  onDone,
}: {
  provider: ModelProviderVM;
  onDone: () => void;
}) {
  const update = useUpdateModelProvider();
  const [draft, setDraft] = useState(provider.name);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
  }, []);

  const commit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const next = draft.trim();
    if (next && next !== provider.name) {
      update.mutate({ id: provider.id, name: next, message: `${next} saved` });
    } else {
      setDraft(provider.name);
    }
    onDone();
  };

  return (
    <Input
      autoFocus
      value={draft}
      aria-label="Provider name"
      onFocus={(e) => e.target.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          doneRef.current = true;
          setDraft(provider.name);
          onDone();
        }
      }}
      className="h-8 w-[220px] border-mesh-line-soft bg-mesh-panel-2 text-[14px] font-semibold text-foreground focus-visible:ring-mesh-blue-strong/40"
    />
  );
}

function DeleteProviderDialog({
  provider,
  open,
  onOpenChange,
}: {
  provider: ModelProviderVM;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const remove = useDeleteModelProvider();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-mesh-line bg-mesh-panel sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete provider “{provider.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the custom provider configuration. Related edits on the current settings page
            will not be restored automatically.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-mesh-line bg-mesh-panel-2 text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-mesh-red text-white hover:bg-mesh-red/85"
            onClick={() => remove.mutate({ id: provider.id, name: provider.name })}
          >
            Delete provider
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Account provider plan card (Z.ai / BigModel)                         */
/* ------------------------------------------------------------------ */

const CONNECTION_MODES = [
  { value: "Start Plan", label: "Start Plan" },
  { value: "Individual Plan", label: "Individual Plan" },
  { value: "Team Plan", label: "Team Plan" },
];

function AccountProviderCard({ provider }: { provider: ModelProviderVM }) {
  const { settings, set } = useSettingsCtx();
  const modeKey = `modelProvider.connectionMode.${provider.key}`;
  const mode = settingString(settings, modeKey, "Start Plan");
  const subscribed = provider.hasApiKey;
  const consoleUrl = CONSOLE_URLS[provider.logoKey];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`connection-mode-${provider.id}`} className="text-[12px] text-muted-foreground">
          Connection mode
        </Label>
        <SettingSelect
          id={`connection-mode-${provider.id}`}
          label="Connection mode"
          value={mode}
          options={CONNECTION_MODES}
          onValueChange={(value) => set(modeKey, value)}
          triggerClassName="h-9 w-full max-w-[380px]"
        />
      </div>

      <div className="rounded-xl border border-mesh-line bg-mesh-panel-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-foreground">Coding Plan</span>
          {subscribed ? (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-mesh-green">
              <span className="h-1.5 w-1.5 rounded-full bg-mesh-green" aria-hidden />
              Subscribed
            </span>
          ) : (
            <span className="text-[11.5px] text-mesh-quiet">Not connected</span>
          )}
        </div>

        {subscribed ? (
          <>
            <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">
              Plan details and quota are managed by the provider.
            </p>
            <p className="mt-3 text-[11.5px] text-mesh-quiet">
              Renews Dec 31, 2026 ·{" "}
              <button
                type="button"
                className="text-mesh-blue underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
                onClick={() => toast.info("Plan management opens in the provider console in the desktop build.")}
              >
                Manage
              </button>{" "}
              ·{" "}
              <button
                type="button"
                className="text-mesh-blue underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
                onClick={() => toast.info("OAuth login would open here in the desktop build.")}
              >
                Unlink
              </button>
            </p>
            <div className="mt-4 space-y-3">
              <QuotaRow label="5-hour remaining" pct={68} note="resets in 2h 14m" />
              <QuotaRow label="Weekly remaining" pct={41} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-[11.5px] leading-relaxed text-mesh-quiet">
              Connect a Coding Plan subscription, or paste an API key below to use this provider.
            </p>
            <Button
              size="sm"
              className="mesh-action mt-3 h-8 px-3.5 text-[12px] font-medium"
              onClick={() => toast.info("OAuth login would open here in the desktop build.")}
            >
              Connect to {provider.name}
            </Button>
            {consoleUrl && (
              <p className="mt-2 text-[10.5px] text-mesh-quiet">Don’t have a plan? {provider.name} also accepts API keys.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuotaRow({ label, pct, note }: { label: string; pct: number; note?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-mesh-quiet">{pct}%{note ? ` · ${note}` : ""}</span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-mesh-panel-3"
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-mesh-green" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Base URL + API key fields (auto-save on blur/Enter)                  */
/* ------------------------------------------------------------------ */

function BaseUrlField({ provider }: { provider: ModelProviderVM }) {
  const update = useUpdateModelProvider();
  const [draft, setDraft] = useState(provider.baseUrl);
  const lastServer = useRef(provider.baseUrl);

  /* Adopt fresh server values unless the user has uncommitted edits. */
  useEffect(() => {
    const prev = lastServer.current;
    lastServer.current = provider.baseUrl;
    setDraft((d) => (d === prev ? provider.baseUrl : d));
  }, [provider.baseUrl]);

  const commit = () => {
    const next = draft.trim();
    if (next !== draft) setDraft(next);
    if (next !== provider.baseUrl) {
      update.mutate({ id: provider.id, baseUrl: next, message: `${provider.name} saved` });
    }
  };

  return (
    <Input
      id={`base-url-${provider.id}`}
      value={draft}
      aria-label="Base URL"
      placeholder="https://api.example.com/v1"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className="h-9 w-full max-w-[380px] border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] placeholder:font-sans placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40"
    />
  );
}

function ApiKeyField({ provider }: { provider: ModelProviderVM }) {
  const update = useUpdateModelProvider();
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState("");
  const touched = useRef(false);

  const commit = () => {
    if (!touched.current) return;
    touched.current = false;
    const key = draft.trim();
    setDraft("");
    if (!key && !provider.hasApiKey) return;
    update.mutate({
      id: provider.id,
      apiKey: key,
      message: key ? `${provider.name} — API key saved` : `${provider.name} — API key cleared`,
    });
  };

  const consoleUrl = CONSOLE_URLS[provider.logoKey];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`api-key-${provider.id}`} className="text-[12px] text-muted-foreground">
          API key
        </Label>
        {consoleUrl && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11.5px] text-mesh-blue underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
            onClick={() => toast.info("Opens the provider console in the desktop build.")}
          >
            Get API key <ExternalLink className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>
      <div className="relative">
        <Input
          id={`api-key-${provider.id}`}
          type={show ? "text" : "password"}
          autoComplete="off"
          value={draft}
          aria-label={`API key for ${provider.name}`}
          placeholder={provider.hasApiKey ? provider.apiKeyPreview || "Enter API key" : "Enter API key"}
          onChange={(e) => {
            touched.current = true;
            setDraft(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="h-9 w-full max-w-[380px] border-mesh-line-soft bg-mesh-panel-2/60 pr-9 font-mono text-[12px] placeholder:font-sans placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40"
        />
        <button
          type="button"
          aria-label={show ? "Hide API key" : "Show API key"}
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-mesh-quiet transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="text-[10.5px] text-mesh-quiet">
        {provider.hasApiKey
          ? "A key is stored. Type a new key to replace it — clear the field to remove it."
          : "Stored locally on this device only."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Model list                                                           */
/* ------------------------------------------------------------------ */

function ModelListSection({ provider }: { provider: ModelProviderVM }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModelEntryVM | null>(null);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[12.5px] font-semibold text-foreground">Model list</h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 rounded-lg border-mesh-line bg-mesh-panel-2 px-2.5 text-[11.5px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Add model
        </Button>
      </div>

      {provider.models.length === 0 ? (
        <div className="rounded-lg border border-dashed border-mesh-line px-4 py-6 text-center text-[12px] text-mesh-quiet">
          No models are configured. Add a model to use it in chat.
        </div>
      ) : (
        <ul className="list-none overflow-hidden rounded-lg border border-mesh-line bg-mesh-panel-2">
          {provider.models.map((model, index) => (
            <li
              key={model.id}
              className={cn("flex items-center gap-2 px-3 py-2", index > 0 && "border-t border-mesh-line")}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate font-mono text-[12px] text-foreground">{model.modelId}</span>
                <span
                  className="shrink-0 rounded-md border border-mesh-line bg-mesh-panel px-1.5 py-px font-mono text-[10.5px] text-mesh-quiet"
                  title={`${model.contextWindow.toLocaleString()} token context window`}
                >
                  {contextBadgeLabel(model.contextWindow)}
                </span>
                {model.inputTypes.includes("image") && (
                  <span className="shrink-0 rounded-md border border-mesh-line bg-mesh-panel px-1.5 py-px text-[10.5px] text-mesh-quiet">
                    Vision
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <TestModelButton provider={provider} model={model} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit model ${model.modelId}`}
                  title="Edit model"
                  className="h-7 w-7 text-mesh-quiet hover:text-foreground"
                  onClick={() => {
                    setEditing(model);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!model.builtin && (
                  <DeleteModelButton provider={provider} model={model} />
                )}
                <EnableModelSwitch providerId={provider.id} model={model} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <ModelDialog
        key={editing?.id ?? "new"}
        provider={provider}
        model={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function EnableModelSwitch({
  providerId,
  model,
}: {
  providerId: string;
  model: ModelEntryVM;
}) {
  const update = useUpdateModel();
  return (
    <Switch
      checked={model.enabled}
      onCheckedChange={(checked) => update.mutate({ providerId, modelId: model.modelId, enabled: checked })}
      aria-label={`${model.enabled ? "Disable" : "Enable"} model ${model.modelId}`}
    />
  );
}

function DeleteModelButton({ provider, model }: { provider: ModelProviderVM; model: ModelEntryVM }) {
  const remove = useDeleteModel();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete model ${model.modelId}`}
      title="Delete model"
      className="h-7 w-7 text-mesh-quiet hover:text-mesh-red"
      onClick={() => remove.mutate({ providerId: provider.id, modelId: model.modelId })}
      disabled={remove.isPending}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

function TestModelButton({ provider, model }: { provider: ModelProviderVM; model: ModelEntryVM }) {
  const [testing, setTesting] = useState(false);

  const run = () => {
    if (testing) return;
    setTesting(true);
    window.setTimeout(() => {
      setTesting(false);
      if (provider.hasApiKey) {
        toast.success(`${provider.name} / ${model.modelId} connected`);
      } else {
        toast.error(`${provider.name} / ${model.modelId} — no API key configured`);
      }
    }, 900);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Test model ${model.modelId}`}
      title="Test model"
      className="h-7 w-7 text-mesh-quiet hover:text-foreground"
      onClick={run}
      disabled={testing}
    >
      {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Add / Edit model dialog                                              */
/* ------------------------------------------------------------------ */

const KNOWN_MODEL_CONFIGS: { match: string; config: { contextWindow: number; maxOutputTokens: number; inputTypes: string[]; capabilities: Record<string, boolean>; reasoningLevels: string[] } }[] = [
  {
    match: "glm-5.3-max",
    config: { contextWindow: 1_000_000, maxOutputTokens: 32_768, inputTypes: ["text", "image", "pdf"], capabilities: { structuredOutput: true, webSearch: true, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "glm-5.3-flash",
    config: { contextWindow: 200_000, maxOutputTokens: 16_384, inputTypes: ["text", "image"], capabilities: { structuredOutput: true, webSearch: false, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "glm-5.2-air",
    config: { contextWindow: 128_000, maxOutputTokens: 8_192, inputTypes: ["text"], capabilities: { structuredOutput: false, webSearch: false, systemMessages: true }, reasoningLevels: [] },
  },
  {
    match: "claude",
    config: { contextWindow: 200_000, maxOutputTokens: 64_000, inputTypes: ["text", "image", "pdf"], capabilities: { structuredOutput: true, webSearch: true, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "gpt-5",
    config: { contextWindow: 400_000, maxOutputTokens: 128_000, inputTypes: ["text", "image"], capabilities: { structuredOutput: true, webSearch: true, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "kimi",
    config: { contextWindow: 256_000, maxOutputTokens: 16_384, inputTypes: ["text"], capabilities: { structuredOutput: true, webSearch: false, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "deepseek-reasoner",
    config: { contextWindow: 128_000, maxOutputTokens: 8_192, inputTypes: ["text"], capabilities: { structuredOutput: false, webSearch: false, systemMessages: true }, reasoningLevels: ["low", "medium", "high"] },
  },
  {
    match: "deepseek",
    config: { contextWindow: 128_000, maxOutputTokens: 8_192, inputTypes: ["text"], capabilities: { structuredOutput: true, webSearch: false, systemMessages: true }, reasoningLevels: [] },
  },
];

function knownModelConfig(modelId: string) {
  const needle = modelId.toLowerCase();
  if (!needle) return null;
  return KNOWN_MODEL_CONFIGS.find((entry) => needle.includes(entry.match))?.config ?? null;
}

interface ModelFormState {
  smart: boolean;
  modelId: string;
  contextWindow: string;
  maxOutputTokens: string;
  inputTypes: string[];
  capabilities: { structuredOutput: boolean; webSearch: boolean; systemMessages: boolean };
  reasoningLevels: string[];
}

const INPUT_TYPE_OPTIONS = ["text", "image", "video", "audio", "pdf"] as const;
const LEVEL_POOL = ["minimal", "low", "medium", "high", "max"];

function initialState(model: ModelEntryVM | null): ModelFormState {
  if (model) {
    return {
      smart: true,
      modelId: model.modelId,
      contextWindow: String(model.contextWindow),
      maxOutputTokens: String(model.maxOutputTokens),
      inputTypes: model.inputTypes.length ? [...model.inputTypes] : ["text"],
      capabilities: {
        structuredOutput: Boolean(model.capabilities.structuredOutput),
        webSearch: Boolean(model.capabilities.webSearch),
        systemMessages: Boolean(model.capabilities.systemMessages),
      },
      reasoningLevels: [...model.reasoningLevels],
    };
  }
  return {
    smart: true,
    modelId: "",
    contextWindow: "200000",
    maxOutputTokens: "8192",
    inputTypes: ["text"],
    capabilities: { structuredOutput: false, webSearch: false, systemMessages: false },
    reasoningLevels: [],
  };
}

function ModelDialog({
  provider,
  model,
  open,
  onOpenChange,
}: {
  provider: ModelProviderVM;
  model: ModelEntryVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const upsert = useUpsertModel();
  const update = useUpdateModel();
  const [form, setForm] = useState<ModelFormState>(() => initialState(model));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setForm(initialState(model));
    setError("");
  };

  const onModelIdChange = (value: string) => {
    setForm((prev) => {
      const next: ModelFormState = { ...prev, modelId: value };
      if (prev.smart) {
        const known = knownModelConfig(value);
        if (known) {
          next.contextWindow = String(known.contextWindow);
          next.maxOutputTokens = String(known.maxOutputTokens);
          next.inputTypes = [...known.inputTypes];
          next.capabilities = { ...known.capabilities } as ModelFormState["capabilities"];
          next.reasoningLevels = [...known.reasoningLevels];
        }
      }
      return next;
    });
    setError("");
  };

  const toggleInputType = (type: string) => {
    setForm((prev) => {
      if (type === "text") return prev; // Text is always on
      const has = prev.inputTypes.includes(type);
      return {
        ...prev,
        inputTypes: has ? prev.inputTypes.filter((t) => t !== type) : [...prev.inputTypes, type],
      };
    });
  };

  const addLevel = () => {
    setForm((prev) => {
      const next = LEVEL_POOL.find((level) => !prev.reasoningLevels.includes(level));
      return {
        ...prev,
        reasoningLevels: [...prev.reasoningLevels, next ?? `level ${prev.reasoningLevels.length + 1}`],
      };
    });
  };

  const saving = upsert.isPending || update.isPending;

  const save = () => {
    const modelId = form.modelId.trim();
    if (!modelId) {
      setError("Model ID is required");
      return;
    }
    const contextWindow = Number.parseInt(form.contextWindow, 10) || 200_000;
    const maxOutputTokens = Number.parseInt(form.maxOutputTokens, 10) || 8_192;
    const payload = {
      providerId: provider.id,
      modelId,
      contextWindow,
      maxOutputTokens,
      inputTypes: form.inputTypes,
      capabilities: { ...form.capabilities },
      reasoningLevels: form.reasoningLevels,
    };
    const onDone = () => {
      toast.success("Model saved");
      onOpenChange(false);
    };
    if (model) {
      update.mutate(payload, { onSuccess: onDone });
    } else {
      upsert.mutate(payload, { onSuccess: onDone });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-mesh-line bg-mesh-panel sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{model ? "Edit model settings" : "Add model"}</DialogTitle>
          <DialogDescription>
            {model
              ? `Update the configuration used for ${model.modelId} on ${provider.name}.`
              : `Add a model that can be selected in chat on ${provider.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Smart configuration */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-mesh-line-soft bg-mesh-panel-2/50 px-3.5 py-3">
            <div className="min-w-0">
              <Label htmlFor="model-smart" className="text-[12.5px] font-medium text-foreground">
                Smart configuration
              </Label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-mesh-quiet">
                Fills recommended values when the model ID matches a known model.
              </p>
            </div>
            <Switch
              id="model-smart"
              checked={form.smart}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smart: checked }))}
              aria-label="Smart configuration"
            />
          </div>

          {/* Model ID */}
          <div className="space-y-1.5">
            <Label htmlFor="model-id" className="text-[12px] text-muted-foreground">
              Model ID
            </Label>
            <Input
              id="model-id"
              value={form.modelId}
              onChange={(e) => onModelIdChange(e.target.value)}
              placeholder="e.g. glm-5.3-max"
              aria-invalid={Boolean(error) || undefined}
              className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] placeholder:font-sans placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/40"
            />
            {error && <p className="text-[11px] text-mesh-red">{error}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="model-context" className="text-[12px] text-muted-foreground">
                Context window
              </Label>
              <Input
                id="model-context"
                type="number"
                min={1000}
                step={1000}
                value={form.contextWindow}
                onChange={(e) => setForm((prev) => ({ ...prev, contextWindow: e.target.value }))}
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model-max-output" className="text-[12px] text-muted-foreground">
                Max output tokens
              </Label>
              <Input
                id="model-max-output"
                type="number"
                min={256}
                step={256}
                value={form.maxOutputTokens}
                onChange={(e) => setForm((prev) => ({ ...prev, maxOutputTokens: e.target.value }))}
                className="h-9 border-mesh-line-soft bg-mesh-panel-2/60 font-mono text-[12px] focus-visible:ring-mesh-blue-strong/40"
              />
            </div>
          </div>

          {/* Advanced settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger
              className="flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
              aria-expanded={advancedOpen}
            >
              <ChevronDown
                className={cn("h-4 w-4 text-mesh-quiet transition-transform", advancedOpen && "rotate-180")}
                aria-hidden
              />
              Advanced settings
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 px-1 pt-2">
              {/* Input types */}
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-foreground">Input types</span>
                <div className="flex flex-wrap gap-1.5">
                  {INPUT_TYPE_OPTIONS.map((type) => {
                    const locked = type === "text";
                    const active = form.inputTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={locked}
                        aria-pressed={active}
                        onClick={() => toggleInputType(type)}
                        className={cn(
                          "h-7 rounded-full border px-3 text-[11.5px] capitalize transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
                          active
                            ? "border-mesh-line bg-mesh-panel-3 text-white"
                            : "border-mesh-line bg-mesh-panel-2 text-mesh-quiet hover:text-foreground",
                          locked && "cursor-default opacity-90"
                        )}
                        title={locked ? "Text input is always enabled" : undefined}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-foreground">Model capabilities</span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["structuredOutput", "Structured output"],
                      ["webSearch", "Native web search"],
                      ["systemMessages", "Mid-conversation system messages"],
                    ] as const
                  ).map(([key, label]) => {
                    const active = form.capabilities[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            capabilities: { ...prev.capabilities, [key]: !prev.capabilities[key] },
                          }))
                        }
                        className={cn(
                          "h-7 rounded-full border px-3 text-[11.5px] transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
                          active
                            ? "border-mesh-line bg-mesh-panel-3 text-white"
                            : "border-mesh-line bg-mesh-panel-2 text-mesh-quiet hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reasoning levels */}
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-foreground">
                  Reasoning levels <span className="font-normal text-mesh-quiet">(low to high)</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {form.reasoningLevels.map((level, index) => (
                    <span
                      key={`${level}-${index}`}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-mesh-line bg-mesh-panel-3 pl-3 pr-1.5 text-[11.5px] text-white"
                    >
                      {level}
                      <button
                        type="button"
                        aria-label={`Delete level ${level}`}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            reasoningLevels: prev.reasoningLevels.filter((_, i) => i !== index),
                          }))
                        }
                        className="flex h-5 w-5 items-center justify-center rounded-full text-mesh-quiet transition-colors hover:bg-mesh-panel hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={addLevel}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-mesh-line px-3 text-[11.5px] text-mesh-quiet transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue"
                  >
                    <Plus className="h-3 w-3" /> Add level
                  </button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={reset}
            className="mr-auto text-[12px] text-mesh-quiet hover:text-foreground"
          >
            Reset form
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button className="mesh-action h-8 px-4 text-[12.5px] font-medium" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Add provider template picker (rendered inside the detail pane)       */
/* ------------------------------------------------------------------ */

function AddProviderPane({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (provider: ModelProviderVM) => void;
}) {
  const create = useCreateModelProvider();
  const pendingKey = create.variables?.templateKey ?? null;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-8 gap-1.5 px-2 text-[12px] text-muted-foreground hover:bg-mesh-panel-2 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to provider details
      </Button>
      <h3 className="mt-3 text-base font-semibold text-foreground">Add provider</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-mesh-quiet">
        Pick a template to create a provider with the right endpoint format. Everything can be edited
        afterwards.
      </p>

      <div className="mt-4 space-y-5">
        {PROVIDER_TEMPLATE_GROUPS.map((group) => (
          <section key={group.label} aria-label={`${group.label} provider templates`}>
            <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-mesh-quiet">
              {group.label}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.templates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  pending={create.isPending && pendingKey === template.key}
                  onPick={(picked) =>
                    create.mutate({ templateKey: picked.key }, { onSuccess: (data) => onCreated(data.provider) })
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  pending,
  onPick,
}: {
  template: ProviderTemplate;
  pending: boolean;
  onPick: (template: ProviderTemplate) => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onPick(template)}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-lg border border-mesh-line bg-mesh-panel-2 px-4 py-3 text-left transition-colors",
        "hover:bg-mesh-panel-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
        "disabled:cursor-wait disabled:opacity-60"
      )}
    >
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold text-[#222]"
        style={{ background: template.custom ? "#e8eaec" : tileColor(template.logoKey) }}
      >
        {template.custom ? (
          <Plus className="h-4 w-4 text-[#222]" />
        ) : (
          template.name.charAt(0).toUpperCase()
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-foreground">{template.name}</span>
        {template.baseUrl ? (
          <span className="block truncate font-mono text-[10.5px] text-mesh-quiet">{template.baseUrl}</span>
        ) : (
          <span className="block truncate text-[10.5px] text-mesh-quiet">
            Configure the endpoint manually
          </span>
        )}
      </span>
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-mesh-quiet" aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-mesh-quiet" aria-hidden />
      )}
    </button>
  );
}
