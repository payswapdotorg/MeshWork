import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAutomationVM } from "@/lib/server/vm-mappers";
import { getNextCronRun, parseCronExpr } from "../cron";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    cronExpr?: string;
    schedule?: string;
    prompt?: string;
    target?: string;
    mode?: string;
    model?: string;
    status?: string;
    enabled?: boolean;
  };

  const existing = await db.automation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Automation not found." }, { status: 404 });
  }

  const data: {
    name?: string;
    description?: string;
    cronExpr?: string;
    schedule?: string;
    prompt?: string;
    target?: string;
    mode?: string;
    model?: string;
    status?: string;
    enabled?: boolean;
    nextRunAt?: Date | null;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Task title is required.", field: "name" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.prompt !== undefined) {
    const prompt = String(body.prompt).trim();
    if (!prompt) {
      return NextResponse.json({ error: "Instructions are required.", field: "prompt" }, { status: 400 });
    }
    data.prompt = prompt;
  }
  if (body.target !== undefined) data.target = String(body.target).trim();
  if (body.mode !== undefined) data.mode = String(body.mode).trim() || "ask";
  if (body.model !== undefined) data.model = String(body.model).trim() || "glm-5.3-max";

  let cronChanged = false;
  if (body.cronExpr !== undefined) {
    const cronExpr = String(body.cronExpr).trim();
    if (!cronExpr) {
      return NextResponse.json({ error: "A schedule is required.", field: "cronExpr" }, { status: 400 });
    }
    if (!parseCronExpr(cronExpr)) {
      return NextResponse.json(
        { error: "Enter a valid cron expression.", field: "cronExpr" },
        { status: 400 }
      );
    }
    if (cronExpr !== existing.cronExpr) cronChanged = true;
    data.cronExpr = cronExpr;
    if (body.schedule === undefined) data.schedule = cronExpr;
  }
  if (body.schedule !== undefined) {
    data.schedule = String(body.schedule).trim() || data.cronExpr || existing.cronExpr;
  }
  if (cronChanged) {
    data.nextRunAt = getNextCronRun(data.cronExpr as string);
  }

  /* status ⇔ enabled: paused means disabled, active means enabled. */
  if (body.status !== undefined) {
    const status = String(body.status);
    if (status !== "active" && status !== "paused") {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }
    data.status = status;
    data.enabled = status === "active";
  } else if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value." }, { status: 400 });
    }
    data.enabled = body.enabled;
    data.status = body.enabled ? "active" : "paused";
  }

  const automation = await db.automation.update({ where: { id }, data });
  return NextResponse.json({ automation: toAutomationVM(automation) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.automation.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
