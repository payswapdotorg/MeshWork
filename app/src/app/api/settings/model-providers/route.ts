import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/server/workspace";
import { toModelProviderVM } from "@/lib/server/vm-mappers";
import { getProviderTemplate } from "@/lib/meshwork/provider-templates";
import { listProviderVMs } from "./shared";

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({ providers: await listProviderVMs() });
}

/**
 * Create a provider from the template catalog (zcode "Add provider" picker).
 * Template "custom" creates an empty "New provider" ready for configuration.
 */
export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json().catch(() => ({}))) as { templateKey?: string; name?: string };
  const template = getProviderTemplate(typeof body.templateKey === "string" ? body.templateKey : "");
  if (!template) {
    return NextResponse.json({ error: "Unknown provider template." }, { status: 400 });
  }
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : template.name;

  /* Unique key: append -2, -3, … when the template was used before. */
  let key = template.key;
  for (let suffix = 2; ; suffix += 1) {
    const clash = await db.modelProvider.findUnique({ where: { key } });
    if (!clash) break;
    key = `${template.key}-${suffix}`;
  }

  const maxOrder = await db.modelProvider.aggregate({ _max: { displayOrder: true } });
  const provider = await db.modelProvider.create({
    data: {
      key,
      name,
      baseUrl: template.baseUrl,
      apiFormat: template.apiFormat,
      apiKey: "",
      enabled: true,
      builtin: false,
      account: template.account ?? false,
      logoKey: template.logoKey,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  let order = 0;
  for (const m of template.models) {
    await db.modelEntry.create({
      data: {
        providerId: provider.id,
        modelId: m.modelId,
        contextWindow: m.contextWindow,
        maxOutputTokens: m.maxOutputTokens,
        inputTypes: JSON.stringify(m.inputTypes?.length ? m.inputTypes : ["text"]),
        capabilities: JSON.stringify(m.capabilities ?? {}),
        reasoningLevels: JSON.stringify(m.reasoningLevels ?? []),
        enabled: true,
        builtin: false,
        displayOrder: order++,
      },
    });
  }

  const models = await db.modelEntry.findMany({ where: { providerId: provider.id } });
  return NextResponse.json({ provider: toModelProviderVM(provider, models) }, { status: 201 });
}
