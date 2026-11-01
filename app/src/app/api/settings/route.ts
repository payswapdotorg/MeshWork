import { NextResponse } from "next/server";
import { ensureSeeded, getSettingsMap, putSettingsMap } from "@/lib/server/workspace";

export async function GET() {
  await ensureSeeded();
  const settings = await getSettingsMap();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!/^[a-z][a-z0-9.-]*$/i.test(key)) continue;
    if (typeof value === "string" && value.length > 500) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      patch[key] = value;
    }
  }
  await putSettingsMap(patch);
  const settings = await getSettingsMap();
  return NextResponse.json({ settings });
}
