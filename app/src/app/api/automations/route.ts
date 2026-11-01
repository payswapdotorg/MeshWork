import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { toAutomationVM } from "@/lib/server/vm-mappers";
import { getNextCronRun, parseCronExpr } from "./cron";

/** zcode create limit for scheduled tasks (any status counts). */
const MAX_AUTOMATIONS = 20;
const MAX_AUTOMATIONS_ERROR =
  "You can keep up to 20 scheduled tasks, including paused, completed, and failed tasks. Delete one before creating another.";

export async function GET() {
  await ensureSeeded();
  const automations = await db.automation.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ automations: automations.map(toAutomationVM) });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    cronExpr?: string;
    schedule?: string;
    prompt?: string;
    target?: string;
    mode?: string;
    model?: string;
  };

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Task title is required.", field: "name" }, { status: 400 });
  }
  const cronExpr = (body.cronExpr ?? "").trim();
  if (!cronExpr) {
    return NextResponse.json({ error: "A schedule is required.", field: "cronExpr" }, { status: 400 });
  }
  if (!parseCronExpr(cronExpr)) {
    return NextResponse.json(
      { error: "Enter a valid cron expression.", field: "cronExpr" },
      { status: 400 }
    );
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Instructions are required.", field: "prompt" }, { status: 400 });
  }

  const count = await db.automation.count();
  if (count >= MAX_AUTOMATIONS) {
    return NextResponse.json({ error: MAX_AUTOMATIONS_ERROR }, { status: 400 });
  }

  const schedule = (body.schedule ?? "").trim() || cronExpr;
  const automation = await db.automation.create({
    data: {
      name,
      description: (body.description ?? "").trim(),
      schedule,
      cronExpr,
      prompt,
      target: (body.target ?? "").trim(),
      mode: (body.mode ?? "ask").trim() || "ask",
      model: (body.model ?? "glm-5.3-max").trim() || "glm-5.3-max",
      status: "active",
      enabled: true,
      nextRunAt: getNextCronRun(cronExpr),
    },
  });
  return NextResponse.json({ automation: toAutomationVM(automation) }, { status: 201 });
}
