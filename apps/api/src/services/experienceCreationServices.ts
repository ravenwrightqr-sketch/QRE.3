/**
 * Production creation boundary.
 *
 * Business prompt → cognition → experience → flow.
 */

import { db } from "@qre/db";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { compileExperience } from "./experienceService.js";

export type CreateExperienceInput = {
  assetId: string;
  prompt: string;
  title?: string;
  userId?: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function resolveExperienceEntity(assetId: string, prompt: string) {
  const rows = await db.$queryRaw<any[]>`
    SELECT id, kind, name, canonical_key, confidence
    FROM "qre_memory_entity"
    WHERE "asset_id" = ${assetId}
    ORDER BY "updated_at" DESC
    LIMIT 100
  `;
  const promptKey = normalize(prompt);
  const entity = rows.find((row) => {
    const nameKey = normalize(String(row.name ?? ""));
    return nameKey.length >= 2 && promptKey.includes(nameKey);
  });
  if (!entity) return undefined;
  return { id: entity.id, kind: entity.kind, name: entity.name, canonicalKey: entity.canonical_key, confidence: Number(entity.confidence), scope: "asset" };
}

export async function createExperience(input: CreateExperienceInput) {
  if (!input.assetId || !input.prompt.trim()) throw new Error("Asset and prompt required.");

  const memoryRepository = createMemoryRepository();
  const compiled = await compileExperience({
    prompt: input.prompt.trim(),
    assetId: input.assetId,
    userId: input.userId,
    memoryRepository,
  });

  const entityMemory = await resolveExperienceEntity(input.assetId, input.prompt.trim());
  const blueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    sourcePrompt: input.prompt.trim(),
    authoring: {
      kind: "service_experience",
      authoredBy: input.userId ?? null,
      memoryAware: true,
      behaviorAware: true,
    },
    memory: { scope: "asset", entity: entityMemory ?? null, learned: true },
  };

  const experience = await db.experience.create({
    data: { assetId: input.assetId, title: input.title ?? compiled.title, blueprint },
  });

  const flow = await db.flow.create({
    data: {
      name: experience.title ?? "Experience",
      version: 1,
      actions: { category: compiled.blueprint.type ?? "experience", sourcePrompt: input.prompt.trim() },
      steps: { create: compiled.flowSteps.map((step) => ({ order: step.order, type: step.type, payload: step.payload })) },
    },
    include: { steps: true },
  });

  await db.experience.update({ where: { id: experience.id }, data: { flow: { connect: { id: flow.id } } } });

  return { experience, flow, compiled, entityMemory };
}
