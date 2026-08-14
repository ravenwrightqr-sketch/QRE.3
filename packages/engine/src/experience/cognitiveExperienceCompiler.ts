import type {
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceEntities,
  ExperienceMoment,
  ExperienceStory,
  ExperienceTone,
  Moment,
  CinematicScene,
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
 * STATUS: ACTIVE / COMPILER-ONLY
 *
 * Canonical compiler bridge:
 *
 * prompt → cognition → universal reality → runtime moments → cinema
 *
 * V16 remains an artifact/memory substrate only. Its authoring `ExperienceMoment[]`
 * and blueprint are not confused with the runtime `Moment[]` emitted by the
 * universal realization path.
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

type V16Substrate = ReturnType<typeof compileExperienceV16>;

export type CognitiveCompiledExperience = Omit<
  V16Substrate,
  "blueprint" | "moments"
> & {
  cognition: CognitiveExperienceState;
  observation: ExperienceObservation;
  situation: CognitiveSituation;
  candidates: CognitiveCandidate[];
  story: ExperienceStory;
  scenePlan: StoryScenePlan[];
  blueprint: ExperienceBlueprint;
  moments: Moment[];
  cinematicScenes: CinematicScene[];
};

const unique = (values: string[]): string[] => [
  ...new Set(values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean)),
];

const provenance = (state: CognitiveExperienceState): StoryProvenance[] =>
  state.subject.evidence.map((evidence) => ({
    kind:
      evidence.source === "prompt"
        ? "observed"
        : evidence.source === "creative_realization"
          ? "playful"
          : "inferred",
    source: evidence.source,
    confidence: evidence.confidence,
  }));

function compose(
  prompt: string,
  substrate: V16Substrate,
  cognition: CognitiveExperienceState,
) {
  const universal = compileUniversalRealityExperience(prompt, cognition.plan);
  const storyProvenance = provenance(cognition);

  const storyTone: ExperienceTone[] = [
    ...((substrate.blueprint?.tone ?? []) as readonly ExperienceTone[]),
  ];

  const story: ExperienceStory = {
    title: substrate.title,
    hook: universal.beats[0]?.text ?? substrate.title,
    logline: universal.beats.map((beat) => beat.text).join(" "),
    beats: universal.beats,
    ending: universal.beats.at(-1)?.text ?? substrate.title,
    continuation: universal.beats.at(-1)?.text,
    tone: storyTone,
    provenance: storyProvenance,
  };

  const moments: Moment[] = universal.moments;

  const scenePlan: StoryScenePlan[] = universal.beats.map((beat, index) => {
    const visual = universal.cinematicScenes[index]?.visual;
    return {
      id: `universal-scene-${index + 1}`,
      order: index,
      beatId: beat.id,
      purpose: "realize concrete source reality",
      text: beat.text,
      emotionalTarget: beat.emotionalTarget ?? "",
      entities: beat.entities ?? [],
      duration: Number(moments[index]?.meta?.duration ?? 3800) / 1000,
      transition: universal.cinematicScenes[index]?.transition ?? "fade",
      visual: {
        theme: visual?.theme ?? "cinematic",
        animation: visual?.animation ?? "none",
      },
      provenance: beat.provenance ?? storyProvenance,
    };
  });

  const blueprintMoments: ExperienceMoment[] = moments.map((moment, index) => ({
    type: index === 0
      ? "introduction"
      : index === moments.length - 1
        ? "completion"
        : "story",
    component: "story",
    title: "",
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
    tone: [...storyTone],
    cognitivePlan: cognition.plan,
    moments: blueprintMoments,
    metadata: {
      ...substrate.blueprint.metadata,
      dna: unique([
        ...(substrate.blueprint.metadata?.dna ?? []),
        "canonical-universal-reality-compiler",
        "source-evidence-first",
        "explicit-participant-only",
        "location-time-preservation",
      ]),
    },
  };

  return {
    story,
    moments,
    scenePlan,
    cinematicScenes: universal.cinematicScenes,
    blueprint,
  };
}

export function compileCognitiveExperience(
  prompt: string,
  context: ExperienceCompilerContext = {},
): CognitiveCompiledExperience {
  let cognition = understandExperience(prompt, context);

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

  const substrate = compileExperienceV16(prompt, context);
  const composed = compose(prompt, substrate, cognition);
  const storyProvenance = provenance(cognition);

  const observation: ExperienceObservation = {
    prompt,
    subject: cognition.subject.value || substrate.movie.subject,
    activity: composed.story.beats[0]?.text ?? substrate.intent.purpose,
    context: unique([substrate.intent.domain, ...substrate.intent.signals]),
    entities: cognition.entities,
    explicitEmotions: cognition.emotionalIntent,
    audience: unique([...cognition.participants.value, ...cognition.plan.audience]),
    temporal: unique([...cognition.entities.dates, ...cognition.entities.times]),
    affordances: cognition.affordances,
    evidence: storyProvenance,
  };

  const situation: CognitiveSituation = {
    subject: cognition.subject.value,
    actors: cognition.participants.value,
    activity: observation.activity,
    setting: cognition.entities.places,
    temporal: observation.temporal,
    social: cognition.participants.value.length > 0 ? "shared" : "unknown",
    purpose: cognition.plan.purpose,
    change: "",
    tension: "",
  };

  const candidates: CognitiveCandidate[] = (cognition.plan.realization?.directives ?? []).map((directive, index) => ({
    id: `candidate-${index + 1}`,
    beats: [directive.kind],
    score: directive.confidence ?? 0.5,
    rationale: [directive.intent],
  }));

  return {
    ...substrate,
    cognition,
    observation,
    situation,
    candidates,
    story: composed.story,
    scenePlan: composed.scenePlan,
    blueprint: composed.blueprint,
    moments: composed.moments,
    cinematicScenes: composed.cinematicScenes,
  };
}
