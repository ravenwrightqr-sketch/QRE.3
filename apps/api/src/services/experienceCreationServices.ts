/**
 * =====================================================
 * EXPERIENCE CREATION SERVICE
 * =====================================================
 *
 * Production creation boundary.
 *
 * Prompt
 *   ↓
 * Experience Compiler (ENGINE)
 *   ↓
 * Experience Record
 *   ↓
 * Flow Runtime
 *
 * Responsibilities:
 *
 * - Compile experience
 * - Create Experience
 * - Create Flow
 * - Link runtime to experience
 *
 * NO FRONTEND LOGIC
 * NO EXECUTION
 * NO ENGINE OWNERSHIP
 *
 * =====================================================
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

/**
 * Resolve the entity mentioned by the prompt from the durable memory graph.
 * This deliberately happens at the API boundary: the engine remains pure and
 * the persisted experience gains a stable pointer to the memory thread that
 * informed it.
 */
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

  return {
    id: entity.id,
    kind: entity.kind,
    name: entity.name,
    canonicalKey: entity.canonical_key,
    confidence: Number(entity.confidence),
    scope: "asset",
  };
}

export async function createExperience(input: CreateExperienceInput) {
  if (!input.assetId || !input.prompt.trim()) {
    throw new Error("Asset and prompt required.");
  }

  /**
   * ===================================================
   * 1. COMPILE
   * API → ENGINE
   * ===================================================
   *
   * The compiler remains pure. The API boundary supplies the durable
   * memory repository so creation participates in the same memory loop
   * as the /experience/compile route.
   */
  const memoryRepository = createMemoryRepository();

  const compiled = await compileExperience({
    prompt: input.prompt.trim(),
    assetId: input.assetId,
    userId: input.userId,
    memoryRepository,
  });

  /**
   * ===================================================
   * 2. RESOLVE ENTITY MEMORY THREAD
   * ===================================================
   */
  const entityMemory = await resolveExperienceEntity(
    input.assetId,
    input.prompt.trim(),
  );

  /**
   * ===================================================
   * 3. CREATE EXPERIENCE
   * Human creative object
   * ===================================================
   */
  const blueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    memory: {
      scope: "asset",
      entity: entityMemory ?? null,
      learned: true,
    },
  };

  const experience = await db.experience.create({
    data: {
      assetId: input.assetId,
      title: input.title ?? compiled.title,
      blueprint,
    },
  });

  /**
   * ===================================================
   * 4. CREATE FLOW
   * Runtime representation
   * ===================================================
   */
  const flow = await db.flow.create({
    data: {
      name: experience.title ?? "Experience",
      version: 1,
      actions: {
        category: compiled.blueprint.type ?? "experience",
      },
      steps: {
        create: compiled.flowSteps.map((step) => ({
          order: step.order,
          type: step.type,
          payload: step.payload,
        })),
      },
    },
    include: {
      steps: true,
    },
  });

  /**
   * ===================================================
   * 5. LINK EXPERIENCE → FLOW
   * ===================================================
   */
  await db.experience.update({
    where: {
      id: experience.id,
    },
    data: {
      flow: {
        connect: {
          id: flow.id,
        },
      },
    },
  });

  return {
    experience,
    flow,
    compiled,
    entityMemory,
  };
}
