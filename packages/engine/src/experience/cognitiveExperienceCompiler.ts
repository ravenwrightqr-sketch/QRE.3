import type {
  CognitiveEvidence,
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceGenome,
} from "@qre/contracts";

import { understandExperience } from "../cognition/cognitiveEngine.js";
import { buildCognitivePremise } from "../cognition/premiseBuilder.js";
import { realizeCognitiveExperience } from "../cognition/cognitiveExperienceRealizer.js";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type StoryCompilerContext,
} from "./universalStoryCompiler.js";
import { elevateStoryBeats } from "./eloquentStoryRealizer.js";

/**
 * ============================================================
 * QRE COGNITIVE EXPERIENCE COMPILER — ARCHITECTURE LOCK
 * ============================================================
 *
 * PURPOSE:
 *   Canonical composition boundary for turning a raw human prompt into
 *   a cognitively directed experience.
 *
 * CANONICAL PIPELINE:
 *   PROMPT
 *     → COGNITIVE UNDERSTANDING
 *     → CONSERVED PREMISE / EVIDENCE RELATIONSHIPS
 *     → EVIDENCE
 *     → MEANING
 *     → HYPOTHESES
 *     → OPPORTUNITY SPACE
 *     → SELECTED EXPERIENCE DIRECTION
 *     → COGNITIVE PLAN
 *     → SEMANTIC REALIZATION
 *     → UNIVERSAL COMPILATION
 *     → PREMISE LANGUAGE REALIZATION
 *     → BLUEPRINT
 *     → FLOW
 *     → MOMENTS
 *     → CINEMATIC SCENES
 *
 * ARCHITECTURE RULE:
 *   THE COMPILER BECOMES SMARTER.
 *   IT DOES NOT INVENT ANOTHER ARCHITECTURE.
 *
 * CONTRACT RULE:
 *   Shared semantic shapes come from @qre/contracts.
 *   Engine-local duplicate semantic contracts are not authoritative.
 *
 * COGNITIVE RULE:
 *   Cognition decides what the experience could become.
 *   Semantic realization records how each operation should change the
 *   experiential state. It does not manufacture facts.
 *
 * LANGUAGE RULE:
 *   Language realization happens after cognition and story structure are
 *   selected. It may improve cadence and clarity, but it may not invent
 *   facts, alter the selected direction, or create a parallel planner.
 *
 * CONTINUITY RULE:
 *   This file composes the existing compiler layers; it does not create
 *   a parallel runtime pipeline.
 *
 * ============================================================
 */

export type CognitiveCompiledExperience = CompiledStoryExperience & {
  cognition: CognitiveExperienceState;
};

function explicitNarrativeIntent(prompt: string): boolean {
  return /\b(?:story|stories|narrative|tale|tell the story|storytelling)\b/i.test(
    prompt,
  );
}

/**
 * The hypothesis scorer intentionally compares several experiential modes.
 * An explicit narrative request is stronger evidence than a near-tie between
 * abstract dimensions (for example identity vs. story differing by 0.0001).
 * Preserve the existing hypothesis set, but make the user's declared
 * narrative intent authoritative at the composition boundary.
 */
function respectExplicitNarrativeIntent(
  prompt: string,
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  if (!explicitNarrativeIntent(prompt)) {
    return cognition;
  }

  if (cognition.selectedHypothesis.kind === "story") {
    return cognition;
  }

  const evidence: CognitiveEvidence = {
    source: "prompt",
    detail: "explicit narrative/story request",
    confidence: 0.99,
  };

  const selectedHypothesis = {
    ...cognition.selectedHypothesis,
    kind: "story" as const,
    premise: `${cognition.subject.value} unfolds as a sequence of meaningful moments`,
    rationale:
      "The prompt explicitly requests a story or narrative, so narrative form is the declared experience direction.",
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

function canonicalizeCognition(
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  return {
    ...cognition,
    plan: {
      ...cognition.plan,
      direction: cognition.selectedHypothesis.kind,
    },
  };
}

function mergeGenome(
  genome: ExperienceGenome,
  cognition: CognitiveExperienceState,
): ExperienceGenome {
  const selected = cognition.selectedHypothesis;

  return {
    ...genome,
    intent: [
      ...new Set([
        ...genome.intent,
        selected.kind,
        ...cognition.motivations.value,
      ]),
    ],
    archetypes: [
      ...new Set([
        ...genome.archetypes,
        selected.kind,
        ...cognition.hypotheses.map((item) => item.kind),
      ]),
    ],
    themes: [
      ...new Set([
        ...genome.themes,
        ...cognition.emotionalIntent,
        ...cognition.affordances,
        ...cognition.plan.interactionModel,
        ...cognition.plan.futureEvolution,
      ]),
    ],
    emotions: [
      ...new Set([...genome.emotions, ...cognition.emotionalIntent]),
    ],
    memory: Math.max(
      genome.memory,
      selected.dimensions.memoryPotential,
    ),
    discovery: Math.max(
      genome.discovery,
      selected.dimensions.discoveryPotential,
    ),
    commerce: Math.max(
      genome.commerce,
      selected.dimensions.commercialPotential,
    ),
    interaction: Math.max(
      genome.interaction,
      selected.dimensions.interactionNaturalness,
    ),
    replay: Math.max(
      genome.replay,
      selected.dimensions.temporalPotential,
    ),
    entities: cognition.entities,
    audience: [
      ...new Set([
        ...genome.audience,
        ...cognition.participants.value,
        ...cognition.plan.audience,
      ]),
    ],
    dna: [
      ...new Set([
        ...genome.dna,
        "cognitive-experience-intelligence",
        "evidence-aware",
        "hypothesis-driven",
        "cognitive-plan-directed",
        "premise-conserved",
        "semantic-realization",
        "universal-compiler-substrate",
        `hypothesis:${selected.kind}`,
        ...cognition.affordances.map((value) => `affordance:${value}`),
        ...cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
        ...(cognition.plan.realization?.semanticArc.map((value) => `arc:${value}`) ?? []),
      ]),
    ],
  };
}

function mergeBlueprint(
  blueprint: ExperienceBlueprint,
  cognition: CognitiveExperienceState,
): ExperienceBlueprint {
  return {
    ...blueprint,
    cognitivePlan: cognition.plan,
    metadata: {
      ...blueprint.metadata,
      archetypes: [
        ...new Set([
          ...(blueprint.metadata?.archetypes ?? []),
          cognition.selectedHypothesis.kind,
          ...cognition.hypotheses.slice(0, 3).map((item) => item.kind),
        ]),
      ],
      themes: [
        ...new Set([
          ...(blueprint.metadata?.themes ?? []),
          ...cognition.emotionalIntent,
          ...cognition.affordances,
          ...cognition.plan.futureEvolution,
          ...cognition.plan.creativePossibilities,
        ]),
      ],
      dna: [
        ...new Set([
          ...(blueprint.metadata?.dna ?? []),
          "evidence-aware",
          "hypothesis-driven",
          "cognitive-plan",
          "premise-conserved",
          "semantic-realization",
          "adaptive-experience",
          "universal-compiler-substrate",
          ...cognition.assumptions.map(() => "assumption-explicit"),
        ]),
      ],
    },
  };
}

function directModel(
  compiled: CompiledStoryExperience,
  cognition: CognitiveExperienceState,
): CompiledStoryExperience["model"] {
  return {
    ...compiled.model,
    title: compiled.title,
    description: cognition.plan.purpose,
    metadata: {
      ...compiled.model.metadata,
      tags: [
        ...((compiled.model.metadata?.tags ?? []) as string[]),
        "cognitive-experience-intelligence",
        "cognitive-plan-directed",
        "premise-conserved",
        "semantic-realization",
        "universal-compiler-substrate",
        "eloquent-language-realization",
        `selected:${cognition.selectedHypothesis.kind}`,
        `subject:${cognition.subject.value}`,
      ],
    },
  };
}

/**
 * Apply the language layer once, then propagate the realized text through
 * every presentation representation that carries story copy.
 *
 * The semantic structure is untouched. Only the already-selected beat text
 * is improved, and every downstream representation receives the same text so
 * the blueprint, flow, moment, scene-plan, and cinematic scene cannot drift.
 */
function realizeLanguage(
  compiled: CompiledStoryExperience,
  cognition: CognitiveExperienceState,
): CompiledStoryExperience {
  const beats = elevateStoryBeats(
    compiled.story.beats,
    cognition.plan,
  );

  const beatById = new Map(
    beats.map((beat) => [beat.id, beat]),
  );

  const story = {
    ...compiled.story,
    beats,
    hook: beats[0]?.text ?? compiled.story.hook,
    ending:
      beats.find((beat) => beat.kind === "payoff")?.text ??
      beats.at(-1)?.text ??
      compiled.story.ending,
    continuation:
      beats.find((beat) => beat.kind === "continuation")?.text ??
      compiled.story.continuation,
  };

  const blueprint = {
    ...compiled.blueprint,
    moments: compiled.blueprint.moments.map((moment) => {
      const beatId = String(
        (moment.payload as { beatId?: unknown } | undefined)?.beatId ?? "",
      );
      const beat = beatById.get(beatId);
      return beat
        ? {
            ...moment,
            description: beat.text,
          }
        : moment;
    }),
  };

  const flowSteps = compiled.flowSteps.map((step) => {
    const payload = step.payload as
      | { beat?: { id?: string } }
      | undefined;
    const beatId = payload?.beat?.id;
    const beat = beatId ? beatById.get(beatId) : undefined;

    return beat
      ? {
          ...step,
          payload: {
            ...step.payload,
            beat,
          },
        }
      : step;
  });

  const moments = compiled.moments.map((moment) => {
    const beatId = String(
      (moment.meta as { beatId?: unknown } | undefined)?.beatId ?? "",
    );
    const beat = beatById.get(beatId);

    return beat
      ? {
          ...moment,
          text: beat.text,
        }
      : moment;
  });

  const scenePlan = compiled.scenePlan.map((scene) => {
    const beat = beatById.get(scene.beatId);
    return beat
      ? {
          ...scene,
          text: beat.text,
        }
      : scene;
  });

  const cinematicScenes = compiled.cinematicScenes.map(
    (scene, index) => ({
      ...scene,
      moment: moments[index] ?? scene.moment,
    }),
  );

  return {
    ...compiled,
    story,
    blueprint,
    flowSteps,
    moments,
    scenePlan,
    cinematicScenes,
  };
}

function enrichConcreteSubjectEvidence(
  prompt: string,
  cognition: CognitiveExperienceState,
): CognitiveExperienceState {
  const concrete =
    prompt.match(
      /\bfor\s+((?:the|a|an)\s+[\p{L}\p{N}'’-]+(?:\s+[\p{L}\p{N}'’-]+){0,4}|[A-Z][\p{L}\p{N}'’-]*(?:\s+(?:the|a|an)\s+[\p{L}\p{N}'’-]+){0,4})\b/u,
    )?.[1]
      ?.replace(/\s+/g, " ")
      .trim();

  if (!concrete) {
    return cognition;
  }

  const existingEvidence = cognition.subject.evidence ?? [];

  const alreadyObserved = existingEvidence.some(
    (evidence) =>
      evidence.source === "prompt" &&
      evidence.detail.toLowerCase().includes(concrete.toLowerCase()),
  );

  return {
    ...cognition,
    subject: {
      ...cognition.subject,
      value: concrete,
      status: "observed",
      confidence: Math.max(cognition.subject.confidence, 0.99),
      evidence: alreadyObserved
        ? existingEvidence
        : [
            ...existingEvidence,
            {
              source: "prompt",
              detail: `concrete subject preserved from prompt: ${concrete}`,
              confidence: 0.99,
            },
          ],
    },
    plan: {
      ...cognition.plan,
      centralSubject: concrete,
    },
  };
}
/**
 * Canonical public compiler entry point.
 *
 * Cognition runs first. The conserved premise and semantic realization are
 * then supplied directly to the universal compiler, which remains the only
 * runtime-shape compilation path.
 */
export function compileCognitiveExperience(
  prompt: string,
  context: StoryCompilerContext = {},
): CognitiveCompiledExperience {
   const cognitionBase = canonicalizeCognition(
  enrichConcreteSubjectEvidence(
    prompt,
    respectExplicitNarrativeIntent(
      prompt,
      understandExperience(prompt, context),
    ),
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
  });

  const cognition: CognitiveExperienceState = {
    ...cognitionBase,
    plan: {
      ...cognitionBase.plan,
      premise,
      realization,
    },
  };

  const compiled = compileStoryExperience(prompt, {
    ...context,
    cognitivePlan: cognition.plan,
  });

  const realized = realizeLanguage(compiled, cognition);

  return {
    ...realized,
    cognition,
    genome: mergeGenome(realized.genome, cognition),
    blueprint: mergeBlueprint(realized.blueprint, cognition),
    model: directModel(realized, cognition),
  };
}
