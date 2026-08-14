import { db } from "@qre/db";
import type { AssetRepository, AssetRecord } from "@qre/engine";

export function createAssetRepository(): AssetRepository {
  return {
    async findBySlug(slug: string): Promise<AssetRecord | null> {
      const asset = await db.asset.findUnique({
        where: { slug },
        include: {
          flows: { where: { active: true }, orderBy: { priority: "desc" }, include: { flow: { include: { steps: true } } } },
          experiences: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!asset) return null;
      const activeLink = asset.flows[0] ?? null;
      const activeFlow = activeLink?.flow ?? null;
      const experiences = asset.experiences.map((experience) => {
        const blueprint = experience.blueprint as Record<string, unknown> | null;
        return { id: experience.id, title: experience.title ?? null, sourcePrompt: typeof blueprint?.sourcePrompt === "string" ? blueprint.sourcePrompt : null, blueprint: experience.blueprint, createdAt: experience.createdAt.toISOString() };
      });
      return {
        id: asset.id, slug: asset.slug, accountId: asset.accountId ?? null, paid: asset.paid, category: asset.category ?? null,
        flow: activeFlow ? { id: activeFlow.id, steps: activeFlow.steps.map((step) => ({ id: step.id, order: step.order, type: step.type, payload: step.payload as unknown })) } : null,
        experience: experiences[experiences.length - 1] ?? null,
        experiences,
      };
    },
  };
}
