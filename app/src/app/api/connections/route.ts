import { NextResponse } from "next/server";
import { ensureSeeded, getConnectionsConfig, putConnectionsConfig } from "@/lib/server/workspace";
import { buildConnectionsVM } from "@/lib/meshwork/aggregation";
import type { AggregationMode, OptimiseFor } from "@/lib/meshwork/types";

const MODES: AggregationMode[] = ["single", "load-balance", "bond", "failover", "redundancy"];
const OBJECTIVES: OptimiseFor[] = ["cost", "latency", "throughput", "availability"];

export async function GET() {
  await ensureSeeded();
  const config = await getConnectionsConfig();
  return NextResponse.json(buildConnectionsVM(config));
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as {
    mode?: string;
    optimiseFor?: string;
    maxSpendPerDay?: number | null;
    selectedPathIds?: string[];
  };

  const previous = await getConnectionsConfig();
  const mode = MODES.includes(body.mode as AggregationMode)
    ? (body.mode as AggregationMode)
    : previous.mode;
  const optimiseFor = OBJECTIVES.includes(body.optimiseFor as OptimiseFor)
    ? (body.optimiseFor as OptimiseFor)
    : previous.optimiseFor;
  const maxSpendPerDay =
    body.maxSpendPerDay === null
      ? null
      : typeof body.maxSpendPerDay === "number" && body.maxSpendPerDay >= 0 && body.maxSpendPerDay <= 1000
        ? body.maxSpendPerDay
        : previous.maxSpendPerDay;
  const selectedPathIds = Array.isArray(body.selectedPathIds)
    ? body.selectedPathIds.filter((id) => typeof id === "string").slice(0, 8)
    : previous.selectedPathIds;

  const config = { mode, optimiseFor, maxSpendPerDay, selectedPathIds };
  await putConnectionsConfig(config);
  return NextResponse.json(buildConnectionsVM(config));
}
