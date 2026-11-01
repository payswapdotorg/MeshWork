import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAutomationRunVM } from "@/lib/server/vm-mappers";

/** Run history for one scheduled task (newest first). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const runs = await db.automationRun.findMany({
    where: { automationId: id },
    orderBy: { startedAt: "desc" },
  });
  return NextResponse.json({ runs: runs.map(toAutomationRunVM) });
}
