/**
 * Compatibility semantic facade.
 *
 * Super Cog is the semantic authority. This adapter preserves the old
 * analyzeSemanticPrompt API for callers that have not migrated yet.
 */

import {
  compileCognitiveExperience,
} from "../../experience/cognitiveExperienceCompiler.js";

export type SemanticSignal = {
  concept: string;
  confidence: number;
};

export type SemanticAnalysis = {
  intent: string;
  themes: string[];
  emotions: string[];
  entities: string[];
  actions: string[];
  environments: string[];
  audience: string[];
  experienceDNA: string[];
  signals: SemanticSignal[];
};

export function analyzeSemanticPrompt(prompt: string): SemanticAnalysis {
  const result = compileCognitiveExperience(prompt);
  const understanding = result.cognition.understanding;
  const plan = result.cognition.plan;

  return {
    intent: understanding.intent[0] ?? "experience_creation",
    themes: understanding.themes,
    emotions: understanding.emotions,
    entities: [
      ...understanding.entities.people,
      ...understanding.entities.places,
      ...understanding.entities.organizations,
      ...understanding.entities.products,
      ...understanding.entities.events,
      ...understanding.entities.keywords,
    ],
    actions: understanding.affordances,
    environments: understanding.worldSignals,
    audience: understanding.audience,
    experienceDNA: result.genome.dna,
    signals: [
      ...result.cognition.hypotheses.map((hypothesis) => ({
        concept: hypothesis.kind,
        confidence: hypothesis.score,
      })),
      {
        concept: plan.centralSubject,
        confidence: result.cognition.subject.confidence,
      },
    ],
  };
}
