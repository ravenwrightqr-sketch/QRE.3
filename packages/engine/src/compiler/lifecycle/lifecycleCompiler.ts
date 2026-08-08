/**
 * QRE LIFECYCLE INTELLIGENCE
 *
 * Records only temporal evidence present in the prompt or cognition.
 * No invented future, ownership, legacy, or relationship states.
 */

import type { ExperienceLifecycle, LifecycleStage, LifecycleEvent } from "@qre/contracts";

type LifecycleInput = {
  prompt: string;
  memory?: {
    timeCapsule?: boolean;
    replay?: boolean;
    memories?: string[];
  };
  entities?: {
    objects?: string[];
    creatures?: string[];
    people?: string[];
    places?: string[];
  };
  relationships?: unknown[];
  world?: { domains?: string[] };
};

function resolveStage(input: LifecycleInput): LifecycleStage {
  if (input.memory?.timeCapsule || input.memory?.replay) return "legacy";
  if (input.relationships?.length) return "relationship";
  if (input.entities?.objects?.length || input.entities?.creatures?.length) return "acquisition";
  return "creation";
}

function buildEvents(input: LifecycleInput): LifecycleEvent[] {
  const events: LifecycleEvent[] = [];
  const memories = input.memory?.memories ?? [];

  if (memories.length) {
    events.push({
      stage: "relationship",
      description: memories.join("; "),
      significance: 0.9,
    });
  }

  return events;
}

export function compileLifecycle(input: LifecycleInput): ExperienceLifecycle {
  if (!input) throw new Error("Lifecycle input required.");

  return {
    currentStage: resolveStage(input),
    events: buildEvents(input),
    milestones: [],
    futurePossibilities: [],
  };
}

export const lifecycleCompiler = compileLifecycle;
