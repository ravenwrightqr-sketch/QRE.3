/*
STATUS: CANONICAL
ROLE: Sole Universal Author orchestrator.
AUTHORITY:
- RealityGraph owns source evidence.
- Readout projects facts.
- Cognition discovers grounded semantic possibilities.
- Creative Spine organizes grounded opportunities and lens pressure.
- Artist owns visible language, rhythm, ordering and final treatment.
- SequencePlay records viewer-facing progression after the Artist creates it.

MUST NOT:
- invent concrete reality;
- select a second semantic truth after Artist selection;
- persist memory, route scans, or own payments;
- expose compiler vocabulary to customers;
- let a deterministic taste judge choose the art;
- depend on Movie or film candidates as an Author intermediate.
*/

import type {
  AuthorBrainTruth,
  AuthorCreativeBrief,
  AuthorScene,
  SequenceCut,
  SequencePlay,
  ViewerAttentionRole,
  ViewerState,
} from "@qre/contracts";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorCreativeSpine } from "./authorCreativeSpine.js";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { buildAuthorReadout, type AuthorReadout } from "./authorReadout.js";
import { realizeAuthorExperience, type RealizedScene } from "./authorCreativeRealizer.js";
import type { AuthorCreativeInterpretation } from "./authorCognitionUniversal.js";

const ARTIST_DNA = [
  "CREATIVE TASTE ONLY — never treat this as source reality.",
  "Make something people would actually want to watch, not a polished receipt.",
  "Search for kinetic energy, sensory impact, comedy, absurdity, drama, tenderness, menace, surprise, contrast, recurrence, return, consequence and transformation when the supplied reality can carry them.",
  "Ordinary subjects may receive bold figurative framing: a house can feel like a level, a room like an arena, a machine like an opponent, a tool like a weapon, a sign like a sentinel — never as fabricated literal events.",
  "Use supplied sound, light, heat, cold, speed, texture, motion, taste, smell, impact and repetition as creative material.",
  "Prefer a memorable creative move over a generic adjective or generic summary.",
  "Do not force this taste onto every world. It is permission and pressure, not a template.",
].join("\n");

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

function roleFor(kind: AuthorScene["kind"], index: number, total: number): ViewerAttentionRole {
  if (kind === "hook" || index === 0) return "hook";
  if (kind === "payoff" || index === total - 1) return "payoff";
  if (kind === "turn") return "reframe";
  if (kind === "movement") return "escalation";
  if (kind === "afterglow") return "release";
  return "discovery";
}

function gainFor(role: ViewerAttentionRole): SequenceCut["gainKind"] {
  switch (role) {
    case "hook": return "surprise";
    case "pressure":
    case "escalation": return "escalation";
    case "reframe": return "reframe";
    case "consequence": return "consequence";
    case "callback": return "callback";
    case "payoff":
    case "release": return "payoff";
    case "question": return "question";
    case "continuation": return "new_fact";
    default: return "discovery";
  }
}

function interpretationForSubject(
  subject: string,
  spine: ReturnType<typeof buildAuthorCreativeSpine>,
  interpretations: readonly AuthorCreativeInterpretation[],
): string {
  return clean(interpretations[0]?.thesis)
    || clean(spine.lensTreatment.languageAim)
    || `${subject}: make a supplied relationship newly noticeable.`;
}

function sequenceFor(
  subject: string,
  scenes: readonly RealizedScene[],
  spine: ReturnType<typeof buildAuthorCreativeSpine>,
  interpretations: readonly AuthorCreativeInterpretation[],
): SequencePlay {
  const cuts: SequenceCut[] = scenes.map((scene, index) => {
    const role = roleFor(scene.kind, index, scenes.length);
    const previous = scenes.slice(0, index).map((item) => item.text);
    const opportunity = spine.opportunities[index % Math.max(1, spine.opportunities.length)];
    const interpretation = interpretations[index % Math.max(1, interpretations.length)];
    const viewerBefore: ViewerState = {
      known: previous,
      unresolved: clean(opportunity?.whyItWorks),
      currentWant: index === 0 ? clean(spine.lensTreatment.languageAim) : clean(opportunity?.whyItWorks),
      recentChange: previous.at(-1),
    };
    const viewerAfter: ViewerState = {
      known: [...previous, scene.text],
      unresolved: index === scenes.length - 1 ? undefined : clean(opportunity?.whyItWorks),
      currentWant: index === scenes.length - 1 ? undefined : clean(interpretation?.creativeOpportunity),
      recentChange: scene.text,
    };
    return {
      id: `sequence-cut-${index + 1}`,
      order: index + 1,
      role,
      gainKind: gainFor(role),
      sourceIds: unique(scene.sourceEventIds),
      informationGain: scene.text,
      attentionDelta: clean(interpretation?.rationale) || clean(opportunity?.whyItWorks) || "the supplied reality advances",
      viewerBefore,
      viewerAfter,
      nextPromise: clean(opportunity?.whyItWorks),
      confidence: metric(scene.score),
    } satisfies SequenceCut;
  });

  return {
    subject,
    premise: interpretationForSubject(subject, spine, interpretations),
    openingState: cuts[0]?.viewerBefore ?? { known: [] },
    cuts,
    closingState: cuts.at(-1)?.viewerAfter,
    continuity: spine.selectedRelationId ? [spine.selectedRelationId] : [],
    antiCrutch: ["no fixed beat count", "no one-fact-per-screen rule", "no source-order requirement"],
    continuation: clean(spine.lensTreatment.languageAim),
  };
}

function briefFor(
  subject: string,
  cognition: Awaited<ReturnType<typeof buildAuthorCognitivePlan>>,
  spine: ReturnType<typeof buildAuthorCreativeSpine>,
): AuthorCreativeBrief {
  const primary = cognition.interpretations[0];
  return {
    angle: spine.lensTreatment.secondary
      ? `${spine.lensTreatment.primary} + ${spine.lensTreatment.secondary}`
      : spine.lensTreatment.primary,
    engine: "Reality → Creative Spine → Cognition → Artist → Sequence",
    question: clean(primary?.creativeOpportunity) || clean(spine.lensTreatment.languageAim),
    strongestImage: clean(primary?.thesis) || subject,
    tension: clean(spine.lensTreatment.feltEffect) || clean(primary?.rationale),
    payoff: clean(spine.lensTreatment.languageAim),
    callback: spine.opportunities.some((item) => item.opportunity.includes("callback")) ? "continuity available" : "none",
    rhythm: ["short", "standard", "hit"],
    avoid: ["invented reality", "fixed story template", "fact-by-fact transcription", "production directions"],
  };
}

export type CanonicalAuthorResult = {
  readout: AuthorReadout;
  scenes: AuthorScene[];
  sequence: SequencePlay;
  realizationMode: "collection" | "state" | "sequence";
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
  const creativeSpine = buildAuthorCreativeSpine({ graph: world, subject, lens: clean(input.lens), returning });
  const cognitionLearningContext = unique([ARTIST_DNA, ...(input.creativeLearningContext ?? [])]);
  const cognition = await buildAuthorCognitivePlan({
    prompt,
    subject,
    place: clean(input.place),
    lens: clean(input.lens),
    facts,
    sourceMoments,
    realityGraph: world,
    creativeSpine,
    domainContext: input.domainContext,
    memoryContext: input.memoryContext ?? [],
    trajectory: input.trajectory ?? [],
    creativeLearningContext: cognitionLearningContext,
    returning,
    visitNumber: input.visitNumber,
  });

  const realization = await realizeAuthorExperience({
    prompt,
    subject,
    lens: cognition.selectedLens || creativeSpine.lensTreatment.primary,
    graph: world,
    creativeSpine,
    interpretations: cognition.interpretations,
    domainContext: input.domainContext,
    memoryContext: input.memoryContext ?? [],
    priorScenes: input.trajectory,
    creativeLearningContext: cognitionLearningContext,
  });

  const scenes: AuthorScene[] = realization.scenes.map((scene) => ({ text: scene.text, kind: scene.kind }));
  const sequence = sequenceFor(subject, realization.scenes, creativeSpine, cognition.interpretations);
  const complete = scenes.length === sequence.cuts.length && scenes.length > 0;
  const model = cognition.model === "deterministic" ? realization.model : cognition.model;

  return {
    readout,
    scenes,
    sequence,
    realizationMode: scenes.length === 1 ? "state" : scenes.length > 1 ? "sequence" : "collection",
    brief: briefFor(subject, cognition, creativeSpine),
    diagnostics: {
      model,
      modelCalls: cognition.modelCalls + realization.modelCalls,
      candidateSequences: Math.max(1, creativeSpine.opportunities.length),
      acceptedCandidates: complete ? 1 : 0,
      qualityStatus: complete ? "ACCEPTED" : "REJECTED",
      renderable: complete,
      complete,
      selectedScore: metric(realization.score),
      rejectedCandidates: realization.reason ? [{ reason: realization.reason }] : [],
    },
    adaptiveQuestions: cognition.adaptiveQuestions,
    world,
  };
}
