import type { ExperienceMeaningContext } from "../cognition/MeaningContext.js";
import type { ExperienceGenome } from "./genome.js";
import type { ExperienceWorld } from "./world.js";
import type { ExperienceMeaning } from "./meaning.js";
import type { CognitiveEvolutionState } from "../cognition/cognitionLoop.js";
import type { ExperienceBlueprint } from "./blueprint.js";
import type { ExperienceMoment } from "./moment.js";
import type { ExperienceNarrative } from "../cognition/ExperienceNarrative.js";
import type { ExperienceModel } from "./model.js";
import type { FlowStep } from "../flow.js";
import type { CinematicScene } from "../cinematic.js";
import type { SemanticIR } from "./semanticIR.js";
import type { ExperienceCognitiveTrace } from "./cognitiveTrace.js";
import type { GeoStory } from "../geoStory.js";
import type { MemorySnapshot } from "../memorySnapshot.js";
import type { ServiceReceipt } from "../serviceReceipt.js";
import type { ExperienceUnderstanding } from "./experienceUnderstanding.js";
import type { ExperienceIntent } from "./experienceIntent.js";

export type ExperiencePresence = {
  source: "qr" | "nfc" | "link" | "event" | "manual";
  object?: { id?: string; category?: string; label?: string };
  location?: { latitude: number; longitude: number; label?: string };
  actor?: { id?: string; role?: string; name?: string };
  capturedAt: string;
};

export type ExperienceLoop = {
  entry: string;
  action: string;
  reward?: string;
  continuation?: string;
  shareTrigger?: string;
  nextExperience?: string;
};

/**
 * Canonical cognitive payload carried by the compiler.
 *
 * Cognition produces evidence and meaning. The compiler projects those
 * results into world, blueprint, flow, and cinematic artifacts.
 */
export type ExperienceCompilerIntelligence = {
  understanding: ExperienceUnderstanding;
  meaningContext: ExperienceMeaningContext;
  meaning: ExperienceMeaning;
  genome: ExperienceGenome;
  semanticIR: SemanticIR;
  cognitiveTrace?: ExperienceCognitiveTrace;
  cognitionLoop?: CognitiveEvolutionState;
  memoryReveal?: unknown;
  experienceArc?: unknown;
  worldObservations?: unknown;
};

export type ExperienceCompileContext = {
  assetId?: string;
  trigger?: string;
  event?: string;
  timestamp?: string;
  presence?: ExperiencePresence;
  world?: ExperienceWorld;
  metadata?: {
    understanding?: ExperienceUnderstanding;
    meaningContext?: ExperienceMeaningContext;
    genome?: ExperienceGenome;
    semanticIR?: SemanticIR;
    worldObservations?: unknown;
    memoryReveal?: unknown;
    experienceArc?: unknown;
  };
};

export type CompiledExperience = {
  id: string;
  intelligence: ExperienceCompilerIntelligence;
  genome: ExperienceGenome;
  world: ExperienceWorld;
  narrative: ExperienceNarrative;
  blueprint: ExperienceBlueprint;
  direction?: Record<string, unknown>;
  intent?: ExperienceIntent;
  presence?: ExperiencePresence;
  loop?: ExperienceLoop;
  flowSteps: FlowStep[];
  experienceMoments: ExperienceMoment[];
  cinematicScenes: CinematicScene[];
  model: ExperienceModel;
  geoStory?: GeoStory;
  memorySnapshot?: MemorySnapshot;
  receipt?: ServiceReceipt;
  context?: ExperienceCompileContext;
  title: string;
  estimatedDuration: number;
  cognitionLoop?: CognitiveEvolutionState;
  momentCount: number;
  metadata?: {
    compilerVersion: string;
    semanticHash?: string;
    generatedAt?: string;
    source?: string;
    tags?: string[];
  };
};
