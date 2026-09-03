import type { AuthorDomainContext, MouthBeamOptions, MouthCandidate, MouthCandidateBatch, MouthCandidateBeat, MouthCandidatePool, MouthSequencePath } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

/** ONE PRODUCTION MOUTH. Generation, authorization, and sequence selection live here. */
export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const STOP = new Set(["the","a","an","and","or","but","to","of","in","on","at","for","with","from","by","through","after","before","then","now","still","again","this","that","it","is","are","was","were","be","been","being","as","into","my","your","our","their","his","her","its","he","she","they","them","you","we","me","very","really","just","already","apparently","anyway","perhaps","maybe"]);
const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((token) => token.length >= 3));
const meaningful = (value: string): Set<string> => new Set([...tokens(value)].filter((token) => !STOP.has(token)));
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};
const wordCount = (value: string): number => clean(value).split(/\s+/).filter(Boolean).length;

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return [...new Set((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? "").map(clean).filter(Boolean))];
}

function worldSource(envelope: RealityEnvelope): string[] {
  return [envelope.subject, ...envelope.events.map((event) => event.label), ...envelope.suppliedPhrases, ...envelope.suppliedEntities, ...envelope.suppliedActions, ...envelope.suppliedStates, ...envelope.recurringSignals, ...envelope.sensorySignals, ...envelope.unresolvedTensions].map(clean).filter(Boolean);
}

function semanticSource(beat: MouthCandidateBeat): string[] {
  const semantic = beat.semanticRealization;
  if (!semantic) return [];
  return [semantic.subject, semantic.before, semantic.after, semantic.relation?.kind, semantic.callback?.detail, semantic.realizationMove, semantic.creativeOpportunity, semantic.mechanism].map(clean).filter(Boolean);
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function concreteRisk(text: string, source: string): number {
  const value = clean(text);
  if (!value) return 1;
  if (/\b(?:qre|cognition|planner|planning|candidate|semantic|trajectory|viewer|observer|objective|audience|mouth|author|beam|payoff\s+dependency)\b/i.test(value)) return 1;
  if (/\b(?:this means|which means|the meaning is|the point is|the viewer|the audience|this proves|in other words)\b/i.test(value)) return 1;
  const candidate = meaningful(value);
  const supplied = meaningful(source);
  const sourceOverlap = overlap(candidate, supplied);
  const unsupportedAction = /\b(?:walk(?:ed|s)?|run(?:ning|s)?|jump(?:ed|s|ing)?|grab(?:bed|s|bing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|talk(?:ed|s|ing)?|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|return(?:ed|s|ing)?|watch(?:ed|es|ing)?|look(?:ed|s|ing)?|move(?:d|s|ing)?|touch(?:ed|s|ing)?|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|es|ing)?|disappear(?:ed|s|ing)?)\b/i.test(value);
  if (unsupportedAction && sourceOverlap < 0.55) return 1;
  return 0;
}

function semanticAuthorization(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): { authorized: boolean; strength: number } {
  const semantic = beat.semanticRealization;
  if (!semantic) return { authorized: false, strength: 0 };
  const evidence = new Set(semantic.evidenceEventIds ?? []);
  if (!(beat.eventIds ?? []).some((id) => evidence.has(id))) return { authorized: false, strength: 0 };
  const candidate = meaningful(text);
  const labels = sourceLabels(beat, envelope);
  const semanticTokens = meaningful(semanticSource(beat).join(" "));
  const before = meaningful(clean(semantic.before));
  const after = meaningful(clean(semantic.after));
  const candidateBefore = overlap(candidate, before);
  const candidateAfter = overlap(candidate, after);
  const semanticOverlap = overlap(candidate, semanticTokens);
  const sourceHits = labels.filter((label) => overlap(candidate, meaningful(label)) >= 0.5).length;
  const crossEvent = sourceHits >= 2;
  const beforeAfter = before.size > 0 && after.size > 0 && candidateBefore >= 0.18 && candidateAfter >= 0.18;
  const semanticMove = semanticOverlap >= 0.34;
  if (!beforeAfter && !crossEvent && !semanticMove) return { authorized: false, strength: 0 };
  return { authorized: true, strength: metric((beforeAfter ? 0.5 : 0) + (crossEvent ? 0.3 : 0) + (semanticMove ? 0.2 : 0)) };
}

function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const wholeText = worldSource(envelope).join(" ");
  const grounding = metric(overlap(meaningful(value), meaningful(labels.join(" "))) * 0.75 + overlap(meaningful(value), meaningful(wholeText)) * 0.25);
  const semantic = semanticAuthorization(value, beat, envelope);
  const invention = metric(concreteRisk(value, wholeText));
  const novelty = priorTexts.length ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0)) : 1;
  const human = wordCount(value) >= 2 && wordCount(value) <= 12;
  const score = literal ? metric(0.72 + grounding * 0.18 + novelty * 0.1) : metric(semantic.authorized ? semantic.strength * 0.58 + grounding * 0.15 + novelty * 0.1 + (human ? 0.07 : 0) + 0.1 : 0);
  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (grounding >= 0.24) reasons.push("event-grounded");
  if (semantic.authorized) reasons.push("approved-semantic-realization");
  else if (!literal) reasons.push("candidate-does-not-express-approved-meaning");
  if ((beat.eventIds ?? []).length > 1 && grounding >= 0.35) reasons.push("cross-event-expression");
  if (human) reasons.push("human-sized-cut");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");
  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: grounding >= 0.24 && invention < 0.9 ? [...(beat.eventIds ?? [])] : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: semantic.authorized ? semantic.strength : literal ? 0.45 : 0,
    observerDiscoveryScore: semantic.authorized ? Math.max(semantic.strength, 0.4) : literal ? 0.12 : 0,
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4),
    obligationCoverage: metric(literal ? 1 : semantic.authorized ? 0.7 + semantic.strength * 0.3 : 0),
    relationContractScore: metric((beat.relationKinds ?? []).length ? 0.85 : 0.35),
    forbiddenMoveRisk: invention,
    cohesionScore: metric(0.55 + (semantic.authorized ? semantic.strength * 0.35 : 0) + grounding * 0.1),
    noveltyScore: novelty,
    compressionScore: human ? 0.95 : 0.65,
    inventionRisk: invention,
    repetitionRisk: 1 - novelty,
    collageRisk: 0,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH.",
    "Cognition has already decided the reality, movie, semantic meaning, evidence, relations, viewer movement, and beat order. You only realize approved meaning as language.",
    "Reality freedom is LOW. Framing freedom is HIGH.",
    "Grounding is not authorization. A source word or event ID never authorizes a creative interpretation.",
    "Never invent a person, object, place, physical action, physical relation, reaction, dialogue, event, or chronology.",
    "Use the lens to alter framing, rhythm, irony, tenderness, suspense, status, absurdity, or genre coloration only.",
    "When several supplied facts participate in one approved semantic turn, make their relationship perceptible instead of captioning each fact independently.",
    "Never write generic atmospheric filler, trailer narration, or a prettier noun for an event.",
    "Examples of forbidden thin output: 'A flash of blue.' 'A tremor.' 'Sudden stillness.' 'A final flourish.'",
    "If no approved semantic realization exists for a beat, use the supplied event literally. Do not invent a meaning.",
  ].join(" ");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const lens = classifyLens(input.lens);
  return [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: JSON.stringify({
      instruction: "Return exactly 3 materially different language realizations for every beat. They must express the approved semantic realization when one exists; otherwise preserve the supplied event literally.",
      lens: input.lens || "AUTO",
      lensProfile: lens,
      domainContext: input.domainContext ?? null,
      reality: worldSource(input.envelope),
      beats: input.beats.map((beat) => ({ order: beat.order, role: beat.role, eventIds: beat.eventIds ?? [], evidence: sourceLabels(beat, input.envelope), semanticRealization: beat.semanticRealization ?? null, observerExperience: beat.observerExperience ?? null, change: beat.change, next: beat.next, obligations: beat.obligations ?? [], forbiddenMoves: beat.forbiddenMoves ?? [] })),
      priorTexts: input.priorTexts ?? [],
      outputSchema: { variantsByBeat: [{ order: 1, variants: ["candidate", "candidate", "candidate"] }] },
    }, null, 2) },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return undefined;
    const variantsByBeat = parsed.variantsByBeat.map((item) => {
      const value = item as { order?: unknown; variants?: unknown };
      return { order: Number(value.order), variants: Array.isArray(value.variants) ? value.variants.map(clean).filter(Boolean).slice(0, 3) : [] };
    }).filter((item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0);
    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch { return undefined; }
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts ?? []);
}

export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  if (!clean(candidate.text)) return false;
  if (candidate.inventionRisk >= 0.9 || candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.endpointExactness >= 0.999) return true;
  return candidate.reasons.includes("approved-semantic-realization");
}

function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  const current = meaningful(text);
  return metric(1 - Math.max(...prior.map((candidate) => overlap(current, meaningful(candidate.text))), 0));
}

function pathIncrement(candidate: MouthCandidate, prior: readonly MouthCandidate[], pool: MouthCandidatePool): number {
  const state = pool.viewerState;
  const novelty = lexicalNovelty(candidate.text, prior);
  const stateFit = metric(candidate.transitionScore * 0.45 + state.stateShift * 0.2 + state.curiosityPressure * 0.15 + state.predictionError * 0.1 + candidate.observerDiscoveryScore * 0.1);
  const semanticBonus = candidate.reasons.includes("approved-semantic-realization") ? 0.12 : 0;
  const literalPenalty = candidate.endpointExactness >= 0.999 ? 0.08 : 0;
  return metric(candidate.score * 0.42 + stateFit * 0.24 + candidate.meaningScore * 0.12 + candidate.obligationCoverage * 0.06 + novelty * 0.06 + candidate.cohesionScore * 0.04 + semanticBonus - literalPenalty);
}

function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>();
  const output: MouthCandidate[] = [];
  for (const candidate of candidates) {
    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(candidate);
  }
  return output;
}

export function selectBestMouthSequence(pools: readonly MouthCandidatePool[], options: MouthBeamOptions = {}): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };
  if (ordered.some((pool) => !pool.viewerState || typeof pool.viewerState !== "object")) return { candidates: [], texts: [], score: 0 };
  const width = Math.max(1, Math.floor(options.width ?? 8));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [{ candidates: [], score: 0 }];
  for (const pool of ordered) {
    let eligible = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate);
    const creative = eligible.filter((candidate) => candidate.reasons.includes("approved-semantic-realization"));
    if (creative.length) eligible = creative;
    else eligible = eligible.filter((candidate) => candidate.endpointExactness >= 0.999);
    if (!eligible.length) return { candidates: [], texts: [], score: 0 };
    eligible.sort((a, b) => b.score - a.score);
    eligible = eligible.slice(0, Math.max(width, perBeat));
    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) {
      for (const candidate of eligible) {
        if (path.candidates.some((prior) => clean(prior.text).toLowerCase() === clean(candidate.text).toLowerCase())) continue;
        expanded.push({ candidates: [...path.candidates, candidate], score: path.score + pathIncrement(candidate, path.candidates, pool) });
      }
    }
    expanded.sort((a, b) => b.score - a.score);
    paths = expanded.slice(0, width);
  }
  const best = paths[0];
  if (!best) return { candidates: [], texts: [], score: 0 };
  return { candidates: best.candidates, texts: best.candidates.map((candidate) => candidate.text), score: metric(best.score / Math.max(1, best.candidates.length)) };
}
