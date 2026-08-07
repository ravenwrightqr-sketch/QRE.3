/**
 * =====================================================
 * QRE EXPERIENCE UNDERSTANDING CONTRACT
 * =====================================================
 *
 * Human intention interpretation layer.
 *
 * Prompt
 *   ↓
 * Understanding
 *   ↓
 * Meaning
 *   ↓
 * Genome
 *
 * The Understanding layer preserves both:
 *
 * 1. canonical semantic primitives
 * 2. the human's actual expression of intent
 *
 * Canonical intent is NOT the complete representation
 * of what the human means.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO INDUSTRY LOGIC
 *
 * =====================================================
 */

import type {
  ExperienceIntent,
  ExperienceEntities,
  ExperienceRelationship,
  WorldDomain,
} from "@qre/contracts";

/**
 * =====================================================
 * EMOTION UNDERSTANDING
 * =====================================================
 */

export type EmotionUnderstanding = {
  emotions: string[];
  atmosphere: string[];
  intensity: number;
  primary?: string;
};

/**
 * =====================================================
 * MEMORY UNDERSTANDING
 * =====================================================
 */

export type MemoryUnderstanding = {
  past: boolean;
  present: boolean;
  future: boolean;

  legacy: boolean;
  replay: boolean;
  timeCapsule: boolean;

  mode?:
    | "archive"
    | "replay"
    | "timeline"
    | "legacy"
    | "time_capsule"
    | "none";
};

/**
 * =====================================================
 * AUDIENCE UNDERSTANDING
 * =====================================================
 */

export type AudienceUnderstanding = {
  types: string[];
  social:
    | "solo"
    | "shared"
    | "community";

  roles: string[];
  relationship: string[];
  behaviors: string[];
  expectations: string[];

  primary?: string;
};

/**
 * =====================================================
 * DNA UNDERSTANDING
 * =====================================================
 */

export type DNAUnderstanding = {
  traits: string[];

  style?: {
    atmosphere: string[];
    visual: string[];
    interaction: string[];
  };
};

/**
 * =====================================================
 * WORLD UNDERSTANDING
 * =====================================================
 */

export type WorldUnderstanding = {
  domains: WorldDomain[];
  primary: WorldDomain;
  confidence: number;
};

/**
 * =====================================================
 * UNDERSTANDING SCORE
 * =====================================================
 */

export type UnderstandingScore = {
  semantic: number;
  entity: number;
  relationship: number;
  emotional: number;
  memory: number;
  world: number;
  dna: number;
  overall: number;
};

/**
 * =====================================================
 * HUMAN DESIRE UNDERSTANDING
 * =====================================================
 */

export type HumanDesireUnderstanding = {
  desires: string[];
  motivations: string[];
  goals: string[];
  fears: string[];
  aspirations: string[];
};

/**
 * =====================================================
 * SENSORY UNDERSTANDING
 * =====================================================
 */

export type SensoryUnderstanding = {
  visual: string[];
  audio: string[];
  physical: string[];
  environmental: string[];
};

/**
 * =====================================================
 * CREATION POSSIBILITY FIELD
 * =====================================================
 */

export type CreationPotentialUnderstanding = {
  possibilities: string[];
  constraints: string[];
  opportunities: string[];
};

/**
 * =====================================================
 * HUMAN INTENT EXPRESSION
 * =====================================================
 *
 * This is deliberately separate from ExperienceIntent.
 *
 * ExperienceIntent represents canonical semantic
 * primitives understood by the compiler.
 *
 * expression preserves what the human actually asked
 * for, including novel requests that do not map cleanly
 * to a canonical primitive.
 *
 * The compiler must never fabricate a canonical intent
 * merely because the expression is unfamiliar.
 * =====================================================
 */

export type HumanIntentUnderstanding = {
  expression: string;

  motivations: string[];

  desiredOutcome: string[];

  evidence: string[];

  unresolved: string[];
};

/**
 * =====================================================
 * EXPERIENCE UNDERSTANDING
 * =====================================================
 */

export interface ExperienceUnderstanding {
  prompt: string;

  /**
   * Canonical semantic primitives discovered from
   * the human expression.
   *
   * May be empty when no canonical primitive can be
   * established with sufficient evidence.
   */
  intent: ExperienceIntent[];

  /**
   * The actual human intention expressed by the prompt.
   *
   * This is the open semantic layer.
   */
  humanIntent: HumanIntentUnderstanding;

  entities: ExperienceEntities;

  relationships: ExperienceRelationship[];

  emotions: EmotionUnderstanding;

  memory: MemoryUnderstanding;

  audience: AudienceUnderstanding;

  world: WorldUnderstanding;

  dna: DNAUnderstanding;

  desire: HumanDesireUnderstanding;

  sensory: SensoryUnderstanding;

  potential: CreationPotentialUnderstanding;

  scores: UnderstandingScore;

  confidence: number;
}