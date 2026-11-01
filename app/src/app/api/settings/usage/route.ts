import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";

/**
 * Local usage statistics for Settings → Usage stats. Figures are computed
 * from this workspace's SQLite database and are labelled as local session
 * stats in the UI (never advertised as provider telemetry).
 */
export async function GET() {
  await ensureSeeded();

  const [tasksRun, toolCalls, messages, taskRows] = await Promise.all([
    db.task.count(),
    db.taskMessage.count({ where: { kind: "tool" } }),
    db.taskMessage.findMany({ select: { text: true } }),
    db.task.findMany({ select: { createdAt: true } }),
  ]);

  /* Rough token estimate (~4 chars per token) over the recorded trace text. */
  const chars = messages.reduce((sum, m) => sum + m.text.length, 0);
  const tokens = Math.round(chars / 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(today);
    start.setDate(start.getDate() - (6 - i));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      day: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-US", { weekday: "short" }),
      tasks: taskRows.filter((t) => t.createdAt >= start && t.createdAt < end).length,
    };
  });

  return NextResponse.json({ tasksRun, toolCalls, tokens, activity: days });
}
