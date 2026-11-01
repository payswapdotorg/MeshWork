import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAutomationRunVM, toAutomationVM } from "@/lib/server/vm-mappers";

/** Trigger an immediate manual run of a scheduled task (zcode "Run now"). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const automation = await db.automation.findUnique({ where: { id } });
  if (!automation) {
    return NextResponse.json({ error: "Automation not found." }, { status: 404 });
  }
  if (automation.status === "paused") {
    return NextResponse.json(
      { error: "This scheduled task is paused. Continue it first." },
      { status: 400 }
    );
  }
  if (automation.status === "completed" || automation.status === "failed") {
    return NextResponse.json({ error: "This scheduled task is not running." }, { status: 400 });
  }

  const now = new Date();
  /* pseudo-random duration between 45s and 180s (3 minutes) of work */
  const durationMs = 45_000 + Math.floor(Math.random() * 135_001);
  const run = await db.automationRun.create({
    data: {
      automationId: automation.id,
      trigger: "manual",
      status: "succeeded",
      startedAt: now,
      durationMs,
      sessionId: null,
    },
  });
  const updated = await db.automation.update({
    where: { id: automation.id },
    data: { runCount: { increment: 1 }, lastRunAt: now },
  });
  return NextResponse.json({ run: toAutomationRunVM(run), automation: toAutomationVM(updated) });
}
