import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Delete a single run from a scheduled task's history. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const { id, runId } = await params;
  await db.automationRun.deleteMany({ where: { id: runId, automationId: id } });
  return NextResponse.json({ ok: true });
}
