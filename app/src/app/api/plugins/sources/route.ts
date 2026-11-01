import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import type { MarketplaceSource } from "@prisma/client";
import type { MarketplaceSourceVM } from "@/lib/meshwork/types";

/** Local row → VM mapper (vm-mappers.ts only exposes the list variant). */
function toSourceVM(s: MarketplaceSource): MarketplaceSourceVM {
  return {
    id: s.id,
    key: s.key,
    name: s.name,
    source: s.source,
    official: s.official,
    removable: s.removable,
    lastUpdated: s.lastUpdated.toISOString(),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Add a marketplace source (personal, removable). */
export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as { name?: string; source?: string };
  const source = String(body.source ?? "").trim();
  if (!source) {
    return NextResponse.json({ error: "A marketplace source is required." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim() || source;
  const key = slugify(name);
  if (!key) {
    return NextResponse.json({ error: "A marketplace source is required." }, { status: 400 });
  }
  const existing = await db.marketplaceSource.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json(
      { error: "A marketplace source with this name already exists." },
      { status: 400 }
    );
  }
  const created = await db.marketplaceSource.create({
    data: { key, name, source, official: false, removable: true },
  });
  return NextResponse.json({ source: toSourceVM(created) }, { status: 201 });
}
