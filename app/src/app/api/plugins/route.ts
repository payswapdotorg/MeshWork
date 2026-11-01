import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { toMarketplaceSourceVMs, toPluginVM } from "@/lib/server/vm-mappers";

export async function GET() {
  await ensureSeeded();
  const [plugins, sources] = await Promise.all([
    db.plugin.findMany({ orderBy: { createdAt: "asc" } }),
    toMarketplaceSourceVMs(),
  ]);
  return NextResponse.json({ plugins: plugins.map(toPluginVM), sources });
}
