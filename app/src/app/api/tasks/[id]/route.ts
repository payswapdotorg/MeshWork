import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toTaskVM } from "@/lib/server/vm-mappers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id }, include: { project: true } });
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  const messages = await db.taskMessage.findMany({
    where: { taskId: id },
    orderBy: { seq: "asc" },
  });
  return NextResponse.json({
    task: toTaskVM(task, task.project.name),
    messages: messages.map((m) => ({
      id: m.id,
      taskId: m.taskId,
      seq: m.seq,
      kind: m.kind,
      text: m.text,
      payload: safePayload(m.payload),
      durationMs: m.durationMs,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

function safePayload(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    pinned?: boolean;
    groupId?: string | null;
    name?: string;
    markRead?: boolean;
  };
  const allowed = ["draft", "in_progress", "completed", "error"];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  const task = await db.task.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
      ...(body.groupId !== undefined ? { groupId: body.groupId } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.markRead ? { unreadAt: null } : {}),
    },
    include: { project: true },
  });
  return NextResponse.json({ task: toTaskVM(task, task.project.name) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.task.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
