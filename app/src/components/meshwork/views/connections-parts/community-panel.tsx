"use client";

import { ArrowLeftRight, ArrowUpRight, Store } from "lucide-react";
import { useMeshStore } from "@/lib/meshwork/store";
import { SectionLabel } from "../../page-shell";

/**
 * Community connectivity — navigation cards to the demand-side surfaces.
 * A provider pool and a group purchase are different concepts (footer note).
 */
export function CommunityPanel() {
  const setView = useMeshStore((s) => s.setView);

  const actions = [
    {
      view: "group-buying",
      title: "Explore group buying",
      description: "Pool neighbourhood demand",
      icon: ArrowLeftRight,
    },
    {
      view: "marketplace",
      title: "Provider pools",
      description: "Browse provider capacity offers",
      icon: Store,
    },
  ] as const;

  return (
    <section aria-label="Community connectivity" className="mt-7">
      <SectionLabel>Community connectivity</SectionLabel>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.view}
            type="button"
            onClick={() => setView(action.view)}
            className="group flex items-center gap-3.5 rounded-xl border border-mesh-line-soft bg-mesh-panel p-4 text-left transition-all hover:border-mesh-blue-strong/40 hover:bg-mesh-panel-2/60 focus-visible:outline-2 focus-visible:outline-mesh-blue"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mesh-blue-soft text-mesh-blue"
              aria-hidden
            >
              <action.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-foreground">{action.title}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ArrowUpRight
              className="ml-auto h-4 w-4 shrink-0 text-mesh-quiet transition-colors group-hover:text-mesh-blue"
              aria-hidden
            />
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-mesh-quiet">
        A provider pool and a group purchase are different concepts.
      </p>
    </section>
  );
}
