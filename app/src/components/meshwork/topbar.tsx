"use client";

import {
  CircleHelp,
  Globe,
  Menu,
  Minus,
  MonitorSmartphone,
  Plus,
  Square,
  SquareTerminal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMeshStore } from "@/lib/meshwork/store";
import { VIEW_TITLES } from "@/lib/meshwork/navigation";
import { useTasks } from "@/hooks/meshwork/use-meshwork-data";
import { Button } from "@/components/ui/button";

/**
 * Workspace titlebar — the concept's 48px header: breadcrumbs on the left,
 * Browser / Terminal / Devices tool toggles and window controls on the right.
 */
function ToolToggle({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex h-[31px] items-center gap-[7px] rounded-lg border px-2.5 text-[11px] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mesh-blue",
        active
          ? "border-[#536c9c] bg-[#252d3a] text-[#d5e3ff]"
          : "border-[#37393e] bg-mesh-panel text-[#afb2b9] hover:bg-[#282a2e] hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const view = useMeshStore((s) => s.view);
  const activeTaskId = useMeshStore((s) => s.activeTaskId);
  const dock = useMeshStore((s) => s.dock);
  const toggleDockPanel = useMeshStore((s) => s.toggleDockPanel);
  const minimizeDock = useMeshStore((s) => s.minimizeDock);
  const restoreDock = useMeshStore((s) => s.restoreDock);
  const expandDock = useMeshStore((s) => s.expandDock);
  const closeDock = useMeshStore((s) => s.closeDock);
  const setView = useMeshStore((s) => s.setView);

  /* Task view breadcrumb resolves the open task's name from the tasks query. */
  const tasksQuery = useTasks();
  const activeTask =
    view === "task" && activeTaskId
      ? tasksQuery.data?.tasks.find((t) => t.id === activeTaskId)
      : undefined;

  const titles = VIEW_TITLES[view];
  const anyPanelOpen = dock.active !== null;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#222428] px-3 sm:px-4">
      {/* Mobile nav */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-4 w-4" aria-hidden />
        </Button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-2 text-[12px] text-[#888d96]">
            <li className="hidden sm:block">{titles.group}</li>
            <li aria-hidden className="hidden sm:block">
              ›
            </li>
            <li className={cn("truncate font-medium text-[#e5e6e8]", view === "task" && "max-w-[42vw] sm:max-w-[34vw]")} aria-current="page">
              {view === "task" && activeTask ? activeTask.name : titles.title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Tool toggles: Browser, Terminal, Devices */}
        <div className="flex items-center gap-[7px]" role="toolbar" aria-label="Workspace tools">
          <ToolToggle label="Browser" active={dock.open.browser} onClick={() => toggleDockPanel("browser")}>
            <Globe className="h-[15px] w-[15px]" aria-hidden />
            <span className="hidden sm:inline">Browser</span>
          </ToolToggle>
          <ToolToggle label="Terminal" active={dock.open.terminal} onClick={() => toggleDockPanel("terminal")}>
            <SquareTerminal className="h-[15px] w-[15px]" aria-hidden />
            <span className="hidden sm:inline">Terminal</span>
          </ToolToggle>
          <ToolToggle label="Devices" active={dock.open.devices} onClick={() => toggleDockPanel("devices")}>
            <MonitorSmartphone className="h-[15px] w-[15px]" aria-hidden />
            <span className="hidden lg:inline">Devices</span>
          </ToolToggle>
        </div>

        {/* Window controls */}
        <div
          className="ml-3 hidden items-center gap-[13px] text-[#9b9da3] md:flex"
          aria-label="Dock window controls"
        >
          <button
            type="button"
            aria-label="Help"
            onClick={() =>
              toast.info("Meshwork concept preview — the agent runs inside your permission envelope.")
            }
            className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Minimize dock"
            disabled={!anyPanelOpen}
            onClick={minimizeDock}
            className="transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={dock.expanded ? "Restore dock" : "Maximize dock"}
            disabled={!anyPanelOpen}
            onClick={() => (dock.expanded ? restoreDock() : expandDock())}
            className="transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Close dock"
            disabled={!anyPanelOpen}
            onClick={closeDock}
            className="transition-colors hover:text-mesh-red disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile: quick new task */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          aria-label="New task"
          onClick={() => setView("new-task")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
