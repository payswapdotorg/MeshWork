import { db } from "@/lib/db";
import { toModelProviderVM } from "@/lib/server/vm-mappers";
import type { ModelProviderVM } from "@/lib/meshwork/types";

/** All providers with their models, ordered for the Model settings nav. */
export async function listProviderVMs(): Promise<ModelProviderVM[]> {
  const [providers, models] = await Promise.all([
    db.modelProvider.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] }),
    db.modelEntry.findMany(),
  ]);
  return providers.map((p) => toModelProviderVM(p, models));
}

/** One provider (with models) as a VM, or null when the id is unknown. */
export async function findProviderVM(id: string): Promise<ModelProviderVM | null> {
  const provider = await db.modelProvider.findUnique({ where: { id } });
  if (!provider) return null;
  const models = await db.modelEntry.findMany({ where: { providerId: id } });
  return toModelProviderVM(provider, models);
}
