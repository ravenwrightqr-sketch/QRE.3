/**
 * QRE UNIVERSAL COGNITION — SEQUENCE-TEXT FILM ONLY
 *
 * Current artifact: text moving as a sequence of attention-changing screens.
 * `SequenceCandidate` is semantic sequence structure only.
 * Do not introduce audiovisual production, genre, shot, camera, soundtrack,
 * transition, screenplay, or other presentation abstractions into Cognition.
 *
 * Cognition discovers relationships, patterns, tensions, recurrence, change,
 * and meaningful connections in supplied reality. Artist owns the proposition.
 * Memory is additional supplied reality, never permission to invent facts.
 */
import type { AuthorDomainContext, AuthorCreativeProposition, CreativeFrameSelection, RealityGraph, SequenceCandidate, SequenceTrajectoryStep, SubjectTruth } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";

export type AuthorCognitionInput = {
  prompt: string; lens?: string; subject?: string; place?: string; facts: string[]; sourceMoments: string[];
  realityGraph: RealityGraph; domainContext?: AuthorDomainContext; memoryContext?: string[]; trajectory?: string[];
  creativeLearningContext?: string[]; returning?: boolean; visitNumber?: number;
};
export type AuthorCreativeInterpretation = { id: string; thesis: string; creativeOpportunity: string; rationale: string; evidenceEventIds: string[]; confidence: number };
export type AuthorAdaptiveQuestion = { kind: "who" | "where" | "when" | "event" | "detail"; question: string; reason: string };
export type AuthorSubjectMaterial = { identity: string[]; traits: string[]; preferences: string[]; routines: string[]; goals: string[]; relationships: string[]; memories: string[]; other: string[] };
export type AuthorCognitionPlan = {
  selectedLens: string; frame: CreativeFrameSelection; interpretations: AuthorCreativeInterpretation[];
  sequenceCandidates: SequenceCandidate[]; selectedSequence?: SequenceCandidate;
  adaptiveQuestions: AuthorAdaptiveQuestion[]; attentionStrategy: string; reasoningSummary: string[];
  subjectTruth: SubjectTruth; subjectMaterial: AuthorSubjectMaterial; artistDirection: AuthorArtistDirection;
  model: string; modelCalls: number;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value: unknown, fallback = 0): number => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(1, Number(n.toFixed(3)))) : fallback; };
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
const PREFERENCE = /\b(?:love|loves|like|likes|enjoy|enjoys|prefer|prefers|favorite|favourite|hate|hates)\b/i;
const IDENTITY = /\b(?:my name is|named|is a|is an|breed|type|kind|male|female|small|large|tall|short|young|old)\b/i;
const ROUTINE = /\b(?:every day|every morning|every night|daily|weekly|usually|often|always|routine|habit|regularly)\b/i;
const GOAL = /\b(?:want to|wants to|hope to|hopes to|trying to|plan to|plans to|goal|would like to)\b/i;
const MEMORY = /\b(?:remember|remembered|memory|when we|years ago|used to)\b/i;
const OCCURRENCE = /\b(?:today|yesterday|tomorrow|this morning|this afternoon|tonight|last night|earlier|later|then|after that|before that|first|finally|went|walked|ran|arrived|met|found|lost|bought|sold|opened|closed|returned|visited|called|watched|heard|saw|chased|caught|finished|started|happened)\b/i;
const PAST = /\b(?:was|were|did|had|went|ran|came|met|found|lost|bought|sold|saw|heard|watched|returned|finished|started|[a-z]+ed\b)\b/i;
const OPS = new Set<SequenceTrajectoryStep["operation"]>(["establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff"]);

function classifyMaterial(facts: readonly string[]): AuthorSubjectMaterial {
  const out: AuthorSubjectMaterial = { identity: [], traits: [], preferences: [], routines: [], goals: [], relationships: [], memories: [], other: [] };
  for (const raw of facts) {
    const value = clean(raw); if (!value) continue;
    if (MEMORY.test(value)) out.memories.push(value);
    else if (/\b(?:wife|husband|mom|dad|sister|brother|friend|partner|belongs to|owned by|with me)\b/i.test(value)) out.relationships.push(value);
    else if (GOAL.test(value)) out.goals.push(value);
    else if (PREFERENCE.test(value)) out.preferences.push(value);
    else if (ROUTINE.test(value)) out.routines.push(value);
    else if (IDENTITY.test(value)) out.identity.push(value);
    else out.other.push(value);
  }
  return out;
}
function subjectTruthFrom(input: AuthorCognitionInput, material: AuthorSubjectMaterial): SubjectTruth {
  const all = [...material.identity, ...material.other];
  return { name: clean(input.subject) || undefined, kind: clean(input.domainContext?.subjectKind).toLowerCase() as SubjectTruth["kind"] || "unknown", sex: all.some((x) => /\bfemale\b/i.test(x)) ? "female" : all.some((x) => /\bmale\b/i.test(x)) ? "male" : "unknown", identityFacts: unique([...material.identity, ...material.traits, ...material.other]).slice(0, 32), provenance: "explicit" };
}
function eligibleIds(input: AuthorCognitionInput): Set<string> {
  const sourceMoments = new Set(input.sourceMoments.map((x) => clean(x).toLowerCase()).filter(Boolean));
  const ids = new Set<string>();
  for (const event of input.realityGraph.events) {
    const label = clean(event.label); const persistent = PREFERENCE.test(label) || IDENTITY.test(label) || ROUTINE.test(label) || GOAL.test(label) || MEMORY.test(label);
    if (sourceMoments.has(label.toLowerCase()) || OCCURRENCE.test(label) || (!persistent && PAST.test(label))) ids.add(event.id);
  }
  return ids;
}
function relationOperation(kind: RealityGraph["relations"][number]["kind"]): SequenceTrajectoryStep["operation"] | undefined {
  switch (kind) { case "contrasts": return "contrast"; case "changes": case "causes": return "consequence"; case "converges": return "converge"; case "recontextualizes": return "reframe"; case "repeats": return "recur"; case "involves": return "reveal"; default: return undefined; }
}
function sequenceFromRelation(graph: RealityGraph, subject: string, relation: RealityGraph["relations"][number], returning: boolean, index: number): SequenceCandidate | undefined {
  const from = graph.events.find((event) => event.id === relation.from); const to = graph.events.find((event) => event.id === relation.to); const operation = relationOperation(relation.kind);
  if (!from || !to || !operation || !OPS.has(operation)) return undefined;
  const score = clamp(Number(relation.strength ?? .5) * .6 + (relation.evidence?.length ?? 0) / 5 * .2 + (["contrast", "reframe", "converge"].includes(operation) ? .14 : .06) + (returning ? .06 : 0), .5);
  return {
    id: `sequence-${relation.from}-${relation.to}-${relation.kind}-${index}`,
    lens: "NONE", anchorEventIds: [relation.from, relation.to], supportingRelationKinds: [relation.kind],
    trajectory: [
      { order: 1, operation: "establish", eventIds: [relation.from], viewerChange: `notice ${from.label}`, nextQuestion: "What does the next supplied detail change?" },
      { order: 2, operation, eventIds: [relation.from, relation.to], viewerChange: `the supplied relationship changes the reading`, nextQuestion: "What becomes newly meaningful?" },
      { order: 3, operation: "payoff", eventIds: [relation.to], viewerChange: returning ? "the changed reading gains history" : "the changed reading lands", nextQuestion: "What remains after the relationship is noticed?" },
    ],
    payoff: to.label, unresolvedQuestion: "What becomes newly meaningful when these supplied details are read together?",
    evidence: unique([from.label, to.label, ...(relation.evidence ?? [])]).slice(0, 8),
    hypothesis: [`${subject}: the supplied ${relation.kind} relationship makes these details more meaningful together.`],
    truthRisk: 0, novelty: clamp(.45 + score * .4), specificity: clamp(.78 + score * .18), informationValue: clamp(.52 + score * .4), uncertainty: clamp(.34 - score * .12),
    attentionPotential: clamp(.58 + score * .36), consequencePotential: operation === "consequence" ? .8 : .55, callbackPotential: returning ? .82 : operation === "recur" ? .68 : .18,
    compressionPotential: clamp(.72 + score * .2), repetitionRisk: .04, distinctiveness: clamp(.72 + score * .2), score,
  };
}
function eventSequence(event: RealityGraph["events"][number], subject: string, returning: boolean, persistent = false): SequenceCandidate {
  return {
    id: `sequence-${persistent ? "material" : "event"}-${event.id}`, lens: "NONE", anchorEventIds: [event.id], supportingRelationKinds: [],
    trajectory: [{ order: 1, operation: returning ? "recur" : "establish", eventIds: [event.id], viewerChange: `notice ${event.label}`, nextQuestion: "What supplied detail changes the reading?" }],
    payoff: event.label, unresolvedQuestion: "What supplied detail changes the reading?", evidence: unique([event.label, ...(event.entities ?? [])]).slice(0, 4),
    hypothesis: [`${subject}: this supplied ${persistent ? "persistent detail" : "occurrence"} can carry meaning without inventing a new event.`], truthRisk: 0,
    novelty: persistent ? .7 : .58, specificity: persistent ? .98 : .95, informationValue: persistent ? .78 : .7, uncertainty: persistent ? .16 : .22,
    attentionPotential: persistent ? .84 : .74, consequencePotential: .3, callbackPotential: returning ? .82 : .12, compressionPotential: persistent ? .95 : .88,
    repetitionRisk: .04, distinctiveness: persistent ? .92 : .84, score: persistent ? .72 : .62,
  };
}
function sequenceCandidates(input: AuthorCognitionInput, eligible: Set<string>): SequenceCandidate[] {
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1); const subject = clean(input.subject) || "the subject"; const out: SequenceCandidate[] = [];
  let index = 0;
  for (const relation of input.realityGraph.relations.slice(0, 100)) {
    if (!eligible.has(relation.from) || !eligible.has(relation.to)) continue;
    const candidate = sequenceFromRelation(input.realityGraph, subject, relation, returning, index++); if (candidate) out.push(candidate);
  }
  if (!out.length) for (const event of input.realityGraph.events.filter((event) => eligible.has(event.id)).slice(0, 6)) out.push(eventSequence(event, subject, returning));
  if (!out.length) for (const event of input.realityGraph.events.filter((event) => !eligible.has(event.id)).slice(0, 6)) out.push(eventSequence(event, subject, returning, true));
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}
function adaptiveQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const out: AuthorAdaptiveQuestion[] = [];
  if (!clean(input.subject)) out.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." });
  if (!clean(input.place) && !input.realityGraph.events.some((event) => event.place)) out.push({ kind: "where", question: "Where did this happen?", reason: "Place may add useful context." });
  return out.slice(0, 2);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const subjectMaterial = classifyMaterial(input.facts); const subjectTruth = subjectTruthFrom(input, subjectMaterial); const eligible = eligibleIds(input);
  const candidates = sequenceCandidates(input, eligible); const reality = {
    subject: clean(input.subject) || "unknown", prompt: clean(input.prompt), subjectMaterial, events: input.realityGraph.events.slice(0, 40),
    relations: input.realityGraph.relations.slice(0, 50), patterns: input.realityGraph.patterns?.slice(0, 20) ?? [], tensions: input.realityGraph.unresolvedTensions?.slice(0, 12) ?? [],
    memories: (input.memoryContext ?? []).slice(0, 12), priorSequenceText: (input.trajectory ?? []).slice(-10), returning: Boolean(input.returning || (input.visitNumber ?? 1) > 1),
  };
  let interpretations: AuthorCreativeInterpretation[] = []; let model = "deterministic"; let modelCalls = 0;
  try {
    const response = await localModelGenerate([
      { role: "system", content: "You are QRE universal semantic cognition. Discover meaningful relationships inside supplied reality. Return only grounded interpretations with thesis, creativeOpportunity, rationale, and evidenceEventIds. Never invent events or design presentation, production, or genre concepts. Memory is supplied reality and may create recognition, recurrence, changed meaning, or continuity." },
      { role: "user", content: JSON.stringify(reality) },
    ], "json", { numPredict: 850, temperature: .7 });
    const parsed = JSON.parse(clean(response.text)) as Record<string, unknown>;
    const rows = Array.isArray(parsed.interpretations) ? parsed.interpretations : [];
    interpretations = rows.slice(0, 6).flatMap((row, index) => {
      if (!row || typeof row !== "object") return [];
      const value = row as Record<string, unknown>;
      const ids = Array.isArray(value.evidenceEventIds) ? unique(value.evidenceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => input.realityGraph.events.some((event) => event.id === id)).slice(0, 6) : [];
      const thesis = clean(value.thesis); if (!thesis || !ids.length) return [];
      return [{ id: clean(value.id) || `interpretation-${index + 1}`, thesis, creativeOpportunity: clean(value.creativeOpportunity) || "supplied relationship", rationale: clean(value.rationale) || "grounded in supplied reality", evidenceEventIds: ids, confidence: clamp(value.confidence, .65) }];
    });
    model = response.model; modelCalls = 1;
  } catch { /* deterministic cognition remains authoritative fallback */ }

  const selected = candidates[0];
  const proposition: AuthorCreativeProposition = {
    text: selected?.hypothesis[0] ?? interpretations[0]?.thesis ?? "A supplied detail becomes more meaningful in relationship to another supplied detail.",
    pattern: selected?.supportingRelationKinds[0] ?? "relationship",
    sourceEventIds: selected?.anchorEventIds ?? interpretations[0]?.evidenceEventIds ?? [],
  };
  const fallbackArtist: AuthorArtistDirection = {
    creativeProposition: proposition,
    mechanic: { text: proposition.text, sourceEventIds: proposition.sourceEventIds },
    hook: { text: selected?.evidence[0] ?? clean(input.subject) || "the subject", sourceEventIds: selected?.anchorEventIds.slice(0, 1) ?? [] },
    openLoop: { text: selected?.unresolvedQuestion ?? "What changes the reading?", sourceEventIds: selected?.anchorEventIds ?? [] },
    tension: { text: proposition.text, sourceEventIds: proposition.sourceEventIds },
    surprise: { text: "The later supplied detail changes the meaning of what came before.", sourceEventIds: proposition.sourceEventIds },
    payoff: { text: proposition.text, sourceEventIds: proposition.sourceEventIds },
  };
  return {
    selectedLens: "NONE",
    frame: { mode: "none", frame: "NONE", confidence: 1, coreTension: "", creativeGain: "", templateRisk: "", evidenceEventIds: [] },
    interpretations: interpretations.length ? interpretations : selected ? [{ id: "interpretation-grounded", thesis: selected.hypothesis[0] ?? "", creativeOpportunity: selected.supportingRelationKinds[0] ?? "supplied relationship", rationale: "derived from supplied reality", evidenceEventIds: selected.anchorEventIds, confidence: selected.score }] : [],
    sequenceCandidates: candidates,
    selectedSequence: selected,
    adaptiveQuestions: adaptiveQuestions(input),
    attentionStrategy: interpretations[0]?.thesis ?? selected?.hypothesis[0] ?? proposition.text,
    reasoningSummary: unique([...(input.realityGraph.unresolvedTensions ?? []), ...(input.realityGraph.patterns ?? []).map((pattern) => pattern.label)]).slice(0, 6),
    subjectTruth, subjectMaterial, artistDirection: fallbackArtist, model, modelCalls,
  };
}
