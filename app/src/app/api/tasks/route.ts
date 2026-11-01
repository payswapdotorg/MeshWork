import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { generateTaskTrace } from "@/lib/server/task-trace";
import { toTaskVM } from "@/lib/server/vm-mappers";
import type { TaskVM } from "@/lib/meshwork/types";

export async function GET() {
  await ensureSeeded();
  const [tasks, projects] = await Promise.all([
    db.task.findMany({ include: { project: true }, orderBy: { updatedAt: "desc" } }),
    db.project.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return NextResponse.json({
    tasks: tasks.map((t) => toTaskVM(t)),
    projects: projects.map((p) => ({ id: p.id, key: p.key, name: p.name })),
  });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as {
    prompt?: string;
    name?: string;
    projectKey?: string;
    model?: string;
    permissionMode?: string;
  };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Describe the outcome you want first." }, { status: 400 });
  }
  const projects = await db.project.findMany();
  const project = projects.find((p) => p.key === body.projectKey) ?? projects[0];
  if (!project) {
    return NextResponse.json({ error: "No project available." }, { status: 400 });
  }
  const name = (body.name ?? "").trim() || prompt.split(/[.\n]/)[0].slice(0, 60);
  const model = body.model ?? "glm-5.3-max";
  const task = await db.task.create({
    data: {
      name,
      prompt,
      projectId: project.id,
      model,
      permissionMode: body.permissionMode ?? "ask",
      status: "in_progress",
    },
  });
  /* Generate the initial conversation trace (thinking + tool rows + answer)
     so the task opens with the normal ZCode task UI. */
  await generateTaskTrace(task.id, prompt, model);
  /* The trace generator concludes the run — re-read so the response carries
     the final status instead of the pre-trace snapshot. */
  const finalTask = await db.task.findUnique({ where: { id: task.id } });
  return NextResponse.json({
    task: {
      id: task.id,
      name: task.name,
      projectId: task.projectId,
      projectName: project.name,
      prompt: task.prompt,
      status: (finalTask?.status ?? task.status) as TaskVM["status"],
      model: task.model,
      permissionMode: task.permissionMode,
      pinned: task.pinned,
      unread: task.unreadAt !== null,
      groupId: task.groupId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    } satisfies TaskVM,
  });
}
