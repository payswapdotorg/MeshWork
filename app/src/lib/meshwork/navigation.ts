import {
  ArrowLeftRight,
  CirclePlus,
  History,
  LayoutGrid,
  ListTodo,
  Network,
  Store,
  Tag,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { MeshView } from "./types";

export interface NavItem {
  view: MeshView;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  /** Short status hint rendered on the right (e.g. "3 online"). */
  hint?: string;
  badge?: "tasks" | "connections";
}

/**
 * Primary navigation — the flat five-item rail of the approved new-task
 * concept (new_task.html): New task · Automations · Connections ·
 * Marketplace · Plugin marketplace.
 */
export const NAV_PRIMARY: NavItem[] = [
  { view: "new-task", label: "New task", icon: CirclePlus, shortcut: "Ctrl+N" },
  { view: "automations", label: "Automations", icon: History },
  { view: "connections", label: "Connections", icon: Waypoints, hint: "3 online", badge: "connections" },
  { view: "marketplace", label: "Marketplace", icon: Store },
  { view: "plugin-marketplace", label: "Plugin marketplace", icon: LayoutGrid },
];

/**
 * Secondary navigation — keeps the remaining workspace surfaces reachable
 * (additions to the concept nav; nothing from the workspace is removed).
 */
export const NAV_SECONDARY: NavItem[] = [
  { view: "tasks", label: "Tasks", icon: ListTodo, badge: "tasks" },
  { view: "my-offers", label: "My Offers", icon: Tag },
  { view: "nodes", label: "Devices & Nodes", icon: Network },
  { view: "group-buying", label: "Group Buying", icon: ArrowLeftRight },
];

export const VIEW_TITLES: Record<MeshView, { group: string; title: string }> = {
  "new-task": { group: "Workspace", title: "New task" },
  task: { group: "Workspace", title: "Task" },
  tasks: { group: "Workspace", title: "Tasks" },
  automations: { group: "Workspace", title: "Automations" },
  "plugin-marketplace": { group: "Workspace", title: "Plugin marketplace" },
  connections: { group: "Workspace", title: "Connections" },
  marketplace: { group: "Workspace", title: "Connection Marketplace" },
  "my-offers": { group: "Workspace", title: "My Offers" },
  nodes: { group: "Workspace", title: "Devices & Nodes" },
  "group-buying": { group: "Workspace", title: "Group Buying" },
};
