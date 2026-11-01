"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMeshStore } from "@/lib/meshwork/store";
import { useConnections, useNodes, useTasks } from "@/hooks/meshwork/use-meshwork-data";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { DockPanel, MobileDock } from "./dock-panel";
import { NewTaskView } from "./views/new-task-view";
import { TaskView } from "./views/task-view";
import { TasksView } from "./views/tasks-view";
import { AutomationsView } from "./views/automations-view";
import { PluginMarketplaceView } from "./views/plugin-marketplace-view";
import { MyOffersView } from "./views/my-offers-view";
import { NodesView } from "./views/nodes-view";
import { GroupBuyingView } from "./views/group-buying-view";
import { ConnectionsView } from "./views/connections-view";
import { MarketplaceView } from "./views/marketplace-view";
import { SettingsView } from "./views/settings-view";
import { MeshworkProviders } from "./providers";

function CurrentView() {
  const view = useMeshStore((s) => s.view);
  switch (view) {
    case "new-task":
      return <NewTaskView />;
    case "task":
      return <TaskView />;
    case "tasks":
      return <TasksView />;
    case "automations":
      return <AutomationsView />;
    case "plugin-marketplace":
      return <PluginMarketplaceView />;
    case "connections":
      return <ConnectionsView />;
    case "marketplace":
      return <MarketplaceView />;
    case "my-offers":
      return <MyOffersView />;
    case "nodes":
      return <NodesView />;
    case "group-buying":
      return <GroupBuyingView />;
    default:
      return <NewTaskView />;
  }
}

function WorkspaceShell() {
  const settingsOpen = useMeshStore((s) => s.settingsOpen);
  const setView = useMeshStore((s) => s.setView);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tasksQuery = useTasks();
  const connectionsQuery = useConnections();
  const nodesQuery = useNodes();

  /* Rehydrate the persisted shell state after mount (SSR-safe). */
  useEffect(() => {
    void useMeshStore.persist.rehydrate();
  }, []);

  /* ⌘N / Ctrl+N → New task (keyboard shortcut, matches the sidebar hint) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setView("new-task");
        // give the composer a tick to mount before focusing it
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent("meshwork:focus-composer"));
        }, 50);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView]);

  const projects = tasksQuery.data?.projects ?? [];
  const tasks = tasksQuery.data?.tasks ?? [];
  const badges: Partial<Record<"tasks" | "connections", number>> = {
    tasks: tasks.length,
    connections: connectionsQuery.data?.stats.availableLinks,
  };
  const nodes = nodesQuery.data?.nodes;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-mesh-bg text-foreground">
      <div className="flex min-h-0 flex-1">
        {/* The workspace left pane is removed entirely while Settings is open
            (existing ZCode behaviour); Back to workspace restores it. */}
        {!settingsOpen && (
          <div className="hidden md:flex">
            <Sidebar
              projects={projects}
              tasks={tasks}
              badges={badges}
              onProjectCreated={() => tasksQuery.refetch()}
            />
          </div>
        )}

        <main id="meshwork-main" className="flex min-w-0 flex-1 flex-col">
          {!settingsOpen && <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {settingsOpen ? <SettingsView /> : <CurrentView />}
          </div>
        </main>

        <DockPanel nodes={nodes} />
      </div>

      <MobileDock nodes={nodes} />

      {/* Mobile navigation sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[260px] border-mesh-line-soft bg-mesh-topbar p-0"
          aria-describedby={undefined}
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <Sidebar
            projects={projects}
            tasks={tasks}
            badges={badges}
            onProjectCreated={() => tasksQuery.refetch()}
            className="w-full border-r-0"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AppShell() {
  return (
    <MeshworkProviders>
      <WorkspaceShell />
    </MeshworkProviders>
  );
}
