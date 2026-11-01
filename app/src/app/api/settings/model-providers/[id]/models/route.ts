import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { findProviderVM } from "../../shared";

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseStringArray(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every((t) => typeof t === "string")) return fallback;
  return raw as string[];
}

/** Upsert a model entry on a provider (unique per providerId + modelId). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const modelId = typeof body.modelId === "string" ? body.modelId.trim() : "";
  if (!modelId) {
    return NextResponse.json({ error: "Model ID is required." }, { status: 400 });
  }
  const contextWindow = clampInt(body.contextWindow, 1_000, 100_000_000, 200_000);
  const maxOutputTokens = clampInt(body.maxOutputTokens, 256, 10_000_000, 8_192);
  const inputTypes = parseStringArray(body.inputTypes, ["text"]);
  const reasoningLevels = parseStringArray(body.reasoningLevels, []);
  const capabilities =
    typeof body.capabilities === "object" && body.capabilities !== null && !Array.isArray(body.capabilities)
      ? (body.capabilities as Record<string, boolean>)
      : {};

  const existing = await db.modelEntry.findUnique({
    where: { providerId_modelId: { providerId: id, modelId } },
  });

  if (existing) {
    await db.modelEntry.update({
      where: { id: existing.id },
      data: {
        contextWindow,
        maxOutputTokens,
        ...(body.inputTypes !== undefined && { inputTypes: JSON.stringify(inputTypes) }),
        ...(body.capabilities !== undefined && { capabilities: JSON.stringify(capabilities) }),
        ...(body.reasoningLevels !== undefined && { reasoningLevels: JSON.stringify(reasoningLevels) }),
      },
    });
  } else {
    const maxOrder = await db.modelEntry.aggregate({
      where: { providerId: id },
      _max: { displayOrder: true },
    });
    await db.modelEntry.create({
      data: {
        providerId: id,
        modelId,
        contextWindow,
        maxOutputTokens,
        inputTypes: JSON.stringify(inputTypes),
        capabilities: JSON.stringify(capabilities),
        reasoningLevels: JSON.stringify(reasoningLevels),
        enabled: true,
        builtin: false,
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      },
    });
  }

  return NextResponse.json({ provider: await findProviderVM(id) }, { status: existing ? 200 : 201 });
}
