"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/meshwork/use-meshwork-data";
import type { SettingsMap, SettingsValue } from "@/lib/meshwork/types";
import { useMeshStore } from "@/lib/meshwork/store";
import { Button } from "@/components/ui/button";
import {
  SettingsNavDesktop,
  SettingsNavMobile,
  SETTINGS_SECTIONS,
  getSectionLabel,
  type SettingsSectionId,
} from "./settings-parts/settings-nav";
import {
  SettingsContext,
  SectionSkeleton,
  type SettingsContextValue,
} from "./settings-parts/settings-ui";
import {
  AppearanceSection,
  ArchivesSection,
  GeneralSection,
  ProjectsSection,
  ShortcutsSection,
  UsageSection,
} from "./settings-parts/general-sections";
import {
  CommandsSection,
  HooksSection,
  McpSection,
  MemorySection,
  PersonalizationSection,
  PluginsSection,
  SkillsSection,
  SubagentsSection,
} from "./settings-parts/agent-sections";
import { ModelProviderSection } from "./settings-parts/model-section";
import { BrowserSection, ComputerSection, DevicesSection } from "./settings-parts/web-sections";
import {
  AdvancedSection,
  MarketplaceSection,
  NetworkSection,
  NodeSection,
  PrivacySection,
} from "./settings-parts/network-sections";

const EMPTY_SETTINGS: SettingsMap = {};

function SectionContent({ section }: { section: SettingsSectionId }) {
  switch (section) {
    /* Basics */
    case "general":
      return <GeneralSection />;
    case "appearance":
      return <AppearanceSection />;
    case "modelProvider":
      return <ModelProviderSection />;
    case "browser":
      return <BrowserSection />;
    case "shortcuts":
      return <ShortcutsSection />;
    /* Agent capabilities */
    case "personalization":
      return <PersonalizationSection />;
    case "memory":
      return <MemorySection />;
    case "subagents":
      return <SubagentsSection />;
    case "plugins":
      return <PluginsSection />;
    case "mcp":
      return <McpSection />;
    case "skill":
      return <SkillsSection />;
    case "commands":
      return <CommandsSection />;
    case "hooks":
      return <HooksSection />;
    /* Data and statistics */
    case "usage":
      return <UsageSection />;
    case "projects":
      return <ProjectsSection />;
    case "archives":
      return <ArchivesSection />;
    /* Meshwork network (additive group — Meshwork-specific sections) */
    case "devices":
      return <DevicesSection />;
    case "computer":
      return <ComputerSection />;
    case "network":
      return <NetworkSection />;
    case "node":
      return <NodeSection />;
    case "privacy":
      return <PrivacySection />;
    case "marketplace":
      return <MarketplaceSection />;
    case "advanced":
      return <AdvancedSection />;
    default:
      return <GeneralSection />;
  }
}

function SettingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-mesh-line bg-mesh-panel/50 px-6 py-10 text-center">
      <span
        aria-hidden
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-mesh-red-soft/50 text-mesh-red"
      >
        <TriangleAlert className="h-4.5 w-4.5" />
      </span>
      <h2 className="mt-3 text-[14px] font-semibold text-foreground">Settings could not be loaded</h2>
      <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-mesh-quiet">
        The local settings service did not respond. Your saved settings are untouched — retry to view them.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
        onClick={onRetry}
      >
        <RotateCw className="h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

/**
 * zcode Settings page — two-column layout: 268px section nav (68px icon rail
 * below lg) + a max-w-4xl content column. Every section persists through the
 * settings API; the Model settings section is backed by the model-provider
 * API. The Meshwork network nav group is additive (nothing was removed).
 */
export function SettingsView() {
  const closeSettings = useMeshStore((s) => s.closeSettings);
  const deepLinkedSection = useMeshStore((s) => s.settingsSection);
  const [section, setSection] = useState<SettingsSectionId>(
    SETTINGS_SECTIONS.some((s) => s.id === deepLinkedSection)
      ? (deepLinkedSection as SettingsSectionId)
      : "general"
  );

  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();

  const settings = settingsQuery.data?.settings;

  const set = useCallback(
    (key: string, value: SettingsValue) => updateSettings.mutate({ [key]: value }),
    [updateSettings]
  );

  const contextValue = useMemo<SettingsContextValue>(
    () => ({ settings: settings ?? EMPTY_SETTINGS, set }),
    [settings, set]
  );

  /* Move focus to the section content when the section changes. */
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contentRef.current?.focus();
  }, [section]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-mesh-bg md:flex-row">
      <SettingsNavDesktop active={section} onSelect={setSection} onBack={closeSettings} />
      <SettingsNavMobile active={section} onSelect={setSection} onBack={closeSettings} />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div
          ref={contentRef}
          role="region"
          aria-label={`${getSectionLabel(section)} settings`}
          tabIndex={-1}
          className="mx-auto max-w-4xl px-4 pb-10 pt-6 outline-none lg:px-8"
        >
          {settingsQuery.isLoading ? (
            <SectionSkeleton />
          ) : settingsQuery.isError ? (
            <SettingsError onRetry={() => void settingsQuery.refetch()} />
          ) : (
            <SettingsContext.Provider value={contextValue}>
              <SectionContent section={section} />
            </SettingsContext.Provider>
          )}
        </div>
      </div>
    </div>
  );
}
