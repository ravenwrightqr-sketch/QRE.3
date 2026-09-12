/**
 * QRE CANONICAL AUTHOR — SEQUENCE-TEXT FILM ONLY
 *
 * Current artifact: text moving as a sequence of attention-changing screens.
 * The canonical handoff is Reality → Cognition → Artist → Mouth → Judge → SequencePlay.
 *
 * No separate production artifact belongs in Author. Do not reintroduce movie,
 * genre, shot, camera, soundtrack, transition, screenplay, or audiovisual
 * planning concepts into this path.
 *
 * Reality owns source evidence. Cognition discovers relationships. Artist owns
 * the central proposition. Mouth realizes it. Judge is diagnostic only.
 */
import type { AuthorBrainTruth, AuthorCreativeBrief, AuthorScene, AuthorCreativeProposition, SequenceCandidate, SequenceCut, SequencePlay, ViewerAttentionRole, ViewerState } from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorCreativeSpine } from "./authorCreativeSpine.js";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorReadout } from "./authorReadout.js";
import { realizeAuthorExperience, type RealizedScene } from "./authorCreativeRealizer.js";
import type { RealizedSequenceJudgment } from "./authorRealizedFilmJudge.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const ARTIST_DNA = [
  "CREATIVE TASTE ONLY — never treat this as source reality.",
  "Start with complete supplied reality. Do not choose a category or template first.",
  "Discover the strongest organizing relationship already present: priority, hierarchy, contradiction, repetition, cycle, transformation, accumulation, precision, dependency, status, scarcity, excess, identity, hidden complexity, recurring failure, recurring success, or another supported relationship.",
  "Find what makes THIS subject particular. The final sequence should make that relationship newly noticeable.",
  "A boring service can become compelling when its actual details contain a strong pattern, rule, contrast, process, personality, precision, dependency, or transformation.",
  "Memory is supplied reality. It may create recognition, recurrence, changed meaning, callback, or continuity without inventing facts.",
  "The Artist finds one central idea. Mouth realizes that idea as moving text. Every cut should change the read.",
].join("\n");

function roleFor(kind: AuthorScene["kind"], index: number, total: number): ViewerAttentionRole {
  if (index === 0 || kind === "hook") return "hook";
  if (index === total - 1 || kind === "payoff") return "payoff";
  if (kind === "turn") return "reframe";
  if (kind === "afterglow") return "release";
  if (kind === "movement") return "escalation";
  if (kind === "discovery") return "discovery";
  return "question";
}
function gainFor(role: ViewerAttentionRole): SequenceCut["gainKind"] {
  switch (role) {
    case "hook": return "surprise";
    case "question": return "question";
    case "pressure": case "escalation": return "escalation";
    case "reframe": return "reframe";
    case "consequence": return "consequence";
    case "callback": return "callback";
    case "payoff": case "release": return "payoff";
    default: return "discovery";
  }
}
function sequenceFor(subject: string, sequenceCandidate: SequenceCandidate, scenes: RealizedScene[], proposition: AuthorCreativeProposition): SequencePlay {
  const cuts: SequenceCut[] = scenes.map((scene, index) => {
    const prior = scenes.slice(0, index).map((item) => item.text);
    const role = roleFor(scene.kind, index, scenes.length);
    const trajectory = sequenceCandidate.trajectory[Math.min(index, Math.max(0, sequenceCandidate.trajectory.length - 1))];
    const before: ViewerState = { known: prior, expected: clean(trajectory?.nextQuestion) || clean(sequenceCandidate.unresolvedQuestion), unresolved: index === 0 ? clean(sequenceCandidate.unresolvedQuestion) : clean(trajectory?.nextQuestion), recentChange: prior.at(-1) };
    const after: ViewerState = { known: [...prior, scene.text], expected: clean(trajectory?.nextQuestion), unresolved: index === scenes.length - 1 ? undefined : clean(sequenceCandidate.unresolvedQuestion), currentWant: index === scenes.length - 1 ? undefined : clean(proposition.text), recentChange: scene.text };
    return { id: `sequence-cut-${index + 1}`, order: index + 1, role, gainKind: gainFor(role), sourceIds: unique(scene.sourceEventIds), informationGain: scene.text, attentionDelta: clean(trajectory?.viewerChange) || proposition.text, viewerBefore: before, viewerAfter: after, necessity: { necessary: true, reason: proposition.text }, nextPromise: clean(trajectory?.nextQuestion), payoffConnection: role === "payoff" ? proposition.text : undefined, noveltyScore: metric(sequenceCandidate.novelty + scene.score * .35), confidence: metric(scene.score) } satisfies SequenceCut;
  });
  return { subject, premise: proposition.text, openingState: cuts[0]?.viewerBefore ?? { known: [] }, baselineFacts: [], cuts, closingState: cuts.at(-1)?.viewerAfter, continuity: sequenceCandidate.callbackPotential > .55 ? ["supplied history can alter later readings"] : [], antiCrutch: ["no fixed beat count", "no one-fact-per-cut rule", "no source-order serialization", "every cut must change the read", "the central proposition remains the creative center"], continuation: clean(sequenceCandidate.unresolvedQuestion) || "Another supplied detail may change the reading." };
}
function briefFor(sequenceCandidate: SequenceCandidate, cognition: Awaited<ReturnType<typeof buildAuthorCognitivePlan>>, lens: string): AuthorCreativeBrief {
  const direction = cognition.artistDirection;
  return { angle: lens, engine: "Reality → Cognition → Artist → Mouth → Sequence", question: clean(direction.openLoop.text) || sequenceCandidate.unresolvedQuestion, strongestImage: clean(direction.hook.text) || sequenceCandidate.evidence[0] || sequenceCandidate.payoff, tension: clean(direction.tension.text) || clean(direction.creativeProposition.pattern), payoff: clean(direction.payoff.text) || direction.creativeProposition.text, callback: clean(direction.surprise.text), rhythm: cognition.sequenceCandidates.length > 5 ? ["short", "standard", "long", "hit"] : ["short", "standard", "hit"], avoid: ["invented reality", "compiler language", "fixed template", "repeated openings", "caption-reel collapse", "fact-by-fact transcription", "abandoning the Artist proposition"] };
}

export type CanonicalAuthorResult = {
  readout: ReturnType<typeof buildAuthorReadout>;
  scenes: AuthorScene[];
  sequence: SequencePlay;
  selectedSequence?: SequenceCandidate;
  realizationMode: "collection" | "state" | "sequence-film";
  brief: AuthorCreativeBrief;
  diagnostics: { model: string; modelCalls: number; candidateSequences: number; acceptedCandidates: number; qualityStatus: "ACCEPTED" | "REJECTED"; renderable: boolean; complete: boolean; selectedScore: number; rejectedCandidates: unknown[]; realizedSequenceJudge?: RealizedSequenceJudgment; selectedSequenceId?: string };
  adaptiveQuestions: Array<{ kind: string; question: string; reason: string }>;
  world: ReturnType<typeof buildAuthorRealityGraph>;
};

export async function authorBrainCanonical(input: AuthorBrainTruth): Promise<CanonicalAuthorResult> {
  const subject = clean(input.subject) || "the subject";
  const prompt = clean(input.prompt);
  const facts = unique(input.facts);
  const sourceMoments = unique(input.sourceMoments);
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const world = input.realityGraph ?? buildAuthorRealityGraph({ prompt, subject, place: clean(input.place), facts, sourceMoments, memoryContext: input.memoryContext ?? [], trajectory: input.trajectory ?? [] });
  const readout = buildAuthorReadout({ graph: world, subject });
  const spine = buildAuthorCreativeSpine({ graph: world, subject, returning });
  const creativeLearningContext = unique([ARTIST_DNA, ...(input.creativeLearningContext ?? []), ...spine.opportunities.slice(0, 12).map((item) => `DERIVED OPPORTUNITY: ${item.opportunity}; evidence=${item.evidenceEventIds.join(",")}; strength=${item.strength}`)]);
  const cognition = await buildAuthorCognitivePlan({ prompt, subject, place: clean(input.place), lens: clean(input.lens), facts, sourceMoments, realityGraph: world, domainContext: input.domainContext, memoryContext: input.memoryContext ?? [], trajectory: input.trajectory ?? [], creativeLearningContext, returning, visitNumber: input.visitNumber });
  const sequences = cognition.sequenceCandidates;
  const selectedSequence = cognition.selectedSequence ?? sequences[0];
  if (!selectedSequence) {
    return { readout, scenes: [], sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] }, realizationMode: "collection", brief: { angle: cognition.selectedLens, engine: "Reality → Cognition → Artist → Mouth → Sequence", question: "", strongestImage: "", tension: "", payoff: "", callback: "", rhythm: ["short"], avoid: ["invented reality"] }, diagnostics: { model: cognition.model, modelCalls: cognition.modelCalls, candidateSequences: 0, acceptedCandidates: 0, qualityStatus: "REJECTED", renderable: false, complete: false, selectedScore: 0, rejectedCandidates: [{ reason: "no grounded sequence possibility discovered" }] }, adaptiveQuestions: cognition.adaptiveQuestions, world };
  }
  const realization = await realizeAuthorExperience({ prompt, subject, lens: cognition.selectedLens, graph: world, sequences, sequence: selectedSequence, artistDirection: cognition.artistDirection, domainContext: input.domainContext, memoryContext: input.memoryContext, priorScenes: input.trajectory, creativeLearningContext });
  if (!realization.judgment?.accepted) {
    return { readout, scenes: [], sequence: { subject, premise: "", openingState: { known: [] }, cuts: [] }, selectedSequence, realizationMode: "collection", brief: briefFor(selectedSequence, cognition, cognition.selectedLens), diagnostics: { model: cognition.model === "fallback" ? realization.model : cognition.model, modelCalls: cognition.modelCalls + realization.modelCalls, candidateSequences: sequences.length, acceptedCandidates: 0, qualityStatus: "REJECTED", renderable: false, complete: false, selectedScore: metric(realization.judgment?.score ?? 0), rejectedCandidates: [{ reason: realization.reason, judgeReasons: realization.judgment?.reasons ?? [] }], realizedSequenceJudge: realization.judgment, selectedSequenceId: selectedSequence.id }, adaptiveQuestions: cognition.adaptiveQuestions, world };
  }
  const scenes = realization.scenes.map((scene) => ({ text: scene.text, kind: scene.kind }) satisfies AuthorScene);
  const proposition = cognition.artistDirection.creativeProposition;
  const sequence = sequenceFor(subject, selectedSequence, realization.scenes, proposition);
  const complete = scenes.length === sequence.cuts.length && scenes.length > 0;
  return { readout, scenes, sequence, selectedSequence, realizationMode: scenes.length > 1 ? "sequence-film" : "state", brief: briefFor(selectedSequence, cognition, cognition.selectedLens), diagnostics: { model: cognition.model === "fallback" ? realization.model : cognition.model, modelCalls: cognition.modelCalls + realization.modelCalls, candidateSequences: sequences.length, acceptedCandidates: realization.judgment ? 1 : 0, qualityStatus: complete ? "ACCEPTED" : "REJECTED", renderable: complete, complete, selectedScore: metric(realization.judgment?.score ?? 0), rejectedCandidates: realization.reason ? [{ reason: realization.reason }] : [], realizedSequenceJudge: realization.judgment, selectedSequenceId: selectedSequence.id }, adaptiveQuestions: cognition.adaptiveQuestions, world };
}
