/*
STATUS: CANONICAL
ROLE: Sole Universal Author orchestrator. Wires reality, cognition, creative realization, and runtime projection.
INPUT: AuthorBrainTruth assembled from user reality, persistent world memory, geo/presence, and governed creative learning.
OUTPUT: One selected Movie realization projected into SequencePlay and AuthorScene objects with provenance.
AUTHORITY: Cognition owns interpretation/Movie selection; RealityGraph owns source evidence; Creative Realizer owns visible language.
MUST NOT: Select a second Movie, persist memory, route scans, own payments, parse business domains, or expose compiler vocabulary.
UPSTREAM: Experience adapter, memory/world model, presence, creative learning.
DOWNSTREAM: Experience adapter, runtime Moment projection, memory projection, analytics.
REPLACEMENT: Replaces the previous multi-layer Author brain and all competing Author orchestration paths.
*/
import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, LatentMovieCandidate, SequenceCut, SequencePlay, ViewerAttentionRole, ViewerState } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { evaluateLatentMovie, type SemanticGateResult } from "./authorSemanticGate.js";
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
  switch (role) { case "hook": return "surprise"; case "question": return "question"; case "pressure": case "escalation": return "escalation"; case "reframe": return "reframe"; case "consequence": return "consequence"; case "callback": return "callback"; case "payoff": case "release": return "payoff"; case "continuation": return "new_fact"; default: return "discovery"; }
}
function sequenceFor(subject: string, movie: LatentMovieCandidate, scenes: RealizedScene[]): SequencePlay {
  const cuts: SequenceCut[] = scenes.map((scene, index) => {
    const prior = scenes.slice(0, index).map((item) => item.text); const role = roleFor(scene.kind, index, scenes.length);
    const viewerBefore: ViewerState = { known: prior, expected: clean(movie.trajectory[index - 1]?.nextQuestion) || clean(movie.unresolvedQuestion), unresolved: clean(movie.unresolvedQuestion), recentChange: prior.at(-1) };
    const viewerAfter: ViewerState = { known: [...prior, scene.text], expected: clean(movie.trajectory[index]?.nextQuestion), unresolved: index === scenes.length - 1 ? undefined : clean(movie.unresolvedQuestion), recentChange: scene.text };
    return { id: `sequence-cut-${index + 1}`, order: index + 1, role, gainKind: gainFor(role), sourceIds: unique(scene.sourceEventIds), informationGain: scene.text, attentionDelta: clean(movie.trajectory[index]?.viewerChange) || clean(movie.hypothesis[index % Math.max(1, movie.hypothesis.length)]), viewerBefore, viewerAfter, necessity: { necessary: true, reason: clean(movie.trajectory[index]?.viewerChange) || "advances the selected experience" }, nextPromise: clean(movie.trajectory[index]?.nextQuestion), payoffConnection: role === "payoff" ? clean(movie.payoff) : undefined, noveltyScore: metric(movie.novelty + scene.score * 0.35), confidence: metric(scene.score) } satisfies SequenceCut;
  });
  return { subject, premise: clean(movie.hypothesis[0]) || clean(movie.payoff), openingState: cuts[0]?.viewerBefore ?? { known: [] }, baselineFacts: [], cuts, closingState: cuts.at(-1)?.viewerAfter, continuity: movie.callbackPotential > 0.55 ? ["selected movie uses continuity material"] : [], antiCrutch: ["no fixed beat count", "no repeated subject openings", "no source-order as chronology"], continuation: clean(movie.unresolvedQuestion) || "The world can receive another supplied event." };
}
function briefFor(movie: LatentMovieCandidate, cognition: Awaited<ReturnType<typeof buildAuthorCognitivePlan>>, lens: string): AuthorCreativeBrief {
  return { angle: lens, engine: "Reality → World → Cognition → Movie → Creative Realizer → Sequence → Experience", question: clean(movie.unresolvedQuestion), strongestImage: clean(movie.evidence[0]) || clean(movie.payoff), tension: clean(movie.storyThesis?.semanticTurn) || clean(movie.hypothesis[0]), payoff: clean(movie.payoff), callback: clean(movie.callbackPotential > 0.55 ? "continuity available" : "none"), rhythm: cognition.latentMovieCandidates.length > 5 ? ["short", "standard", "long", "hit"] : ["short", "standard", "hit"], avoid: ["invented reality", "compiler language", "fixed story template", "repeated subject openings"] };
}
function gateCandidates(candidates: LatentMovieCandidate[], world: ReturnType<typeof buildAuthorRealityGraph>): { selected?: LatentMovieCandidate; gate?: SemanticGateResult; rejected: unknown[] } {
  const rejected: unknown[] = [];
  let selected: LatentMovieCandidate | undefined;
  let selectedGate: SemanticGateResult | undefined;
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    const gate = evaluateLatentMovie(candidate, world);
    if (!gate.accepted) {
      rejected.push({ movieId: candidate.id, score: metric(candidate.score), reason: "semantic Movie gate rejected", semanticGate: gate.reasons, signals: gate.signals });
      continue;
    }
    if (!selected || gate.score > (selectedGate?.score ?? -1)) {
      selected = candidate;
      selectedGate = gate;
    }
  }
  return { selected, gate: selectedGate, rejected };
}
export type CanonicalAuthorResult = { scenes: AuthorScene[]; sequence: SequencePlay; movie?: LatentMovieCandidate; realizationMode: "collection" | "state" | "sequence-film"; brief: AuthorCreativeBrief; diagnostics: { model: string; modelCalls: number; candidateSequences: number; acceptedCandidates: number; qualityStatus: "ACCEPTED" | "REJECTED"; renderable: boolean; complete: boolean; selectedScore: number; rejectedCandidates: unknown[]; semanticGate?: ReturnType<typeof evaluateLatentMovie> }; adaptiveQuestions: Array<{ kind: string; question: string; reason: string }>; world: ReturnType<typeof buildAuthorRealityGraph> };
export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject"; const prompt = clean(input.prompt); const facts = unique(input.facts); const sourceMoments = unique(input.sourceMoments);
  const world = input.realityGraph ?? buildAuthorRealityGraph({ prompt, subject, place: clean(input.place), facts, sourceMoments, memoryContext: input.memoryContext ?? [], trajectory: input.trajectory ?? [] });
  const cognition = await buildAuthorCognitivePlan({ prompt, subject, place: clean(input.place), lens: clean(input.lens), facts, sourceMoments, realityGraph: world, domainContext: input.domainContext, memoryContext: input.memoryContext ?? [], trajectory: input.trajectory ?? [], creativeLearningContext: input.creativeLearningContext ?? [], returning: input.returning, visitNumber: input.visitNumber, movieMode: input.movieMode });
  if (!cognition.latentMovieCandidates.length) return { scenes: [], sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] }, realizationMode: "collection", brief: { angle: cognition.selectedLens, engine: "Reality → World → Cognition → Movie → Creative Realizer → Sequence → Experience", question: "", strongestImage: "", tension: "", payoff: "", callback: "none", rhythm: ["short"], avoid: ["invented reality"] }, diagnostics: { model: cognition.model, modelCalls: cognition.modelCalls, candidateSequences: 0, acceptedCandidates: 0, qualityStatus: "REJECTED", renderable: false, complete: false, selectedScore: 0, rejectedCandidates: [{ reason: "no Movie candidates" }] }, adaptiveQuestions: cognition.adaptiveQuestions, world };

  const gated = gateCandidates(cognition.latentMovieCandidates, world);
  const movie = gated.selected;
  if (!movie || !gated.gate) {
    const fallbackCandidate = cognition.latentMovieCandidates.slice().sort((a, b) => b.score - a.score)[0];
    return {
      scenes: [],
      sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] },
      realizationMode: "collection",
      brief: fallbackCandidate ? briefFor(fallbackCandidate, cognition, cognition.selectedLens) : { angle: cognition.selectedLens, engine: "Reality → World → Cognition → Movie → Creative Realizer → Sequence → Experience", question: "", strongestImage: "", tension: "", payoff: "", callback: "none", rhythm: ["short"], avoid: ["invented reality"] },
      diagnostics: { model: cognition.model, modelCalls: cognition.modelCalls, candidateSequences: cognition.latentMovieCandidates.length, acceptedCandidates: 0, qualityStatus: "REJECTED", renderable: false, complete: false, selectedScore: metric(fallbackCandidate?.score ?? 0), rejectedCandidates: gated.rejected, semanticGate: fallbackCandidate ? evaluateLatentMovie(fallbackCandidate, world) : undefined },
      adaptiveQuestions: cognition.adaptiveQuestions,
      world,
    };
  }

  const realization = await realizeAuthorExperience({ prompt, subject, lens: cognition.selectedLens, graph: world, movie, memoryContext: input.memoryContext, priorScenes: input.trajectory, creativeLearningContext: input.creativeLearningContext });
  const scenes = realization.scenes.map((scene) => ({ text: scene.text, kind: scene.kind } satisfies AuthorScene)); const sequence = sequenceFor(subject, movie, realization.scenes); const complete = scenes.length > 0 && scenes.length === sequence.cuts.length;
  return { scenes, sequence, movie, realizationMode: scenes.length === 1 ? "state" : scenes.length > 1 ? "sequence-film" : "collection", brief: briefFor(movie, cognition, cognition.selectedLens), diagnostics: { model: cognition.model === "fallback" ? realization.model : cognition.model, modelCalls: cognition.modelCalls + realization.modelCalls, candidateSequences: cognition.latentMovieCandidates.length, acceptedCandidates: scenes.length, qualityStatus: complete ? "ACCEPTED" : "REJECTED", renderable: complete, complete, selectedScore: metric((gated.gate.score + realization.score) / 2), rejectedCandidates: [...gated.rejected, ...(realization.reason ? [{ reason: realization.reason, rejectedSets: realization.rejectedSets }] : [])], semanticGate: gated.gate }, adaptiveQuestions: cognition.adaptiveQuestions, world };
}
