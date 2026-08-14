import type {
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceEntities,
  ExperienceGenome,
  ExperienceModel,
  ExperienceMoment,
  ExperienceStory,
  Moment,
  CinematicScene,
  StoryBeat,
  StoryProvenance,
  StoryScenePlan,
} from "@qre/contracts";
import { understandExperience } from "../cognition/cognitiveEngine.js";
import { buildCognitivePremise } from "../cognition/premiseBuilder.js";
import { realizeCognitiveExperience } from "../cognition/cognitiveExperienceRealizer.js";
import { compileExperienceV16 } from "./experienceCompilerV16.js";
import type { ExperienceCompilerContext } from "./experienceCompilerContext.js";
import { compileUniversalRealityExperience } from "../compiler/universalRealityCompiler.js";

/**
 * STATUS: CANONICAL ADAPTER
 *
 * The old beat/template compiler is no longer authoritative.
 * V16 is retained only as an artifact/schema substrate while the canonical
 * customer-language path is:
 *
 * prompt → cognition → premise/evidence → universal reality model →
 * creative scene realization → runtime moments → cinematic scenes.
 *
 * Do not add domain-specific story branches here.
 */

export type ExperienceObservation = {
  prompt: string;
  subject: string;
  activity: string;
  context: string[];
  entities: ExperienceEntities;
  explicitEmotions: string[];
  audience: string[];
  temporal: string[];
  affordances: string[];
  evidence: StoryProvenance[];
};

export type CognitiveSituation = {
  subject: string;
  actors: string[];
  activity: string;
  setting: string[];
  temporal: string[];
  social: "solo" | "shared" | "unknown";
  purpose: string;
  change: string;
  tension: string;
};

export type CognitiveCandidate = {
  id: string;
  beats: string[];
  score: number;
  rationale: string[];
};

export type CognitiveCompiledExperience = {
  version: string;
  title: string;
  intent: unknown;
  movie: unknown;
  blueprint: ExperienceBlueprint;
  cognition: CognitiveExperienceState;
  observation: ExperienceObservation;
  situation: CognitiveSituation;
  candidates: CognitiveCandidate[];
  genome: ExperienceGenome;
  story: ExperienceStory;
  scenePlan: StoryScenePlan[];
  model: ExperienceModel;
  moments: Moment[];
  cinematicScenes: CinematicScene[];
};

const unique = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean)),
];

const provenance = (state: CognitiveExperienceState): StoryProvenance[] =>
  state.subject.evidence.map((evidence) => ({
    kind: evidence.source === "prompt" ? "observed" : "inferred",
    source: evidence.source,
    confidence: evidence.confidence,
  }));

function ordinarySubjectRepair(prompt: string, state: CognitiveExperienceState): CognitiveExperienceState {
  if (state.subject.status === "observed" && state.subject.value.trim()) return state;
  const match = prompt.match(/^(?:a|an|the|my|our)?\s*([A-Za-z][A-Za-z0-9'’-]*(?:\s+[A-Za-z0-9'’-]*){0,4})\s+(?=(?:arrived|walked|entered|went|came|left|returned|found|sat|stood|started|was|were|is|are|had|has)\b)/i);
  const actor = match?.[1]?.trim();
  if (!actor) return state;
  return {
    ...state,
    subject: {
      ...state.subject,
      value: actor,
      status: "observed",
      confidence: Math.max(state.subject.confidence, 0.97),
      evidence: [...state.subject.evidence, { source: "prompt", detail: `ordinary subject: ${actor}`, confidence: 0.97 }],
    },
  };
}

function retainExplicitParticipants(prompt: string, state: CognitiveExperienceState): CognitiveExperienceState {
  const corpus = prompt.toLowerCase();
  const values = state.participants.value.filter((value) => corpus.includes(value.toLowerCase()) || (value.toLowerCase() === "kids" && /\b(?:kids?|children)\b/.test(corpus)));
  return {
    ...state,
    participants: {
      ...state.participants,
      value: values,
      status: values.length ? "observed" : "unknown",
      confidence: values.length ? state.participants.confidence : 0,
      evidence: values.length ? state.participants.evidence : [],
    },
  };
}

export function compileCognitiveExperience(
  prompt: string,
  context: ExperienceCompilerContext = {},
): CognitiveCompiledExperience {
  let cognition = ordinarySubjectRepair(prompt, understandExperience(prompt, context));
  cognition = retainExplicitParticipants(prompt, cognition);

  const premise = buildCognitivePremise({
    prompt,
    subject: cognition.subject,
    participants: cognition.participants,
    entities: cognition.entities,
    affordances: cognition.affordances,
    emotionalIntent: cognition.emotionalIntent,
    plan: cognition.plan,
    context,
  });

  const realization = realizeCognitiveExperience({
    plan: cognition.plan,
    premise,
    evidence: cognition.subject.evidence,
    hypothesisEvidence: cognition.selectedHypothesis.evidence,
    prompt,
  });

  cognition = {
    ...cognition,
    plan: {
      ...cognition.plan,
      direction: cognition.selectedHypothesis.kind,
      premise,
      realization,
    },
  };

  const substrate = compileExperienceV16(prompt, context) as any;
  const universal = compileUniversalRealityExperience(prompt, cognition.plan);
  const storyProvenance = provenance(cognition);

  const story: ExperienceStory = {
    title: substrate.title,
    hook: universal.beats[0]?.text ?? substrate.title,
    logline: universal.beats.map((beat) => beat.text).join(" "),
    beats: universal.beats,
    ending: universal.beats.at(-1)?.text ?? substrate.title,
    continuation: universal.beats.at(-1)?.text,
    tone: substrate.blueprint?.tone ?? [],
    provenance: storyProvenance,
  };

  const moments: Moment[] = universal.moments;
  const scenePlan: StoryScenePlan[] = universal.beats.map((beat, index) => ({
    id: `universal-scene-${index + 1}`,
    order: index,
    beatId: beat.id,
    purpose: "realize concrete source reality",
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: Number(moments[index]?.meta?.duration ?? 3800) / 1000,
    transition: universal.cinematicScenes[index]?.transition,
    visual: universal.cinematicScenes[index]?.visual,
    provenance: beat.provenance,
  }));

  const blueprintMoments: ExperienceMoment[] = moments.map((moment, index) => ({
    type: index === 0 ? "introduction" : index === moments.length - 1 ? "completion" : "story",
    component: "story",
    title: index === 0 ? "Beginning" : index === moments.length - 1 ? "What stayed" : "Then",
    subtitle: cognition.subject.value,
    description: moment.type === "message" ? moment.text : "",
    editable: true,
    demo: false,
    order: index,
    payload: {
      source: "canonical-universal-reality-compiler",
      beatId: universal.beats[index]?.id,
      realityEventId: moment.meta?.realityEventId,
      place: moment.meta?.place,
      time: moment.meta?.time,
    },
  }));

  const blueprint: ExperienceBlueprint = {
    ...substrate.blueprint,
    cognitivePlan: cognition.plan,
    moments: blueprintMoments,
    metadata: {
      ...(substrate.blueprint?.metadata ?? {}),
      dna: unique([
        ...(substrate.blueprint?.metadata?.dna ?? []),
        "canonical-universal-reality",
        "prompt-authoritative-evidence",
        "creative-lens-not-domain",
        "runtime-moment-sequence",
        "location-time-preservation",
      ]),
    },
  };

  const observation: ExperienceObservation = {
    prompt,
    subject: cognition.subject.value || universal.world.subjects[0] || "unknown",
    activity: universal.beats[0]?.text ?? prompt,
    context: unique([...universal.world.places, ...universal.world.times, ...universal.world.explicitLenses]),
    entities: cognition.entities,
    explicitEmotions: cognition.emotionalIntent,
    audience: cognition.participants.value,
    temporal: unique([...universal.world.times, ...cognition.entities.dates, ...cognition.entities.times]),
    affordances: cognition.affordances,
    evidence: storyProvenance,
  };

  const situation: CognitiveSituation = {
    subject: observation.subject,
    actors: unique([observation.subject, ...cognition.participants.value]),
    activity: observation.activity,
    setting: universal.world.places,
    temporal: observation.temporal,
    social: cognition.participants.value.length ? "shared" : "unknown",
    purpose: cognition.plan.purpose,
    change: cognition.plan.realization?.semanticArc?.[0] ?? "",
    tension: cognition.plan.realization?.semanticArc?.[1] ?? "",
  };

  return {
    ...substrate,
    version: "universal-reality",
    blueprint,
    cognition,
    observation,
    situation,
    candidates: [{ id: "universal-reality", beats: universal.beats.map((beat) => beat.kind), score: 1, rationale: ["source evidence drives realization"] }],
    genome: substrate.genome as ExperienceGenome,
    story,
    scenePlan,
    model: {
      ...(substrate.model ?? {}),
      title: substrate.title,
      description: cognition.plan.purpose,
      industry: "generic",
      goal: "experience",
      tone: substrate.blueprint?.tone ?? [],
      moments: blueprintMoments,
    } as ExperienceModel,
    moments,
    cinematicScenes: universal.cinematicScenes,
  };
}
