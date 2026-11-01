"use client";

/**
 * Connection Marketplace view — Figma frame 8:36 "Meshwork — Marketplace &
 * Community" (1192×858), owned by Worker 3 (Task 2-b).
 *
 * Two-column layout: a fluid main column (header, functional tab pills and the
 * Buy access / Sell capacity / Group purchase panels) plus a fixed-width right
 * community panel that stacks below the main column on <lg.
 */

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { useMarketplace } from "@/hooks/meshwork/use-meshwork-data";
import { MARKETPLACE_NOTE } from "@/lib/meshwork/data";
import { BuyAccessTab } from "./marketplace-parts/buy-access-tab";
import { CommunityPanel } from "./marketplace-parts/community-panel";
import { GroupPurchaseTab } from "./marketplace-parts/group-purchase-tab";
import { SellCapacityTab } from "./marketplace-parts/sell-capacity-tab";

const TABS = [
  { id: "buy", label: "Buy access" },
  { id: "sell", label: "Sell capacity" },
  { id: "group", label: "Group purchase" },
] as const;

type MarketplaceTab = (typeof TABS)[number]["id"];

/** Segmented tab control (Figma 8:36) — roving tabindex, arrows/Home/End. */
function MarketplaceTabs({
  active,
  onChange,
}: {
  active: MarketplaceTab;
  onChange: (tab: MarketplaceTab) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((tab) => tab.id === active);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (current - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const tab = TABS[next];
    if (!tab) return;
    onChange(tab.id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Marketplace sections"
      onKeyDown={onKeyDown}
      className="mt-5 inline-flex items-center gap-1 rounded-full border border-mesh-line-soft bg-mesh-panel p-1"
    >
      {TABS.map((tab, index) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`marketplace-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`marketplace-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-mesh-blue",
              isActive ? "bg-mesh-panel-3 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function MarketplaceView() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>("buy");

  const marketplaceQuery = useMarketplace();
  const listings = marketplaceQuery.data?.listings ?? [];
  const pool = marketplaceQuery.data?.pools[0];
  const note = marketplaceQuery.data?.note ?? MARKETPLACE_NOTE;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <header>
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
              Connectivity marketplace
            </h1>
            <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-muted-foreground">
              Buy a connection, offer spare capacity, or coordinate a group purchase.
            </p>
          </header>

          <MarketplaceTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === "buy" && (
            <section
              role="tabpanel"
              id="marketplace-panel-buy"
              aria-labelledby="marketplace-tab-buy"
              className="mt-5"
            >
              <BuyAccessTab
                listings={listings}
                isLoading={marketplaceQuery.isLoading}
                isError={marketplaceQuery.isError}
                onRetry={() => {
                  void marketplaceQuery.refetch();
                }}
              />
            </section>
          )}

          {activeTab === "sell" && (
            <section
              role="tabpanel"
              id="marketplace-panel-sell"
              aria-labelledby="marketplace-tab-sell"
              className="mt-5"
            >
              <SellCapacityTab />
            </section>
          )}

          {activeTab === "group" && (
            <section
              role="tabpanel"
              id="marketplace-panel-group"
              aria-labelledby="marketplace-tab-group"
              className="mt-5"
            >
              <GroupPurchaseTab pool={pool} poolLoading={marketplaceQuery.isLoading} />
            </section>
          )}

          <p className="mt-6 border-t border-mesh-line-soft pt-3 text-[11px] leading-relaxed text-mesh-quiet">
            {note}
          </p>
        </div>

        {/* Right community panel — constant across tabs, stacks below on <lg */}
        <CommunityPanel pool={pool} poolLoading={marketplaceQuery.isLoading} />
      </div>
    </div>
  );
}
