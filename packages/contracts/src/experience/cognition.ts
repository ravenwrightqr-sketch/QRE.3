/**
 * =============================================================
 * QRE COGNITIVE COMPILER CONTRACTS
 * =============================================================
 *
 * Cognition is the decision layer between human language and the
 * universal experience substrate.
 *
 * These contracts describe evidence, hypotheses, plans, and story
 * realization. They contain no database or runtime concerns.
 *
 * =============================================================
 */

import type { ExperienceEntities } from "./entityExtractor.js";
import type { ExperienceBlueprint } from "./blueprint.js";
import type { ExperienceGenome } from "./genome.js";
import type { ExperienceModel } from "./model.js";
import type { ExperienceWorld } from "./world.js";
import type { Moment } from "../moment.js";
import type { CinematicScene } from "../cinematic.js";
import type { FlowStep } from "../flow.js";

export type CognitiveDirection =
  | "utility"
  | "game"
  | "discovery"
  | "memory"
  | "social"
  | "commerce"
  | "journey"
  | "identity"
  | "story";

export type CognitiveEvidence = {
  signal: string;
  source: "prompt" | "entity" | "context" | "relationship" | "inference";
  weight: number;
};

export type CognitiveSubject = {
  value: string;
  confidence: number;
  evidence: CognitiveEvidence[];
};

export type CognitiveHypothesis = {
  kind: CognitiveDirection;
  score: number;
  rationale: string;
  evidence: CognitiveEvidence[];
};

export type CognitiveOpportunitySet = {
  memory: string[];
  geographic: string[];
  social: string[];
  discovery: string[];
  temporal: string[];
  commercial: string[];
};

export type CognitiveExperiencePlan = {
  direction: CognitiveDirection;
  centralSubject: string;
  purpose: string;
  whyInteract: string[];
  interactionModel: string[];
  storyStructure: string[];
  progressionModel: string[];
  dynamicBehavior: string[];
  futureEvolution: string[];
  audience: string[];
  emotionalIntent: string[];
  memoryModel: string[];
  creativePossibilities: string[];
  evidence: CognitiveEvidence[];
  confidence: number;
};

export type ExperienceObservation = {
  prompt: string;
  subject: string;
  activity: string;
  affordances: string[];
  audience: string[];
  explicitEmotions: string[];
  context: string[];
  entities: ExperienceEntities;
  evidence: CognitiveEvidence[];
};

export type StorySituation = {
  setting: string[];
  actors: string[];
  temporal: string[];
  social: string[];
};

export type StoryBeatKind =
  | "orientation"
  | "hook"
  | "encounter"
  | "escalation"
  | "discovery"
  | "transformation"
  | "payoff"
  | "reflection"
  | "continuation"
  | "need"
  | "threshold"
  | "origin"
  | "challenge"
  | "reveal"
  | "instruction"
  | "action"
  | "feedback"
  | "contribution"
  | "identity"
  | "milestone"
  | "unlock"
  | "earned_access"
  | "next_step";

export type StoryBeat = {
  id: string;
  kind: StoryBeatKind;
  order: number;
  purpose: string;
  text: string;
  entities: string[];
  emotionalTarget: string;
  provenance: CognitiveEvidence[];
};

export type StoryScenePlan = {
  id: string;
  order: number;
  beatId: string;
  purpose: string;
  text: string;
  emotionalTarget: string;
  entities: string[];
  duration: number;
  transition: "fade" | "zoom" | "cinematic" | "none";
  visual: {
    theme: "cinematic" | "dark" | "light" | "glass";
    animation: "none" | "slow_zoom" | "parallax" | "particles" | "glitch";
  };
  audio: {
    type: "ambient" | "music" | "voice";
    mood: string;
  };
  provenance: CognitiveEvidence[];
};

export type ExperienceStory = {
  title: string;
  hook: string;
  logline: string;
  beats: StoryBeat[];
  ending: string;
  continuation?: string;
  tone: string[];
  provenance: CognitiveEvidence[];
};

export type CognitiveUnderstanding = {
  prompt: string;
  intent: string[];
  themes: string[];
  entities: ExperienceEntities;
  relationships: string[];
  emotions: string[];
  memorySignals: string[];
  audience: string[];
  worldSignals: string[];
  affordances: string[];
  confidence: number;
};

export type CognitiveCompilation = {
  prompt: string;
  understanding: CognitiveUnderstanding;
  subject: CognitiveSubject;
  hypotheses: CognitiveHypothesis[];
  selectedHypothesis: CognitiveHypothesis;
  plan: CognitiveExperiencePlan;
  opportunities: CognitiveOpportunitySet;
  memoryOpportunities: string[];
  geographicOpportunities: string[];
  socialOpportunities: string[];
  discoveryOpportunities: string[];
  temporalOpportunities: string[];
  commercialOpportunities: string[];
  observation: ExperienceObservation;
  situation: StorySituation;
  story: ExperienceStory;
};

export type CompiledCognitiveExperience = {
  cognition: CognitiveCompilation;
  genome: ExperienceGenome;
  world: ExperienceWorld;
  blueprint: ExperienceBlueprint;
  flowSteps: FlowStep[];
  moments: Moment[];
  cinematicScenes: CinematicScene[];
  scenePlan: StoryScenePlan[];
  story: ExperienceStory;
  model: ExperienceModel;
  title: string;
  estimatedDuration: number;
  momentCount: number;
};
