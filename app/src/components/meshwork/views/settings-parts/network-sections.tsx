"use client";

import { toast } from "sonner";
import { ArrowUpRight, CreditCard } from "lucide-react";
import { useMeshStore } from "@/lib/meshwork/store";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  SectionShell,
  SettingsGroupCard,
  SettingsRow,
  SettingInput,
  SettingSelect,
  SettingSwitch,
  StaticValue,
  settingBool,
  settingString,
  useSettingsCtx,
} from "./settings-ui";

/* -------------------------------- Network ----------------------------- */

export function NetworkSection() {
  const { settings, set } = useSettingsCtx();
  return (
    <SectionShell
      id="settings-network"
      title="Network"
      description="Meshwork network participation for this device."
    >
      <SettingsGroupCard>
        <SettingsRow
          label="Network discovery"
          description="Discovery scans for uplinks and nearby Meshwork nodes. Off by default."
          htmlFor="setting-discovery"
        >
          <SettingSwitch
            id="setting-discovery"
            label="Network discovery"
            checked={settingBool(settings, "network.discovery")}
            onCheckedChange={(value) => set("network.discovery", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Adapter"
          description="The data-plane adapter requires explicit authorization. Diagnostics never change routing."
        >
          <StaticValue value="Diagnostics only" />
        </SettingsRow>
        <SettingsRow
          label="Routing preference"
          description="How the workspace picks between available paths when more than one is usable."
          htmlFor="setting-routing"
        >
          <SettingSelect
            id="setting-routing"
            label="Routing preference"
            value={settingString(settings, "network.routingPreference", "latency")}
            onValueChange={(value) => set("network.routingPreference", value)}
            triggerClassName="sm:w-[200px]"
            options={[
              { value: "latency", label: "Lowest latency" },
              { value: "cost", label: "Lowest cost" },
              { value: "throughput", label: "Highest throughput" },
            ]}
          />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* --------------------------------- Node ------------------------------- */

export function NodeSection() {
  const { settings } = useSettingsCtx();
  const setView = useMeshStore((s) => s.setView);
  const enrolled = settingBool(settings, "node.enrolled");

  return (
    <SectionShell id="settings-node" title="Node" description="This device's identity on the Meshwork network.">
      <SettingsGroupCard>
        <SettingsRow label="Node ID" description="The local identifier for this device on the network.">
          <StaticValue value={settingString(settings, "node.id", "—")} mono />
        </SettingsRow>
        <SettingsRow
          label="Enrollment"
          description="Enrollment pairs this device as a network participant. It does not enable sharing."
        >
          <StaticValue value={enrolled ? "Enrolled" : "Not enrolled"} tone={enrolled ? "default" : "quiet"} />
        </SettingsRow>
        <SettingsRow
          label="Permission grants"
          description="All grants are off. Sharing requires explicit, separate authorization."
        >
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => setView("nodes")}
          >
            Open Devices &amp; Nodes <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* -------------------------------- Privacy ----------------------------- */

export function PrivacySection() {
  const { settings, set } = useSettingsCtx();
  return (
    <SectionShell id="settings-privacy" title="Privacy" description="What this workspace shares.">
      <SettingsGroupCard>
        <SettingsRow
          label="Location sharing"
          description="Off by default. Location is only used for coverage lookups you explicitly request."
          htmlFor="setting-location"
        >
          <SettingSwitch
            id="setting-location"
            label="Location sharing"
            checked={settingBool(settings, "privacy.locationSharing")}
            onCheckedChange={(value) => set("privacy.locationSharing", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Anonymous telemetry"
          description="Usage events stay on this device unless telemetry is enabled."
          htmlFor="setting-telemetry"
        >
          <SettingSwitch
            id="setting-telemetry"
            label="Anonymous telemetry"
            checked={settingBool(settings, "privacy.telemetry")}
            onCheckedChange={(value) => set("privacy.telemetry", value)}
          />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ------------------------------ Marketplace --------------------------- */

export function MarketplaceSection() {
  return (
    <SectionShell id="settings-marketplace" title="Marketplace" description="Payments and operator terms.">
      <EmptyState
        icon={CreditCard}
        title="No payment methods configured"
        note="Purchases require a configured payment rail and verified provider offers. Nothing can be charged from this build."
      />
      <SettingsGroupCard>
        <SettingsRow
          label="Capacity-sharing terms"
          description="Operator terms must be reviewed before publishing any capacity offer on the marketplace."
        >
          <StaticValue value="Review required" tone="warn" />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* -------------------------------- Advanced ----------------------------- */

export function AdvancedSection() {
  const { settings, set } = useSettingsCtx();
  const multipath = settingString(settings, "advanced.multipath", "not-configured");
  return (
    <SectionShell id="settings-advanced" title="Advanced" description="Relay and transport options.">
      <SettingsGroupCard>
        <SettingsRow
          label="Relay endpoint"
          description="A compatible relay is required for single-flow bonding."
          htmlFor="setting-relay"
        >
          <SettingInput
            id="setting-relay"
            label="Relay endpoint"
            value={settingString(settings, "advanced.relayEndpoint")}
            placeholder="relay.example.net:443"
            onCommit={(value) => set("advanced.relayEndpoint", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Multipath transport"
          description="Bonding a single flow across paths needs a multipath endpoint or relay on the other side."
        >
          <StaticValue value={multipath === "not-configured" ? "Not configured" : multipath} tone="quiet" />
        </SettingsRow>
        <SettingsRow
          label="Diagnostics"
          description="Runs the path diagnostics flow. Figures in this preview remain illustrative."
        >
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => toast.info("Diagnostics run in design preview — figures remain illustrative.")}
          >
            Run network diagnostics
          </Button>
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}
