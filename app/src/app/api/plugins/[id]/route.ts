import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toPluginVM } from "@/lib/server/vm-mappers";

/** Install/uninstall, enable/disable and scope changes all flow through here. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    installed?: boolean;
    enabled?: boolean;
    scope?: string;
  };

  if (body.installed === undefined && body.enabled === undefined && body.scope === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = await db.plugin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Plugin not found." }, { status: 404 });
  }

  const data: { installed?: boolean; enabled?: boolean; scope?: string } = {};
  if (body.installed !== undefined) {
    if (typeof body.installed !== "boolean") {
      return NextResponse.json({ error: "Invalid installed value." }, { status: 400 });
    }
    data.installed = body.installed;
    /* uninstalling resets the plugin to its default enabled state */
    if (body.installed === false && body.enabled === undefined) data.enabled = true;
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value." }, { status: 400 });
    }
    data.enabled = body.enabled;
  }
  if (body.scope !== undefined) {
    const scope = String(body.scope);
    if (scope !== "user" && scope !== "workspace") {
      return NextResponse.json({ error: "Invalid scope value." }, { status: 400 });
    }
    data.scope = scope;
  }

  const plugin = await db.plugin.update({ where: { id }, data });
  return NextResponse.json({ plugin: toPluginVM(plugin) });
}
