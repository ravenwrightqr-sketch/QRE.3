/*
STATUS: CANONICAL
ROLE: Sole Universal Author orchestrator. Wires reality, cognition, independent judgment, creative realization, and runtime projection.
INPUT: AuthorBrainTruth assembled from user reality, persistent world memory, geo/presence, and governed creative learning.
OUTPUT: One selected Movie realization projected into SequencePlay and AuthorScene objects with provenance, alongside a factual Readout.
AUTHORITY: RealityGraph owns source evidence; Readout projects facts; Cognition owns interpretation/Movie candidates; Experience Judge owns deterministic quality selection; Creative Realizer owns visible language.
MUST NOT: Select a second semantic truth, persist memory, route scans, own payments, parse business domains, or expose compiler vocabulary.
*/
import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, LatentMovieCandidate, SequenceCut, SequencePlay, ViewerAttentionRole, ViewerState } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorCreativeSpine } from "./authorCreativeSpine.js";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { judgeAuthorExperience, type AuthorExperienceJudgment } from "./authorExperienceJudge.js";
import { buildAuthorReadout, type AuthorReadout } from "./authorReadout.js";
import { realizeAuthorExperience, type RealizedScene } from "./authorCreativeRealizer.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function roleFor(kind: AuthorScene["kind"], index: number, total: number): ViewerAttentionRole {
  if (kind === "hook" || index === 0) return "hook";
  if (kind === "payoff" || index === total - 1) return "payoff";
  if (kind === "turn") return "reframe";
  if (kind === "afterglow") return "release";
  if (kind === "movement") return "escalation";
  return "discovery";
}
function gainFor(role: ViewerAttentionRole): SequenceCut["gainKind"] {
  switch (role) {
    case "hook": return "surprise";
    case "question": return "question";
    case "pressure":
    case "escalation": return "escalation";
    case "reframe": return "reframe";
    case "consequence": return "consequence";
    case "callback": return "callback";
    case "payoff":
    case "release": return "payoff";
    case "continuation": return "new_fact";
    default: return "discovery";
  }
}
function sequenceFor(subject: string, movie: LatentMovieCandidate, scenes: RealizedScene[]): SequencePlay {
  const cuts: SequenceCut[] = scenes.map((scene, index) => {
    const prior = scenes.slice(0, index).map((item) => item.text);
    const role = roleFor(scene.kind, index, scenes.length);
    const viewerBefore: ViewerState = {
      known: prior,
      expected: clean(movie.trajectory[index - 1]?.nextQuestion) || clean(movie.unresolvedQuestion),
      unresolved: clean(movie.unresolvedQuestion),
      recentChange: prior.at(-1),
    };
    const viewerAfter: ViewerState = {
      known: [...prior, scene.text],
      expected: clean(movie.trajectory[index]?.nextQuestion),
      unresolved: index === scenes.length - 1 ? undefined : clean(movie.unresolvedQuestion),
      recentChange: scene.text,
    };
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role,
      gainKind: gainFor(role),
      sourceIds: unique(scene.sourceEventIds),
      informationGain: scene.text,
      attentionDelta: clean(movie.trajectory[index]?.viewerChange) || clean(movie.hypothesis[index % Math.max(1, movie.hypothesis.length)]),
      viewerBefore,
      viewerAfter,
      necessity: { necessary: true, reason: clean(movie.trajectory[index]?.viewerChange) || "advances the selected experience" },
      nextPromise: clean(movie.trajectory[index]?.nextQuestion),
      payoffConnection: role === "payoff" ? clean(movie.payoff) : undefined,
      noveltyScore: metric(movie.novelty + scene.score * 0.35),
      confidence: metric(scene.score),
    } satisfies SequenceCut;
  });
  return {
    subject,
    premise: clean(movie.hypothesis[0]) || clean(movie.payoff),
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    baselineFacts: [],
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: movie.callbackPotential > 0.55 ? ["selected movie uses continuity material"] : [],
    antiCrutch: ["no fixed beat count", "no repeated subject openings", "no source-order as chronology"],
    continuation: clean(movie.unresolvedQuestion) || "The world can receive another supplied event.",
  };
}
function briefFor(movie: LatentMovieCandidate, cognition: Awaited<ReturnType<typeof buildAuthorCognitivePlan>>, lens: string): AuthorCreativeBrief {
  return {
    angle: lens,
    engine: "Reality → World → Cognition → Movie → Experience Judge → Creative Realizer → Sequence → Experience",
    question: clean(movie.unresolvedQuestion),
    strongestImage: clean(movie.evidence[0]) || clean(movie.payoff),
    tension: clean(movie.storyThesis?.semanticTurn) || clean(movie.hypothesis[0]),
    payoff: clean(movie.payoff),
    callback: clean(movie.callbackPotential > 0.55 ? "continuity available" : "none"),
    rhythm: cognition.latentMovieCandidates.length > 5 ? ["short", "standard", "long", "hit"] : ["short", "standard", "hit"],
    avoid: ["invented reality", "compiler language", "fixed story template", "repeated subject openings", "caption reel"],
  };
}

type JudgedCandidate = { candidate: LatentMovieCandidate; judgment: AuthorExperienceJudgment };

function judgeCandidates(
  candidates: LatentMovieCandidate[],
  world: ReturnType<typeof buildAuthorRealityGraph>,
  returning: boolean,
  priorTrajectory: string[] = [],
): { selected?: JudgedCandidate; rejected: unknown[]; accepted: JudgedCandidate[] } {
  const priorText = priorTrajectory.map(clean).filter(Boolean).join(" ").toLowerCase();
  const judged: JudgedCandidate[] = candidates.map((candidate) => {
    const judgment = judgeAuthorExperience(candidate, world, {
      returning,
      priorSignatures: priorText ? [priorText] : [],
    });
    return { candidate, judgment };
  });

  const accepted = judged
    .filter((item) => item.judgment.accepted)
    .sort((a, b) => b.judgment.score - a.judgment.score);

  // Independent chooser: do not honor Cognition's selectedMovieId blindly.
  // Prefer a strong candidate, then reward a materially different evidence/operation signature.
  let selected: JudgedCandidate | undefined;
  for (const item of accepted) {
    if (!selected) {
      selected = item;
      continue;
    }
    const selectedEvidence = new Set(selected.candidate.trajectory.flatMap((step) => step.eventIds));
    const itemEvidence = new Set(item.candidate.trajectory.flatMap((step) => step.eventIds));
    const shared = [...itemEvidence].filter((id) => selectedEvidence.has(id)).length;
    const union = new Set([...selectedEvidence, ...itemEvidence]).size;
    const evidenceDiversity = union ? 1 - shared / union : 0;
    const operationDiversity = item.candidate.trajectory.map((step) => step.operation).filter((op, i, arr) => arr.indexOf(op) === i).join("|") ===
      selected.candidate.trajectory.map((step) => step.operation).filter((op, i, arr) => arr.indexOf(op) === i).join("|") ? 0 : 1;
    const challenger = item.judgment.score + evidenceDiversity * 0.035 + operationDiversity * 0.025;
    if (challenger > selected.judgment.score + 0.01) selected = item;
  }

  const rejected = judged
    .filter((item) => !item.judgment.accepted)
    .map(({ candidate, judgment }) => ({
      movieId: candidate.id,
      score: metric(candidate.score),
      decisionScore: metric(judgment.score),
      reason: "independent experience judge rejected",
      reasons: judgment.reasons,
      dimensions: judgment.dimensions,
      semanticGate: judgment.gate,
    }));
  return { selected, rejected, accepted };
}

export type CanonicalAuthorResult = {
  readout: AuthorReadout;
  scenes: AuthorScene[];
  sequence: SequencePlay;
  movie?: LatentMovieCandidate;
  realizationMode: "collection" | "state" | "sequence-film";
  brief: AuthorCreativeBrief;
  diagnostics: {
    model: string;
    modelCalls: number;
    candidateSequences: number;
    acceptedCandidates: number;
    qualityStatus: "ACCEPTED" | "REJECTED";
    renderable: boolean;
    complete: boolean;
    selectedScore: number;
    rejectedCandidates: unknown[];
    semanticGate?: ReturnType<typeof judgeAuthorExperience>["gate"];
    experienceJudge?: AuthorExperienceJudgment;
  };
  adaptiveQuestions: Array<{ kind: string; question: string; reason: string }>;
  world: ReturnType<typeof buildAuthorRealityGraph>;
};

export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const prompt = clean(input.prompt);
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const world = input.realityGraph ?? buildAuthorRealityGraph({
    prompt,
    subject,
    place: clean(input.place),
    facts,
    sourceMoments,
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
  });
  const readout = buildAuthorReadout({ graph: world, subject });

  const creativeSpine = buildAuthorCreativeSpine({ graph: world, subject, returning: input.returning });
  const metamorphicContext = creativeSpine.opportunities.slice(0, 8).map((opportunity) =>
    `DERIVED CREATIVE OPPORTUNITY: ${opportunity.opportunity}; evidence=${opportunity.evidenceEventIds.join(",")}; strength=${opportunity.strength}`,
  );
  const cognitionLearningContext = unique([...(input.creativeLearningContext ?? []), ...metamorphicContext]);

  const cognition = await buildAuthorCognitivePlan({
    prompt,
    subject,
    place: clean(input.place),
    lens: clean(input.lens),
    facts,
    sourceMoments,
    realityGraph: world,
    domainContext: input.domainContext,
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    creativeLearningContext: cognitionLearningContext,
    returning,
    visitNumber: input.visitNumber,
    movieMode: input.movieMode,
  });

  if (!cognition.latentMovieCandidates.length) {
    return {
      readout,
      scenes: [],
      sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
      realizationMode: "collection",
      brief: {
        angle: cognition.selectedLens,
        engine: "Reality → World → Cognition → Movie → Experience Judge → Creative Realizer → Sequence → Experience",
        question: "",
        strongestImage: "",
        tension: "",
        payoff: "",
        callback: "none",
        rhythm: ["short"],
        avoid: ["invented reality"],
      },
      diagnostics: {
        model: cognition.model,
        modelCalls: cognition.modelCalls,
        candidateSequences: 0,
        acceptedCandidates: 0,
        qualityStatus: "REJECTED",
        renderable: false,
        complete: false,
        selectedScore: 0,
        rejectedCandidates: [{ reason: "no Movie candidates" }],
      },
      adaptiveQuestions: cognition.adaptiveQuestions,
      world,
    };
  }

  const judged = judgeCandidates(cognition.latentMovieCandidates, world, returning, input.trajectory ?? []);
  const selected = judged.selected;
  const movie = selected?.candidate;
  if (!selected || !movie) {
    const bestRejected = cognition.latentMovieCandidates
      .map((candidate) => ({ candidate, judgment: judgeAuthorExperience(candidate, world, { returning }) }))
      .sort((a, b) => b.judgment.score - a.judgment.score)[0];
    return {
      readout,
      scenes: [],
      sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
      realizationMode: "collection",
      brief: bestRejected ? briefFor(bestRejected.candidate, cognition, cognition.selectedLens) : {
        angle: cognition.selectedLens,
        engine: "Reality → World → Cognition → Movie → Experience Judge → Creative Realizer → Sequence → Experience",
        question: "",
        strongestImage: "",
        tension: "",
        payoff: "",
        callback: "none",
        rhythm: ["short"],
        avoid: ["invented reality"],
      },
      diagnostics: {
        model: cognition.model,
        modelCalls: cognition.modelCalls,
        candidateSequences: cognition.latentMovieCandidates.length,
        acceptedCandidates: 0,
        qualityStatus: "REJECTED",
        renderable: false,
        complete: false,
        selectedScore: metric(bestRejected?.judgment.score ?? 0),
        rejectedCandidates: judged.rejected,
        semanticGate: bestRejected?.judgment.gate,
        experienceJudge: bestRejected?.judgment,
      },
      adaptiveQuestions: cognition.adaptiveQuestions,
      world,
    };
  }

  const lensSpine = buildAuthorCreativeSpine({ graph: world, subject, lens: cognition.selectedLens, returning: input.returning });
  const lensStack = [lensSpine.lensTreatment.primary, lensSpine.lensTreatment.secondary]
    .filter((value) => value && value !== "none")
    .join(" + ") || cognition.selectedLens;

  const realization = await realizeAuthorExperience({
    prompt,
    subject,
    lens: lensStack,
    graph: world,
    movie,
    domainContext: input.domainContext,
    memoryContext: input.memoryContext,
    priorScenes: input.trajectory,
    creativeLearningContext: input.creativeLearningContext,
  });
  const scenes = realization.scenes.map((scene) => ({ text: scene.text, kind: scene.kind } satisfies AuthorScene));
  const sequence = sequenceFor(subject, movie, realization.scenes);
  const complete = scenes.length > 0 && scenes.length === sequence.cuts.length;
  const selectedJudgment = selected.judgment;

  return {
    readout,
    scenes,
    sequence,
    movie,
    realizationMode: scenes.length === 1 ? "state" : scenes.length > 1 ? "sequence-film" : "collection",
    brief: briefFor(movie, cognition, lensStack),
    diagnostics: {
      model: cognition.model === "fallback" ? realization.model : cognition.model,
      modelCalls: cognition.modelCalls + realization.modelCalls,
      candidateSequences: cognition.latentMovieCandidates.length,
      acceptedCandidates: judged.accepted.length,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: metric((selectedJudgment.score + realization.score) / 2),
      rejectedCandidates: [...judged.rejected, ...(realization.reason ? [{ reason: realization.reason, rejectedSets: realization.rejectedSets }] : [])],
      semanticGate: selectedJudgment.gate,
      experienceJudge: selectedJudgment,
    },
    adaptiveQuestions: cognition.adaptiveQuestions,
    world,
  };
}
