"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ConnectionsConfigVM, DockPanelId, MeshView } from "./types";
import { DEFAULT_CONNECTIONS_CONFIG } from "./aggregation";
import { DEFAULT_MODEL } from "./data";

/**
 * Workspace shell state (the app's single owner of navigation, sidebar docking,
 * dock panels and the composer draft — persisted so the workspace restores
 * exactly as it was left, per TL handoff §3.3 and §10.8).
 */

interface DockState {
  open: Record<DockPanelId, boolean>;
  active: DockPanelId | null;
  width: number;
  expanded: boolean;
}

interface MeshUIState {
  view: MeshView;
  /** active task in the conversation view (view === "task") */
  activeTaskId: string | null;
  sidebarCollapsed: boolean;
  settingsOpen: boolean;
  /** Settings section to open (deep links like Plugin Marketplace → Plugins). */
  settingsSection: string;
  selectedProjectKey: string;
  composer: { prompt: string; model: string; permissionMode: string };
  dock: DockState;
  /** cached local copy of the connections config so the page survives reloads */
  connections: ConnectionsConfigVM;

  setView: (view: MeshView) => void;
  openTask: (taskId: string) => void;
  closeTask: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openSettings: (section?: string) => void;
  closeSettings: () => void;
  setProject: (key: string) => void;
  setComposer: (patch: Partial<MeshUIState["composer"]>) => void;
  resetComposer: () => void;

  openDockPanel: (id: DockPanelId) => void;
  closeDockPanel: (id: DockPanelId) => void;
  toggleDockPanel: (id: DockPanelId) => void;
  setActiveDockPanel: (id: DockPanelId) => void;
  closeDock: () => void;
  minimizeDock: () => void;
  expandDock: () => void;
  restoreDock: () => void;
  setDockWidth: (width: number) => void;

  setConnections: (patch: Partial<ConnectionsConfigVM>) => void;
}

const initialDock: DockState = {
  open: { browser: true, terminal: false, devices: false },
  active: "browser",
  width: 360,
  expanded: false,
};

export const useMeshStore = create<MeshUIState>()(
  persist(
    (set, get) => ({
      view: "new-task",
      activeTaskId: null,
      sidebarCollapsed: false,
      settingsOpen: false,
      settingsSection: "general",
      selectedProjectKey: "",
      composer: { prompt: "", model: DEFAULT_MODEL, permissionMode: "ask" },
      dock: initialDock,
      connections: DEFAULT_CONNECTIONS_CONFIG,

      setView: (view) => set({ view, settingsOpen: false, activeTaskId: view === "task" ? get().activeTaskId : null }),
      openTask: (taskId) => set({ view: "task", activeTaskId: taskId, settingsOpen: false }),
      closeTask: () => set({ view: "tasks", activeTaskId: null }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      openSettings: (section) => set({ settingsOpen: true, settingsSection: section ?? "general" }),
      closeSettings: () => set({ settingsOpen: false, settingsSection: "general" }),
      setProject: (key) => set({ selectedProjectKey: key }),
      setComposer: (patch) => set((s) => ({ composer: { ...s.composer, ...patch } })),
      resetComposer: () =>
        set({ composer: { prompt: "", model: get().composer.model, permissionMode: get().composer.permissionMode } }),

      openDockPanel: (id) =>
        set((s) => ({
          dock: { ...s.dock, open: { ...s.dock.open, [id]: true }, active: id },
        })),
      closeDockPanel: (id) =>
        set((s) => {
          const open = { ...s.dock.open, [id]: false };
          const remaining = (Object.keys(open) as DockPanelId[]).filter((k) => open[k]);
          const active = s.dock.active === id ? (remaining[0] ?? null) : s.dock.active;
          return { dock: { ...s.dock, open, active } };
        }),
      toggleDockPanel: (id) => {
        const { dock } = get();
        if (dock.open[id] && dock.active === id) get().closeDockPanel(id);
        else get().openDockPanel(id);
      },
      setActiveDockPanel: (id) => set((s) => ({ dock: { ...s.dock, active: id, open: { ...s.dock.open, [id]: true } } })),
      closeDock: () =>
        set((s) => ({
          dock: { ...s.dock, open: { browser: false, terminal: false, devices: false }, active: null, expanded: false },
        })),
      minimizeDock: () => set((s) => ({ dock: { ...s.dock, expanded: false, width: Math.min(s.dock.width, 360) } })),
      expandDock: () => set((s) => ({ dock: { ...s.dock, expanded: true } })),
      restoreDock: () => set((s) => ({ dock: { ...s.dock, expanded: false } })),
      setDockWidth: (width) => set((s) => ({ dock: { ...s.dock, width } })),

      setConnections: (patch) => set((s) => ({ connections: { ...s.connections, ...patch } })),
    }),
    {
      name: "meshwork-shell-v2",
      storage: createJSONStorage(() => localStorage),
      /* Rehydrate after mount (app-shell) so SSR markup and the first client
         render always match — the restored state lands as a normal update. */
      skipHydration: true,
      partialize: (s) => ({
        view: s.view,
        activeTaskId: s.activeTaskId,
        sidebarCollapsed: s.sidebarCollapsed,
        selectedProjectKey: s.selectedProjectKey,
        composer: s.composer,
        dock: s.dock,
        connections: s.connections,
      }),
    }
  )
);
