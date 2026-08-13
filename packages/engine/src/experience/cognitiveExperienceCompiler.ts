import type {
  CognitiveEvidence,
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceEntities,
  ExperienceGenome,
  ExperienceMeaning,
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
import { guardCognitiveStory } from "../cognition/cognitiveRealizationGuard.js";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";
import { realizePremiseBeat } from "./premiseRealizer.js";
import {
  compileExperienceV16,
  type CompiledExperienceV16,
} from "./experienceCompilerV16.js";
import type { ExperienceCompilerContext } from "./experienceCompilerContext.js";

/**
 * CANONICAL COGNITIVE EXPERIENCE COMPILER
 *
 * PROMPT
 *   → COGNITION
 *   → PREMISE / EVIDENCE
 *   → TRAJECTORY
 *   → V7–V16 EXPERIENCE SUBSTRATE
 *   → ONE STORY / FLOW / MOMENT / SCENE COMPOSITION
 *
 * The deleted universalStoryCompiler was a second architecture layer. It is
 * intentionally gone. This boundary composes the existing cognitive and
 * experience engines and keeps one downstream structure authority here.
 */

export type CognitiveCandidate = {
  id: string;
  beats: StoryBeatKind[];
  score: number;
  rationale: string[];
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

export type CognitiveCompiledExperience = CompiledExperienceV16 & {
  observation: ExperienceObservation;
  situation: CognitiveSituation;
  candidates: CognitiveCandidate[];
  genome: ExperienceGenome;
  story: ExperienceStory;
  scenePlan: StoryScenePlan[];
  model: ExperienceModel;
  /** Canonical runtime moments. */
  moments: Moment[];
  cinematicScenes: CinematicScene[];
  title: string;
  estimatedDuration: number;
  momentCount: number;
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

function explicitNarrativeIntent(prompt: string): boolean {
  return /\b(?:story|stories|narrative|tale|tell the story|storytelling)\b/i.test(prompt);
}

function respectExplicitNarrativeIntent(
  prompt: string,
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  if (!explicitNarrativeIntent(prompt)) return cognition;
  if (cognition.selectedHypothesis.kind === "story") return cognition;

  const evidence: CognitiveEvidence = {
    source: "prompt",
    detail: "explicit narrative/story request",
    confidence: 0.99,
  };

  const selectedHypothesis = {
    ...cognition.selectedHypothesis,
    kind: "story" as const,
    premise: `${cognition.subject.value} unfolds as a sequence of moments`,
    rationale: "The prompt explicitly requests a story or narrative.",
    evidence: [...cognition.selectedHypothesis.evidence, evidence],
    score: Math.max(cognition.selectedHypothesis.score, 0.99),
  };

  return {
    ...cognition,
    selectedHypothesis,
    hypotheses: cognition.hypotheses.map((hypothesis) =>
      hypothesis.kind === "story"
        ? {
            ...hypothesis,
            score: Math.max(hypothesis.score, 0.99),
            evidence: [...hypothesis.evidence, evidence],
          }
        : hypothesis,
    ),
  };
}

function canonicalizeCognition(cognition: CognitiveExperienceState): CognitiveExperienceState {
  return {
    ...cognition,
    plan: {
      ...cognition.plan,
      direction: cognition.selectedHypothesis.kind,
    },
  };
}

function grammaticalSubject(prompt: string): string | undefined {
  const text = prompt.replace(/\s+/g, " ").trim();
  const verbs = "documents?|clean(?:s|ed|ing)?|repairs?|restores?|records?|photographs?|writes?|builds?|creates?|designs?|runs?|owns?|manages?|prepares?|inspects?|visits?|helps?|takes?|makes?|finds?|grooms?|cooks?|sells?|buys?|teaches?|plays?|wears?|drives?|uses?|opens?|closes?|carries?|brings?|delivers?|serves?|hosts?|shares?|celebrates?|explores?|discovers?|collects?|organizes?|organises?|clears?|washes?|fixes?|tests?|checks?|shows?|tells?|turns?|handles?";

  const declarative = text.match(new RegExp(
    `^(?:a|an|the|my|our)?\\s*([\\p{L}][\\p{L}\\p{N}'’-]*(?:\\s+[\\p{L}][\\p{L}\\p{N}'’-]*){0,3})\\s+(?:${verbs})\\b`,
    "iu",
  ));
  if (declarative?.[1]) return declarative[1].trim();

  const imperative = text.match(
    /^(?:make|create|build|design|turn|transform|treat)\s+(?:a|an|the|my|our)?\s*(.+?)(?=\s+(?:into|like|feel|become|as|a|an|for|so|that|which)\b|[.!?]|$)/i,
  );
  if (imperative?.[1]) return imperative[1].trim();

  const instructional = text.match(
    /\b(?:make|cook|bake|build|create|design|draw|write)\s+(?:a|an|the)?\s*([^,.!?]+?)(?=\s+(?:for|with|using|at|in|on|today|tonight)\b|[,.!?]|$)/i,
  );
  if (instructional?.[1]) {
    const candidate = instructional[1].trim();
    if (candidate && !/^(?:someone|something|people|how|how to)$/i.test(candidate)) return candidate;
  }

  const objectFirst = text.match(
    /^(?:turn|transform|make)\s+(?:a|an|the|my|our)?\s*(.+?)\s+(?:into|feel like|become)\b/i,
  );
  return objectFirst?.[1]?.trim();
}

function looksLikeInstructionSubject(value: string): boolean {
  return /^(?:teach|teaching|make|making|create|creating|build|building|turn|turning|transform|transforming|how|how to|someone|something|people)\b/i.test(value)
    || /\bhow to\b/i.test(value);
}

function enrichConcreteSubjectEvidence(prompt: string, cognition: CognitiveExperienceState): CognitiveExperienceState {
  const candidate = grammaticalSubject(prompt);
  const current = cognition.subject.value.trim();
  const currentLooksMalformed = /^n\b/i.test(current);

  if (!candidate || (!currentLooksMalformed && current && !looksLikeInstructionSubject(current))) return cognition;

  const existingEvidence = cognition.subject.evidence ?? [];
  const alreadyObserved = existingEvidence.some(
    (evidence) => evidence.source === "prompt" && evidence.detail.toLowerCase().includes(candidate.toLowerCase()),
  );

  return {
    ...cognition,
    subject: {
      ...cognition.subject,
      value: candidate,
      status: "observed",
      confidence: Math.max(cognition.subject.confidence, 0.99),
      evidence: alreadyObserved
        ? existingEvidence
        : [...existingEvidence, {
            source: "prompt",
            detail: `concrete grammatical subject preserved from prompt: ${candidate}`,
            confidence: 0.99,
          }],
    },
    plan: { ...cognition.plan, centralSubject: candidate },
  };
}

function provenance(cognition: CognitiveExperienceState): StoryProvenance[] {
  return cognition.subject.evidence.map((evidence) => ({
    kind: evidence.source === "creative_realization" ? "playful" : evidence.source === "prompt" ? "observed" : "inferred",
    source: evidence.source,
    confidence: evidence.confidence,
  }));
}

function storyEntities(entities: ExperienceEntities, subject: string): string[] {
  return unique([
    subject,
    ...entities.people,
    ...entities.places,
    ...entities.events,
    ...entities.products,
    ...entities.media,
  ]);
}

function directiveFor(kind: StoryBeatKind, cognition: CognitiveExperienceState) {
  return cognition.plan.realization?.directives.find((directive) => directive.kind === kind);
}

function buildStory(
  prompt: string,
  compiled: CompiledExperienceV16,
  cognition: CognitiveExperienceState,
): { story: ExperienceStory; scenePlan: StoryScenePlan[]; moments: Moment[]; cinematicScenes: CinematicScene[] } {
  const trajectory = composeCognitiveTrajectory({ plan: cognition.plan, prompt });
  const baseProvenance = provenance(cognition);
  const entities = storyEntities(cognition.entities, compiled.movie.subject);

  const skeleton: StoryBeat[] = trajectory.beats.map((kind, index) => {
    const source = compiled.movie.beats[index];
    const directive = directiveFor(kind, cognition);
    return {
      id: `cognitive-${index + 1}`,
      kind,
      order: index,
      purpose: directive?.intent ?? `${kind} in the selected cognitive trajectory`,
      text: source?.text ?? realizePremiseBeat({
        id: `cognitive-seed-${index + 1}`,
        kind,
        order: index,
        purpose: kind,
        text: "",
        entities,
        provenance: baseProvenance,
        directive,
      }, cognition.plan),
      emotionalTarget: cognition.emotionalIntent[index % Math.max(1, cognition.emotionalIntent.length)],
      entities,
      provenance: source
        ? source.sourceFactIds.map((factId) => ({ kind: "observed", source: factId, confidence: 1 }))
        : baseProvenance,
      directive,
    };
  });

  const guarded = guardCognitiveStory(skeleton, cognition.plan);
  const repaired = guarded.map((beat, index) => {
    if (beat.text.trim()) return beat;
    const source = compiled.movie.beats[index];
    const fallback = source?.text ?? realizePremiseBeat(beat, cognition.plan);
    return { ...beat, text: fallback || `${compiled.movie.subject} moves into the next moment.` };
  });

  const beats = repaired.map((beat, index) => ({
    ...beat,
    text: beat.text.trim().endsWith(".") ? beat.text.trim() : `${beat.text.trim()}.`,
    order: index,
  }));

  const story: ExperienceStory = {
    title: compiled.title,
    hook: beats[0]?.text ?? compiled.title,
    logline: `${compiled.movie.subject} unfolds through ${beats.length} connected moments.`,
    beats,
    ending: beats.at(-1)?.text ?? compiled.title,
    continuation: cognition.plan.futureEvolution.length
      ? cognition.plan.futureEvolution[0]
      : compiled.movie.beats.at(-1)?.text,
    tone: compiled.blueprint.tone,
    provenance: baseProvenance,
  };

  const moments: Moment[] = beats.map((beat, index) => ({
    type: "message",
    order: index,
    text: beat.text,
    meta: { beatId: beat.id, kind: beat.kind, duration: 4000 },
  }));

  const scenePlan: StoryScenePlan[] = beats.map((beat, index) => ({
    id: `cognitive-scene-${index + 1}`,
    order: index,
    beatId: beat.id,
    purpose: beat.purpose,
    text: beat.text,
    emotionalTarget: beat.emotionalTarget,
    entities: beat.entities,
    duration: 4,
    transition: index === 0 ? "none" : index === beats.length - 1 ? "cinematic" : "fade",
    visual: {
      theme: "cinematic",
      animation: index === 0 ? "slow_zoom" : "parallax",
    },
    provenance: beat.provenance,
  }));

  const cinematicScenes: CinematicScene[] = moments.map((moment, index) => ({
    id: `cognitive-cinematic-${index + 1}`,
    type: index === 0 ? "intro" : index === beats.length - 1 ? "emotion" : "action",
    duration: 4000,
    moment,
    order: index,
    transition: scenePlan[index]?.transition,
    visual: scenePlan[index]?.visual,
    preload: index < moments.length - 1,
    meta: { beatId: beats[index]?.id, kind: beats[index]?.kind },
  }));

  return { story, scenePlan, moments, cinematicScenes };
}

function mergeBlueprint(
  blueprint: ExperienceBlueprint,
  cognition: CognitiveExperienceState,
  moments: ExperienceMoment[],
): ExperienceBlueprint {
  return {
    ...blueprint,
    cognitivePlan: cognition.plan,
    moments,
    metadata: {
      ...blueprint.metadata,
      archetypes: unique([
        ...(blueprint.metadata?.archetypes ?? []),
        cognition.selectedHypothesis.kind,
        ...cognition.hypotheses.slice(0, 3).map((item) => item.kind),
      ]),
      themes: unique([
        ...(blueprint.metadata?.themes ?? []),
        ...cognition.emotionalIntent,
        ...cognition.affordances,
        ...cognition.plan.futureEvolution,
      ]),
      dna: unique([
        ...(blueprint.metadata?.dna ?? []),
        "canonical-cognitive-compiler",
        "evidence-aware",
        "hypothesis-driven",
        "premise-conserved",
        "single-language-authority",
      ]),
    },
  };
}

function buildGenome(
  compiled: CompiledExperienceV16,
  cognition: CognitiveExperienceState,
): ExperienceGenome {
  const selected = cognition.selectedHypothesis;
  const toneText = [...compiled.blueprint.tone, ...cognition.emotionalIntent].join(" ").toLowerCase();
  const energy: ExperienceGenome["energy"] = /funny|playful|joy|delight/.test(toneText)
    ? "playful"
    : /dark|horror|mystery|mysterious/.test(toneText)
      ? "mysterious"
      : /warm|love|emotional/.test(toneText)
        ? "emotional"
        : "cinematic" as ExperienceGenome["energy"];

  const journey: ExperienceGenome["journey"] = composeCognitiveTrajectory({ plan: cognition.plan, prompt: cognition.prompt }).beats.flatMap((kind) => {
    if (kind === "orientation" || kind === "hook" || kind === "encounter") return ["arrival"];
    if (kind === "discovery" || kind === "reveal") return ["discovery"];
    if (kind === "transformation") return ["transformation"];
    if (kind === "payoff" || kind === "milestone" || kind === "unlock") return ["peak"];
    if (kind === "reflection" || kind === "origin") return ["memory"];
    if (kind === "continuation" || kind === "next_step") return ["return"];
    return [];
  });

  const interpretation = {
    intent: [selected.kind],
    concepts: unique([cognition.subject.value, ...cognition.affordances, ...cognition.plan.interactionModel]),
    emotionalSignals: cognition.emotionalIntent,
    worldSignals: unique([...cognition.geographicOpportunities, ...cognition.socialOpportunities]),
    cognitiveSignals: unique([
      ...cognition.plan.dynamicBehavior,
      ...cognition.plan.futureEvolution,
      ...cognition.plan.discoveryModel,
    ]),
    confidence: selected.score,
  };

  const meaning: ExperienceMeaning = compiled.blueprint.meaning;
  const relationships: ExperienceGenome["relationships"] = cognition.participants.value.map((participant) => ({
    subject: cognition.subject.value,
    predicate: "shared_with",
    object: participant,
    confidence: cognition.participants.confidence,
  }));

  return {
    intent: unique([selected.kind, compiled.intent.purpose]),
    interpretation,
    archetypes: unique([selected.kind, compiled.intent.subjectKind]),
    themes: unique([...cognition.emotionalIntent, ...cognition.affordances, ...cognition.plan.futureEvolution]),
    emotions: cognition.emotionalIntent,
    meaning,
    relationships,
    energy,
    pacing: composeCognitiveTrajectory({ plan: cognition.plan, prompt: cognition.prompt }).beats.length >= 6 ? "fast" : "medium",
    social: cognition.participants.value.length > 1 ? "shared" : "solo",
    journey: unique(journey),
    discovery: selected.dimensions.discoveryPotential,
    memory: selected.dimensions.memoryPotential,
    commerce: selected.dimensions.commercialPotential,
    immersion: selected.dimensions.temporalPotential,
    interaction: selected.dimensions.interactionNaturalness,
    replay: selected.dimensions.temporalPotential,
    entities: cognition.entities,
    environments: unique([
      ...cognition.entities.places,
      ...cognition.entities.events,
    ]),
    audience: unique([
      ...cognition.participants.value,
      ...cognition.plan.audience,
    ]),
    dna: unique([
      "canonical-cognitive-compiler",
      "cognitive-trajectory",
      "premise-conserved",
      "evidence-aware",
      ...cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
    ]),
  };
}

function buildModel(
  compiled: CompiledExperienceV16,
  cognition: CognitiveExperienceState,
  moments: Moment[],
): ExperienceModel {
  const industry: ExperienceModel["industry"] =
    compiled.intent.domain === "dog_grooming" ? "pet" :
    compiled.intent.domain === "housekeeping" ? "service" :
    compiled.intent.domain === "real_estate" ? "real_estate" :
    compiled.intent.domain === "restaurant" ? "restaurant" :
    compiled.intent.domain === "wedding" ? "wedding" :
    compiled.intent.domain === "artist" ? "artist" :
    compiled.intent.domain === "travel" ? "event" :
    "generic";

  const goal: ExperienceModel["goal"] =
    compiled.intent.purpose === "business" ? "conversion" :
    compiled.intent.purpose === "memory" ? "memory" :
    compiled.intent.purpose === "event" ? "storytelling" :
    compiled.intent.purpose === "collection" ? "collect_leads" :
    "storytelling";

  return {
    title: compiled.title,
    description: cognition.plan.purpose,
    industry,
    goal,
    tone: compiled.blueprint.tone,
    moments,
    metadata: {
      category: compiled.intent.domain,
      tags: unique([
        "canonical-cognitive-compiler",
        `selected:${cognition.selectedHypothesis.kind}`,
        `subject:${cognition.subject.value}`,
      ]),
    },
  };
}

function buildObservation(
  prompt: string,
  compiled: ExperienceCompilerV16,
  cognition: CognitiveExperienceState,
): ExperienceObservation {
  return {
    prompt,
    subject: cognition.subject.value || compiled.movie.subject,
    activity: compiled.movie.beats[0]?.text ?? compiled.intent.purpose,
    context: unique([
      compiled.intent.domain,
      ...(compiled.intent.signals ?? []),
    ]),
    entities: cognition.entities,
    explicitEmotions: cognition.emotionalIntent,
    audience: unique([...cognition.participants.value, ...cognition.plan.audience]),
    temporal: unique([
      ...cognition.entities.dates,
      ...cognition.entities.times,
    ]),
    affordances: cognition.affordances,
    evidence: provenance(cognition),
  };
}

function directModelMetadata(model: ExperienceModel, cognition: CognitiveExperienceState): ExperienceModel {
  return {
    ...model,
    metadata: {
      ...model.metadata,
      tags: unique([
        ...(model.metadata?.tags ?? []),
        "premise-conserved",
        "semantic-realization",
        "creative-realization",
      ]),
    },
  };
}

export function compileCognitiveExperience(
  prompt: string,
  context: ExperienceCompilerContext = {},
): CognitiveCompiledExperience {
  const cognitionBase = canonicalizeCognition(
    enrichConcreteSubjectEvidence(
      prompt,
      respectExplicitNarrativeIntent(prompt, understandExperience(prompt, context)),
    ),
  );

  const premise = buildCognitivePremise({
    prompt,
    subject: cognitionBase.subject,
    participants: cognitionBase.participants,
    entities: cognitionBase.entities,
    affordances: cognitionBase.affordances,
    emotionalIntent: cognitionBase.emotionalIntent,
    plan: cognitionBase.plan,
    context,
  });

  const realization = realizeCognitiveExperience({
    plan: cognitionBase.plan,
    premise,
    evidence: cognitionBase.subject.evidence,
    hypothesisEvidence: cognitionBase.selectedHypothesis.evidence,
    prompt,
  });

  const cognition: CognitiveExperienceState = {
    ...cognitionBase,
    plan: { ...cognitionBase.plan, premise, realization },
  };

  // V16 remains the canonical memory/experience substrate. Story structure is
  // composed once below from its movie plus the authoritative cognitive plan.
  const compiled = compileExperienceV16(prompt, {
    ...context,
    cognitivePlan: cognition.plan,
  });

  const { story, scenePlan, moments, cinematicScenes } = buildStory(prompt, compiled, cognition);
  const blueprintMoments: ExperienceMoment[] = moments.map((moment, index) => ({
    type: index === 0 ? "introduction" : index === moments.length - 1 ? "completion" : "story",
    component: "story",
    title: index === 0 ? "The beginning" : index === moments.length - 1 ? "The moment that stayed" : "And then",
    subtitle: cognition.subject.value,
    description: moment.text,
    editable: true,
    demo: false,
    order: index,
    payload: { beatId: story.beats[index]?.id, source: "cognitive-experience" },
  }));

  const blueprint = mergeBlueprint(compiled.blueprint, cognition, blueprintMoments);
  const genome = buildGenome(compiled, cognition);
  const model = directModelMetadata(buildModel(compiled, cognition, moments), cognition);
  const observation = buildObservation(prompt, compiled, cognition);
  const trajectory = composeCognitiveTrajectory({ plan: cognition.plan, prompt });

  return {
    ...compiled,
    observation,
    situation: {
      subject: observation.subject,
      actors: observation.audience,
      activity: observation.activity,
      setting: observation.context,
      temporal: observation.temporal,
      social: observation.audience.length > 1 ? "shared" : observation.audience.length === 1 ? "solo" : "unknown",
      purpose: cognition.plan.purpose,
      change: cognition.plan.realization?.semanticArc.at(-1) ?? "the experience progresses through connected moments",
      tension: cognition.plan.storyStructure.join(" → "),
    },
    candidates: trajectory.candidates.map((candidate) => ({
      id: candidate.id,
      beats: candidate.beats,
      score: candidate.score,
      rationale: candidate.rationale,
    })),
    genome,
    story,
    blueprint,
    flowSteps: story.beats.map((beat, index) => ({
      id: `cognitive-flow-${index + 1}`,
      order: index,
      type: "message",
      payload: {
        beat,
        beatId: beat.id,
        subject: cognition.subject.value,
        source: "cognitive-experience",
      },
    })),
    moments,
    cinematicScenes,
    scenePlan,
    model,
    title: story.title,
    estimatedDuration: Math.max(8, story.beats.length * 4),
    momentCount: story.beats.length,
    cognition,
  };
}
