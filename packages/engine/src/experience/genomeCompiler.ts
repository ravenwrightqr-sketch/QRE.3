/**
 * QRE EXPERIENCE GENOME COMPILER
 *
 * Prompt → Understanding → Genome → World → Blueprint → Flow → Moments → Scenes
 *
 * This module is a composition boundary. It does not contain prompt heuristics.
 */

import { composeWorld } from "../world/worldComposer.js";
import { understandExperience } from "../compiler/understanding/index.js";
import { composeBlueprint } from "./blueprintComposer.js";
import { blueprintToFlow } from "./blueprintToFlow.js";
import { flowToMoment } from "../moments/flowToMoments.js";
import { cinematicRuntime } from "../runtime/cinematic/cinematicRuntime.js";

import type {
  ExperienceBlueprint,
  ExperienceEnergy,
  ExperienceGenome,
  ExperienceMeaning,
  ExperienceModel,
  ExperiencePacing,
  ExperienceRelationship,
  ExperienceSocial,
  ExperienceJourney,
  FlowStep,
  Moment,
  CinematicScene,
  ExperienceEntities,
} from "@qre/contracts";

export type CompiledGenomeExperience = {
  genome: ExperienceGenome;
  world: ReturnType<typeof composeWorld>;
  blueprint: ExperienceBlueprint;
  flowSteps: FlowStep[];
  moments: Moment[];
  cinematicScenes: CinematicScene[];
  model: ExperienceModel;
  title: string;
  estimatedDuration: number;
  momentCount: number;
};

function resolveEnergy(
  emotions: string[],
  traits: string[],
  intensity: number,
): ExperienceEnergy {
  if (traits.some((value) => /myster|dark|gothic|unknown/i.test(value))) return "mysterious";
  if (traits.some((value) => /play|fun|game|wild/i.test(value))) return "playful";
  if (intensity >= 0.8) return "intense";
  if (emotions.some((value) => /love|nostalgia|care|tender|meaning/i.test(value))) return "emotional";
  if (traits.some((value) => /premium|luxury|elegant/i.test(value))) return "premium";
  return emotions.length ? "emotional" : "calm";
}

function resolvePacing(intensity: number, traits: string[]): ExperiencePacing {
  if (traits.some((value) => /slow|reflect|cinematic|memory/i.test(value))) return "slow";
  if (intensity >= 0.75) return "fast";
  return "medium";
}

function resolveSocial(value: string): ExperienceSocial {
  if (value === "community" || value === "shared") return value;
  return "solo";
}

function resolveJourney(
  intents: string[],
  memory: { past: boolean; future: boolean; legacy: boolean; replay: boolean; timeCapsule: boolean },
): ExperienceJourney[] {
  const journey: ExperienceJourney[] = ["arrival"];
  if (intents.includes("discover")) journey.push("discovery");
  if (memory.past || memory.replay || memory.timeCapsule) journey.push("memory");
  if (intents.includes("celebrate")) journey.push("peak");
  if (intents.includes("teach") || intents.includes("protect")) journey.push("transformation");
  if (intents.includes("connect") || intents.includes("reward")) journey.push("share");
  journey.push("reveal", "return");
  if (memory.future || memory.legacy) journey.splice(Math.max(1, journey.length - 1), 0, "memory");
  return [...new Set(journey)];
}

function buildMeaning(
  prompt: string,
  understanding: ReturnType<typeof understandExperience>,
): ExperienceMeaning {
  const memories: string[] = [];
  if (understanding.memory.past) memories.push("the past");
  if (understanding.memory.replay) memories.push("replay");
  if (understanding.memory.timeCapsule) memories.push("a future time capsule");
  if (understanding.memory.legacy) memories.push("legacy");

  const relationship = understanding.relationships[0];
  return {
    why: understanding.intent[0] ?? "discover",
    relationship: relationship
      ? {
          subject: relationship.subject,
          object: relationship.object,
          type: relationship.predicate,
        }
      : undefined,
    emotions: understanding.emotions.emotions,
    memories,
    desiredFeeling: understanding.emotions.emotions.length
      ? understanding.emotions.emotions
      : ["wonder"],
    transformation: understanding.intent.includes("teach") || understanding.intent.includes("protect")
      ? "leave the person changed by what they encountered"
      : undefined,
  };
}

function buildDNA(
  understanding: ReturnType<typeof understandExperience>,
): string[] {
  const dna = new Set<string>(["adaptive", "prompt_native", "memory_aware"]);
  for (const trait of understanding.dna.traits) dna.add(trait);
  for (const value of understanding.dna.style?.atmosphere ?? []) dna.add(value);
  for (const value of understanding.dna.style?.visual ?? []) dna.add(value);
  for (const value of understanding.dna.style?.interaction ?? []) dna.add(value);
  if (understanding.memory.past || understanding.memory.replay) dna.add("memory_driven");
  if (understanding.memory.future || understanding.memory.timeCapsule) dna.add("future_memory");
  if (understanding.relationships.length) dna.add("relational");
  return [...dna];
}

function buildGenome(
  prompt: string,
  understanding: ReturnType<typeof understandExperience>,
): ExperienceGenome {
  const intents = understanding.intent.map(String);
  const themes = [
    ...new Set([
      ...intents,
      ...understanding.dna.traits,
      ...understanding.world.domains.map(String),
    ]),
  ];
  const meaning = buildMeaning(prompt, understanding);
  const intensity = understanding.emotions.intensity;
  const dna = buildDNA(understanding);

  const genome: ExperienceGenome = {
    intent: intents,
    interpretation: {
      intent: intents,
      concepts: themes,
      emotionalSignals: understanding.emotions.emotions,
      worldSignals: understanding.world.domains.map(String),
      cognitiveSignals: [
        understanding.memory.mode ?? "none",
        ...understanding.dna.traits,
      ],
      confidence: understanding.confidence,
    },
    archetypes: [...new Set([...intents, ...understanding.world.domains.map(String)])],
    themes,
    emotions: understanding.emotions.emotions,
    meaning,
    relationships: understanding.relationships as ExperienceRelationship[],
    energy: resolveEnergy(understanding.emotions.emotions, dna, intensity),
    pacing: resolvePacing(intensity, dna),
    social: resolveSocial(understanding.audience.social),
    journey: resolveJourney(intents, understanding.memory),
    discovery: intents.includes("discover") ? 1 : 0.5,
    memory: understanding.memory.past || understanding.memory.replay || understanding.memory.timeCapsule ? 1 : 0.35,
    commerce: intents.includes("sell") ? 1 : 0,
    immersion: dna.some((value) => /cinematic|immersive|visual/i.test(value)) ? 1 : 0.6,
    interaction: understanding.dna.style?.interaction?.length ? 1 : 0.6,
    replay: understanding.memory.replay || understanding.memory.timeCapsule ? 1 : 0.35,
    entities: understanding.entities as ExperienceEntities,
    environments: understanding.world.domains.map(String),
    audience: understanding.audience.types,
    dna,
  };

  return genome;
}

function createExperienceModel(
  blueprint: ExperienceBlueprint,
  prompt: string,
): ExperienceModel {
  return {
    title: blueprint.title,
    description: prompt,
    industry: "generic",
    goal: "welcome",
    tone: blueprint.tone,
    moments: blueprint.moments,
    metadata: {
      category: blueprint.type,
      tags: ["compiled", "cognitive", "prompt-native", "memory-aware", "cinematic"],
    },
  };
}

export function compileExperienceGenome(prompt: string): CompiledGenomeExperience {
  if (!prompt.trim()) throw new Error("Experience prompt required.");

  const understanding = understandExperience(prompt);
  const genome = buildGenome(prompt, understanding);
  const world = composeWorld(genome);
  const blueprint = composeBlueprint(genome);
  const flowSteps = blueprintToFlow(blueprint);
  const moments = flowToMoment(flowSteps);
  const cinematicScenes = cinematicRuntime({ moments, geoStory: null });
  const model = createExperienceModel(blueprint, prompt);

  return {
    genome,
    world,
    blueprint,
    flowSteps,
    moments,
    cinematicScenes,
    model,
    title: blueprint.title,
    estimatedDuration: moments.length * 5,
    momentCount: moments.length,
  };
}

export const genomeCompiler = compileExperienceGenome;
