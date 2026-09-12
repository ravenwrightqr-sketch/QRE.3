/**
 * QRE UNIVERSAL COGNITION
 *
 * Author cognition discovers grounded semantic relationships and prepares a
 * sequence-text film possibility. "LatentMovie" is only a compatibility name
 * for that sequence structure: text moving as a sequence, never a conventional
 * movie, screenplay, shot list, audiovisual plan, or cinematic production brief.
 *
 * RealityGraph is source truth. Cognition may interpret supplied relationships;
 * it must never invent events, people, actions, chronology, or production form.
 */
import type {
  AuthorDomainContext,
  AuthorCreativeProposition,
  CreativeFrameSelection,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  SubjectTruth,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";

export type AuthorCognitionInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  realityGraph: RealityGraph;
  domainContext?: AuthorDomainContext;
  memoryContext?: string[];
  trajectory?: string[];
  creativeLearningContext?: string[];
  returning?: boolean;
  visitNumber?: number;
};

export type AuthorCreativeInterpretation = {
  id: string;
  thesis: string;
  creativeOpportunity: string;
  rationale: string;
  evidenceEventIds: string[];
  confidence: number;
};

export type AuthorAdaptiveQuestion = {
  kind: "who" | "where" | "when" | "event" | "detail";
  question: string;
  reason: string;
};

export type AuthorSubjectMaterial = {
  identity: string[];
  traits: string[];
  preferences: string[];
  routines: string[];
  goals: string[];
  relationships: string[];
  memories: string[];
  other: string[];
};

export type AuthorCognitionPlan = {
  selectedLens: string;
  frame: CreativeFrameSelection;
  interpretations: AuthorCreativeInterpretation[];
  latentMovieCandidates: LatentMovieCandidate[];
  selectedMovie?: LatentMovieCandidate;
  adaptiveQuestions: AuthorAdaptiveQuestion[];
  attentionStrategy: string;
  reasoningSummary: string[];
  subjectTruth: SubjectTruth;
  subjectMaterial: AuthorSubjectMaterial;
  artistDirection: AuthorArtistDirection;
  model: string;
  modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, Number(number.toFixed(3)))) : fallback;
};
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const PREFERENCE = /\b(?:love|loves|like|likes|enjoy|enjoys|prefer|prefers|favorite|favourite|hate|hates)\b/i;
const IDENTITY = /\b(?:my name is|named|is a|is an|breed|type|kind|male|female|small|large|tall|short|young|old)\b/i;
const ROUTINE = /\b(?:every day|every morning|every night|daily|weekly|usually|often|always|routine|habit|regularly)\b/i;
const GOAL = /\b(?:want to|wants to|hope to|hopes to|trying to|plan to|plans to|goal|would like to)\b/i;
const MEMORY = /\b(?:remember|remembered|memory|when we|years ago|used to)\b/i;
const OCCURRENCE = /\b(?:today|yesterday|tomorrow|this morning|this afternoon|tonight|last night|earlier|later|then|after that|before that|first|finally|went|walked|ran|arrived|met|found|lost|bought|sold|opened|closed|returned|visited|called|watched|heard|saw|chased|caught|finished|started|happened)\b/i;
const PAST = /\b(?:was|were|did|had|went|ran|came|met|found|lost|bought|sold|saw|heard|watched|returned|finished|started|[a-z]+ed\b)\b/i;

const OPS = new Set<LatentMovieTrajectoryStep["operation"]>([
  "establish",
  "contrast",
  "recur",
  "reframe",
  "escalate",
  "converge",
  "reveal",
  "consequence",
  "payoff",
]);

function parseModel(text: string): Record<string, unknown> | undefined {
  const normalized = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(normalized);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
  } catch {
    const start = normalized.indexOf("{");
    const end = normalized.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      const parsed = JSON.parse(normalized.slice(start, end + 1));
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function classifyMaterial(facts: readonly string[]): AuthorSubjectMaterial {
  const material: AuthorSubjectMaterial = {
    identity: [],
    traits: [],
    preferences: [],
    routines: [],
    goals: [],
    relationships: [],
    memories: [],
    other: [],
  };
  for (const raw of facts) {
    const value = clean(raw);
    if (!value) continue;
    if (MEMORY.test(value)) material.memories.push(value);
    else if (/\b(?:wife|husband|mom|dad|sister|brother|friend|partner|belongs to|owned by|with me)\b/i.test(value)) material.relationships.push(value);
    else if (GOAL.test(value)) material.goals.push(value);
    else if (PREFERENCE.test(value)) material.preferences.push(value);
    else if (ROUTINE.test(value)) material.routines.push(value);
    else if (IDENTITY.test(value)) material.identity.push(value);
    else material.other.push(value);
  }
  return material;
}

function subjectTruthFrom(input: AuthorCognitionInput, material: AuthorSubjectMaterial): SubjectTruth {
  const allIdentity = [...material.identity, ...material.other];
  const sex = allIdentity.some((value) => /\bfemale\b/i.test(value))
    ? "female"
    : allIdentity.some((value) => /\bmale\b/i.test(value))
      ? "male"
      : "unknown";
  return {
    name: clean(input.subject) || undefined,
    kind: clean(input.domainContext?.subjectKind).toLowerCase() as SubjectTruth["kind"] || "unknown",
    sex,
    identityFacts: unique([...material.identity, ...material.traits, ...material.other]).slice(0, 32),
    provenance: "explicit",
  };
}

function eligibleEventIds(input: AuthorCognitionInput): Set<string> {
  const sourceMoments = new Set(input.sourceMoments.map((value) => clean(value).toLowerCase()).filter(Boolean));
  const ids = new Set<string>();
  for (const event of input.realityGraph.events) {
    const label = clean(event.label);
    const directMoment = sourceMoments.has(label.toLowerCase());
    const persistent = PREFERENCE.test(label) || IDENTITY.test(label) || ROUTINE.test(label) || GOAL.test(label) || MEMORY.test(label);
    if (directMoment || OCCURRENCE.test(label) || (!persistent && PAST.test(label))) ids.add(event.id);
  }
  return ids;
}

function relationOperation(kind: RealityGraph["relations"][number]["kind"]): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) {
    case "contrasts": return "contrast";
    case "changes": return "consequence";
    case "converges": return "converge";
    case "recontextualizes": return "reframe";
    case "repeats": return "recur";
    case "causes": return "consequence";
    case "involves": return "reveal";
    default: return undefined;
  }
}

function buildSequenceCandidate(
  graph: RealityGraph,
  subject: string,
  fromId: string,
  toId: string,
  relation: RealityGraph["relations"][number],
  returning: boolean,
  index: number,
): LatentMovieCandidate | undefined {
  const from = graph.events.find((event) => event.id === fromId);
  const to = graph.events.find((event) => event.id === toId);
  if (!from || !to) return undefined;
  const operation = relationOperation(relation.kind);
  if (!operation || !OPS.has(operation)) return undefined;

  const trajectory: LatentMovieTrajectoryStep[] = [
    {
      order: 1,
      operation: "establish",
      eventIds: [fromId],
      viewerChange: "the supplied detail becomes present",
      nextQuestion: "What does its relationship to the next detail change?",
    },
    {
      order: 2,
      operation,
      eventIds: [fromId, toId],
      viewerChange: `the supplied ${relation.kind} relationship changes the reading`,
      nextQuestion: "What becomes newly meaningful?",
    },
    {
      order: 3,
      operation: "payoff",
      eventIds: [toId],
      viewerChange: returning ? "the changed reading returns with context" : "the changed reading lands",
      nextQuestion: "What remains after the relationship is noticed?",
    },
  ];

  const score = clamp(
    relation.strength * 0.55 +
    Math.min(1, relation.evidence?.length ? relation.evidence.length / 3 : 0) * 0.2 +
    (operation === "contrast" || operation === "reframe" || operation === "converge" ? 0.15 : 0.06) +
    (returning ? 0.08 : 0),
  );

  return {
    id: `sequence-${fromId}-${toId}-${relation.kind}-${index}`,
    lens: "NONE",
    anchorEventIds: [fromId, toId],
    supportingRelationKinds: [relation.kind],
    trajectory,
    payoff: to.label,
    unresolvedQuestion: "What becomes newly meaningful when these supplied details are read together?",
    evidence: unique([from.label, to.label, ...(relation.evidence ?? [])]).slice(0, 8),
    hypothesis: [
      `${subject}: the supplied ${relation.kind} relationship changes the meaning of both details when held in sequence.`,
      "Interpretation only; no new event is asserted.",
    ],
    truthRisk: 0,
    novelty: clamp(0.45 + score * 0.4),
    specificity: clamp(0.75 + score * 0.2),
    informationValue: clamp(0.52 + score * 0.4),
    uncertainty: clamp(0.36 - score * 0.15),
    attentionPotential: clamp(0.58 + score * 0.35),
    consequencePotential: clamp(operation === "consequence" ? 0.78 : 0.55),
    callbackPotential: returning ? 0.8 : operation === "recur" ? 0.68 : 0.18,
    compressionPotential: clamp(0.7 + score * 0.22),
    repetitionRisk: 0.04,
    distinctiveness: clamp(0.72 + score * 0.2),
    score,
  };
}

function sequenceCandidates(input: AuthorCognitionInput, eligible: Set<string>): LatentMovieCandidate[] {
  const graph = input.realityGraph;
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const out: LatentMovieCandidate[] = [];
  let index = 0;
  for (const relation of graph.relations.slice(0, 80)) {
    if (!eligible.has(relation.from) || !eligible.has(relation.to)) continue;
    const candidate = buildSequenceCandidate(graph, clean(input.subject) || "the subject", relation.from, relation.to, relation, returning, index++);
    if (candidate) out.push(candidate);
  }

  if (!out.length) {
    const events = graph.events.filter((event) => eligible.has(event.id)).slice(0, 6);
    for (const [i, event] of events.entries()) {
      out.push({
        id: `sequence-event-${event.id}`,
        lens: "NONE",
        anchorEventIds: [event.id],
        supportingRelationKinds: [],
        trajectory: [{ order: 1, operation: returning ? "recur" : "establish", eventIds: [event.id], viewerChange: "the supplied occurrence becomes present", nextQuestion: "What supplied detail changes its meaning?" }],
        payoff: event.label,
        unresolvedQuestion: "What supplied detail changes the reading?",
        evidence: [event.label],
        hypothesis: [`${clean(input.subject) || "The subject"}: this supplied occurrence can carry meaning without adding plot.`],
        truthRisk: 0,
        novelty: clamp(0.55 + i * 0.04),
        specificity: 0.95,
        informationValue: 0.72,
        uncertainty: 0.2,
        attentionPotential: 0.74,
        consequencePotential: 0.3,
        callbackPotential: returning ? 0.82 : 0.12,
        compressionPotential: 0.9,
        repetitionRisk: 0.08,
        distinctiveness: 0.86,
        score: clamp(0.64 + i * 0.03),
      });
    }
  }

  const seen = new Set<string>();
  return out
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      const signature = `${candidate.supportingRelationKinds.join(",")}|${candidate.anchorEventIds.slice().sort().join("+")}|${candidate.trajectory.map((step) => step.operation).join(">")}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .slice(0, 10);
}

function fallbackQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const questions: AuthorAdaptiveQuestion[] = [];
  if (!clean(input.subject)) questions.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." });
  if (!clean(input.place) && !input.realityGraph.events.some((event) => event.place)) questions.push({ kind: "where", question: "Where did this happen?", reason: "Place may add meaningful context." });
  if (!input.realityGraph.events.some((event) => event.time) && !/(today|yesterday|tomorrow|morning|afternoon|evening|night|\d{4})/i.test(input.prompt)) {
    questions.push({ kind: "when", question: "When did this happen?", reason: "Time may establish useful continuity." });
  }
  return questions.slice(0, 3);
}

function fallbackDirection(anchorIds: string[], candidate?: LatentMovieCandidate): AuthorArtistDirection {
  const proposition: AuthorCreativeProposition = {
    text: "Use the chosen Artist treatment from the canonical Artist stage.",
    pattern: "await Artist selection",
    sourceEventIds: anchorIds,
  };
  return {
    creativeProposition: proposition,
    mechanic: { text: proposition.text, sourceEventIds: anchorIds },
    hook: { text: "Begin with the strongest supplied detail.", sourceEventIds: anchorIds },
    openLoop: { text: candidate?.unresolvedQuestion || "What becomes newly meaningful?", sourceEventIds: anchorIds },
    tension: { text: candidate?.hypothesis?.[0] || "Find tension inside supplied reality.", sourceEventIds: anchorIds },
    surprise: { text: "Let the supplied relationship change the read.", sourceEventIds: anchorIds },
    payoff: { text: candidate?.payoff || "Land on a supplied detail.", sourceEventIds: anchorIds },
  };
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const eligible = eligibleEventIds(input);
  const material = classifyMaterial(input.facts);
  const subjectTruth = subjectTruthFrom(input, material);
  const candidates = sequenceCandidates(input, eligible);
  const selectedMovie = candidates[0];
  let model = "deterministic";
  let modelCalls = 0;
  let interpretations: AuthorCreativeInterpretation[] = [];
  let modelQuestions: AuthorAdaptiveQuestion[] = [];
  let attentionStrategy = selectedMovie?.hypothesis?.[0] || "Find the strongest grounded relationship in the supplied reality.";
  let reasoningSummary = selectedMovie?.hypothesis ?? [];

  try {
    const reality = {
      subject: clean(input.subject) || "unknown",
      place: clean(input.place) || "unknown",
      prompt: clean(input.prompt),
      subjectTruth,
      subjectMaterial: material,
      events: input.realityGraph.events.filter((event) => eligible.has(event.id)).slice(0, 24).map((event) => ({ id: event.id, label: event.label, salient: Boolean(event.salient), place: event.place, time: event.time, entities: event.entities })),
      relations: input.realityGraph.relations.filter((relation) => eligible.has(relation.from) && eligible.has(relation.to)).slice(0, 32).map((relation) => ({ from: relation.from, to: relation.to, kind: relation.kind, strength: relation.strength, evidence: relation.evidence })),
      patterns: input.realityGraph.patterns ?? [],
      tensions: input.realityGraph.unresolvedTensions ?? [],
    };

    const response = await localModelGenerate(
      [
        {
          role: "system",
          content: [
            "You are QRE semantic cognition, not a filmmaker.",
            "Discover relationships, organizing patterns, contrasts, recurrence, transformation, convergence, recontextualization, dependency, tension, or unexpected specificity inside supplied reality.",
            "Do not invent facts, events, motives, emotions, chronology, people, actions, locations, capabilities, or outcomes.",
            "Do not propose movies, stories, scenes, shots, camera work, lenses, montage, soundtrack, music, sound design, visual effects, transitions, or production techniques.",
            "Do not choose a genre or cinematic frame.",
            "A sequence-text film means grounded text moving through a sequence. Your job is to discover the semantic relationship that could make that sequence meaningful.",
            "Return JSON with interpretations only. Each interpretation must name the relationship, explain why the supplied evidence supports it, and cite exact event IDs.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify({ reality }),
        },
      ],
      "json",
      { numPredict: 900, temperature: 0.55 },
    );
    const parsed = parseModel(response.text);
    model = response.model;
    modelCalls = 1;

    if (Array.isArray(parsed?.interpretations)) {
      interpretations = parsed.interpretations.flatMap((value, index) => {
        if (!value || typeof value !== "object") return [];
        const row = value as Record<string, unknown>;
        const ids = Array.isArray(row.evidenceEventIds)
          ? unique(row.evidenceEventIds.filter((id): id is string => typeof id === "string").map(clean).filter((id) => eligible.has(id)))
          : [];
        const thesis = clean(row.thesis);
        const opportunity = clean(row.creativeOpportunity);
        const rationale = clean(row.rationale);
        if (!thesis || !ids.length) return [];
        return [{
          id: clean(row.id) || `interpretation-${index + 1}`,
          thesis,
          creativeOpportunity: opportunity || "supplied relationship",
          rationale: rationale || "grounded in supplied evidence",
          evidenceEventIds: ids.slice(0, 6),
          confidence: clamp(row.confidence, 0.65),
        } satisfies AuthorCreativeInterpretation];
      }).slice(0, 6);
    }

    const maybeQuestions = Array.isArray(parsed?.adaptiveQuestions) ? parsed.adaptiveQuestions : [];
    modelQuestions = maybeQuestions.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const row = value as Record<string, unknown>;
      const kind = clean(row.kind) as AuthorAdaptiveQuestion["kind"];
      const question = clean(row.question);
      return question && ["who", "where", "when", "event", "detail"].includes(kind)
        ? [{ kind, question, reason: clean(row.reason) || "Additional supplied context may sharpen the reading." }]
        : [];
    }).slice(0, 3);

    attentionStrategy = clean(parsed?.attentionStrategy) || attentionStrategy;
    reasoningSummary = Array.isArray(parsed?.reasoningSummary)
      ? parsed.reasoningSummary.filter((value): value is string => typeof value === "string").map(clean).filter(Boolean).slice(0, 8)
      : reasoningSummary;
  } catch {
    // Deterministic sequence candidates remain authoritative when the semantic model is unavailable.
  }

  const selectedAnchorIds = selectedMovie?.anchorEventIds?.slice(0, 4) ?? [];
  return {
    selectedLens: clean(input.lens) || "NONE",
    frame: {
      mode: "none",
      frame: "NONE",
      confidence: 0,
      coreTension: "",
      creativeGain: "",
      templateRisk: "",
      evidenceEventIds: selectedAnchorIds,
    },
    interpretations: interpretations.length
      ? interpretations
      : selectedMovie
        ? [{
            id: "interpretation-grounded",
            thesis: selectedMovie.hypothesis[0] ?? "",
            creativeOpportunity: selectedMovie.anchorEventIds.length > 1 ? "supplied relationship" : "character material",
            rationale: "derived from supplied reality",
            evidenceEventIds: selectedMovie.anchorEventIds,
            confidence: selectedMovie.score,
          }]
        : [],
    latentMovieCandidates: candidates,
    selectedMovie,
    adaptiveQuestions: unique([...modelQuestions, ...fallbackQuestions(input)].map((value) => JSON.stringify(value)))
      .map((value) => JSON.parse(value) as AuthorAdaptiveQuestion)
      .slice(0, 4),
    attentionStrategy,
    reasoningSummary,
    subjectTruth,
    subjectMaterial: material,
    artistDirection: fallbackDirection(selectedAnchorIds, selectedMovie),
    model,
    modelCalls,
  };
}
