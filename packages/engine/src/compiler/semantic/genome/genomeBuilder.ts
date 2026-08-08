/**
 * QRE EXPERIENCE GENOME BUILDER
 *
 * Evidence-derived creative substrate.
 *
 * The genome records what cognition actually found.
 * It does not manufacture themes, worlds, emotions, journeys,
 * symbols, future states, or narrative conclusions.
 */

import type {
  ExperienceGenome,
  ExperienceMeaningContext,
  ExperienceRelationship,
  SemanticInterpretation,
} from "@qre/contracts";
import { compileObjectGenome } from "../../object/index.js";
import { compileLifecycle } from "../../lifecycle/lifecycleCompiler.js";

function unique(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

function interpretationFrom(understanding: any): SemanticInterpretation {
  const entities = understanding.entities ?? {};
  return {
    intent: unique(understanding.intent),
    concepts: unique([
      ...(entities.concepts ?? []),
      ...(entities.events ?? []),
    ]),
    emotionalSignals: unique(understanding.emotions?.emotions),
    worldSignals: unique(understanding.world?.domains),
    cognitiveSignals: [],
    confidence: typeof understanding.confidence === "number" ? understanding.confidence : 0,
  };
}

function relationshipsFrom(understanding: any): ExperienceRelationship[] {
  return (understanding.relationships ?? [])
    .filter((value: any) => value?.subject && value?.object && value?.predicate)
    .map((value: any) => ({
      subject: value.subject,
      predicate: value.predicate,
      object: value.object,
      confidence: typeof value.confidence === "number" ? value.confidence : 0.5,
    }));
}

function meaningFrom(understanding: any, context: ExperienceMeaningContext) {
  const humanIntent = understanding.humanIntent ?? {};
  const desire = understanding.desire ?? {};
  const memory = understanding.memory ?? {};

  return {
    why: unique([
      ...(humanIntent.motivations ?? []),
      ...(context.meanings ?? []),
    ]),
    emotions: unique(understanding.emotions?.emotions),
    memories: unique([
      ...(memory.memories ?? []),
      ...(memory.past ? [memory.past] : []),
      ...(memory.legacy ? [memory.legacy] : []),
    ]),
    desiredFeeling: unique([
      ...(humanIntent.desiredOutcome ?? []),
      ...(desire.desires ?? []),
    ]),
    transformation: unique([
      ...(desire.goals ?? []),
    ]),
  };
}

function journeyFrom(understanding: any): string[] {
  const journey: string[] = [];
  const memory = understanding.memory ?? {};
  if (memory.past || memory.replay) journey.push("memory");
  return journey;
}

export function buildExperienceGenome(
  prompt: string,
  understanding: any,
  meaningContext: ExperienceMeaningContext,
): ExperienceGenome {
  if (!prompt.trim()) throw new Error("Experience prompt cannot be empty");

  const entities = understanding.entities ?? {
    people: [], places: [], organizations: [], dates: [], times: [], events: [],
    products: [], urls: [], phones: [], emails: [], media: [], keywords: [],
    objects: [], creatures: [], concepts: [], symbols: [], worlds: [], archetypes: [],
  };

  const emotions = unique(understanding.emotions?.emotions);
  const sensory = understanding.sensory ?? {};
  const dna = unique([
    ...(understanding.dna?.traits ?? []),
    ...(sensory.visual ?? []).map((value: string) => `visual_${value}`),
    ...(sensory.audio ?? []).map((value: string) => `audio_${value}`),
    ...(sensory.physical ?? []).map((value: string) => `physical_${value}`),
    ...(sensory.environmental ?? []).map((value: string) => `environment_${value}`),
  ]);
  const relationships = relationshipsFrom(understanding);
  const meaning = meaningFrom(understanding, meaningContext);

  const objectGenome = compileObjectGenome({
    prompt,
    entities,
    meaning: {
      desiredFeeling: meaning.desiredFeeling,
      symbols: unique(entities.symbols),
      themes: unique(meaningContext.themes),
    },
    emotions: {
      emotions,
      intensity: understanding.emotions?.intensity ?? 0,
    },
    dna: { traits: dna },
    memory: understanding.memory,
    relationships,
  });

  const lifecycle = compileLifecycle({
    prompt,
    memory: understanding.memory,
    entities,
    relationships,
    world: understanding.world,
  });

  const worldDomains = unique(understanding.world?.domains);
  const audience = unique([
    ...(understanding.audience?.types ?? []),
    ...(understanding.audience?.roles ?? []),
  ]);
  const interpretation = interpretationFrom(understanding);

  return {
    intent: unique(understanding.intent),
    interpretation,
    archetypes: [],
    themes: unique([
      ...worldDomains,
      ...(meaningContext.themes ?? []),
    ]),
    emotions,
    meaning,
    relationships,
    worlds: worldDomains,
    energy: emotions.includes("joy") || emotions.includes("excitement") ? "playful" : "emotional",
    pacing: "medium",
    social: understanding.audience?.social ?? "solo",
    journey: journeyFrom(understanding) as any,
    discovery: worldDomains.includes("discovery_world") ? 1 : 0,
    memory: understanding.memory?.past || understanding.memory?.legacy || understanding.memory?.replay ? 1 : 0,
    commerce: worldDomains.includes("commerce_world") ? 1 : 0,
    immersion: 0,
    interaction: understanding.audience?.behaviors?.includes("interaction") ? 1 : 0,
    replay: understanding.memory?.replay ? 1 : 0,
    entities,
    object: objectGenome,
    lifecycle,
    environments: unique([
      ...(understanding.sensory?.environmental ?? []),
      ...(entities.places ?? []),
    ]),
    audience,
    dna,
    tone: unique(emotions),
    sensory: unique([
      ...(sensory.visual ?? []).map((value: string) => `visual_${value}`),
      ...(sensory.audio ?? []).map((value: string) => `audio_${value}`),
      ...(sensory.physical ?? []).map((value: string) => `physical_${value}`),
      ...(sensory.environmental ?? []).map((value: string) => `environment_${value}`),
    ]),
    symbols: unique(entities.symbols),
    transformation: unique(meaning.transformation),
  };
}
