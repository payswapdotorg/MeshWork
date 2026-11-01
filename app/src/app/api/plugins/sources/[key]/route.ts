import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toMarketplaceSourceVMs } from "@/lib/server/vm-mappers";

/** Refresh a marketplace source (pulls its latest plugin index). */
export async function PATCH(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const existing = await db.marketplaceSource.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Marketplace source not found." }, { status: 404 });
  }
  await db.marketplaceSource.update({ where: { key }, data: { lastUpdated: new Date() } });
  return NextResponse.json({ sources: await toMarketplaceSourceVMs() });
}

/** Remove a marketplace source; its plugins are uninstalled but kept. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const existing = await db.marketplaceSource.findUnique({ where: { key } });
  if (!existing) {
    return NextResponse.json({ error: "Marketplace source not found." }, { status: 404 });
  }
  if (!existing.removable) {
    return NextResponse.json(
      { error: "Official marketplace sources cannot be removed." },
      { status: 400 }
    );
  }
  /* orphaned plugins stay in the catalog but are no longer installed */
  await db.plugin.updateMany({ where: { sourceKey: key }, data: { installed: false } });
  await db.marketplaceSource.delete({ where: { key } });
  return NextResponse.json({ ok: true });
}
