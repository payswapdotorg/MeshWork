import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateFollowUp, modelLabel } from "@/lib/server/task-trace";
import type { TaskMessageVM } from "@/lib/meshwork/types";

/**
 * POST /api/tasks/[id]/messages — append a user reply to an existing task
 * conversation and generate the follow-up trace (thinking + tool rows +
 * assistant answer), exactly like the initial trace of a new task.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { text?: string; model?: string };
  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Message text is required." }, { status: 400 });
  }
  const task = await db.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const last = await db.taskMessage.findFirst({ where: { taskId: id }, orderBy: { seq: "desc" } });
  let seq = (last?.seq ?? -1) + 1;
  const now = Date.now();
  const created: Awaited<ReturnType<typeof db.taskMessage.create>>[] = [];

  /* (a) the user's reply */
  created.push(
    await db.taskMessage.create({
      data: { taskId: id, seq: seq++, kind: "user", text, createdAt: new Date(now) },
    })
  );

  /* Model switch (composer Select) → timeline marker + task model update */
  const model = body.model && body.model !== task.model ? body.model : null;
  if (model) {
    await db.task.update({ where: { id }, data: { model } });
    created.push(
      await db.taskMessage.create({
        data: {
          taskId: id,
          seq: seq++,
          kind: "marker",
          text: "",
          payload: JSON.stringify({ marker: "modelChange", label: `Switched to ${modelLabel(model)}` }),
          createdAt: new Date(now + 200),
        },
      })
    );
  }

  /* (b) generated follow-up trace; the task reads in_progress while it runs,
     then completes (updatedAt auto-bumps). */
  await db.task.update({ where: { id }, data: { status: "in_progress" } });
  const traceStart = seq;
  await generateFollowUp(id, text, model ?? task.model);
  const traced = await db.taskMessage.findMany({
    where: { taskId: id, seq: { gte: traceStart } },
    orderBy: { seq: "asc" },
  });
  await db.task.update({ where: { id }, data: { status: "completed" } });

  const messages: TaskMessageVM[] = [...created, ...traced].map((m) => ({
    id: m.id,
    taskId: m.taskId,
    seq: m.seq,
    kind: m.kind as TaskMessageVM["kind"],
    text: m.text,
    payload: parsePayload(m.payload),
    durationMs: m.durationMs,
    status: (m.status as TaskMessageVM["status"]) ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ messages });
}

function parsePayload(raw: string): TaskMessageVM["payload"] {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" && Object.keys(parsed).length > 0
      ? (parsed as unknown as TaskMessageVM["payload"])
      : null;
  } catch {
    return null;
  }
}
