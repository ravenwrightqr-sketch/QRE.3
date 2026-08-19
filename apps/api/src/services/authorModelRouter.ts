import type {
  AuthorModelRequestPolicy,
  AuthorModelTier,
  AuthorSearchBudget,
} from "@qre/contracts";

export type AuthorComplexityInput = {
  eventCount: number;
  relationCount: number;
  tensionCount: number;
  modalityCount?: number;
  contradictionCount?: number;
  requestedLensCount?: number;
};

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function estimateAuthorComplexity(
  input: AuthorComplexityInput,
): number {
  return metric(
    input.eventCount * 0.015 +
      input.relationCount * 0.012 +
      input.tensionCount * 0.04 +
      (input.modalityCount ?? 0) * 0.025 +
      (input.contradictionCount ?? 0) * 0.05 +
      (input.requestedLensCount ?? 1) * 0.03,
  );
}

export function chooseAuthorModelPolicy(
  complexity: number,
): AuthorModelRequestPolicy {
  if (complexity < 0.25) {
    return {
      tier: "local_fast",
      maxCalls: 1,
      maxTokens: 256,
      temperature: 0.55,
      parallelizable: true,
      reason: "low-complexity authoring case",
    };
  }

  if (complexity < 0.58) {
    return {
      tier: "local_reasoning",
      maxCalls: 2,
      maxTokens: 512,
      temperature: 0.62,
      parallelizable: true,
      reason: "moderate semantic density or contradiction",
    };
  }

  if (complexity < 0.8) {
    return {
      tier: "local_reasoning",
      maxCalls: 3,
      maxTokens: 768,
      temperature: 0.68,
      parallelizable: true,
      reason: "high relationship density requires deeper search",
    };
  }

  return {
    tier: "cloud",
    maxCalls: 3,
    maxTokens: 1024,
    temperature: 0.7,
    parallelizable: true,
    reason: "exceptionally dense authoring problem",
  };
}

export function buildAuthorSearchBudget(
  complexity: number,
  hardMaxBeats = 6,
): AuthorSearchBudget {
  const movieCount = complexity >= 0.72 ? 5 : complexity >= 0.45 ? 3 : 2;
  const candidatesPerBeat = complexity >= 0.72 ? 6 : complexity >= 0.45 ? 5 : 3;
  const beamWidth = complexity >= 0.72 ? 12 : complexity >= 0.45 ? 8 : 5;
  const maxRepairRounds = complexity >= 0.7 ? 2 : 1;
  const maxModelCalls = complexity >= 0.7 ? 4 : complexity >= 0.45 ? 3 : 2;

  return {
    complexity: metric(complexity),
    movieCount: Math.min(5, movieCount),
    candidatesPerBeat,
    beamWidth,
    maxRepairRounds,
    maxModelCalls,
  };
}

export function modelTierLabel(
  tier: AuthorModelTier,
): string {
  switch (tier) {
    case "local_fast": return "LOCAL_FAST";
    case "local_reasoning": return "LOCAL_REASONING";
    case "vision": return "VISION";
    case "cloud": return "CLOUD_REASONING";
    default: return "DETERMINISTIC";
  }
}
