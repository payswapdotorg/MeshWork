import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { findProviderVM } from "../shared";

const API_FORMATS = ["anthropic-messages", "openai-chat-completions", "openai-responses"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Provider name is required." }, { status: 400 });
    }
    data.name = body.name.trim();
  }

  if (body.baseUrl !== undefined) {
    if (provider.account) {
      return NextResponse.json(
        { error: "Base URL is managed by the provider connection and cannot be changed." },
        { status: 400 }
      );
    }
    if (typeof body.baseUrl !== "string") {
      return NextResponse.json({ error: "Invalid base URL." }, { status: 400 });
    }
    data.baseUrl = body.baseUrl.trim();
  }

  if (body.apiFormat !== undefined) {
    if (provider.account) {
      return NextResponse.json(
        { error: "API format is managed by the provider connection and cannot be changed." },
        { status: 400 }
      );
    }
    if (typeof body.apiFormat !== "string" || !API_FORMATS.includes(body.apiFormat as (typeof API_FORMATS)[number])) {
      return NextResponse.json({ error: "Invalid API format." }, { status: 400 });
    }
    data.apiFormat = body.apiFormat;
  }

  if (body.apiKey !== undefined) {
    if (typeof body.apiKey !== "string" || body.apiKey.length > 500) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 400 });
    }
    data.apiKey = body.apiKey; // empty string clears the stored key
  }

  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid enabled value." }, { status: 400 });
    }
    data.enabled = body.enabled;
  }

  if (body.displayOrder !== undefined) {
    if (typeof body.displayOrder !== "number" || !Number.isInteger(body.displayOrder)) {
      return NextResponse.json({ error: "Invalid display order." }, { status: 400 });
    }
    data.displayOrder = body.displayOrder;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await db.modelProvider.update({ where: { id }, data });
  return NextResponse.json({ provider: await findProviderVM(id) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }
  if (provider.builtin) {
    return NextResponse.json({ error: "Built-in providers cannot be deleted." }, { status: 400 });
  }
  await db.modelProvider.delete({ where: { id } }); // model entries cascade
  return NextResponse.json({ ok: true });
}
