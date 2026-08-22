import type {
  AuthorEnterpriseIntelligence,
  AuthorGeoEvidence,
  AuthorMemoryDelta,
  AuthorStyleMemory,
  AuthorTimelineEvidence,
} from "@qre/contracts";
import type { RealityGraph } from "@qre/contracts";
import { buildAuthorRealityEnvelope, type RealityEnvelope } from "./authorRealityEnvelope.js";
import { selectSafeStrategies } from "./authorRealizationStrategyLattice.js";
import { buildCharacterProfile, classifyLens, scoreLensFit } from "./authorCharacterLensEngine.js";
import { estimateAuthorComplexity, buildAuthorSearchBudget, chooseAuthorModelPolicy } from "./authorModelRouter.js";
import { normalizeGeoEvidence, normalizeTimelineEvidence, normalizeMultimodalEvidence, type AuthorEvidenceInput } from "./authorMultimodalEvidence.js";
import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";

export type EnterpriseIntelligenceInput = {
  graph: RealityGraph;
  subject: string;
  lens?: string;
  beats: readonly MouthCandidateBeat[];
  multimodalEvidence?: readonly AuthorEvidenceInput[];
  timelineEvidence?: readonly AuthorTimelineEvidence[];
  geoEvidence?: readonly AuthorGeoEvidence[];
  memoryDelta?: AuthorMemoryDelta;
  styleMemory?: AuthorStyleMemory;
};

export type EnterpriseIntelligenceContext = AuthorEnterpriseIntelligence & {
  envelope: RealityEnvelope;
  lensFit: number;
  beatStrategies: Record<number, ReturnType<typeof selectSafeStrategies>>;
};

export function buildEnterpriseIntelligence(
  input: EnterpriseIntelligenceInput,
): EnterpriseIntelligenceContext {
  const envelope = buildAuthorRealityEnvelope({
    graph: input.graph,
    subject: input.subject,
  });

  const character = buildCharacterProfile(envelope);
  const lens = classifyLens(input.lens);
  const lensFit = scoreLensFit(lens, character, envelope);
  const multimodalEvidence = normalizeMultimodalEvidence(input.multimodalEvidence ?? []);
  const timeline = normalizeTimelineEvidence(input.timelineEvidence ?? []);
  const geo = normalizeGeoEvidence(input.geoEvidence ?? []);

  const beatStrategies: Record<number, ReturnType<typeof selectSafeStrategies>> = {};
  for (const beat of input.beats) {
    beatStrategies[beat.order] = selectSafeStrategies(beat, envelope, 5);
  }

  const relationCount = envelope.relations.length;
  const tensionCount = envelope.unresolvedTensions.length;
  const complexity = estimateAuthorComplexity({
    eventCount: envelope.events.length,
    relationCount,
    tensionCount,
    modalityCount: multimodalEvidence.length,
    contradictionCount: character.contradictions.length,
    requestedLensCount: input.lens ? input.lens.split(/[,|]/).filter(Boolean).length : 1,
  });
  const searchBudget = buildAuthorSearchBudget(complexity);
  const modelPolicy = chooseAuthorModelPolicy(complexity);

  return {
    envelope,
    character,
    lens,
    lensFit,
    strategies: Object.values(beatStrategies).flat(),
    beatStrategies,
    multimodalEvidence,
    timeline,
    geo,
    memoryDelta: input.memoryDelta,
    styleMemory: input.styleMemory,
    searchBudget,
    modelPolicy,
    audit: [],
  };
}
