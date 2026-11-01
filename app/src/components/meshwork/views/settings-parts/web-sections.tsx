"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SectionShell,
  SettingsGroupCard,
  SettingsRow,
  SettingSwitch,
  StaticValue,
  settingBool,
  useSettingsCtx,
} from "./settings-ui";

/* ------------------------------ Browser use --------------------------- */

/**
 * zcode Settings → Browser Use. The control card toggles the embedded
 * browser; the data card clears local browsing state.
 */
export function BrowserSection() {
  const { settings, set } = useSettingsCtx();
  const [allowInsecure, setAllowInsecure] = useState(false);

  return (
    <SectionShell
      id="settings-browser"
      title="Browser Use"
      description="The embedded browser the agent uses for research and web tasks."
    >
      <SettingsGroupCard title="Control">
        <SettingsRow
          label="Embedded browser"
          description="Let agent tasks open and drive the embedded workspace browser."
          htmlFor="setting-browser-enabled"
        >
          <SettingSwitch
            id="setting-browser-enabled"
            label="Embedded browser"
            checked={settingBool(settings, "browser.enabled", true)}
            onCheckedChange={(value) => set("browser.enabled", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Allow insecure certificates"
          description="Skip certificate validation for self-signed local endpoints. Off by default."
          htmlFor="setting-browser-insecure"
        >
          <SettingSwitch
            id="setting-browser-insecure"
            label="Allow insecure certificates"
            checked={allowInsecure}
            onCheckedChange={setAllowInsecure}
          />
        </SettingsRow>
      </SettingsGroupCard>

      <SettingsGroupCard
        title="Data"
        description="Browsing data is stored locally for this workspace only."
        bodyClassName="divide-y-0"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-foreground">Browsing data</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-mesh-quiet">
              Cache, cookies and local storage created by agent browsing sessions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-mesh-line bg-mesh-panel-2 px-3 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
            onClick={() => toast.success("Browsing data cleared")}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear browsing data
          </Button>
        </div>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ---------------------------- Remote devices -------------------------- */

export function DevicesSection() {
  const { settings, set } = useSettingsCtx();
  return (
    <SectionShell id="settings-devices" title="Remote devices" description="Access from your other devices.">
      <SettingsGroupCard>
        <SettingsRow
          label="Allow remote device access"
          description="Off by default — remote access requires an authenticated paired device."
          htmlFor="setting-remote-access"
        >
          <SettingSwitch
            id="setting-remote-access"
            label="Allow remote device access"
            checked={settingBool(settings, "devices.remoteAccess")}
            onCheckedChange={(value) => set("devices.remoteAccess", value)}
          />
        </SettingsRow>
        <SettingsRow
          label="Pairing"
          description="No device is paired with this workspace yet. Pairing requires the device service."
        >
          <StaticValue
            value={typeof settings["devices.pairing"] === "string" ? settings["devices.pairing"] : "Not configured"}
            tone="quiet"
          />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}

/* ----------------------------- Computer use --------------------------- */

export function ComputerSection() {
  const { settings, set } = useSettingsCtx();
  return (
    <SectionShell id="settings-computer" title="Computer use" description="Screen and keyboard control.">
      <SettingsGroupCard>
        <SettingsRow
          label="Enable computer use"
          description="Off by default. Computer use grants screen/keyboard control to approved tasks only."
          htmlFor="setting-computer-enabled"
        >
          <SettingSwitch
            id="setting-computer-enabled"
            label="Enable computer use"
            checked={settingBool(settings, "computer.enabled")}
            onCheckedChange={(value) => set("computer.enabled", value)}
          />
        </SettingsRow>
      </SettingsGroupCard>
    </SectionShell>
  );
}
