/* QRE UNIVERSAL COGNITION · one domain-neutral search brain */
import type {
  AuthorDomainContext,
  CreativeFrameSelection,
  LatentMovieCandidate,
  LatentMovieTrajectoryStep,
  RealityGraph,
  SubjectTruth,
} from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { buildAuthorCognitionIntelligence } from "./authorCognitionIntelligence.js";
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
  movieMode?: boolean;
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

const clean = (v: unknown): string => String(v ?? "").replace(/\s+/g, " ").trim();
const clamp = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, Number(n.toFixed(3)))) : d;
};
const unique = <T>(xs: readonly T[]): T[] => [...new Set(xs)];
const OPS = new Set<LatentMovieTrajectoryStep["operation"]>([
  "establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff",
]);
const FRAMES = new Set([
  "comedy", "funny", "noir", "romance", "romantic", "horror", "heist", "game", "fierce", "courtroom", "military",
  "documentary", "deadpan", "tender", "surreal", "wild", "spy", "mission", "speedrun", "tournament", "investigation",
  "backstage", "transformation", "race", "restoration", "expedition", "quest", "countdown", "archive", "operation", "negotiation",
]);
const GENERIC = /\b(?:a day|the journey|something special|special moment|good times|beautiful moment|it all started|the experience)\b/i;
const INTERNAL = /\b(?:cognition|planner|trajectory|candidate|viewer state|semantic turn|compiler|realizer|provenance|evidence id)\b/i;
const PSYCH = /\b(?:happy|happiness|sad|sadness|anxious|anxiety|contentment|motive|motivation|personality|felt)\b/i;
const PREFERENCE = /\b(?:love|loves|like|likes|enjoy|enjoys|prefer|prefers|favorite|favourite|hate|hates|favorite)\b/i;
const IDENTITY = /\b(?:my name is|named|is a|is an|breed|type|kind|male|female|poodle|pomeranian|small|large|tall|short|young|old)\b/i;
const ROUTINE = /\b(?:every day|every morning|every night|daily|weekly|usually|often|always|routine|habit|regularly)\b/i;
const GOAL = /\b(?:want to|wants to|hope to|hopes to|trying to|plan to|plans to|goal|would like to)\b/i;
const MEMORY = /\b(?:remember|remembered|memory|when we|years ago|used to)\b/i;
const RELATIONSHIP = /\b(?:my wife|my husband|my mom|my dad|my sister|my brother|my friend|my partner|belongs to|owned by|with me)\b/i;
const OCCURRENCE = /\b(?:today|yesterday|tomorrow|this morning|this afternoon|tonight|last night|earlier|later|then|after that|before that|first|finally|went|walked|ran|arrived|met|found|lost|bought|sold|opened|closed|returned|visited|called|watched|heard|saw|saw|chased|caught|finished|started|happened)\b/i;
const PAST = /\b(?:ed\b|was|were|did|had|went|ran|came|met|found|lost|bought|sold|saw|heard|watched|returned|finished|started)\b/i;

function parse(text: string): Record<string, unknown> | undefined {
  const t = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const x = JSON.parse(t);
    return x && typeof x === "object" ? x as Record<string, unknown> : undefined;
  } catch {
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) return undefined;
    try {
      const x = JSON.parse(t.slice(a, b + 1));
      return x && typeof x === "object" ? x as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }
}

function classifyMaterial(facts: readonly string[]): AuthorSubjectMaterial {
  const out: AuthorSubjectMaterial = { identity: [], traits: [], preferences: [], routines: [], goals: [], relationships: [], memories: [], other: [] };
  for (const raw of facts) {
    const value = clean(raw);
    if (!value) continue;
    if (MEMORY.test(value)) out.memories.push(value);
    else if (RELATIONSHIP.test(value)) out.relationships.push(value);
    else if (GOAL.test(value)) out.goals.push(value);
    else if (PREFERENCE.test(value)) out.preferences.push(value);
    else if (ROUTINE.test(value)) out.routines.push(value);
    else if (IDENTITY.test(value)) out.identity.push(value);
    else out.other.push(value);
  }
  return out;
}

function subjectTruthFrom(input: AuthorCognitionInput, material: AuthorSubjectMaterial): SubjectTruth {
  const name = clean(input.subject) || undefined;
  const sexFact = [...material.identity, ...material.other].find((x) => /\bfemale\b/i.test(x))
    ? "female"
    : [...material.identity, ...material.other].find((x) => /\bmale\b/i.test(x)) ? "male" : "unknown";
  return {
    name,
    kind: clean(input.domainContext?.subjectKind).toLowerCase() as SubjectTruth["kind"] || "unknown",
    sex: sexFact,
    identityFacts: unique([...material.identity, ...material.traits, ...material.other]).slice(0, 32),
    provenance: "explicit",
  };
}

function eventLabels(g: RealityGraph): Map<string, string> {
  return new Map(g.events.map((e) => [e.id, clean(e.label)]));
}

function isChronologicalEvent(label: string, sourceMoments: readonly string[]): boolean {
  const value = clean(label);
  if (!value) return false;
  if (sourceMoments.some((moment) => clean(moment).toLowerCase() === value.toLowerCase())) return true;
  if (PREFERENCE.test(value) || IDENTITY.test(value) || ROUTINE.test(value) || GOAL.test(value)) return OCCURRENCE.test(value) && PAST.test(value);
  return OCCURRENCE.test(value) || PAST.test(value);
}

function eligibleEventIds(input: AuthorCognitionInput): Set<string> {
  const eligible = new Set<string>();
  for (const event of input.realityGraph.events) {
    if (isChronologicalEvent(event.label, input.sourceMoments)) eligible.add(event.id);
  }
  return eligible;
}

function validIds(v: unknown, g: RealityGraph, eligible: Set<string>): string[] {
  const known = new Set(g.events.map((e) => e.id));
  const raw = Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : typeof v === "string" ? [v] : [];
  return unique(raw.map(clean).filter((x) => known.has(x) && eligible.has(x)));
}

function labels(g: RealityGraph, ids: readonly string[]): string[] {
  const m = eventLabels(g);
  return unique(ids.map((id) => m.get(id)).filter((x): x is string => Boolean(x)));
}

function frame(parsed: Record<string, unknown> | undefined, explicit: string, g: RealityGraph, eligible: Set<string>): CreativeFrameSelection {
  const f = parsed?.frame && typeof parsed.frame === "object" ? parsed.frame as Record<string, unknown> : {};
  const requested = clean(parsed?.selectedLens ?? f.frame ?? explicit).toLowerCase();
  const normalized = requested.replace(/[^a-z0-9_-]/g, "");
  const chosen = explicit && explicit.toLowerCase() !== "let qre decide"
    ? requested
    : (FRAMES.has(normalized) ? normalized : "");
  const ids = validIds(f.evidenceEventIds ?? parsed?.frameEvidenceEventIds, g, eligible);
  return {
    mode: chosen && (explicit || ids.length) ? "frame" : "none",
    frame: chosen || "NONE",
    confidence: clamp(f.confidence ?? parsed?.frameConfidence, explicit ? 1 : .4),
    coreTension: clean(f.coreTension ?? parsed?.coreTension),
    creativeGain: clean(f.creativeGain ?? parsed?.creativeGain),
    templateRisk: clean(f.templateRisk ?? parsed?.templateRisk),
    evidenceEventIds: ids,
  };
}

function score(c: LatentMovieCandidate, returning: boolean): number {
  const semanticSteps = c.trajectory.filter((s) => s.eventIds.length >= 2).length;
  const eventSpan = new Set(c.trajectory.flatMap((s) => s.eventIds)).size;
  const movement = Math.min(1, semanticSteps / 4);
  const span = Math.min(1, eventSpan / 8);
  const depth = Math.min(1, c.trajectory.length / 6);
  const continuity = returning ? c.callbackPotential : c.novelty;
  return clamp(
    c.attentionPotential * .15 + c.novelty * .10 + c.specificity * .11 + c.distinctiveness * .12 +
    c.informationValue * .09 + c.consequencePotential * .10 + continuity * .07 + movement * .09 +
    span * .10 + depth * .04 + (1 - c.truthRisk) * .07 - c.repetitionRisk * .10,
  );
}

function observationCandidates(input: AuthorCognitionInput, returning: boolean, eligible: Set<string>): LatentMovieCandidate[] {
  const g = input.realityGraph;
  const candidates: LatentMovieCandidate[] = [];
  for (const relation of g.relations.slice(0, 100)) {
    if (!eligible.has(relation.from) || !eligible.has(relation.to)) continue;
    const from = g.events.find((e) => e.id === relation.from), to = g.events.find((e) => e.id === relation.to);
    if (!from || !to) continue;
    const c: LatentMovieCandidate = {
      id: `universal-observation-${relation.from}-${relation.to}-${relation.kind}`,
      lens: "NONE",
      anchorEventIds: [relation.from, relation.to],
      supportingRelationKinds: [relation.kind],
      trajectory: [
        { order: 1, operation: "establish", eventIds: [relation.from], viewerChange: "establish the supplied opening detail", nextQuestion: "What changes when the related detail enters?" },
        { order: 2, operation: relation.kind === "repeats" ? "recur" : relation.kind === "changes" ? "consequence" : relation.kind === "contrasts" ? "contrast" : relation.kind === "converges" ? "converge" : "reframe", eventIds: [relation.from, relation.to], viewerChange: `the supplied ${relation.kind} relationship changes the reading`, nextQuestion: "What lingers after that change?" },
        { order: 3, operation: "payoff", eventIds: [relation.to], viewerChange: "land without inventing a new event", nextQuestion: "What remains in the world?" },
      ],
      payoff: to.label,
      unresolvedQuestion: "What deserves another look?",
      evidence: [from.label, to.label],
      hypothesis: [`${input.subject || "The subject"}: two supplied events become more interesting when their existing relationship is made visible.`],
      truthRisk: 0, novelty: .62, specificity: .95, informationValue: .72, uncertainty: .18, attentionPotential: .8,
      consequencePotential: relation.kind === "changes" || relation.kind === "causes" ? .75 : .45,
      callbackPotential: returning ? .78 : .18, compressionPotential: .88, repetitionRisk: .04, distinctiveness: .88, score: 0,
    };
    c.score = score(c, returning); candidates.push(c);
  }
  const eventCandidates = [...eligible]
    .map((id) => g.events.find((e) => e.id === id))
    .filter((e): e is RealityGraph["events"][number] => Boolean(e))
    .sort((a, b) => Number(Boolean(b.salient)) - Number(Boolean(a.salient)))
    .slice(0, 6);
  for (const [i, e] of eventCandidates.entries()) {
    const c: LatentMovieCandidate = {
      id: `universal-event-${e.id}`,
      lens: "NONE",
      anchorEventIds: [e.id],
      supportingRelationKinds: [],
      trajectory: [{ order: 1, operation: returning ? "recur" : "establish", eventIds: [e.id], viewerChange: "hold the supplied occurrence in focus", nextQuestion: "What does another supplied occurrence change?" }],
      payoff: e.label, unresolvedQuestion: "What deserves another look?", evidence: [e.label],
      hypothesis: [`${input.subject || "The subject"}: this supplied occurrence can carry meaning without adding plot.`],
      truthRisk: 0, novelty: .55 + i * .05, specificity: .95, informationValue: .7, uncertainty: .2, attentionPotential: .74,
      consequencePotential: .3, callbackPotential: returning ? .8 : .12, compressionPotential: .9, repetitionRisk: .08, distinctiveness: .86, score: 0,
    };
    c.score = score(c, returning); candidates.push(c);
  }
  if (!candidates.length) {
    const materialEvent = g.events.find((e) => !eligible.has(e.id));
    if (materialEvent) {
      candidates.push({
        id: `subject-material-${materialEvent.id}`,
        lens: "NONE",
        anchorEventIds: [materialEvent.id],
        supportingRelationKinds: [],
        trajectory: [{ order: 1, operation: "establish", eventIds: [materialEvent.id], viewerChange: "establish persistent subject material", nextQuestion: "What detail gives this subject character?" }],
        payoff: materialEvent.label,
        unresolvedQuestion: "What detail makes the subject unmistakable?",
        evidence: [materialEvent.label],
        hypothesis: ["Persistent identity, trait, preference, or routine can become characterization without becoming a chronological event."],
        truthRisk: 0, novelty: .7, specificity: .98, informationValue: .78, uncertainty: .15, attentionPotential: .86,
        consequencePotential: .2, callbackPotential: returning ? .9 : .18, compressionPotential: .95, repetitionRisk: .02, distinctiveness: .92, score: .72,
      });
    }
  }
  return candidates;
}

function normalizeModel(raw: unknown, input: AuthorCognitionInput, returning: boolean, eligible: Set<string>): LatentMovieCandidate[] {
  const rows = Array.isArray((raw as Record<string, unknown> | undefined)?.movies)
    ? (raw as Record<string, unknown>).movies as unknown[] : [];
  return rows.slice(0, 8).flatMap((x, i) => {
    if (!x || typeof x !== "object") return [];
    const r = x as Record<string, unknown>;
    const ids = validIds(r.evidenceEventIds ?? r.evidenceIds ?? r.anchorEventIds ?? r.eventIds, input.realityGraph, eligible);
    const thesis = clean(r.thesis ?? (Array.isArray(r.hypothesis) ? r.hypothesis[0] : undefined));
    const rawTrajectory = Array.isArray(r.trajectory) ? r.trajectory : [];
    const trajectory: LatentMovieTrajectoryStep[] = rawTrajectory.flatMap((s, k) => {
      if (!s || typeof s !== "object") return [];
      const z = s as Record<string, unknown>;
      const op = clean(z.operation).toLowerCase() as LatentMovieTrajectoryStep["operation"];
      const eventIds = validIds(z.eventIds ?? z.eventId, input.realityGraph, eligible);
      return OPS.has(op) && eventIds.length ? [{ order: k + 1, operation: op, eventIds, viewerChange: clean(z.viewerChange ?? z.attentionMove) || "the reading changes", nextQuestion: clean(z.nextQuestion ?? z.nextPromise) || "What becomes meaningful next?" }] : [];
    });
    const allIds = unique([...ids, ...trajectory.flatMap((s) => s.eventIds)]);
    const persistentOnly = !allIds.length && (GENERIC.test(thesis) || INTERNAL.test(thesis));
    if (persistentOnly) return [];
    if (allIds.length && trajectory.length === 0) return [];
    const c: LatentMovieCandidate = {
      id: clean(r.id ?? r.movieId) || `model-movie-${i + 1}`,
      lens: clean(r.lens ?? r.frame) || "NONE",
      anchorEventIds: ids.slice(0, 4),
      supportingRelationKinds: Array.isArray(r.supportingRelationKinds) ? unique(r.supportingRelationKinds.filter((x): x is string => typeof x === "string").map(clean)) : [],
      trajectory,
      payoff: clean(r.payoff ?? r.finalMeaning) || labels(input.realityGraph, [allIds.at(-1) ?? ""]).at(-1) || "supplied reality",
      unresolvedQuestion: clean(r.unresolvedQuestion ?? r.nextQuestion) || "What changes this reading?",
      evidence: Array.isArray(r.evidence) ? r.evidence.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean).slice(0, 16) : labels(input.realityGraph, allIds),
      hypothesis: Array.isArray(r.hypothesis) ? r.hypothesis.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean).slice(0, 6) : [thesis || "Grounded structural reading of supplied material."],
      truthRisk: clamp(r.truthRisk), novelty: clamp(r.novelty, .68), specificity: clamp(r.specificity, .84), informationValue: clamp(r.informationValue, .74),
      uncertainty: clamp(r.uncertainty, .3), attentionPotential: clamp(r.attentionPotential, .64), consequencePotential: clamp(r.consequencePotential, .5),
      callbackPotential: clamp(r.callbackPotential, returning ? .78 : .18), compressionPotential: clamp(r.compressionPotential, .76), repetitionRisk: clamp(r.repetitionRisk, .08),
      distinctiveness: clamp(r.distinctiveness, .72), score: 0,
    };
    c.score = score(c, returning);
    return [c];
  });
}

function signature(c: LatentMovieCandidate): string {
  return `${c.trajectory.map((s) => s.operation).join(">")}|${c.trajectory.map((s) => s.eventIds.slice().sort().join("+")).join("|")}`;
}
function dedupe(cs: LatentMovieCandidate[], limit = 10): LatentMovieCandidate[] {
  const out: LatentMovieCandidate[] = [], seen = new Set<string>();
  for (const c of cs.slice().sort((a, b) => b.score - a.score)) {
    const s = signature(c); if (seen.has(s)) continue; seen.add(s); out.push(c); if (out.length >= limit) break;
  }
  return out;
}
function questions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const out: AuthorAdaptiveQuestion[] = [];
  if (!input.subject) out.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." });
  if (!input.place && !input.realityGraph.events.some((e) => e.place)) out.push({ kind: "where", question: "Where did this happen?", reason: "Place may add meaningful context." });
  if (!input.realityGraph.events.some((e) => e.time) && !/(today|yesterday|tomorrow|morning|afternoon|evening|night|\d{1,2}:\d{2}|\d{4})/i.test(input.prompt)) {
    out.push({ kind: "when", question: "When did this happen?", reason: "Time may establish useful continuity." });
  }
  return out.slice(0, 3);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1);
  const explicit = clean(input.lens);
  const material = classifyMaterial(input.facts);
  const subjectTruth = subjectTruthFrom(input, material);
  const eligible = eligibleEventIds(input);
  const intelligence = buildAuthorCognitionIntelligence(input.realityGraph, returning, input.creativeLearningContext ?? []);

  const compact = {
    subject: clean(input.subject) || "unknown",
    place: clean(input.place) || "unknown",
    prompt: clean(input.prompt),
    subjectTruth,
    subjectMaterial: material,
    creatorContext: input.domainContext ?? null,
    returning,
    memory: (input.memoryContext ?? []).slice(0, 12),
    learning: (input.creativeLearningContext ?? []).slice(0, 12),
    events: input.realityGraph.events.filter((e) => eligible.has(e.id)).map((e) => ({ id: e.id, label: e.label, salient: Boolean(e.salient), place: e.place, time: e.time, entities: e.entities })),
    relations: input.realityGraph.relations.filter((r) => eligible.has(r.from) && eligible.has(r.to)).slice(0, 24).map((r) => ({ from: r.from, to: r.to, kind: r.kind, strength: r.strength })),
    patterns: input.realityGraph.patterns ?? [],
    tensions: input.realityGraph.unresolvedTensions ?? [],
    sensory: input.realityGraph.sensorySignals ?? [],
  };

  let parsed: Record<string, unknown> | undefined;
  let model = "deterministic";
  let modelCalls = 0;

  if (input.movieMode !== false) {
    try {
      const r = await localModelGenerate(
        [
          {
            role: "system",
            content: [
              "You are QRE universal cognition.",
              "Separate persistent subject truth from chronological events.",
              "A name, breed, trait, preference, routine, goal, relationship, or memory is subject material, not a current event.",
              "Only chronological occurrences may form event trajectories.",
              "Never convert a preference or trait into an occurrence. Example: 'loves apples' is not 'ate an apple'.",
              "RealityGraph and explicit subject material are authoritative. Never invent concrete facts, people, actions, outcomes, chronology, motives, emotions, capabilities, locations, or events.",
              "Find grounded relationships, structures, contrasts, recurrence, convergence, recontextualization, accumulation, progression, interruption, transformation, return, absence, and consequence only where supplied evidence supports them.",
              "A Movie is a grounded creative possibility, not a screenplay and not a factual restatement.",
              "Do not create one Movie per preference or identity fact. Persistent subject material may inspire characterization but does not create chronology.",
              "Every event-based Movie must cite eligible event IDs. Identity-only material may remain a character possibility with at most one supporting source.",
              "Use only these trajectory operations: establish, contrast, recur, reframe, escalate, converge, reveal, consequence, payoff.",
              "Lens is selective pressure, not semantic authority. NONE is valid.",
              "Return compact JSON with selectedLens, frame, interpretations, movies, selectedMovieId, adaptiveQuestions, attentionStrategy, reasoningSummary.",
            ].join("\n"),
          },
          { role: "user", content: JSON.stringify({ reality: compact, intelligence: { signals: intelligence.semanticSignals.slice(0, 6), moves: intelligence.candidateMoves.slice(0, 6), competition: intelligence.competitionProtocol.slice(0, 5), attention: intelligence.attention.slice(0, 5), antiFailure: intelligence.antiFailureChecks.slice(0, 5) } }) },
        ],
        "json",
        { numPredict: 1100, temperature: .88 },
      );
      parsed = parse(r.text);
      model = r.model;
      modelCalls = 1;
    } catch {}
  }

  const fr = frame(parsed, explicit, input.realityGraph, eligible);
  const modelCs = normalizeModel(parsed, input, returning, eligible);
  const observations = observationCandidates(input, returning, eligible);
  const candidates = dedupe([...modelCs, ...observations], 10);
  const chosenId = clean(parsed?.selectedMovieId);
  const numericChosen = Number(chosenId);
  const selectedMovie = candidates.find((c) => c.id === chosenId)
    || (Number.isInteger(numericChosen) && numericChosen >= 0 ? candidates[numericChosen] : undefined)
    || candidates[0];

  const ints = Array.isArray(parsed?.interpretations) ? parsed.interpretations.slice(0, 6).flatMap((x, i) => {
    if (!x || typeof x !== "object") return [];
    const r = x as Record<string, unknown>;
    return [{
      id: clean(r.id) || `interpretation-${i + 1}`,
      thesis: clean(r.thesis) || selectedMovie?.hypothesis[0] || "Find the strongest grounded reading.",
      creativeOpportunity: clean(r.creativeOpportunity) || "semantic progression",
      rationale: clean(r.rationale) || "grounded in supplied evidence",
      evidenceEventIds: validIds(r.evidenceEventIds, input.realityGraph, eligible),
      confidence: clamp(r.confidence, .6),
    } satisfies AuthorCreativeInterpretation];
  }) : [];

  const qs = Array.isArray(parsed?.adaptiveQuestions) ? parsed.adaptiveQuestions.flatMap((x) => {
    if (!x || typeof x !== "object") return [];
    const r = x as Record<string, unknown>;
    const kind = clean(r.kind) as AuthorAdaptiveQuestion["kind"];
    const question = clean(r.question);
    return question && ["who", "where", "when", "event", "detail"].includes(kind) && !PSYCH.test(question)
      ? [{ kind, question, reason: clean(r.reason) }] : [];
  }).slice(0, 3) : [];

  return {
    selectedLens: fr.mode === "frame" ? fr.frame : "NONE",
    frame: fr,
    interpretations: ints.length ? ints : selectedMovie ? [{ id: "interpretation-grounded", thesis: selectedMovie.hypothesis[0] ?? "", creativeOpportunity: selectedMovie.anchorEventIds.length > 1 ? "supplied relationship" : "character material", rationale: "derived from supplied reality", evidenceEventIds: selectedMovie.anchorEventIds, confidence: selectedMovie.score }] : [],
    latentMovieCandidates: candidates,
    selectedMovie,
    adaptiveQuestions: unique([...qs, ...questions(input)].map((x) => JSON.stringify(x))).map((x) => JSON.parse(x) as AuthorAdaptiveQuestion).slice(0, 4),
    attentionStrategy: clean(parsed?.attentionStrategy) || "notice what changes the meaning of another supplied detail",
    reasoningSummary: Array.isArray(parsed?.reasoningSummary) ? parsed.reasoningSummary.filter((x): x is string => typeof x === "string").map(clean).filter(Boolean).slice(0, 8) : intelligence.semanticSignals.slice(0, 3),
    subjectTruth,
    subjectMaterial: material,
    artistDirection: {
      mechanic: { text: "Use the chosen Artist treatment from the canonical Artist stage.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
      hook: { text: "Use the strongest supplied detail as the opening attention beat.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
      openLoop: { text: selectedMovie?.unresolvedQuestion || "Create an open question from supplied reality.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
      tension: { text: selectedMovie?.hypothesis?.[0] || "Create tension from supplied reality.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
      surprise: { text: "Find an earned surprise in the supplied material.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
      payoff: { text: selectedMovie?.payoff || "Land on a supplied detail.", sourceEventIds: selectedMovie?.anchorEventIds?.slice(0, 4) ?? [] },
    },
    model,
    modelCalls,
  };
}
