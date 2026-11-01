import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAutomationRunVM, toAutomationVM } from "@/lib/server/vm-mappers";
import { generateTaskTrace } from "@/lib/server/task-trace";

/**
 * Trigger an immediate manual run of a scheduled task (zcode "Run now").
 *
 * A run creates a real task session for the automation's instructions —
 * same shape as the composer's "Create task" — so "Go to session" opens
 * the normal ZCode task UI with thinking + conversation traces.
 */
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

  const prompt = automation.prompt.trim() || automation.name;

  /* Resolve the project the composer stored on the automation (`target`
     holds the project name); fall back to the first workspace project so
     every run lands somewhere visible. */
  const projects = await db.project.findMany({ orderBy: { createdAt: "asc" } });
  const project = projects.find((p) => p.name === automation.target) ?? projects[0];
  if (!project) {
    return NextResponse.json({ error: "No project available." }, { status: 400 });
  }

  /* Session for this run — a normal task with the automation's config. */
  const task = await db.task.create({
    data: {
      name: automation.name,
      prompt,
      projectId: project.id,
      model: automation.model || "glm-5.3-max",
      permissionMode: automation.mode || "ask",
      status: "in_progress",
    },
  });
  await generateTaskTrace(task.id, prompt, automation.model || "glm-5.3-max");

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
      sessionId: task.id,
    },
  });
  const updated = await db.automation.update({
    where: { id: automation.id },
    data: { runCount: { increment: 1 }, lastRunAt: now },
  });
  return NextResponse.json({ run: toAutomationRunVM(run), automation: toAutomationVM(updated) });
}
