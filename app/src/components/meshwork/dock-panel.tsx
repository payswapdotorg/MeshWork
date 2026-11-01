"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Maximize2,
  MonitorSmartphone,
  MoreHorizontal,
  RotateCw,
  SquareTerminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import type { DockPanelId, NodeVM } from "@/lib/meshwork/types";

/* ------------------------------ Browser panel ----------------------------- */

function BrowserPanel() {
  const [url, setUrl] = useState("");
  return (
    <div className="flex h-full flex-col">
      {/* Address bar (concept: ‹ › ↻ · centered pill · ⋯) */}
      <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-[#282a2f] px-3 text-[#858a92]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded hover:text-foreground" aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded hover:text-foreground" aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
        <button
          type="button"
          aria-label="Reload page"
          onClick={() => toast.info("Browser is ready — no live page is loaded in this preview.")}
          className="inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <form
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) {
              toast.info("Live browsing requires the workspace browser runtime — not active in this preview.");
            }
          }}
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL or search"
            aria-label="Address bar"
            className="h-8 w-full rounded-full border border-[#3b3e44] bg-[#27292d] px-3 text-center text-[11px] text-[#a0a4ab] placeholder:text-[#6f7379] focus:border-[#4a5058] focus:outline-none"
          />
        </form>
        <button
          type="button"
          aria-label="Browser menu"
          onClick={() => toast.info("Browser tools arrive with the workspace browser runtime.")}
          className="inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Empty state (concept copy) */}
      <div className="grid flex-1 place-items-center p-5">
        <div className="max-w-[240px] text-center">
          <Globe className="mx-auto mb-3 h-12 w-12 text-[#5b6068]" aria-hidden />
          <h3 className="text-[13px] font-medium text-[#cdd0d5]">Browser</h3>
          <p className="mt-2 text-[11px] leading-[1.5] text-[#858a92]">
            Open a page, inspect sources, compare providers or let an agent complete a browser workflow.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Terminal panel ----------------------------- */

interface TerminalLine {
  id: number;
  kind: "cmd" | "out" | "note";
  text: string;
}

const TERMINAL_BOOT: TerminalLine[] = [
  { id: 0, kind: "note", text: "Meshwork local node · session 01" },
  { id: 1, kind: "cmd", text: "network status" },
  { id: 2, kind: "note", text: "checking interfaces…" },
  { id: 3, kind: "out", text: "• fibre0　online　45 Mbps" },
  { id: 4, kind: "out", text: "• wlan0　online　24 Mbps" },
  { id: 5, kind: "out", text: "• satellite0　online　15 Mbps" },
];

function TerminalPanel() {
  const [lines, setLines] = useState<TerminalLine[]>(TERMINAL_BOOT);
  const [command, setCommand] = useState("");
  const idRef = useRef(100);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  return (
    <div className="flex h-full flex-col font-mono text-[11px] leading-[1.8] text-[#c5d0c8]">
      <div className="min-h-0 flex-1 overflow-y-auto p-2" role="log" aria-label="Terminal transcript">
        {lines.map((line) => (
          <p
            key={line.id}
            className={cn(
              line.kind === "note" && "text-[#7d8883]",
              line.kind === "out" && "text-[#c5d0c8]",
              line.kind === "cmd" && "text-[#c5d0c8]"
            )}
          >
            {line.kind === "cmd" ? <span className="text-[#89d2a7]">meshwork@node:~$ </span> : null}
            {line.text}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-[#292c30] px-3 py-2.5 text-[#91c9a6]"
        onSubmit={(e) => {
          e.preventDefault();
          const cmd = command.trim();
          if (!cmd) return;
          setLines((prev) => [
            ...prev,
            { id: idRef.current++, kind: "cmd", text: cmd },
            { id: idRef.current++, kind: "note", text: "# Command execution is not enabled in this design preview." },
          ]);
          setCommand("");
        }}
      >
        <span aria-hidden>›</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Terminal ready — commands require the relevant permission grant."
          aria-label="Terminal input"
          className="flex-1 bg-transparent text-[#c5d0c8] placeholder:text-[#7d8883] focus:outline-none"
        />
      </form>
    </div>
  );
}

/* ----------------------------- Devices panel ------------------------------ */

function DevicesPanel({ nodes }: { nodes?: NodeVM[] }) {
  const setView = useMeshStore((s) => s.setView);
  return (
    <div className="grid h-full place-items-center overflow-y-auto p-5">
      <div className="w-full max-w-[280px] text-center">
        <MonitorSmartphone className="mx-auto mb-3 h-12 w-12 text-[#5b6068]" aria-hidden />
        <h3 className="text-[13px] font-medium text-[#cdd0d5]">Connected devices</h3>
        <p className="mt-2 text-[11px] leading-[1.5] text-[#858a92]">
          This device is online. Router and Raspberry Pi nodes can be enrolled with separate, explicit permissions.
        </p>
        <div className="mt-4 space-y-2 text-left">
          {(nodes ?? []).map((n) => (
            <div key={n.id} className="rounded-lg border border-[#3b3d42] bg-[#242629] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-foreground">{n.name}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold tracking-wide",
                    n.online
                      ? "border-mesh-green-line bg-mesh-green-soft text-[#8ed9b0]"
                      : "border-[#3b3d42] bg-[#242629] text-[#777b83]"
                  )}
                >
                  {n.online ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10.5px] text-[#969aa2]">{n.subtitle}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView("nodes")}
          className="mesh-net-action mt-4 inline-flex h-8 items-center rounded-lg px-3 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue"
        >
          Open Devices &amp; Nodes
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Dock ----------------------------------- */

const PANEL_META: Record<DockPanelId, { label: string; icon: typeof Globe }> = {
  browser: { label: "Browser", icon: Globe },
  terminal: { label: "Terminal", icon: SquareTerminal },
  devices: { label: "Devices", icon: MonitorSmartphone },
};

export function DockPanel({ nodes }: { nodes?: NodeVM[] }) {
  const dock = useMeshStore((s) => s.dock);
  const setActiveDockPanel = useMeshStore((s) => s.setActiveDockPanel);
  const closeDockPanel = useMeshStore((s) => s.closeDockPanel);
  const restoreDock = useMeshStore((s) => s.restoreDock);
  const expandDock = useMeshStore((s) => s.expandDock);
  const closeDock = useMeshStore((s) => s.closeDock);
  const setDockWidth = useMeshStore((s) => s.setDockWidth);

  const resizingRef = useRef(false);
  const openPanels = (Object.keys(dock.open) as DockPanelId[]).filter((k) => dock.open[k]);
  const active = dock.active && dock.open[dock.active] ? dock.active : openPanels[0] ?? null;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizingRef.current) return;
      const width = Math.min(Math.max(window.innerWidth - e.clientX, 300), Math.min(760, window.innerWidth - 480));
      setDockWidth(width);
    },
    [setDockWidth]
  );

  const stopResize = useCallback(() => {
    resizingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    const up = () => stopResize();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", up);
    };
  }, [onPointerMove, stopResize]);

  if (openPanels.length === 0 || !active) return null;

  const width = dock.expanded ? Math.max(dock.width, 520) : dock.width;

  return (
    <section
      aria-label="Tool dock"
      className="relative hidden shrink-0 flex-col border-l border-[#303237] bg-mesh-dock md:flex"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize dock"
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          resizingRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setDockWidth(Math.min(width + 24, 760));
          if (e.key === "ArrowRight") setDockWidth(Math.max(width - 24, 300));
        }}
        className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize transition-colors hover:bg-mesh-blue-strong/50 focus-visible:bg-mesh-blue focus-visible:outline-none"
      />

      {/* Dock tabs (each open panel; close per tab) */}
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-[#292b30] px-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1" role="tablist" aria-label="Open tool panels">
          {openPanels.map((id) => {
            const meta = PANEL_META[id];
            const Icon = meta.icon;
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDockPanel(id)}
                className={cn(
                  "inline-flex h-[30px] items-center gap-[7px] rounded-[7px] px-2 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
                  isActive
                    ? "bg-[#282a2f] font-medium text-[#e0e2e6]"
                    : "text-[#8d929b] hover:bg-[#22242a] hover:text-[#c9ccd1]"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {meta.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Close ${meta.label} panel`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDockPanel(id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      closeDockPanel(id);
                    }
                  }}
                  className="ml-1 text-[#737780] transition-colors hover:text-foreground"
                >
                  <X className="h-3 w-3" aria-hidden />
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-[#858a92]" aria-label="Dock controls">
          <button
            type="button"
            onClick={() => (dock.expanded ? restoreDock() : expandDock())}
            aria-label={dock.expanded ? "Restore dock" : "Expand dock"}
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={closeDock}
            aria-label="Close dock"
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active panel content */}
      <div className="min-h-0 flex-1" role="tabpanel" aria-label={PANEL_META[active].label}>
        {active === "browser" && <BrowserPanel />}
        {active === "terminal" && <TerminalPanel />}
        {active === "devices" && <DevicesPanel nodes={nodes} />}
      </div>
    </section>
  );
}

/** Compact bottom dock for small screens. */
export function MobileDock({ nodes }: { nodes?: NodeVM[] }) {
  const dock = useMeshStore((s) => s.dock);
  const setActiveDockPanel = useMeshStore((s) => s.setActiveDockPanel);
  const closeDockPanel = useMeshStore((s) => s.closeDockPanel);
  const openPanels = (Object.keys(dock.open) as DockPanelId[]).filter((k) => dock.open[k]);
  const active = dock.active && dock.open[dock.active] ? dock.active : openPanels[0] ?? null;

  if (openPanels.length === 0 || !active) return null;

  return (
    <section
      aria-label="Tool dock"
      className="flex h-[46%] shrink-0 flex-col border-t border-[#303237] bg-mesh-dock md:hidden"
    >
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-[#292b30] px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1" role="tablist" aria-label="Open tool panels">
          {openPanels.map((id) => {
            const meta = PANEL_META[id];
            const Icon = meta.icon;
            const isActive = id === active;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDockPanel(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-[7px] px-2 text-[12px] transition-colors",
                  isActive
                    ? "bg-[#282a2f] font-medium text-[#e0e2e6]"
                    : "text-[#8d929b] hover:bg-[#22242a] hover:text-[#c9ccd1]"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {meta.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => closeDockPanel(active)}
          aria-label={`Close ${PANEL_META[active].label} panel`}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-[#858a92] transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1" role="tabpanel" aria-label={PANEL_META[active].label}>
        {active === "browser" && <BrowserPanel />}
        {active === "terminal" && <TerminalPanel />}
        {active === "devices" && <DevicesPanel nodes={nodes} />}
      </div>
    </section>
  );
}
