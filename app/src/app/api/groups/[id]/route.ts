import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toTaskGroupVM } from "@/lib/server/vm-mappers";

/**
 * Single task group API (zcode "By group" sidebar view).
 * PATCH  {title? | color?} → rename / recolor (color validated against the 7 allowed).
 * DELETE → member tasks become ungrouped (groupId=null), then the group is removed.
 */

const GROUP_COLORS: readonly string[] = ["gray", "red", "orange", "yellow", "green", "blue", "purple"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { title?: string; color?: string };

  if (body.color !== undefined && !GROUP_COLORS.includes(body.color)) {
    return NextResponse.json({ error: "Unsupported color." }, { status: 400 });
  }

  const data: { title?: string; color?: string } = {};
  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Group name can't be empty." }, { status: 400 });
    }
    data.title = title.slice(0, 60);
  }
  if (body.color !== undefined) {
    data.color = body.color;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = await db.taskGroup.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const group = await db.taskGroup.update({ where: { id }, data });
  return NextResponse.json({ group: toTaskGroupVM(group) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.taskGroup.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }
  /* Tasks in the group are kept — they return to the ungrouped list. */
  await db.task.updateMany({ where: { groupId: id }, data: { groupId: null } });
  await db.taskGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
