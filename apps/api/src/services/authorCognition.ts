import type { LatentMovieCandidate, RealityGraph } from "@qre/contracts";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph?: RealityGraph;
  memoryContext?: string[];
  priorScenes?: string[];
  priorStrategies?: string[];
  round?: number;
};

export type AttentionCandidate = {
  strategy: string;
  reason: string;
  score: number;
};

export type CharacterFrameCandidate = {
  frame: string;
  reason: string;
  confidence: number;
};

export type CharacterRead = {
  coreTraits: string[];
  contradictions: string[];
  statusPosture: string;
  emotionalPosture: string;
  objectRelationships: string[];
  creativeFrames: CharacterFrameCandidate[];
  allowedMoves: string[];
  avoidedMoves: string[];
};

export type AuthorCognitivePlan = {
  round: number;
  mode:
    | "grounded"
    | "concept"
    | "living_memory"
    | "service"
    | "voice_first";
  subjectIdentity: string;
  permanentTruths: string[];
  currentEvidence: string[];
  contradictions: string[];
  characterRead: CharacterRead;
  attentionCandidates: AttentionCandidate[];
  latentMovieCandidates: LatentMovieCandidate[];
  chosenAttentionStrategy: string;
  operatorMix: string[];
  callbackTargets: string[];
  antiRepetitionRules: string[];
  sceneRules: string[];
  authorBrief: string[];
  realityGraph?: RealityGraph;
};

const GENERIC_BANS = [
  "beautiful transformation",
  "magical moment",
  "unforgettable experience",
  "incredible journey",
  "luxury experience",
  "perfect day",
  "special moment",
  "living world",
];

const STRATEGIES = [
  ["relationship_reveal", "Make the strongest supplied relationship become perceptible without explaining it."],
  ["contrast", "Exploit a supplied expectation violation or competing signals."],
  ["recontextualization", "Let later evidence change what earlier evidence means."],
  ["state_shift", "Make a supported change in state or interpretation carry the sequence."],
  ["recurrence", "Use repeated or returning evidence only when its recurrence changes significance."],
  ["specificity", "Let the most specific supplied detail carry more weight than generic summary."],
  ["endpoint_pull", "Search backward from the supplied ending to discover what makes it land."],
  ["convergence", "Collapse multiple supported signals into one stronger center of gravity."],
  ["tension", "Keep the strongest unresolved tension alive until it earns a release."],
  ["lens_shift", "Let the requested lens alter framing without changing source truth."],
] as const;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniq(values: string[], limit = 20): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
}

function relationCount(graph: RealityGraph | undefined, kind: string): number {
  return graph?.relations.filter((relation) => relation.kind === kind).length ?? 0;
}

function relationStrength(graph: RealityGraph | undefined, kind: string): number {
  const matches = graph?.relations.filter((relation) => relation.kind === kind) ?? [];
  if (!matches.length) return 0;
  return matches.reduce((sum, relation) => sum + relation.strength, 0) / matches.length;
}

function inferMode(input: AuthorCognitionInput): AuthorCognitivePlan["mode"] {
  const evidence =
    input.facts.length +
    input.sourceMoments.length +
    (input.memoryContext?.length ?? 0);
  const lens = clean(input.lens).toLowerCase();

  if (!evidence) {
    return lens.includes("voice") ? "voice_first" : "concept";
  }

  if (input.memoryContext?.length) return "living_memory";
  if (lens.includes("service")) return "service";
  return "grounded";
}

function graphEvidence(input: AuthorCognitionInput): string[] {
  const graph = input.realityGraph;
  if (!graph) return [];

  return uniq([
    ...graph.events.map((event) => event.label),
    ...graph.unresolvedTensions,
    ...graph.recurringSignals,
    ...graph.sensorySignals,
  ], 100);
}

function deriveCoreTraits(graph?: RealityGraph): string[] {
  if (!graph) return [];

  return uniq(
    graph.events
      .map((event) => event.emotionalState ?? "")
      .filter(Boolean),
    8,
  );
}

function deriveObjectRelationships(graph?: RealityGraph): string[] {
  if (!graph) return [];

  return uniq(
    graph.events
      .filter((event) => event.entities.length >= 2)
      .sort((a, b) => b.entities.length - a.entities.length)
      .map((event) => event.label),
    10,
  );
}

function deriveContradictions(graph?: RealityGraph): string[] {
  return uniq(graph?.unresolvedTensions ?? [], 10);
}

function deriveStatusPosture(graph?: RealityGraph): string {
  const contrasts = relationCount(graph, "contrasts");
  const changes = relationCount(graph, "changes");
  const convergence = relationCount(graph, "converges");
  const recurrence = graph?.recurringSignals.length ?? 0;

  if (contrasts && changes) return "defined by competing supplied signals and a possible shift in interpretation";
  if (contrasts) return "defined by an expectation violation between supplied signals";
  if (recurrence) return "defined by continuity whose meaning may change on return";
  if (convergence) return "defined by a strong relational center rather than isolated facts";
  return "defined by the strongest supported evidence relationship";
}

function deriveEmotionalPosture(
  traits: string[],
  contradictions: string[],
): string {
  if (contradictions.length) return `emotion sits inside ${contradictions[0]}`;
  if (traits.length >= 2) return `emotion emerges from ${traits[0]} meeting ${traits[1]}`;
  if (traits.length === 1) return `emotion is carried by ${traits[0]}`;
  return "emotion should be inferred from behavior and relationships, not named without evidence";
}

function deriveCreativeFrames(graph?: RealityGraph): CharacterFrameCandidate[] {
  if (!graph) return [];

  const frames: CharacterFrameCandidate[] = [];
  const add = (frame: string, reason: string, confidence: number) => {
    frames.push({ frame, reason, confidence: Math.max(0, Math.min(1, confidence)) });
  };

  const contrast = relationStrength(graph, "contrasts");
  const change = relationStrength(graph, "changes");
  const reframe = relationStrength(graph, "recontextualizes");
  const converge = relationStrength(graph, "converges");

  if (contrast) add("expectation_violation", "supplied signals do not fit the same obvious reading", 0.62 + contrast * 0.35);
  if (change) add("state_shift", "supplied evidence supports a change that can carry the movie", 0.58 + change * 0.35);
  if (reframe) add("recontextualization", "one supplied detail can alter the meaning of another", 0.62 + reframe * 0.35);
  if (graph.recurringSignals.length) add("continuity_loop", "repetition is available as changed meaning rather than duplicate coverage", 0.64);
  if (converge) add("relational_center", "multiple supplied signals converge on a stronger center", 0.56 + converge * 0.35);
  if (graph.events.some((event) => event.entities.length >= 3)) add("specific_detail", "one supplied observation carries multiple concrete signals", 0.64);
  if (graph.unresolvedTensions.length) add("unresolved_tension", "the graph contains pressure that can pull the next beat", 0.68);

  return frames.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

function deriveCharacterRead(
  input: AuthorCognitionInput,
  contradictions: string[],
): CharacterRead {
  const graph = input.realityGraph;
  const coreTraits = deriveCoreTraits(graph);
  const objectRelationships = deriveObjectRelationships(graph);
  const creativeFrames = deriveCreativeFrames(graph);

  return {
    coreTraits,
    contradictions,
    statusPosture: deriveStatusPosture(graph),
    emotionalPosture: deriveEmotionalPosture(coreTraits, contradictions),
    objectRelationships,
    creativeFrames,
    allowedMoves: [
      "metaphor",
      "personification",
      "status language",
      "double meaning",
      "character-specific exaggeration",
      "understatement",
      "callback",
      "recontextualization",
      "implication",
      "contrast",
    ],
    avoidedMoves: [
      "invented concrete events",
      "invented dialogue",
      "invented reactions",
      "invented people",
      "invented locations",
      "invented physical props",
      "literalizing a metaphorical frame",
      "generic emotional summary",
    ],
  };
}

function scoreStrategy(
  strategy: string,
  input: AuthorCognitionInput,
): number {
  const graph = input.realityGraph;
  const counts = {
    contrasts: relationCount(graph, "contrasts"),
    changes: relationCount(graph, "changes"),
    recontextualizes: relationCount(graph, "recontextualizes"),
    converges: relationCount(graph, "converges"),
    recurrence: graph?.recurringSignals.length ?? 0,
    tensions: graph?.unresolvedTensions.length ?? 0,
    specific: graph?.events.filter((event) => event.entities.length >= 3).length ?? 0,
  };

  const scoreMap: Record<string, number> = {
    relationship_reveal: counts.converges * 12 + counts.changes * 8,
    contrast: counts.contrasts * 22,
    recontextualization: counts.recontextualizes * 20,
    state_shift: counts.changes * 22,
    recurrence: counts.recurrence * 20,
    specificity: counts.specific * 14,
    endpoint_pull: graph?.events.length ? 18 : 0,
    convergence: counts.converges * 20,
    tension: counts.tensions * 20,
    lens_shift: clean(input.lens) ? 14 : 4,
  };

  const base = 40 + (scoreMap[strategy] ?? 0);
  const priorBoost = input.priorStrategies?.some((value) => value.toLowerCase().includes(strategy)) ? 6 : 0;
  const roundBoost = strategy === "recurrence" && (input.round ?? 1) > 1 ? 8 : 0;
  return Math.min(100, base + priorBoost + roundBoost);
}

function candidateReason(strategy: string): string {
  const found = STRATEGIES.find(([name]) => name === strategy);
  return found?.[1] ?? "Use the strongest supported relationship without changing reality.";
}

function inferCandidates(input: AuthorCognitionInput): AttentionCandidate[] {
  return STRATEGIES
    .map(([strategy]) => ({
      strategy,
      reason: candidateReason(strategy),
      score: scoreStrategy(strategy, input),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

function chooseAttention(candidates: AttentionCandidate[], input: AuthorCognitionInput): string {
  const preferred = candidates.find((candidate) => candidate.score >= 60);
  return preferred?.strategy ?? candidates[0]?.strategy ?? "relationship_reveal";
}

function makeOperatorMix(
  chosen: string,
  round: number,
  candidates: AttentionCandidate[],
): string[] {
  const secondary = candidates.find((candidate) => candidate.strategy !== chosen && candidate.score >= 62)?.strategy;
  const base = [
    "establish",
    chosen,
    "micro_reveal",
    "recontextualize",
    "escalate",
    "payoff",
  ];
  if (secondary && round > 1) base.splice(3, 0, secondary);
  return [...new Set(base)].slice(0, 8);
}

function callbackTargets(input: AuthorCognitionInput): string[] {
  const round = Math.max(1, input.round ?? 1);
  return uniq([
    ...(input.realityGraph?.recurringSignals ?? []),
    ...(round > 1 ? input.priorScenes ?? [] : []),
    ...(round > 1 ? input.priorStrategies ?? [] : []),
  ], 14);
}

export function buildAuthorCognitivePlan(
  input: AuthorCognitionInput,
): AuthorCognitivePlan {
  const round = Math.max(1, input.round ?? 1);
  const mode = inferMode(input);
  const graphText = graphEvidence(input);

  const permanentTruths = uniq([
    ...input.facts,
    ...(input.memoryContext ?? []),
  ], 30);

  const currentEvidence = uniq([
    ...input.sourceMoments,
    ...graphText,
  ], 40);

  const contradictions = deriveContradictions(input.realityGraph);
  const characterRead = deriveCharacterRead(input, contradictions);
  const attentionCandidates = inferCandidates(input);

  const latentMovieCandidates = input.realityGraph
    ? searchLatentMovieCandidates({
        graph: input.realityGraph,
        subject: input.subject,
        lens: input.lens,
        limit: 6,
      })
    : [];

  if (input.realityGraph) {
    input.realityGraph.latentMovieCandidates = latentMovieCandidates;
  }

  const chosen = chooseAttention(attentionCandidates, input);
  const operatorMix = makeOperatorMix(chosen, round, attentionCandidates);
  const callbacks = callbackTargets(input);

  const antiRepetitionRules = [
    "Do not repeat the previous chapter's semantic trajectory when a stronger new relationship exists.",
    "A callback must change significance, not merely repeat wording.",
    "Do not restart identity metadata unless identity itself is the discovery.",
    "Prefer the strongest supported details over exhaustive coverage.",
    "Prefer graph relationships over isolated fact repetition.",
    "Finish when the selected payoff lands; do not append explanation.",
  ];

  const sceneRules = [
    "A beat is one perceivable movement of the selected movie.",
    "Every middle beat must perform the approved semantic change rather than name it.",
    "Image and text are parallel layers; text does not need to describe the image.",
    "Grounded creativity may alter framing, implication, juxtaposition, and attitude without inventing reality.",
    "No domain template is authoritative; the graph and selected movie are.",
    "Do not emit planner labels such as strategy, hook, payoff, contrast, or reframe as viewer prose.",
    "Specificity beats generic prettiness.",
  ];

  const graphSummary = input.realityGraph
    ? `REALITY GRAPH: events=${input.realityGraph.events.length}; relations=${input.realityGraph.relations.length}; tensions=${input.realityGraph.unresolvedTensions.length}; recurrence=${input.realityGraph.recurringSignals.length}.`
    : "REALITY GRAPH: unavailable; use direct supplied evidence only.";

  const movieSummary = latentMovieCandidates.length
    ? `LATENT MOVIES: ${latentMovieCandidates.slice(0, 4).map((candidate) => `${candidate.lens}=${candidate.score} [${candidate.hypothesis.slice(0, 1).join("")}]`).join(" | ")}. These are hypotheses, not facts.`
    : "LATENT MOVIES: none; do not invent one.";

  const frameSummary = characterRead.creativeFrames.length
    ? `COGNITIVE FRAMES: ${characterRead.creativeFrames.slice(0, 5).map((frame) => `${frame.frame}=${frame.confidence.toFixed(2)}`).join(" | ")}. Frames are search lenses, not story facts.`
    : "COGNITIVE FRAMES: none; stay close to evidence.";

  const authorBrief = [
    `ROUND ${round}: ${round > 1 ? "continuation; preserve accumulated meaning while discovering what changed" : "origin; discover the strongest center of gravity"}.`,
    `ATTENTION STRATEGY: ${chosen}. ${candidateReason(chosen)}`,
    graphSummary,
    movieSummary,
    frameSummary,
    `CHARACTER READ: ${characterRead.statusPosture}. ${characterRead.emotionalPosture}.`,
    `TRAITS: ${characterRead.coreTraits.join(" | ") || "derive from supplied behavior and relationships"}.`,
    `CONTRADICTIONS: ${contradictions.join(" | ") || "none explicitly detected"}.`,
    `OPERATOR MIX: ${operatorMix.join(", ")}. Private search options, not a forced story.` ,
    `CALLBACK TARGETS: ${callbacks.join(" | ") || "none"}.`,
    "ATTENTION RULE: search for recognition, surprise, meaning change, and payoff rather than sentence decoration.",
    "TASTE RULE: prefer specific, emotionally intelligent, visually concrete language over generic prettiness.",
    `GENERIC BANS: ${GENERIC_BANS.join(", ")}.`,
  ];

  return {
    round,
    mode,
    subjectIdentity: clean(input.subject) || "unknown subject",
    permanentTruths,
    currentEvidence,
    contradictions,
    characterRead,
    attentionCandidates,
    latentMovieCandidates,
    chosenAttentionStrategy: chosen,
    operatorMix,
    callbackTargets: callbacks,
    antiRepetitionRules,
    sceneRules,
    authorBrief,
    realityGraph: input.realityGraph,
  };
}
