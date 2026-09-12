import type {
  AuthorBrainTruth,
  CanonicalAuthorResult,
  SequenceCandidate,
} from "@qre/contracts";
import { authorCognition } from "./authorCognition.js";
import { chooseAuthorProposition } from "./authorArtist.js";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildSequencePlay, realizeAuthorSequence } from "./authorMouth.js";
import { judgeAuthorSequence } from "./authorJudge.js";
import { buildAuthorReadout } from "./authorReadout.js";

const MAX_CANDIDATE_ATTEMPTS = 3;

export async function authorBrainCanonical(
  input: AuthorBrainTruth,
): Promise<CanonicalAuthorResult> {
  const reality = input.realityGraph ?? buildAuthorRealityGraph(input);
  const cognition = await authorCognition({ truth: input, reality });
  const candidates: SequenceCandidate[] = cognition.candidates.slice(0, 6);

  if (!candidates.length) {
    throw new Error("Author could not find a grounded semantic candidate");
  }

  const rejectedCandidateIds = new Set<string>();
  const diagnostics: string[] = [];

  for (let attempt = 0; attempt < Math.min(MAX_CANDIDATE_ATTEMPTS, candidates.length); attempt += 1) {
    const available = candidates.filter((candidate) => !rejectedCandidateIds.has(candidate.id));
    if (!available.length) break;

    const seed = available[0];
    const proposition = await chooseAuthorProposition({
      truth: input,
      candidate: seed,
      alternatives: available,
      graph: reality,
      relations: cognition.relations,
      domainContext: input.domainContext,
      excludedCandidateIds: [...rejectedCandidateIds],
      judgeFeedback: diagnostics.slice(-8),
    });

    const selectedCandidate = candidates.find((candidate) => candidate.id === proposition.candidateId);
    if (!selectedCandidate || rejectedCandidateIds.has(selectedCandidate.id)) {
      diagnostics.push("artist_selected_invalid_candidate");
      rejectedCandidateIds.add(seed.id);
      continue;
    }

    const drafts = await realizeAuthorSequence({
      graph: reality,
      candidate: selectedCandidate,
      proposition,
    });
    const sequence = buildSequencePlay({
      subject: input.subject || selectedCandidate.lens,
      proposition,
      candidate: selectedCandidate,
      cuts: drafts,
    });
    const judgment = judgeAuthorSequence({
      graph: reality,
      candidate: selectedCandidate,
      proposition,
      sequence,
    });

    if (judgment.status === "ACCEPT") {
      return {
        readout: buildAuthorReadout({ graph: reality, subject: input.subject }),
        reality,
        metamorphic: cognition.relations,
        cognition,
        proposition,
        sequence,
        judgment,
        selectedCandidateId: selectedCandidate.id,
      };
    }

    diagnostics.push(...judgment.reasons);
    rejectedCandidateIds.add(selectedCandidate.id);
  }

  throw new Error(
    `Author realization rejected after ${diagnostics.length ? "bounded alternatives" : "available candidates"}: ${[...new Set(diagnostics)].join("; ")}`,
  );
}
