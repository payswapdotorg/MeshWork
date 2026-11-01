import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { toTaskGroupVM, toTaskVM } from "@/lib/server/vm-mappers";

/**
 * Task groups API (zcode "By group" sidebar view).
 * GET  → groups (position order) + the full task list (the UI filters).
 * POST → create a group (max 12 enforced).
 */

const GROUP_COLORS: readonly string[] = ["gray", "red", "orange", "yellow", "green", "blue", "purple"];
const MAX_GROUPS = 12;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function GET() {
  await ensureSeeded();
  const [groups, tasks] = await Promise.all([
    db.taskGroup.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    db.task.findMany({ include: { project: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return NextResponse.json({
    groups: groups.map(toTaskGroupVM),
    tasks: tasks.map((t) => toTaskVM(t)),
  });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as { title?: string; color?: string };
  const title = (body.title ?? "").trim() || "New group";
  const color = body.color && GROUP_COLORS.includes(body.color) ? body.color : "gray";

  const count = await db.taskGroup.count();
  if (count >= MAX_GROUPS) {
    return NextResponse.json({ error: "You can keep up to 12 groups." }, { status: 400 });
  }

  /* Unique key: slug(title) or "group-{suffix}", retry with a suffix if taken. */
  const base = slugify(title);
  const taken = new Set((await db.taskGroup.findMany({ select: { key: true } })).map((g) => g.key));
  let key = base || `group-${randomSuffix()}`;
  while (taken.has(key)) {
    key = `${base || "group"}-${randomSuffix()}`;
  }

  const max = await db.taskGroup.aggregate({ _max: { position: true } });
  try {
    const group = await db.taskGroup.create({
      data: { key, title, color, position: (max._max.position ?? -1) + 1 },
    });
    return NextResponse.json({ group: toTaskGroupVM(group) }, { status: 201 });
  } catch {
    /* Rare race on the unique key — retry once with a fresh random key. */
    const group = await db.taskGroup.create({
      data: {
        key: `group-${randomSuffix()}${randomSuffix()}`,
        title,
        color,
        position: (max._max.position ?? -1) + 1,
      },
    });
    return NextResponse.json({ group: toTaskGroupVM(group) }, { status: 201 });
  }
}
