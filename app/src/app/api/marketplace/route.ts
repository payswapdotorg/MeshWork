import { NextResponse } from "next/server";
import { EAST_LEGON_POOL, MARKETPLACE_LISTINGS, MARKETPLACE_NOTE } from "@/lib/meshwork/data";
import type { MarketplacePayload } from "@/lib/meshwork/types";

export async function GET() {
  const payload: MarketplacePayload = {
    listings: MARKETPLACE_LISTINGS,
    pools: [EAST_LEGON_POOL],
    note: MARKETPLACE_NOTE,
  };
  return NextResponse.json(payload);
}
