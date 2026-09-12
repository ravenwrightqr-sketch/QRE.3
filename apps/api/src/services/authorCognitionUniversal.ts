/**
 * QRE UNIVERSAL COGNITION
 *
 * The artifact is a sequence-text film: text moving as a sequence of
 * attention-changing screens. `LatentMovieCandidate` is only a compatibility
 * name for a possible grounded sequence-text realization.
 *
 * Cognition discovers relationships, patterns, tensions, recurrence, change,
 * and meaningful connections in supplied reality. It does NOT invent movies,
 * genres, shots, cameras, soundtracks, transitions, or production plans.
 *
 * RealityGraph is the source-truth boundary. Persistent memory is additional
 * supplied reality and may create recognition, recurrence, changed charge, or
 * continuity. Artist chooses the central creative proposition.
 */
import type { AuthorDomainContext, CreativeFrameSelection, LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, SubjectTruth } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import type { AuthorArtistDirection } from "./authorArtistChoice.js";

export type AuthorCognitionInput = { prompt: string; lens?: string; subject?: string; place?: string; facts: string[]; sourceMoments: string[]; realityGraph: RealityGraph; domainContext?: AuthorDomainContext; memoryContext?: string[]; trajectory?: string[]; creativeLearningContext?: string[]; returning?: boolean; visitNumber?: number };
export type AuthorCreativeInterpretation = { id: string; thesis: string; creativeOpportunity: string; rationale: string; evidenceEventIds: string[]; confidence: number };
export type AuthorAdaptiveQuestion = { kind: "who" | "where" | "when" | "event" | "detail"; question: string; reason: string };
export type AuthorSubjectMaterial = { identity: string[]; traits: string[]; preferences: string[]; routines: string[]; goals: string[]; relationships: string[]; memories: string[]; other: string[] };
export type AuthorCognitionPlan = { selectedLens: string; frame: CreativeFrameSelection; interpretations: AuthorCreativeInterpretation[]; latentMovieCandidates: LatentMovieCandidate[]; selectedMovie?: LatentMovieCandidate; adaptiveQuestions: AuthorAdaptiveQuestion[]; attentionStrategy: string; reasoningSummary: string[]; subjectTruth: SubjectTruth; subjectMaterial: AuthorSubjectMaterial; artistDirection: AuthorArtistDirection; model: string; modelCalls: number };

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
const OPS = new Set<LatentMovieTrajectoryStep["operation"]>(["establish", "contrast", "recur", "reframe", "escalate", "converge", "reveal", "consequence", "payoff"]);

function parse(text: string): Record<string, unknown> | undefined {
  const normalized = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  try { const value = JSON.parse(normalized); return value && typeof value === "object" ? value as Record<string, unknown> : undefined; } catch {
    const start = normalized.indexOf("{"), end = normalized.lastIndexOf("}"); if (start < 0 || end <= start) return undefined;
    try { const value = JSON.parse(normalized.slice(start, end + 1)); return value && typeof value === "object" ? value as Record<string, unknown> : undefined; } catch { return undefined; }
  }
}
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
function relationOperation(kind: RealityGraph["relations"][number]["kind"]): LatentMovieTrajectoryStep["operation"] | undefined {
  switch (kind) { case "contrasts": return "contrast"; case "changes": case "causes": return "consequence"; case "converges": return "converge"; case "recontextualizes": return "reframe"; case "repeats": return "recur"; case "involves": return "reveal"; default: return undefined; }
}
function candidateFromRelation(graph: RealityGraph, subject: string, relation: RealityGraph["relations"][number], returning: boolean, index: number): LatentMovieCandidate | undefined {
  const from = graph.events.find((event) => event.id === relation.from); const to = graph.events.find((event) => event.id === relation.to); const operation = relationOperation(relation.kind);
  if (!from || !to || !operation || !OPS.has(operation)) return undefined;
  const score = clamp(relation.strength * 0.6 + (relation.evidence?.length ?? 0) / 5 * 0.2 + (operation === "contrast" || operation === "reframe" || operation === "converge" ? 0.14 : 0.06) + (returning ? 0.06 : 0));
  return { id: `sequence-${relation.from}-${relation.to}-${relation.kind}-${index}`, lens: "NONE", anchorEventIds: [relation.from, relation.to], supportingRelationKinds: [relation.kind], trajectory: [
    { order: 1, operation: "establish", eventIds: [relation.from], viewerChange: `notice ${from.label}`, nextQuestion: "What does the next supplied detail change?" },
    { order: 2, operation, eventIds: [relation.from, relation.to], viewerChange: `the supplied ${relation.kind} relationship changes the reading`, nextQuestion: "What becomes newly meaningful?" },
    { order: 3, operation: "payoff", eventIds: [relation.to], viewerChange: returning ? "the changed reading gains history" : "the changed reading lands", nextQuestion: "What remains after the relationship is noticed?" },
  ], payoff: to.label, unresolvedQuestion: "What becomes newly meaningful when these supplied details are read together?", evidence: unique([from.label, to.label, ...(relation.evidence ?? [])]).slice(0, 8), hypothesis: [`${subject}: the supplied ${relation.kind} relationship makes these details more meaningful together.`], truthRisk: 0, novelty: clamp(.45 + score * .4), specificity: clamp(.78 + score * .18), informationValue: clamp(.52 + score * .4), uncertainty: clamp(.34 - score * .12), attentionPotential: clamp(.58 + score * .36), consequencePotential: operation === "consequence" ? .8 : .55, callbackPotential: returning ? .82 : operation === "recur" ? .68 : .18, compressionPotential: clamp(.72 + score * .2), repetitionRisk: .04, distinctiveness: clamp(.72 + score * .2), score };
}
function singleEventCandidate(event: RealityGraph["events"][number], subject: string, returning: boolean): LatentMovieCandidate {
  return { id: `sequence-event-${event.id}`, lens: "NONE", anchorEventIds: [event.id], supportingRelationKinds: [], trajectory: [{ order: 1, operation: returning ? "recur" : "establish", eventIds: [event.id], viewerChange: `notice ${event.label}`, nextQuestion: "What supplied detail changes its meaning?" }], payoff: event.label, unresolvedQuestion: "What supplied detail changes the reading?", evidence: [event.label], hypothesis: [`${subject}: this supplied occurrence can carry meaning without adding plot.`], truthRisk: 0, novelty: .58, specificity: .95, informationValue: .7, uncertainty: .22, attentionPotential: .74, consequencePotential: .3, callbackPotential: returning ? .82 : .12, compressionPotential: .88, repetitionRisk: .08, distinctiveness: .84, score: .62 };
}
function persistentCandidate(event: RealityGraph["events"][number], subject: string, returning: boolean): LatentMovieCandidate {
  return { id: `sequence-material-${event.id}`, lens: "NONE", anchorEventIds: [event.id], supportingRelationKinds: [], trajectory: [{ order: 1, operation: returning ? "recur" : "establish", eventIds: [event.id], viewerChange: `this persistent detail defines ${subject}`, nextQuestion: "What other supplied detail gives it character?" }], payoff: event.label, unresolvedQuestion: "What other supplied detail changes the read?", evidence: unique([event.label, ...(event.entities ?? [])]).slice(0, 4), hypothesis: [`${subject}: this persistent detail can become characterization without becoming a fake event.`], truthRisk: 0, novelty: .7, specificity: .98, informationValue: .78, uncertainty: .16, attentionPotential: .84, consequencePotential: .2, callbackPotential: returning ? .9 : .18, compressionPotential: .95, repetitionRisk: .02, distinctiveness: .92, score: .72 };
}
function sequenceCandidates(input: AuthorCognitionInput, eligible: Set<string>): LatentMovieCandidate[] {
  const returning = Boolean(input.returning || (input.visitNumber ?? 1) > 1); const subject = clean(input.subject) || "the subject"; const out: LatentMovieCandidate[] = []; let index = 0;
  for (const relation of input.realityGraph.relations.slice(0, 100)) { if (!eligible.has(relation.from) || !eligible.has(relation.to)) continue; const candidate = candidateFromRelation(input.realityGraph, subject, relation, returning, index++); if (candidate) out.push(candidate); }
  if (!out.length) for (const event of input.realityGraph.events.filter((e) => eligible.has(e.id)).slice(0, 6)) out.push(singleEventCandidate(event, subject, returning));
  if (!out.length) for (const event of input.realityGraph.events.filter((e) => !eligible.has(e.id)).slice(0, 6)) out.push(persistentCandidate(event, subject, returning));
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}
function fallbackQuestions(input: AuthorCognitionInput): AuthorAdaptiveQuestion[] {
  const out: AuthorAdaptiveQuestion[] = []; if (!clean(input.subject)) out.push({ kind: "who", question: "Who or what is this about?", reason: "The focal subject is missing." }); if (!clean(input.place) && !input.realityGraph.events.some((e) => e.place)) out.push({ kind: "where", question: "Where did this happen?", reason: "Place may add useful context." }); return out.slice(0, 2);
}

export async function buildAuthorCognitivePlan(input: AuthorCognitionInput): Promise<AuthorCognitionPlan> {
  const material = classifyMaterial(input.facts); const subjectTruth = subjectTruthFrom(input, material); const eligible = eligibleIds(input); const candidates = sequenceCandidates(input, eligible);
  const compact = { subject: clean(input.subject) || "unknown", prompt: clean(input.prompt), subjectMaterial: material, events: input.realityGraph.events.slice(0, 40).map((e) => ({ id: e.id, label: e.label, entities: e.entities, place: e.place, time: e.time, provenance: e.provenance, salient: e.salient })), relations: input.realityGraph.relations.slice(0, 50), patterns: input.realityGraph.patterns?.slice(0, 20) ?? [], tensions: input.realityGraph.unresolvedTensions?.slice(0, 12) ?? [], memories: (input.memoryContext ?? []).slice(0, 12), priorSequenceText: (input.trajectory ?? []).slice(-10), returning: Boolean(input.returning || (input.visitNumber ?? 1) > 1) };
  let interpretations: AuthorCreativeInterpretation[] = []; let model = "deterministic"; let modelCalls = 0;
  try {
    const response = await localModelGenerate([
      { role: "system", content: "You are QRE universal semantic cognition. Discover meaningful relationships inside supplied reality. Do not invent events. Do not design movies, genres, shots, cameras, soundtracks, transitions, production plans, or scripts. Return concise grounded interpretations only: thesis, creative opportunity, rationale, and supplied event ids. Memory is supplied reality and may create recognition or changed meaning." },
      { role: "user", content: JSON.stringify(compact) },
    ], "json", { numPredict: 850, temperature: .7 });
    const parsed = parse(response.text); const rows = Array.isArray(parsed?.interpretations) ? parsed.interpretations : [];
    interpretations = rows.slice(0, 6).flatMap((row, index) => { if (!row || typeof row !== "object") return []; const value = row as Record<string, unknown>; const ids = Array.isArray(value.evidenceEventIds) ? unique(value.evidenceEventIds.filter((id): id is string => typeof id === "string")).filter((id) => input.realityGraph.events.some((e) => e.id === id)).slice(0, 6) : []; const thesis = clean(value.thesis); if (!thesis || !ids.length) return []; return [{ id: clean(value.id) || `interpretation-${index + 1}`, thesis, creativeOpportunity: clean(value.creativeOpportunity) || "supplied relationship", rationale: clean(value.rationale) || "grounded in supplied reality", evidenceEventIds: ids, confidence: clamp(value.confidence, .65) }]; });
    model = response.model; modelCalls = 1;
  } catch {}
  const selected = candidates[0]; const ids = selected?.anchorEventIds ?? [];
  const proposition: AuthorCreativeProposition = { text: selected?.hypothesis[0] ?? "Find the strongest supplied relationship.", pattern: selected?.supportingRelationKinds[0] ?? "relationship", sourceEventIds: ids };
  const artistDirection: AuthorArtistDirection = { creativeProposition: proposition, mechanic: { text: proposition.text, sourceEventIds: ids }, hook: { text: selected?.evidence[0] ?? clean(input.subject) || "the subject", sourceEventIds: ids.slice(0, 1) }, openLoop: { text: selected?.unresolvedQuestion ?? "What changes the reading?", sourceEventIds: ids }, tension: { text: selected?.hypothesis[0] ?? "Two supplied details meet.", sourceEventIds: ids }, surprise: { text: "Let a supplied detail change the meaning of what came before.", sourceEventIds: ids }, payoff: { text: selected?.payoff ?? "Land on what the supplied reality makes unmistakable.", sourceEventIds: ids.slice(-1) } };
  return { selectedLens: "NONE", frame: { mode: "none", frame: "NONE", confidence: 1, coreTension: "", creativeGain: "", templateRisk: "", evidenceEventIds: [] }, interpretations: interpretations.length ? interpretations : selected ? [{ id: "interpretation-grounded", thesis: selected.hypothesis[0] ?? "", creativeOpportunity: selected.supportingRelationKinds[0] ?? "supplied relationship", rationale: "derived from supplied reality", evidenceEventIds: selected.anchorEventIds, confidence: selected.score }] : [], latentMovieCandidates: candidates, selectedMovie: selected, adaptiveQuestions: fallbackQuestions(input), attentionStrategy: interpretations[0]?.thesis ?? selected?.hypothesis[0] ?? "Find the strongest supplied relationship.", reasoningSummary: unique([...(input.realityGraph.unresolvedTensions ?? []), ...(input.realityGraph.patterns ?? []).map((p) => p.label)]).slice(0, 6), subjectTruth, subjectMaterial: material, artistDirection, model, modelCalls };
}
