import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toPluginVM } from "@/lib/server/vm-mappers";

/** Update a plugin to its latest known version. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.plugin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Plugin not found." }, { status: 404 });
  }
  const plugin = await db.plugin.update({
    where: { id },
    data: { version: existing.latestVersion },
  });
  return NextResponse.json({ plugin: toPluginVM(plugin) });
}
