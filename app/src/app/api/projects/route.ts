import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";

export async function GET() {
  await ensureSeeded();
  const projects = await db.project.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({
    projects: projects.map((p) => ({ id: p.id, key: p.key, name: p.name })),
  });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "A project name is required." }, { status: 400 });
  }
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "project";
  const existing = await db.project.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({
      project: { id: existing.id, key: existing.key, name: existing.name },
    });
  }
  const project = await db.project.create({ data: { key, name } });
  return NextResponse.json({ project: { id: project.id, key: project.key, name: project.name } });
}
