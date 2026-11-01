import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { findProviderVM } from "../../../shared";

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseStringArray(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every((t) => typeof t === "string")) return fallback;
  return raw as string[];
}

/** Update one model entry on a provider. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  await ensureSeeded();
  const { id, modelId } = await params;
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  const decodedModelId = decodeURIComponent(modelId);
  const model = await db.modelEntry.findUnique({
    where: { providerId_modelId: { providerId: id, modelId: decodedModelId } },
  });
  if (!model) {
    return NextResponse.json({ error: "Model not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.contextWindow !== undefined) {
    data.contextWindow = clampInt(body.contextWindow, 1_000, 100_000_000, model.contextWindow);
  }
  if (body.maxOutputTokens !== undefined) {
    data.maxOutputTokens = clampInt(body.maxOutputTokens, 256, 10_000_000, model.maxOutputTokens);
  }
  if (body.inputTypes !== undefined) {
    data.inputTypes = JSON.stringify(parseStringArray(body.inputTypes, ["text"]));
  }
  if (body.reasoningLevels !== undefined) {
    data.reasoningLevels = JSON.stringify(parseStringArray(body.reasoningLevels, []));
  }
  if (body.capabilities !== undefined) {
    data.capabilities =
      typeof body.capabilities === "object" && body.capabilities !== null && !Array.isArray(body.capabilities)
        ? JSON.stringify(body.capabilities)
        : JSON.stringify({});
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value." }, { status: 400 });
    }
    data.enabled = body.enabled;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await db.modelEntry.update({ where: { id: model.id }, data });
  return NextResponse.json({ provider: await findProviderVM(id) });
}

/** Delete a custom model entry (built-in models are protected). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  await ensureSeeded();
  const { id, modelId } = await params;
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  const decodedModelId = decodeURIComponent(modelId);
  const model = await db.modelEntry.findUnique({
    where: { providerId_modelId: { providerId: id, modelId: decodedModelId } },
  });
  if (!model) {
    return NextResponse.json({ error: "Model not found." }, { status: 404 });
  }
  if (model.builtin) {
    return NextResponse.json({ error: "Built-in models cannot be deleted." }, { status: 400 });
  }

  await db.modelEntry.delete({ where: { id: model.id } });
  return NextResponse.json({ ok: true });
}
