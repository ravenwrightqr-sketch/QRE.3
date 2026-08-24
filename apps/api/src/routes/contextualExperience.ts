import { Router } from "express";
import { db } from "@qre/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { compileExperience } from "../services/experienceService.js";
import { createMemoryRepository, type MemoryRepository } from "../repositories/memoryRepository.js";
import type { MemoryContext } from "@qre/contracts";

const router = Router();

function scopeMemory(base: MemoryRepository, entityName: string): MemoryRepository {
  return {
    assertAccess: (input) => base.assertAccess(input),
    writeBatch: (batch) => base.writeBatch(batch),
    async loadContext(input) {
      const context = await base.loadContext(input);
      const needle = entityName.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const entity = context.entities.find((item) => item.canonicalKey === needle || item.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === needle);
      if (!entity) throw new Error("Requested entity context not found");

      const facts = context.facts.filter((fact) => fact.entityId === entity.id);
      const relations = context.relations.filter((relation) => relation.fromEntityId === entity.id || relation.toEntityId === entity.id);
      const events = context.events.filter((event) => event.entityIds.includes(entity.id));
      const scoped: MemoryContext = {
        assetId: context.assetId,
        generatedAt: context.generatedAt,
        entities: [entity],
        facts,
        relations,
        events,
      };
      return scoped;
    },
  };
}

router.post("/compile", requireAuth, async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : "";
    const entityName = typeof req.body?.entityName === "string" ? req.body.entityName.trim() : "";
    if (!prompt || !assetId) return res.status(400).json({ success: false, error: "Prompt and asset are required." });

    const userId = req.user?.userId;
    const asset = await db.asset.findFirst({
      where: {
        id: assetId,
        OR: [
          { ownerId: userId },
          { account: { AccountUser: { some: { userId } } } },
        ],
      },
      select: { id: true },
    });
    if (!asset) return res.status(403).json({ success: false, error: "Asset access denied." });

    const base = createMemoryRepository();
    const memoryRepository = entityName ? scopeMemory(base, entityName) : base;
    const experience = await compileExperience({ prompt, assetId, userId, memoryRepository });
    return res.json({ success: true, experience, context: entityName || null });
  } catch (error) {
    console.error("Contextual experience compile failed", error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Contextual experience failed." });
  }
});

export default router;
