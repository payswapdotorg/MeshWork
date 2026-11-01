"use client";

import { useEffect, useRef } from "react";
import {
  Anchor,
  Archive,
  ArrowLeft,
  BarChart3,
  Blocks,
  Bot,
  Brain,
  Cable,
  Folders,
  Globe2,
  HardDrive,
  Keyboard,
  Monitor,
  Network,
  Package,
  Palette,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Terminal,
  User,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/meshwork/use-meshwork-data";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * zcode settings section ids — the true structure restored from
 * settingsPageConfig.ts, plus the additive "Meshwork network" group that
 * keeps the Meshwork-specific sections reachable (nothing removed).
 */
export type SettingsSectionId =
  | "general"
  | "appearance"
  | "modelProvider"
  | "browser"
  | "shortcuts"
  | "personalization"
  | "memory"
  | "subagents"
  | "plugins"
  | "mcp"
  | "skill"
  | "commands"
  | "hooks"
  | "usage"
  | "projects"
  | "archives"
  | "devices"
  | "computer"
  | "network"
  | "node"
  | "privacy"
  | "marketplace"
  | "advanced";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}

export interface SettingsNavGroup {
  label: string;
  items: SettingsNavItem[];
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Basics",
    items: [
      { id: "general", label: "General", icon: Settings2 },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "modelProvider", label: "Model settings", icon: Package },
      { id: "browser", label: "Browser Use", icon: Globe2 },
      { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
    ],
  },
  {
    label: "Agent capabilities",
    items: [
      { id: "personalization", label: "Personalization", icon: User },
      { id: "memory", label: "Memory", icon: Brain },
      { id: "subagents", label: "Subagents", icon: Bot },
      { id: "plugins", label: "Plugins", icon: Blocks },
      { id: "mcp", label: "MCP Servers", icon: Cable },
      { id: "skill", label: "Skills", icon: WandSparkles },
      { id: "commands", label: "Commands", icon: Terminal },
      { id: "hooks", label: "Hooks", icon: Anchor },
    ],
  },
  {
    label: "Data and statistics",
    items: [
      { id: "usage", label: "Usage stats", icon: BarChart3 },
      { id: "projects", label: "Projects", icon: Folders },
      { id: "archives", label: "Archive management", icon: Archive },
    ],
  },
  {
    label: "Meshwork network",
    items: [
      { id: "devices", label: "Remote devices", icon: HardDrive },
      { id: "computer", label: "Computer Use", icon: Monitor },
      { id: "network", label: "Network", icon: Network },
      { id: "node", label: "Node", icon: Network },
      { id: "privacy", label: "Privacy", icon: ShieldCheck },
      { id: "marketplace", label: "Marketplace", icon: Store },
      { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
    ],
  },
];

export const SETTINGS_SECTIONS: SettingsNavItem[] = SETTINGS_NAV_GROUPS.flatMap((group) => group.items);

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((section) => section.id === value);
}

export function getSectionLabel(id: SettingsSectionId): string {
  return SETTINGS_SECTIONS.find((section) => section.id === id)?.label ?? "Settings";
}

interface SettingsNavProps {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
  /** Leaves Settings and restores the previous workspace view (store handles it). */
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/* Profile footer (mirrors the workspace sidebar profile row)           */
/* ------------------------------------------------------------------ */

function NavProfileFooter({ collapsed }: { collapsed?: boolean }) {
  const settingsQuery = useSettings();
  const settings = settingsQuery.data?.settings;
  const name = typeof settings?.["profile.name"] === "string" ? settings["profile.name"] : "Ali19";
  const workspace =
    typeof settings?.["profile.workspace"] === "string" ? settings["profile.workspace"] : "Personal workspace";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 border-t border-mesh-line-soft p-3",
        collapsed && "justify-center gap-0 px-0"
      )}
    >
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f39a28] text-[12px] font-bold text-[#222]"
      >
        {name.charAt(0).toUpperCase()}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[12px] font-medium text-foreground">{name}</span>
          <span className="block truncate text-[10px] text-[#82868e]">{workspace}</span>
        </span>
      )}
    </div>
  );
}

function NavItemRow({
  item,
  isActive,
  collapsed,
  onSelect,
}: {
  item: SettingsNavItem;
  isActive: boolean;
  collapsed?: boolean;
  onSelect: (id: SettingsSectionId) => void;
}) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[12.5px] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-mesh-panel-3 font-medium text-white"
          : "text-[#c4c6ca] hover:bg-[#2a2c30] hover:text-white"
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#a5a8ae]")}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}

/* ------------------------------------------------------------------ */
/* Desktop / large screens: 268px nav sidebar                          */
/* ------------------------------------------------------------------ */

export function SettingsNavDesktop({ active, onSelect, onBack }: SettingsNavProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className="hidden w-[268px] shrink-0 flex-col border-r border-mesh-line-soft bg-mesh-topbar lg:flex"
        aria-label="Settings navigation"
      >
        <div className="p-3 pb-1">
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-9 w-full justify-start gap-2 rounded-xl px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-[#2a2c30] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to workspace
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Settings sections">
          {SETTINGS_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mt-3 first:mt-1">
              <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mesh-quiet">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavItemRow item={item} isActive={item.id === active} onSelect={onSelect} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <NavProfileFooter />
      </aside>
    </TooltipProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile / <lg: 68px icon-only rail with tooltips                      */
/* ------------------------------------------------------------------ */

export function SettingsNavMobile({ active, onSelect, onBack }: SettingsNavProps) {
  const railRef = useRef<HTMLElement>(null);

  /* Keep the active icon visible when the section changes. */
  useEffect(() => {
    const pill = railRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    pill?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [active]);

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        ref={railRef}
        className="flex w-[68px] shrink-0 flex-col border-r border-mesh-line-soft bg-mesh-topbar lg:hidden"
        aria-label="Settings navigation"
      >
        <div className="p-2.5 pb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back to workspace"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-[#2a2c30] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {SETTINGS_NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div
                className="mx-auto mb-1 mt-2 h-px w-6 bg-mesh-line first:mt-0 first:hidden"
                aria-hidden
              />
              {group.items.map((item) => (
                <div key={item.id} data-active={item.id === active || undefined}>
                  <NavItemRow item={item} isActive={item.id === active} collapsed onSelect={onSelect} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <NavProfileFooter collapsed />
      </nav>
    </TooltipProvider>
  );
}
