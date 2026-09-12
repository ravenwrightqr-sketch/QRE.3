import type {
  AuthorBrainTruth,
  AuthorContinuationState,
  AuthorLearningDelta,
  AuthorMemoryDelta,
  CanonicalAuthorResult,
  SequenceCandidate,
} from "@qre/contracts";
import { authorCognition } from "./authorCognition.js";
import { chooseAuthorProposition } from "./authorArtist.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildSequencePlay, realizeAuthorSequence } from "./authorMouth.js";
import { judgeAuthorSequence } from "./authorJudge.js";
import { buildAuthorReadout } from "./authorReadout.js";

const MAX_CANDIDATE_ATTEMPTS = 2;

function buildMemoryDelta(candidate: SequenceCandidate, proposition: CanonicalAuthorResult["proposition"], sequence: CanonicalAuthorResult["sequence"]): AuthorMemoryDelta {
  const changedEventIds = [...new Set(candidate.trajectory.filter((step) => step.operation !== "establish").flatMap((step) => step.eventIds))];
  const callbackEventIds = [...new Set(candidate.trajectory.filter((step) => step.operation === "recur" || step.operation === "reframe").flatMap((step) => step.eventIds))];
  const semanticTurns = sequence.cuts.flatMap((cut) => cut.viewerAfter.recentChange ? [cut.viewerAfter.recentChange] : []);
  return {
    establishedEventIds: [...new Set(candidate.trajectory[0]?.eventIds ?? [])],
    changedEventIds,
    callbackEventIds,
    relationIds: [...new Set(proposition.relationIds)],
    unresolvedQuestions: candidate.unresolvedQuestion ? [candidate.unresolvedQuestion] : [],
    semanticTurns,
    carryThreads: [...new Set([
      candidate.lens,
      proposition.pattern,
      proposition.text,
      proposition.orderingRule,
      candidate.payoff,
    ].filter(Boolean))],
  };
}

function buildLearningDelta(candidate: SequenceCandidate, proposition: CanonicalAuthorResult["proposition"], judgment: CanonicalAuthorResult["judgment"]): AuthorLearningDelta {
  const status = judgment.status === "ACCEPT" ? "accepted" : "rejected";
  return {
    status,
    candidateId: candidate.id,
    treatmentId: proposition.treatment.id,
    relationIds: [...new Set(proposition.relationIds)],
    propositionPattern: proposition.pattern,
    signals: [
      `${status}_candidate:${candidate.id}`,
      `${status}_treatment:${proposition.treatment.id}`,
      `movement:${judgment.movement.toFixed(3)}`,
      `information_per_cut:${judgment.informationPerCut.toFixed(3)}`,
      `continuation:${judgment.continuationPressure.toFixed(3)}`,
      `ordering_rule:${proposition.orderingRule}`,
    ],
    metrics: {
      movement: judgment.movement,
      specificity: judgment.specificity,
      transformation: judgment.transformation,
      informationPerCut: judgment.informationPerCut,
      continuationPressure: judgment.continuationPressure,
      necessity: judgment.necessity,
      inventionRisk: judgment.inventionRisk,
      genericity: judgment.genericity,
    },
  };
}

function buildContinuationState(candidate: SequenceCandidate, cognition: Awaited<ReturnType<typeof authorCognition>>, graph: CanonicalAuthorResult["reality"], sequence: CanonicalAuthorResult["sequence"], returning: boolean | undefined): AuthorContinuationState {
  const used = new Set(candidate.trajectory.flatMap((step) => step.eventIds));
  return {
    unresolvedQuestion: candidate.unresolvedQuestion || undefined,
    nextPromise: sequence.continuation || sequence.cuts.at(-1)?.nextPromise,
    payoff: candidate.payoff || undefined,
    futureEventIds: graph.events.map((event) => event.id).filter((id) => !used.has(id)).slice(0, 24),
    alternateCandidateIds: cognition.candidates.map((value) => value.id).filter((id) => id !== candidate.id).slice(0, 5),
    returnCue: returning ? "The visitor returned; prefer an evolution or callback over a reset." : "A future visit should build from the stored semantic delta.",
  };
}

export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const reality = input.realityGraph ?? buildAuthorRealityGraph(input);
  const cognition = await authorCognition({ truth: input, reality });
  const candidates: SequenceCandidate[] = cognition.candidates.slice(0, 6);
  if (!candidates.length) throw new Error("Author could not find a grounded semantic candidate");

  const rejectedCandidateIds = new Set<string>();
  const diagnostics: string[] = [];
  for (let attempt = 0; attempt < Math.min(MAX_CANDIDATE_ATTEMPTS, candidates.length); attempt += 1) {
    const available = candidates.filter((candidate) => !rejectedCandidateIds.has(candidate.id));
    if (!available.length) break;
    const seed = available[0];
    const proposition = await chooseAuthorProposition({
      truth: input, candidate: seed, alternatives: available, graph: reality, relations: cognition.relations,
      domainContext: input.domainContext, excludedCandidateIds: [...rejectedCandidateIds], judgeFeedback: diagnostics.slice(-8),
    });
    const selectedCandidate = candidates.find((candidate) => candidate.id === proposition.candidateId);
    if (!selectedCandidate || rejectedCandidateIds.has(selectedCandidate.id)) {
      diagnostics.push("artist_selected_invalid_candidate"); rejectedCandidateIds.add(seed.id); continue;
    }
    const drafts = await realizeAuthorSequence({ graph: reality, candidate: selectedCandidate, proposition });
    const sequence = buildSequencePlay({ subject: input.subject || selectedCandidate.lens, proposition, candidate: selectedCandidate, cuts: drafts });
    const judgment = judgeAuthorSequence({ graph: reality, candidate: selectedCandidate, proposition, sequence });
    if (judgment.status === "ACCEPT") {
      return {
        readout: buildAuthorReadout({ graph: reality, subject: input.subject }), reality, metamorphic: cognition.relations, cognition,
        proposition, sequence, judgment, selectedCandidateId: selectedCandidate.id,
        memoryDelta: buildMemoryDelta(selectedCandidate, proposition, sequence),
        learningDelta: buildLearningDelta(selectedCandidate, proposition, judgment),
        continuationState: buildContinuationState(selectedCandidate, cognition, reality, sequence, input.returning),
      };
    }
    diagnostics.push(...judgment.reasons);
    rejectedCandidateIds.add(selectedCandidate.id);
  }
  throw new Error(`Author realization rejected after ${diagnostics.length ? "bounded alternatives" : "available candidates"}: ${[...new Set(diagnostics)].join("; ")}`);
}
