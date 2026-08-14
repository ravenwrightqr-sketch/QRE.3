/** Production creation boundary: prompt → cognition → experience → flow. */

import { db } from "@qre/db";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { compileExperience } from "./experienceService.js";
import { buildSponsorPolicy } from "@qre/engine";
import { generateAiExperienceDraft } from "./aiProvider.js";
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

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

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

function compiledFacts(compiled: any): string[] {
  const world = compiled?.world;
  return [
    ...(world?.participants ?? []),
    ...(world?.places ?? []),
    ...(world?.times ?? []),
    ...(world?.entities ?? []),
    ...(compiled?.moments ?? []).map((moment: any) => typeof moment?.text === "string" ? moment.text : ""),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 120);
}

function applyGenerativeDraft(compiled: any, draft: string) {
  const cleanDraft = draft.replace(/\s+/g, " ").trim();
  if (!cleanDraft || !Array.isArray(compiled?.moments) || !compiled.moments.length) return;
  const first = compiled.moments[0];
  compiled.moments[0] = { ...first, text: cleanDraft, description: cleanDraft };
  if (compiled.blueprint && Array.isArray(compiled.blueprint.moments) && compiled.blueprint.moments.length) {
    compiled.blueprint.moments[0] = { ...compiled.blueprint.moments[0], text: cleanDraft, description: cleanDraft };
  }
  if (Array.isArray(compiled.flowSteps) && compiled.flowSteps.length) {
    const step = compiled.flowSteps[0];
    compiled.flowSteps[0] = { ...step, payload: { ...(step.payload ?? {}), text: cleanDraft, description: cleanDraft, source: "generative-author" } };
  }
}

export async function createExperience(input: CreateExperienceInput) {
  if (!input.assetId || !input.prompt.trim()) throw new Error("Asset and prompt required.");

  const memoryRepository = createMemoryRepository();
  const compiled = await compileExperience({ prompt: input.prompt.trim(), assetId: input.assetId, userId: input.userId, memoryRepository });
  const entityMemory = await resolveExperienceEntity(input.assetId, input.prompt.trim());
  const sponsor = buildSponsorPolicy(input.sponsor ?? {});
  const compiledWorld = compiled?.world as { lens?: string } | undefined;
  const learning = await getCreativeLearningContext({ assetId: input.assetId, userId: input.userId });

  let aiDraft: string | null = null;
  try {
    aiDraft = await generateAiExperienceDraft({
      prompt: input.prompt.trim(),
      lens: compiledWorld?.lens,
      sourceMoments: (compiled.moments ?? []).map((moment: any) => typeof moment?.text === "string" ? moment.text : "").filter(Boolean),
      facts: compiledFacts(compiled),
      memoryContext: compiled.discoveries ?? [],
      creativeLearningContext: learningContextLines(learning),
      audience: "customer-facing QRE experience",
    });
    if (aiDraft) applyGenerativeDraft(compiled, aiDraft);
  } catch (error) {
    console.warn("AI author unavailable; preserving deterministic compilation:", error instanceof Error ? error.message : error);
  }

  const blueprint = {
    ...(compiled.blueprint as Record<string, unknown>),
    sourcePrompt: input.prompt.trim(),
    sponsor,
    authoring: {
      kind: "service_experience",
      authoredBy: input.userId ?? null,
      memoryAware: true,
      behaviorAware: true,
      sponsorAware: Boolean(sponsor),
      generativeAuthor: Boolean(aiDraft),
      learningAware: true,
      learnedCreativePreferences: learningContextLines(learning),
    },
    memory: { scope: "asset", entity: entityMemory ?? null, learned: true },
    generativeDraft: aiDraft,
  };

  const experience = await db.experience.create({ data: { assetId: input.assetId, title: input.title ?? compiled.title, blueprint } });
  const flow = await db.flow.create({
    data: {
      name: experience.title ?? "Experience",
      version: 1,
      actions: { category: compiled.blueprint.type ?? "experience", sourcePrompt: input.prompt.trim(), sponsor, generativeAuthor: Boolean(aiDraft), learningAware: true },
      steps: { create: compiled.flowSteps.map((step) => ({ order: step.order, type: step.type, payload: step.payload })) },
    },
    include: { steps: true },
  });
  await db.experience.update({ where: { id: experience.id }, data: { flow: { connect: { id: flow.id } } } });
  return { experience, flow, compiled, entityMemory, sponsor, aiDraft, learning };
}
