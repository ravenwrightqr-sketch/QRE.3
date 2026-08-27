/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: Production creation boundary: canonical Author → durable experience/flow.
 * LAW: QRE may surprise us.
 * Guardrails protect truth, provenance, architecture, and safety; style is scored.
 */

import { randomUUID } from "node:crypto";
import { db, type Prisma } from "@qre/db";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { compileExperience } from "./experienceService.js";
import { buildSponsorPolicy } from "@qre/engine";
import { getCreativeLearningContext, learningContextLines } from "./creativeLearning.js";

export type SponsorInput = {
  enabled?: boolean;
  name?: string;
  role?: string;
  profileUrl?: string;
  brandMarkUrl?: string;
  usefulCta?: { label: string; url: string };
  placements?: any[];
  frequency?: "once" | "end_only" | "contextual";
  maxExposures?: number;
  disclosure?: "sponsored_by" | "created_by" | "hosted_by";
};

export type CreateExperienceInput = {
  assetId: string;
  prompt: string;
  title?: string;
  userId?: string;
  sponsor?: SponsorInput;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function promptShape(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 8) return "micro";
  if (words <= 24) return "compact";
  if (words <= 60) return "rich";
  return "long-form";
}

function promptSignals(prompt: string): string[] {
  const normalized = prompt.toLowerCase();
  const signals: string[] = [];
  const tests: Array<[string, RegExp]> = [
    ["comedy-request", /\bfunny|comedy|hilarious|absurd|ridiculous\b/],
    ["romance-request", /\bromantic|romance|love|intimate|tender\b/],
    ["horror-request", /\bhorror|scary|terrifying|creepy|haunted|unsettling\b/],
    ["mystery-request", /\bmystery|unknown|nobody knew|secret|clue\b/],
    ["cinematic-request", /\bcinematic|movie|scene|film\b/],
    ["memory-request", /\bmemory|remember|years later|again|returned|recurrence\b/],
    ["place-centered", /\b(beach|pier|home|hotel|house|city|street|venue|park|restaurant|bar|club)\b/],
    ["service-centered", /\b(cleaned|groomed|washed|repaired|installed|served|delivered|worked|service)\b/],
    ["object-centered", /\b(keychain|chair|suitcase|photo|photograph|ticket|ring|clock|object|painting)\b/],
    ["relationship-centered", /\bcouple|father|mother|dad|mom|friend|family|owner|wife|husband|partner\b/],
    ["escalation-request", /\bescalat|bigger|wilder|chaos|increasing|eventually|then\b/],
    ["understatement-request", /\bquiet|subtle|understated|restrained|intimate\b/],
  ];
  for (const [name, pattern] of tests) if (pattern.test(normalized)) signals.push(name);
  return signals;
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

  const memoryRepository = createMemoryRepository();
  const compiled = await compileExperience({
    prompt: input.prompt.trim(),
    assetId: input.assetId,
    userId: input.userId,
    memoryRepository,
  });

  const authorDiagnostics = compiled.authorDiagnostics as
    | { qualityStatus?: string; renderable?: boolean; complete?: boolean }
    | undefined;
  if (
    !authorDiagnostics ||
    authorDiagnostics.qualityStatus !== "ACCEPTED" ||
    authorDiagnostics.renderable !== true ||
    authorDiagnostics.complete !== true
  ) {
    throw new Error("Canonical Author rejected the requested experience.");
  }

  const entityMemory = await resolveExperienceEntity(input.assetId, input.prompt.trim());
  const sponsor = buildSponsorPolicy(input.sponsor ?? {});
  const learning = await getCreativeLearningContext({ assetId: input.assetId, userId: input.userId });
  const authoringMetadata = (compiled.blueprint?.metadata as Record<string, unknown> | undefined)?.authoring as Record<string, unknown> | undefined;
  const lens = typeof authoringMetadata?.lens === "string" ? authoringMetadata.lens : "neutral";

  const cinematicScenes = Array.isArray(compiled.cinematicScenes) ? compiled.cinematicScenes : [];
  const cinematicSequence = {
    version: 1,
    appendOnly: true,
    sceneRule: "one_short_thought_per_scene",
    clip: {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      sourcePrompt: input.prompt.trim(),
      sceneCount: cinematicScenes.length,
      estimatedDurationMs: cinematicScenes.reduce((sum: number, scene: any) => sum + Number(scene?.duration || 0), 0),
      scenes: cinematicScenes,
    },
  } as Prisma.InputJsonValue;

  const learningProfile = {
    lens,
    promptShape: promptShape(input.prompt),
    promptSignals: promptSignals(input.prompt),
    generativeAuthor: true,
    memoryAware: true,
    autonomousLearningEnabled: true,
  } as Prisma.InputJsonValue;

  const blueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    sourcePrompt: input.prompt.trim(),
    sponsor,
    cinematicSequence,
    authoring: {
      kind: "service_experience",
      authoredBy: "qre-author-canonical",
      realizationPath: "authorBrainCanonical",
      memoryAware: true,
      behaviorAware: true,
      sponsorAware: Boolean(sponsor),
      generativeAuthor: true,
      learningAware: true,
      learnedCreativePreferences: learningContextLines(learning),
      autonomousLearning: {
        enabled: true,
        confidence: learning.autonomousConfidence,
      },
    },
    learningProfile,
    memory: { scope: "asset", entity: entityMemory ?? null, learned: true },
  } as Prisma.InputJsonValue;

  const experience = await db.experience.create({
    data: {
      assetId: input.assetId,
      title: input.title ?? compiled.title,
      blueprint,
    },
  });

  const flow = await db.flow.create({
    data: {
      name: experience.title ?? "Experience",
      version: 1,
      actions: {
        category: String((compiled.blueprint as Record<string, unknown>).type ?? "experience"),
        sourcePrompt: input.prompt.trim(),
        sponsor,
        cinematicSequence,
        learningAware: true,
        learningProfile,
      } as Prisma.InputJsonValue,
      steps: {
        create: compiled.flowSteps.map((step) => ({
          order: Number(step.order ?? 0),
          type: String(step.type ?? "message"),
          payload: (step.payload ?? {}) as Prisma.InputJsonValue,
        })),
      },
    },
    include: { steps: true },
  });

  await db.experience.update({
    where: { id: experience.id },
    data: { flow: { connect: { id: flow.id } } },
  });

  return {
    experience,
    flow,
    compiled,
    entityMemory,
    sponsor,
    cinematicSequence,
    learning,
  };
}