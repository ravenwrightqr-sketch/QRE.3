/**
 * =====================================================
 * QRE EXPERIENCE GENOME BUILDER
 * =====================================================
 *
 * Human Prompt
 *        ↓
 * Semantic Understanding
 *        ↓
 * Experience Genome
 *
 * Genome = Creative DNA
 *
 * The Genome understands:
 *
 * - intent
 * - emotion
 * - meaning
 * - world
 * - journey
 * - experience physics
 *
 * It does NOT know:
 *
 * - industries
 * - templates
 * - products
 * - database
 *
 * =====================================================
 */


import {
  analyzeSemanticPrompt,
} from "../semanticAnalyzer.js";


import {
  extractEntities,
} from "../entityExtractor.js";


import type {
  ExperienceGenome,
  ExperienceMeaning,
  ExperienceRelationship,
  ExperienceJourney,
  SemanticInterpretation,
} from "@qre/contracts";


function buildMeaning(
  semantic: any,
): ExperienceMeaning {
  return {
    why: semantic.intent,
    emotions: semantic.emotions,
    memories: semantic.themes.includes("memory") ? ["personal memory"] : [],
    desiredFeeling: semantic.emotions,
    transformation: semantic.experienceDNA?.includes("transformation")
      ? "create change"
      : undefined,
  };
}


function buildDNA(
  semantic: any,
): string[] {
  const dna = new Set<string>();
  dna.add("adaptive");

  for (const value of semantic.experienceDNA ?? []) {
    dna.add(value);
  }

  if (semantic.emotions.includes("nostalgia")) dna.add("memory_driven");
  if (semantic.themes.includes("discovery")) dna.add("exploration");
  if (semantic.themes.includes("connection")) dna.add("human_connection");
  if (semantic.themes.includes("culture")) dna.add("immersive_culture");

  return [...dna];
}


function buildRelationships(): ExperienceRelationship[] {
  return [];
}


function resolveEnergy(
  semantic: any,
) {
  if (semantic.experienceDNA?.includes("cinematic")) return "mysterious";
  if (semantic.emotions.includes("joy")) return "playful";
  if (semantic.emotions.includes("love")) return "emotional";
  return "emotional";
}


function resolvePacing(
  semantic: any,
) {
  if (semantic.experienceDNA?.includes("cinematic")) return "slow";
  if (semantic.themes.includes("discovery")) return "fast";
  return "medium";
}


function buildJourney(
  semantic: any,
): ExperienceJourney[] {
  const journey: ExperienceJourney[] = ["arrival", "discovery", "reveal", "return"];

  if (semantic.experienceDNA?.includes("transformation")) {
    journey.splice(3, 0, "transformation");
  }

  return journey;
}


function buildInterpretation(
  semantic: any,
): SemanticInterpretation {
  const confidenceValues = Array.isArray(semantic.signals)
    ? semantic.signals
      .map((signal: { confidence?: unknown }) => Number(signal?.confidence))
      .filter((value: number) => Number.isFinite(value))
    : [];

  const confidence = confidenceValues.length
    ? Math.max(0, Math.min(1, Math.max(...confidenceValues)))
    : 0.2;

  return {
    intent: [semantic.intent],
    concepts: [
      ...(semantic.themes ?? []),
      ...(semantic.entities ?? []),
      ...(semantic.actions ?? []),
    ],
    emotionalSignals: [...(semantic.emotions ?? [])],
    worldSignals: [
      ...(semantic.entities ?? []),
      ...(semantic.environments ?? []),
      ...(semantic.audience ?? []),
    ],
    cognitiveSignals: [
      ...(semantic.actions ?? []),
      ...(semantic.experienceDNA ?? []),
      ...(semantic.signals ?? []).map((signal: { concept?: unknown }) => String(signal?.concept ?? "")),
    ].filter(Boolean),
    confidence,
  };
}


export function buildExperienceGenome(
  prompt: string,
): ExperienceGenome {
  if (!prompt.trim()) {
    throw new Error("Experience prompt cannot be empty");
  }

  const semantic = analyzeSemanticPrompt(prompt);
  const entities = extractEntities(prompt);
  const meaning = buildMeaning(semantic);
  const relationships = buildRelationships();
  const interpretation = buildInterpretation(semantic);

  return {
    intent: [semantic.intent],
    interpretation,
    dna: buildDNA(semantic),
    archetypes: semantic.themes,
    themes: semantic.themes,
    emotions: semantic.emotions,
    meaning,
    relationships,
    entities,
    energy: resolveEnergy(semantic),
    pacing: resolvePacing(semantic),
    social: semantic.audience.includes("community") ? "community" : "solo",
    journey: buildJourney(semantic),
    discovery: semantic.themes.includes("discovery") ? 0.9 : 0.45,
    memory: semantic.themes.includes("memory") ? 0.9 : 0.35,
    commerce: semantic.themes.includes("commerce") ? 0.9 : 0.2,
    immersion: semantic.experienceDNA?.includes("immersive") ? 0.9 : 0.45,
    interaction: semantic.experienceDNA?.includes("interactive") ? 0.9 : 0.3,
    replay: semantic.themes.includes("memory") || semantic.experienceDNA?.includes("adaptive") ? 0.8 : 0.35,
    environments: semantic.environments,
    audience: semantic.audience,
  };
}
