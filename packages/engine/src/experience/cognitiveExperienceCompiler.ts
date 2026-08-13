import type {
  CognitiveEvidence,
  CognitiveExperienceState,
  ExperienceBlueprint,
  ExperienceGenome,
} from "@qre/contracts";

import { understandExperience } from "../cognition/cognitiveEngine.js";
import { buildCognitivePremise } from "../cognition/premiseBuilder.js";
import { realizeCognitiveExperience } from "../cognition/cognitiveExperienceRealizer.js";
import { guardCognitiveStory } from "../cognition/cognitiveRealizationGuard.js";
import {
  compileStoryExperience,
  type CompiledStoryExperience,
  type ExperienceCompilerContext,
} from "./universalStoryCompiler.js";

/**
 * QRE COGNITIVE EXPERIENCE COMPILER
 *
 * PROMPT → COGNITION → PREMISE/EVIDENCE → SEMANTIC + CREATIVE REALIZATION
 * → UNIVERSAL STORY COMPILATION → BLUEPRINT/FLOW/MOMENTS/SCENES
 *
 * There is one downstream structure authority and one canonical language
 * authority. This boundary only composes them.
 */

export type CognitiveCompiledExperience = CompiledStoryExperience & {
  cognition: CognitiveExperienceState;
};

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

function mergeGenome(genome: ExperienceGenome, cognition: CognitiveExperienceState): ExperienceGenome {
  const selected = cognition.selectedHypothesis;
  return {
    ...genome,
    intent: [...new Set([...genome.intent, selected.kind, ...cognition.motivations.value])],
    archetypes: [...new Set([...genome.archetypes, selected.kind, ...cognition.hypotheses.map((item) => item.kind)])],
    themes: [...new Set([...genome.themes, ...cognition.emotionalIntent, ...cognition.affordances, ...cognition.plan.interactionModel, ...cognition.plan.futureEvolution])],
    emotions: [...new Set([...genome.emotions, ...cognition.emotionalIntent])],
    memory: Math.max(genome.memory, selected.dimensions.memoryPotential),
    discovery: Math.max(genome.discovery, selected.dimensions.discoveryPotential),
    commerce: Math.max(genome.commerce, selected.dimensions.commercialPotential),
    interaction: Math.max(genome.interaction, selected.dimensions.interactionNaturalness),
    replay: Math.max(genome.replay, selected.dimensions.temporalPotential),
    entities: cognition.entities,
    audience: [...new Set([...genome.audience, ...cognition.participants.value, ...cognition.plan.audience])],
    dna: [...new Set([
      ...genome.dna,
      "cognitive-experience-intelligence",
      "evidence-aware",
      "hypothesis-driven",
      "cognitive-plan-directed",
      "premise-conserved",
      "semantic-realization",
      "creative-realization",
      "universal-compiler-substrate",
      `hypothesis:${selected.kind}`,
      ...cognition.affordances.map((value) => `affordance:${value}`),
      ...cognition.plan.dynamicBehavior.map((value) => `dynamic:${value}`),
      ...(cognition.plan.realization?.semanticArc.map((value) => `arc:${value}`) ?? []),
    ])],
  };
}

function mergeBlueprint(blueprint: ExperienceBlueprint, cognition: CognitiveExperienceState): ExperienceBlueprint {
  return {
    ...blueprint,
    cognitivePlan: cognition.plan,
    metadata: {
      ...blueprint.metadata,
      archetypes: [...new Set([...(blueprint.metadata?.archetypes ?? []), cognition.selectedHypothesis.kind, ...cognition.hypotheses.slice(0, 3).map((item) => item.kind)])],
      themes: [...new Set([...(blueprint.metadata?.themes ?? []), ...cognition.emotionalIntent, ...cognition.affordances, ...cognition.plan.futureEvolution, ...cognition.plan.creativePossibilities])],
      dna: [...new Set([...(blueprint.metadata?.dna ?? []), "evidence-aware", "hypothesis-driven", "cognitive-plan", "premise-conserved", "semantic-realization", "creative-realization", "adaptive-experience", "universal-compiler-substrate", ...cognition.assumptions.map(() => "assumption-explicit")])],
    },
  };
}

function directModel(compiled: CompiledStoryExperience, cognition: CognitiveExperienceState): CompiledStoryExperience["model"] {
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
        "creative-realization",
        "universal-compiler-substrate",
        `selected:${cognition.selectedHypothesis.kind}`,
        `subject:${cognition.subject.value}`,
      ],
    },
  };
}

/** Propagate canonical beat text; never invoke a second language brain. */
function propagateCanonicalLanguage(compiled: CompiledStoryExperience): CompiledStoryExperience {
  const beatById = new Map(compiled.story.beats.map((beat) => [beat.id, beat]));
  const story = {
    ...compiled.story,
    hook: compiled.story.beats[0]?.text ?? compiled.story.hook,
    ending: compiled.story.beats.find((beat) => beat.kind === "payoff")?.text ?? compiled.story.beats.at(-1)?.text ?? compiled.story.ending,
    continuation: compiled.story.beats.find((beat) => beat.kind === "continuation")?.text ?? compiled.story.continuation,
  };

  const blueprint = {
    ...compiled.blueprint,
    moments: compiled.blueprint.moments.map((moment) => {
      const beatId = String((moment.payload as { beatId?: unknown } | undefined)?.beatId ?? "");
      const beat = beatById.get(beatId);
      return beat ? { ...moment, description: beat.text } : moment;
    }),
  };

  const flowSteps = compiled.flowSteps.map((step) => {
    const beatId = (step.payload as { beat?: { id?: string } } | undefined)?.beat?.id;
    const beat = beatId ? beatById.get(beatId) : undefined;
    return beat ? { ...step, payload: { ...step.payload, beat } } : step;
  });

  const moments = compiled.moments.map((moment) => {
    const beatId = String((moment.meta as { beatId?: unknown } | undefined)?.beatId ?? "");
    const beat = beatById.get(beatId);
    return beat ? { ...moment, text: beat.text } : moment;
  });

  const scenePlan = compiled.scenePlan.map((scene) => {
    const beat = beatById.get(scene.beatId);
    return beat ? { ...scene, text: beat.text } : scene;
  });

  const cinematicScenes = compiled.cinematicScenes.map((scene, index) => ({
    ...scene,
    moment: moments[index] ?? scene.moment,
  }));

  return { ...compiled, story, blueprint, flowSteps, moments, scenePlan, cinematicScenes };
}

/** Extract a grammatical subject without creating noun-specific branches. */
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

  // "Teach someone how to make sourdough" -> "sourdough".
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
  const normalized = value.replace(/\s+/g, " ").trim();
  return /^(?:teach|teaching|make|making|create|creating|build|building|turn|turning|transform|transforming|how|how to|someone|something|people)\b/i.test(normalized)
    || /\bhow to\b/i.test(normalized);
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
      evidence: alreadyObserved ? existingEvidence : [
        ...existingEvidence,
        {
          source: "prompt",
          detail: `concrete grammatical subject preserved from prompt: ${candidate}`,
          confidence: 0.99,
        },
      ],
    },
    plan: { ...cognition.plan, centralSubject: candidate },
  };
}

/**
 * Convert an explicit participant-choice request into a concrete action.
 *
 * The prompt is the authority here: we do not invent which option was chosen,
 * only preserve the observable fact that a participant chooses a path.
 * This keeps agency experiential instead of leaking the semantic directive
 * ("determine what happens next") into the rendered story.
 */
function realizeExplicitAgency(
  prompt: string,
  compiled: CompiledStoryExperience,
): CompiledStoryExperience {
  if (!/\b(?:choose|chooses|choice|choices|decide|decides|decision|choose their own path|pick|select)\b/i.test(prompt)) {
    return compiled;
  }

  const actionIndex = compiled.story.beats.findIndex((beat) => beat.kind === "action");
  if (actionIndex < 0) return compiled;

  const subject = /\bparticipants?\b/i.test(prompt)
    ? "Participants"
    : compiled.observation.subject || "The participant";
  const existing = compiled.story.beats[actionIndex];

  if (/\b(?:choice|chooses?|decides?|selects?|picks?)\b/i.test(existing.text)) {
    return compiled;
  }

  const actionBeat = {
    ...existing,
    text: `${subject} choose their own path, and that choice determines what they encounter next.`,
  };

  return {
    ...compiled,
    story: {
      ...compiled.story,
      beats: compiled.story.beats.map((beat, index) =>
        index === actionIndex ? actionBeat : beat,
      ),
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

  const compiled = compileStoryExperience(prompt, {
    ...context,
    cognitivePlan: cognition.plan,
  });

  const guarded = {
    ...compiled,
    story: {
      ...compiled.story,
      beats: guardCognitiveStory(compiled.story.beats, cognition.plan),
    },
  };

  const realized = realizeExplicitAgency(prompt, guarded);
  const canonical = propagateCanonicalLanguage(realized);

  return {
    ...canonical,
    cognition,
    genome: mergeGenome(canonical.genome, cognition),
    blueprint: mergeBlueprint(canonical.blueprint, cognition),
    model: directModel(canonical, cognition),
  };
}
