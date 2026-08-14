import type {
  CognitiveBeatDirective,
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
  StoryBeatKind,
  StoryProvenance,
  StoryScenePlan,
} from "@qre/contracts";
import { understandExperience } from "../cognition/cognitiveEngine.js";
import { buildCognitivePremise } from "../cognition/premiseBuilder.js";
import { realizeCognitiveExperience } from "../cognition/cognitiveExperienceRealizer.js";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";
import { compileExperienceV16, type CompiledExperienceV16 } from "./experienceCompilerV16.js";
import type { ExperienceCompilerContext } from "./experienceCompilerContext.js";
import {
  createUniversalRealizationState,
  realizeUniversalExperienceBeat,
} from "./universalExperienceRealizer.js";

/**
 * COMPILER AUTHORITY
 *
 * V16 remains the artifact substrate.
 * This compiler owns cognition/planning orchestration.
 * universalExperienceRealizer.ts is the ONLY customer-language authority.
 *
 * Legacy narrative/creative/template realizers are deliberately excluded.
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
  beats: StoryBeatKind[];
  score: number;
  rationale: string[];
};

export type CognitiveCompiledExperience = Omit<CompiledExperienceV16, "moments" | "cinematicScenes"> & {
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

const names = (entities: ExperienceEntities, subject: string): string[] =>
  unique([
    subject,
    ...entities.people,
    ...entities.places,
    ...entities.events,
    ...entities.products,
    ...entities.media,
  ]);

function repairOrdinarySubject(
  prompt: string,
  state: CognitiveExperienceState,
): CognitiveExperienceState {
  if (
    state.subject.status === "observed" &&
    state.subject.value.trim().split(/\s+/).length <= 5
  ) {
    return state;
  }

  const actorVerb = /^(?:a|an|the)\s+([a-z][a-z0-9'’-]*(?:\s+[a-z][a-z0-9'’-]*){0,5})\s+(?:arrives?|arrived|enters?|entered|walks?|walked|goes?|went|comes?|came|leaves?|left|returns?|returned|grooms?|groomed|cleans?|cleaned|washes?|washed|repairs?|repaired|fixes?|fixed|restores?|restored|builds?|built|makes?|made|creates?|created|designs?|designed|writes?|wrote|cooks?|cooked|serves?|served|prepares?|prepared|opens?|opened|closes?|closed|visits?|visited|travels?|traveled|drives?|drove|rides?|rode|paints?|painted|dances?|danced|sings?|sang|plays?|played|chooses?|chose|picks?|picked|selects?|selected|decides?|decided|touches?|touched|holds?|held|wears?|wore|tastes?|tasted|smells?|smelled|looks?|looked|sees?|saw|watches?|watched|shares?|shared|gives?|gave|takes?|took|brings?|brought|receives?|received|checks?|checked|inspects?|inspected|tests?|tested|measures?|measured|installs?|installed|removes?|removed|changes?|changed|turns?|turned|transforms?|transformed|finishes?|finished|completes?|completed|photographs?|photographed|captures?|captured|records?|recorded|teaches?|taught|learns?|learned|discovers?|discovered|finds?|found|collects?|collected|organizes?|organized|decorates?|decorated|styles?|styled|trims?|trimmed|cuts?|cut|brushes?|brushed|dries?|dried|massages?|massaged|relaxes?|relaxed|pampers?|pampered|spoil(?:s|ed)?|treats?|treated|documents?|documented|shakes?|shook|chews?|chewed|runs?|ran|calls?|called)\b/i;

  const match = prompt.trim().match(actorVerb);
  const actor = match?.[1]?.replace(/\s+/g, " ").trim();
  if (!actor || actor.length > 60) return state;

  return {
    ...state,
    subject: {
      ...state.subject,
      value: actor,
      status: "observed",
      confidence: Math.max(state.subject.confidence, 0.97),
      evidence: [
        ...state.subject.evidence,
        { source: "prompt", detail: `ordinary actor subject: ${actor}`, confidence: 0.97 },
      ],
    },
  };
}

function retainExplicitParticipants(
  prompt: string,
  state: CognitiveExperienceState,
): CognitiveExperienceState {
  const corpus = prompt.toLowerCase();
  const values = state.participants.value.filter((value) => {
    const normalized = value.toLowerCase();
    if (normalized === "owner") return /\bowners?\b/.test(corpus);
    if (normalized === "kids") return /\b(?:kids?|children)\b/.test(corpus);
    if (normalized === "musician") return /\bmusician\b/.test(corpus);
    if (normalized === "artist") return /\bartist\b/.test(corpus);
    if (normalized === "scanner") return /\b(?:scanner|visitor|user|someone)\b/.test(corpus);
    if (normalized === "shared participants") {
      return /\b(?:family|friends?|community|fans?|customers?|visitors?|guests?|crowd|people|team|group|everyone)\b/.test(corpus);
    }
    return corpus.includes(normalized);
  });

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

function orderedBeatKinds(
  trajectory: readonly StoryBeatKind[],
  directives: readonly CognitiveBeatDirective[] | undefined,
): StoryBeatKind[] {
  const phase: Record<string, number> = {
    orientation: 0,
    hook: 10,
    need: 15,
    threshold: 20,
    origin: 20,
    encounter: 30,
    challenge: 35,
    discovery: 40,
    reveal: 45,
    instruction: 45,
    action: 50,
    feedback: 55,
    contribution: 55,
    escalation: 60,
    transformation: 70,
    reflection: 75,
    provenance: 78,
    identity: 80,
    milestone: 82,
    unlock: 84,
    earned_access: 84,
    payoff: 90,
    next_step: 95,
    continuation: 100,
  };

  const result = [...trajectory];

  for (const kind of directives?.map((directive) => directive.kind) ?? []) {
    if (result.includes(kind)) continue;

    const target = phase[kind] ?? 50;
    let index = result.length;
    for (let i = 0; i < result.length; i += 1) {
      if ((phase[result[i] ?? ""] ?? 50) > target) {
        index = i;
        break;
      }
    }
    result.splice(index, 0, kind);
  }

  return result;
}

function compose(
  prompt: string,
  substrate: CompiledExperienceV16,
  state: CognitiveExperienceState,
) {
  const trajectory = composeCognitiveTrajectory({ plan: state.plan, prompt });
  const beatKinds = orderedBeatKinds(
    trajectory.beats,
    state.plan.realization?.directives,
  );
  const storyProvenance = provenance(state);
  const worldState = createUniversalRealizationState(prompt, state.plan);
  const entities = names(
    state.entities,
    state.subject.value || substrate.movie.subject,
  );

  const beats: StoryBeat[] = beatKinds.map((kind, index) => {
    const directive = state.plan.realization?.directives.find((item) => item.kind === kind);
    const beat: StoryBeat = {
      id: `cognitive-${index + 1}`,
      kind,
      order: index,
      purpose: directive?.intent ?? kind,
      text: "",
      emotionalTarget:
        state.emotionalIntent[index % (state.emotionalIntent.length || 1)],
      entities,
      provenance: storyProvenance,
      directive,
    };

    beat.text =
      realizeUniversalExperienceBeat(
        beat,
        state.plan,
        prompt,
        worldState,
      ) ?? "";

    return beat;
  });

  const rendered = beats.filter((beat) => beat.text.trim());
  const story: ExperienceStory = {
    title: substrate.title,
    hook: rendered[0]?.text ?? substrate.title,
    logline: rendered.map((beat) => beat.text).join(" "),
    beats: rendered,
    ending: rendered.at(-1)?.text ?? substrate.title,
    continuation: rendered.at(-1)?.text,
    tone: [...substrate.blueprint.tone],
    provenance: storyProvenance,
  };

  const moments: Moment[] = rendered.map((beat, index) => ({
    type: "message",
    order: index,
    text: beat.text,
    meta: { beatId: beat.id, kind: beat.kind, duration: 4000 },
  }));

  const scenePlan: StoryScenePlan[] = rendered.map((beat, index) => ({
    id: `cognitive-scene-${index + 1}`,
    order: index,
    beatId: beat.id,
    purpose: beat.purpose,
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: 4,
    transition:
      index === 0
        ? "none"
        : index === rendered.length - 1
          ? "cinematic"
          : "fade",
    visual: {
      theme: "cinematic",
      animation: index === 0 ? "slow_zoom" : "parallax",
    },
    provenance: beat.provenance,
  }));

  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `cognitive-cinematic-${index + 1}`,
    type:
      index === 0
        ? "intro"
        : index === rendered.length - 1
          ? "emotion"
          : "action",
    duration: 4000,
    moment,
    order: index,
    transition: scenePlan[index]?.transition,
    visual: scenePlan[index]?.visual,
    preload: index < moments.length - 1,
    meta: {
      beatId: rendered[index]?.id,
      kind: rendered[index]?.kind,
    },
  }));

  return {
    story,
    moments,
    scenePlan,
    cinematicScenes,
    candidates: trajectory.candidates,
  };
}

function blueprint(
  base: ExperienceBlueprint,
  state: CognitiveExperienceState,
  moments: Moment[],
): ExperienceBlueprint {
  const compiledMoments: ExperienceMoment[] = moments.map((moment, index) => ({
    type:
      index === 0
        ? "introduction"
        : index === moments.length - 1
          ? "completion"
          : "story",
    component: "story",
    title:
      index === 0
        ? "The beginning"
        : index === moments.length - 1
          ? "The moment that stayed"
          : "And then",
    subtitle: state.subject.value,
    description: moment.type === "message" ? moment.text : "",
    editable: true,
    demo: false,
    order: index,
    payload: {
      beatId: moment.meta?.beatId,
      source: "cognitive-experience",
    },
  }));

  return {
    ...base,
    cognitivePlan: state.plan,
    moments: compiledMoments,
    metadata: {
      ...base.metadata,
      archetypes: unique([
        ...(base.metadata?.archetypes ?? []),
        state.selectedHypothesis.kind,
      ]),
      dna: unique([
        ...(base.metadata?.dna ?? []),
        "canonical-cognitive-compiler",
        "premise-conserved",
        "universal-evidence-realizer",
        "prompt-authoritative-language",
        "explicit-participant-only",
        "location-time-preservation",
      ]),
    },
  };
}

function makeGenome(
  substrate: CompiledExperienceV16,
  state: CognitiveExperienceState,
): ExperienceGenome {
  return {
    intent: unique([state.selectedHypothesis.kind, substrate.intent.purpose]),
    interpretation: {
      intent: [state.selectedHypothesis.kind],
      concepts: unique([state.subject.value, ...state.affordances]),
      emotionalSignals: state.emotionalIntent,
      worldSignals: [],
      cognitiveSignals: unique([
        ...state.plan.dynamicBehavior,
        ...state.plan.futureEvolution,
      ]),
      confidence: state.selectedHypothesis.score,
    },
    archetypes: [state.selectedHypothesis.kind],
    themes: state.emotionalIntent,
    emotions: state.emotionalIntent,
    meaning: substrate.blueprint.meaning,
    relationships: [],
    energy: "calm",
    pacing: "medium",
    social: state.participants.value.length > 1 ? "shared" : "solo",
    journey: ["arrival", "discovery", "transformation", "peak"],
    discovery: state.selectedHypothesis.dimensions.discoveryPotential,
    memory: state.selectedHypothesis.dimensions.memoryPotential,
    commerce: state.selectedHypothesis.dimensions.commercialPotential,
    immersion: state.selectedHypothesis.dimensions.temporalPotential,
    interaction: state.selectedHypothesis.dimensions.interactionNaturalness,
    replay: state.selectedHypothesis.dimensions.temporalPotential,
    entities: state.entities,
    environments: state.entities.places,
    audience: unique([
      ...state.participants.value,
      ...state.plan.audience,
    ]),
    dna: [
      "canonical-cognitive-compiler",
      "universal-evidence-realizer",
      "prompt-authoritative-language",
    ],
  };
}

export function compileCognitiveExperience(
  prompt: string,
  context: ExperienceCompilerContext = {},
): CognitiveCompiledExperience {
  let state = repairOrdinarySubject(
    prompt,
    understandExperience(prompt, context),
  );

  state = retainExplicitParticipants(prompt, state);
  state = {
    ...state,
    plan: {
      ...state.plan,
      direction: state.selectedHypothesis.kind,
    },
  };

  const premise = buildCognitivePremise({
    prompt,
    subject: state.subject,
    participants: state.participants,
    entities: state.entities,
    affordances: state.affordances,
    emotionalIntent: state.emotionalIntent,
    plan: state.plan,
    context,
  });

  const realization = realizeCognitiveExperience({
    plan: state.plan,
    premise,
    evidence: state.subject.evidence,
    hypothesisEvidence: state.selectedHypothesis.evidence,
    prompt,
  });

  state = {
    ...state,
    plan: {
      ...state.plan,
      premise,
      realization,
    },
  };

  const substrate = compileExperienceV16(prompt, context);
  const result = compose(prompt, substrate, state);
  const compiledBlueprint = blueprint(
    substrate.blueprint,
    state,
    result.moments,
  );

  const observation: ExperienceObservation = {
    prompt,
    subject: state.subject.value || substrate.movie.subject,
    activity:
      result.story.beats[0]?.text ??
      substrate.intent.purpose,
    context: unique([
      substrate.intent.domain,
      ...substrate.intent.signals,
    ]),
    entities: state.entities,
    explicitEmotions: state.emotionalIntent,
    audience: unique([
      ...state.participants.value,
      ...state.plan.audience,
    ]),
    temporal: unique([
      ...state.entities.dates,
      ...state.entities.times,
    ]),
    affordances: state.affordances,
    evidence: provenance(state),
  };

  const model = {
    title: substrate.title,
    description: state.plan.purpose,
    industry: "generic",
    goal: "storytelling",
    tone: [...substrate.blueprint.tone],
    moments: compiledBlueprint.moments,
  } as ExperienceModel;

  return {
    ...substrate,
    cognition: state,
    observation,
    situation: {
      subject: observation.subject,
      actors: observation.audience,
      activity: observation.activity,
      setting: observation.context,
      temporal: observation.temporal,
      social:
        observation.audience.length > 1
          ? "shared"
          : observation.audience.length
            ? "solo"
            : "unknown",
      purpose: state.plan.purpose,
      change:
        state.plan.realization?.semanticArc.at(-1) ?? "progress",
      tension: state.plan.storyStructure.join(" → "),
    },
    candidates: result.candidates,
    genome: makeGenome(substrate, state),
    story: result.story,
    blueprint: compiledBlueprint,
    flowSteps: result.story.beats.map((beat, index) => ({
      id: `cognitive-flow-${index + 1}`,
      order: index,
      type: "message",
      payload: {
        beat,
        beatId: beat.id,
        subject: state.subject.value,
        source: "cognitive-experience",
      },
    })),
    moments: result.moments,
    cinematicScenes: result.cinematicScenes,
    scenePlan: result.scenePlan,
    model,
    title: result.story.title,
    estimatedDuration: Math.max(8, result.story.beats.length * 4),
    momentCount: result.story.beats.length,
  };
}
