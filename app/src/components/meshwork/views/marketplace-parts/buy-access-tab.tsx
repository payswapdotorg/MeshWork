"use client";

/**
 * "Buy access" tab (Figma frame 8:36) — search, filters and the available
 * connection listing rows. Private part of the Marketplace view (Worker 3).
 */

import { useMemo, useState } from "react";
import { Info, Search, SlidersHorizontal } from "lucide-react";
import type { MarketplaceListingVM } from "@/lib/meshwork/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard, ListingCardSkeleton, NoListingsMatch } from "./listing-card";
import { OfferDialog } from "./offer-dialog";

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  { value: "fixed", label: "Fixed access" },
  { value: "mobile", label: "Mobile" },
  { value: "venue", label: "Venue" },
] as const;

const PRICE_FILTERS = [
  { value: "any", label: "Any" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];
type PriceFilter = (typeof PRICE_FILTERS)[number]["value"];

/** Derive the access type from listing copy — the view model has no dedicated field. */
function deriveType(listing: MarketplaceListingVM): TypeFilter {
  const haystack = `${listing.name} ${listing.provider} ${listing.description}`.toLowerCase();
  if (haystack.includes("fixed") || haystack.includes("fibre") || haystack.includes("fiber")) {
    return "fixed";
  }
  if (haystack.includes("mobile") || haystack.includes("5g") || haystack.includes("lte")) {
    return "mobile";
  }
  if (haystack.includes("venue") || haystack.includes("wi-fi") || haystack.includes("wifi")) {
    return "venue";
  }
  return "all";
}

function derivePriceBasis(listing: MarketplaceListingVM): PriceFilter {
  const basis = listing.priceBasis.toLowerCase();
  if (basis.includes("month")) return "monthly";
  if (basis.includes("hour")) return "hourly";
  if (basis.includes("day")) return "daily";
  return "any";
}

function matchesQuery(listing: MarketplaceListingVM, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const haystack = [
    listing.name,
    listing.provider,
    listing.badge,
    listing.description,
    listing.priceBasis,
    `Up to ${listing.downMbps} Mbps`,
  ]
    .join(" ")
    .toLowerCase();
  return trimmed.split(/\s+/).every((token) => haystack.includes(token));
}

export function BuyAccessTab({
  listings,
  isLoading,
  isError,
  onRetry,
}: {
  listings: MarketplaceListingVM[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("any");
  const [offerListing, setOfferListing] = useState<MarketplaceListingVM | null>(null);

  const filtersActive =
    query.trim().length > 0 || typeFilter !== "all" || priceFilter !== "any";

  const filtered = useMemo(
    () =>
      listings.filter(
        (listing) =>
          matchesQuery(listing, query) &&
          (typeFilter === "all" || deriveType(listing) === typeFilter) &&
          (priceFilter === "any" || derivePriceBasis(listing) === priceFilter)
      ),
    [listings, query, typeFilter, priceFilter]
  );

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setPriceFilter("any");
  };

  return (
    <div>
      {/* Search block */}
      <div>
        <p className="text-[11.5px] text-mesh-quiet">
          Find connections by place, provider, speed or intended use
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mesh-quiet"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nearby connections or enter a location"
              aria-label="Search connections"
              className="h-9 border-mesh-line bg-mesh-panel-2/60 pl-9 text-[12.5px] placeholder:text-mesh-quiet focus-visible:ring-mesh-blue-strong/50"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-full border-mesh-line bg-mesh-panel-2 px-3.5 text-[12px] text-muted-foreground hover:bg-mesh-panel-3 hover:text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                Filters
                {filtersActive && (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-mesh-blue" aria-hidden />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="marketplace-filter-type">Type</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                      const option = TYPE_FILTERS.find((o) => o.value === value);
                      if (option) setTypeFilter(option.value);
                    }}
                  >
                    <SelectTrigger
                      id="marketplace-filter-type"
                      size="sm"
                      className="w-full border-mesh-line bg-mesh-panel-2/60 text-[12px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_FILTERS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-[12.5px]">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="marketplace-filter-price">Price basis</Label>
                  <Select
                    value={priceFilter}
                    onValueChange={(value) => {
                      const option = PRICE_FILTERS.find((o) => o.value === value);
                      if (option) setPriceFilter(option.value);
                    }}
                  >
                    <SelectTrigger
                      id="marketplace-filter-price"
                      size="sm"
                      className="w-full border-mesh-line bg-mesh-panel-2/60 text-[12px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_FILTERS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-[12.5px]">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Listings */}
      <section className="mt-5" aria-label="Available connections">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-foreground">Available connections</h2>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1.5 rounded-full border border-mesh-line bg-mesh-panel-2 px-2.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-mesh-blue"
              >
                <Info className="h-3 w-3" aria-hidden />
                Example listings
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 text-[11.5px] leading-relaxed text-muted-foreground"
            >
              Illustrative listings and figures for layout only. Live offers must come from
              verified provider advertisements and fresh node telemetry.
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-2.5 space-y-2">
          {isError ? (
            <div className="rounded-xl border border-dashed border-mesh-line-soft bg-mesh-panel/50 px-4 py-8 text-center">
              <p className="text-[12.5px] text-muted-foreground">Could not load listings.</p>
              <Button
                variant="ghost"
                className="mt-1.5 h-7 px-2.5 text-[12px] font-medium text-mesh-blue hover:bg-mesh-blue-soft/60 hover:text-mesh-blue"
                onClick={onRetry}
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div aria-busy="true">
              <span className="sr-only">Loading listings…</span>
              <div className="space-y-2">
                <ListingCardSkeleton />
                <ListingCardSkeleton />
                <ListingCardSkeleton />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <NoListingsMatch canClear={filtersActive} onClear={clearFilters} />
          ) : (
            filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onViewOffer={() => setOfferListing(listing)}
              />
            ))
          )}
        </div>
      </section>

      <OfferDialog
        listing={offerListing}
        open={offerListing !== null}
        onOpenChange={(open) => {
          if (!open) setOfferListing(null);
        }}
      />
    </div>
  );
}
