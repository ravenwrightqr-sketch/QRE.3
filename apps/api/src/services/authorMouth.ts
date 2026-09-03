import type {
  AuthorDomainContext,
  MouthBeamOptions,
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidatePool,
  MouthSequencePath,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { classifyLens } from "./authorCharacterLensEngine.js";

/** ONE PRODUCTION MOUTH. QRE owns truth, meaning, strategy, scoring, and selection. */
export type { MouthCandidateBeat } from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
  domainContext?: AuthorDomainContext;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by",
  "through", "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are",
  "was", "were", "be", "been", "being", "as", "into", "my", "your", "our", "their", "his", "her",
  "its", "he", "she", "they", "them", "you", "we", "me", "very", "really", "just", "already",
  "apparently", "somehow", "perhaps", "maybe",
]);

const tokens = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'’-]+/g).filter((x) => x.length >= 3));
const meaningful = (value: string): Set<string> => new Set([...tokens(value)].filter((x) => !STOP.has(x)));
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
};
const wordCount = (value: string): number => clean(value).split(/\s+/).filter(Boolean).length;
const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function sourceLabels(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return uniqueStrings((beat.eventIds ?? []).map((id) => envelope.events.find((event) => event.id === id)?.label ?? ""));
}

function semantic(beat: MouthCandidateBeat) {
  return beat.semanticRealization;
}

function relationKind(beat: MouthCandidateBeat): string {
  return clean(semantic(beat)?.relation?.kind).toLowerCase();
}

function extractObject(label: string, subject: string): string {
  const value = clean(label).replace(/[.!?]+$/g, "");
  const withoutSubject = subject
    ? value.replace(new RegExp(`^${subject.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b[,:]?\\s*`, "i"), "")
    : value;
  const patterns = [
    /\b(?:stole|took|grabbed|got|found|lost|bought|sold|ordered|chose|kept|returned|wore|used|held|picked)\s+(?:the|a|an)?\s*(.+)$/i,
    /\b(?:for|with|about|on)\s+(?:the|a|an)?\s*(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = withoutSubject.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return withoutSubject;
}

function creativeStrategies(beat: MouthCandidateBeat): string[] {
  const relation = relationKind(beat);
  const role = clean(beat.role).toLowerCase();
  const out: string[] = [];
  const add = (name: string, job: string) => out.push(`${name}: ${job}`);
  if (/contrast|opposition|difference|tension/i.test(relation)) add("CONTRAST", "put two supplied meanings against each other");
  if (/agency|choice|decision|deviation|interruption|rebellion|unexpected|intent/i.test(relation)) add("STATUS_REVERSAL", "let the supplied outcome defeat the earlier expectation");
  if (/ownership|possession|belong|property/i.test(relation)) add("POSSESSION_TURN", "use the supplied ownership relation as the punch");
  if (/return|recurrence|again|callback|memory/i.test(relation)) add("CALLBACK", "make a repeated supplied detail heavier because of what changed");
  if (/cause|consequence|result|effect/i.test(relation)) add("CONSEQUENCE", "let the supplied result speak for itself");
  if (/surprise|absurd|comic|humou?r/i.test(relation)) add("COMIC_INVERSION", "make the supplied fact undercut the expected reading");
  add("RECONTEXTUALIZATION", "make one supplied detail read differently beside another supplied detail");
  add("IMPLICATION", "leave the approved connection for the reader to complete");
  add("UNDERSTATEMENT", "say less than the full obvious explanation");
  add("COMPRESSION", "remove connective prose and keep the sharpest anchors");
  add("COLLISION", "put two supplied details into one memorable relationship");
  if (/payoff|release/i.test(role)) add("PAYOFF_LANDING", "land the supplied endpoint without adding another event");
  if (/establish|arrival/i.test(role)) add("HOOK_ANCHOR", "make the first supplied detail carry the unresolved pressure");
  return uniqueStrings(out).slice(0, 8);
}

function compactCreativeJob(beat: MouthCandidateBeat, envelope: RealityEnvelope) {
  const s = semantic(beat);
  return {
    order: beat.order,
    role: clean(beat.role),
    subject: clean(envelope.subject),
    evidence: sourceLabels(beat, envelope),
    meaning: {
      relation: clean(s?.relation?.kind),
      before: clean(s?.before),
      after: clean(s?.after),
      move: clean(s?.realizationMove),
      opportunity: clean(s?.creativeOpportunity),
      mechanism: clean(s?.mechanism),
      evidenceEventIds: s?.evidenceEventIds ?? [],
      beforeEventIds: s?.beforeEventIds ?? [],
      afterEventIds: s?.afterEventIds ?? [],
    },
    observer: beat.observerExperience
      ? {
          surprise: clean(beat.observerExperience.surprise),
          curiosity: clean(beat.observerExperience.curiosity),
          landing: clean(beat.observerExperience.landing),
          forbidden: beat.observerExperience.explanationForbidden === true,
        }
      : null,
    change: clean(beat.change),
    next: clean(beat.next),
    strategies: creativeStrategies(beat),
    obligations: uniqueStrings(beat.obligations ?? []),
    forbidden: uniqueStrings(beat.forbiddenMoves ?? []),
    creativeJob: "Make the approved relationship FELT in one short line. Do not paraphrase the source sentence.",
  };
}

function genericRisk(text: string): number {
  return /\b(?:special moment|what a day|magical|magic happens|journey|new chapter|happy ending|everything changed|unforgettable|beautiful moment|meaningful moment|good times|making memories|cherished memories|a day to remember|ready for anything|full of joy|cinematic|like a movie|in that moment|speaks volumes|the truth is revealed|new beginning|such a special|wonderful experience)\b/i.test(clean(text)) ? 1 : 0;
}

function processRisk(text: string): number {
  return /\b(?:viewer|audience|beat|strategy|cognition|frontier|narrative|storytelling|theme|realization|payoff|information|evidence|semantic|trajectory|candidate|mouth|author|planner)\b/i.test(clean(text)) ? 1 : 0;
}

function explanationRisk(text: string): number {
  const value = clean(text);
  let hits = 0;
  for (const pattern of [
    /\b(?:because|therefore|thus|hence|due to|as a result|thanks to)\b/i,
    /\b(?:the reason|the cause|the point|the meaning|the secret|the ingredient)\b/i,
    /\b(?:which made|which caused|which meant|that's how|that is how)\b/i,
    /\b(?:this means|which means|in other words)\b/i,
  ]) if (pattern.test(value)) hits += 1;
  return metric(hits / 2);
}

function unsupportedConcreteRisk(text: string, envelope: RealityEnvelope): number {
  const value = clean(text);
  if (!value) return 1;
  if (processRisk(value)) return 1;
  const source = meaningful([
    envelope.subject,
    ...envelope.events.map((event) => event.label),
    ...envelope.suppliedEntities,
    ...envelope.suppliedActions,
    ...envelope.suppliedStates,
    ...envelope.suppliedPhrases,
  ].join(" "));
  const grounding = overlap(meaningful(value), source);
  const unsupportedActions = /\b(?:walk(?:ed|s)?|run(?:ning|s)?|jump(?:ed|s|ing)?|grab(?:bed|s|bing)?|kiss(?:ed|es|ing)?|hug(?:ged|s|ging)?|smil(?:ed|es|ing)?|laugh(?:ed|s|ing)?|talk(?:ed|s|ing)?|open(?:ed|s|ing)?|clos(?:ed|es|ing)?|enter(?:ed|s|ing)?|look(?:ed|s|ing)?|move(?:d|s|ing)?|touch(?:ed|es|ing)?|throw|threw|catch|caught|dance(?:d|s|ing)?|drive|drove|push(?:ed|es|ing)?|pull(?:ed|s|ing)?|vanish(?:ed|s|ing)?|disappear(?:ed|s|ing)?|blink(?:ed|s|ing)?|wave(?:d|s|ing)?)\b/i;
  if (unsupportedActions.test(value) && grounding < 0.45) return 1;
  return 0;
}

function authorialForce(text: string, beat: MouthCandidateBeat): number {
  const value = clean(text);
  if (!value) return 0;
  const relation = relationKind(beat);
  let score = 0;
  if (/\b(?:other|different)\s+(?:plans?|ideas?|agenda|way)\b/i.test(value)) score += 0.55;
  if (/\b(?:instead|apparently|after all|not quite|so much for|somehow)\b/i.test(value)) score += 0.3;
  if (/\b(?:but|except|only|until|then|while)\b/i.test(value)) score += 0.2;
  if (/\b(?:still|already|yet|again)\b/i.test(value)) score += 0.15;
  if (/\b(?:their|its|his|her)\s+(?:own|way|plan|idea|problem)\b/i.test(value)) score += 0.18;
  if (/agency|choice|decision|deviation|unexpected/i.test(relation) && /\b(?:plans?|ideas?|instead|apparently|wanted|chose|decided)\b/i.test(value)) score += 0.25;
  return metric(score);
}

function creativeEvidenceOverlap(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const labels = sourceLabels(beat, envelope);
  const candidate = meaningful(text);
  if (!labels.length) return 0;
  return metric(labels.reduce((sum, label) => sum + overlap(meaningful(label), candidate), 0) / labels.length);
}

function semanticOverlap(text: string, beat: MouthCandidateBeat): number {
  const s = semantic(beat);
  if (!s) return 0;
  return overlap(meaningful([clean(s.before), clean(s.after), clean(s.relation?.kind), clean(s.creativeOpportunity), clean(s.realizationMove), clean(s.mechanism)].join(" ")), meaningful(text));
}

function exactSource(text: string, labels: readonly string[]): boolean {
  const value = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => clean(label).replace(/[.!?]+$/g, "").toLowerCase() === value);
}

function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[]): MouthCandidate {
  const value = clean(text);
  const labels = sourceLabels(beat, envelope);
  const literal = exactSource(value, labels);
  const grounding = metric(creativeEvidenceOverlap(value, beat, envelope) * 0.7 + overlap(meaningful(value), meaningful(envelope.subject)) * 0.15 + semanticOverlap(value, beat) * 0.15);
  const invention = metric(unsupportedConcreteRisk(value, envelope));
  const generic = genericRisk(value);
  const process = processRisk(value);
  const explanation = explanationRisk(value);
  const force = authorialForce(value, beat);
  const semanticApproved = Boolean(semantic(beat));
  const relation = relationKind(beat);
  const hasRelationalMove = semanticApproved && (
    semanticOverlap(value, beat) >= 0.16 ||
    force >= 0.32 ||
    (creativeEvidenceOverlap(value, beat, envelope) >= 0.28 && /contrast|agency|choice|decision|deviation|unexpected|ownership|consequence|cause|callback|recontext/i.test(relation))
  );
  const priorNovelty = priorTexts.length === 0 ? 1 : metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0));
  const compressed = wordCount(value) >= 2 && wordCount(value) <= 10;
  const forbidden = beat.observerExperience?.explanationForbidden === true;
  const explanationPenalty = forbidden ? explanation : explanation * 0.35;
  const creative = metric(grounding * 0.24 + force * 0.27 + (hasRelationalMove ? 0.22 : 0) + priorNovelty * 0.08 + (compressed ? 0.08 : 0) + (forbidden && explanation === 0 ? 0.05 : 0) - explanationPenalty * 0.4 - generic * 0.55 - process * 0.55);
  const score = literal ? metric(0.25 + grounding * 0.25 - generic * 0.5 - process * 0.5) : hasRelationalMove ? creative : 0;
  const reasons: string[] = [];
  if (literal) reasons.push("literal-source-restatement");
  if (grounding >= 0.18) reasons.push("event-grounded");
  if (semanticApproved) reasons.push("approved-semantic-realization");
  if (hasRelationalMove && !literal) reasons.push("meaning-executed");
  if (force >= 0.32) reasons.push("authorial-turn");
  if (creativeEvidenceOverlap(value, beat, envelope) >= 0.35) reasons.push("source-specific");
  if (priorNovelty >= 0.6) reasons.push("novel-language");
  if (compressed) reasons.push("compressed");
  if (explanation > 0) reasons.push("explicit-explanation-risk");
  if (generic) reasons.push("generic-summary-risk");
  if (process) reasons.push("process-language-risk");
  if (invention >= 0.9) reasons.push("unsupported-concrete-risk");

  return {
    text: value,
    beatOrder: beat.order,
    supportedEventIds: grounding >= 0.18 && invention < 0.9 ? [...(beat.eventIds ?? [])] : [],
    supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean),
    groundingScore: grounding,
    meaningScore: hasRelationalMove ? Math.max(semanticOverlap(value, beat), force) : literal ? 0.25 : 0,
    observerDiscoveryScore: hasRelationalMove ? metric((forbidden && explanation === 0 ? 1 : 0.7) * Math.max(0.4, force, semanticOverlap(value, beat))) : literal ? 0.08 : 0,
    transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4),
    obligationCoverage: hasRelationalMove ? metric(0.72 + grounding * 0.28) : literal ? 0.45 : 0,
    relationContractScore: metric((beat.relationKinds ?? []).length ? 0.86 : 0.4),
    forbiddenMoveRisk: metric(Math.max(invention, explanationPenalty, generic, process)),
    cohesionScore: metric(0.38 + force * 0.25 + grounding * 0.12 + priorNovelty * 0.08 + (hasRelationalMove ? 0.17 : 0) - explanationPenalty * 0.1 - generic * 0.15),
    noveltyScore: priorNovelty,
    compressionScore: compressed ? 0.98 : 0.55,
    inventionRisk: invention,
    repetitionRisk: 1 - priorNovelty,
    collageRisk: labels.length > 1 && creativeEvidenceOverlap(value, beat, envelope) < 0.25 ? 0.75 : 0,
    endpointExactness: literal ? 1 : 0,
    score,
    reasons,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are QRE's ONE MOUTH: an expert human copywriter operating under an absolute reality boundary.",
    "The movie, sequence, semantic meaning, and beat roles are already chosen. Your job is LANGUAGE REALIZATION, not planning.",
    "SOURCE FACTS ARE RAW MATERIAL, NOT PROSE TO COPY.",
    "Every non-opening beat must make the approved relationship FELT: reframe, contrast, collision, implication, callback, status reversal, understatement, or another supplied semantic turn.",
    "The opening/establishing beat may be a clean grounded anchor. The middle and payoff must not be mere source restatements when approved semantic meaning exists.",
    "Use only supplied reality. You may invent phrasing, syntax, attitude, metaphor, personification, wordplay, understatement, status language, comic timing, juxtaposition, and implication.",
    "Never invent a physical action, object, person, setting, sound, reaction, dialogue, chronology, or outcome.",
    "Never mention viewers, audiences, beats, strategies, evidence, cognition, movies, planning, or storytelling.",
    "Never write generic emotional summaries or trailer language.",
    "Prefer 3-8 words. A slightly longer source-specific punch is allowed when necessary.",
    "A grounded line can be creative without repeating every source noun. Preserve enough anchor that the approved reality remains recoverable.",
    "When agency, choice, deviation, or surprise is approved, a status phrase such as 'had other plans' may express it without adding an event.",
    "When two supplied details form the semantic center, collide them. Do not add a third concrete detail.",
    "At payoff, land the supplied endpoint and the accumulated meaning. Do not append another event.",
    "When explanationForbidden is true, do not explain the thesis, relationship, lesson, or conclusion.",
    "Internally draft many possibilities and silently reject weak ones. Return only the strongest three materially different realizations for every beat.",
    "A is safest sharp realization. B is compressed reframe. C is boldest approved implication.",
  ].join(" ");
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput) {
  const lens = classifyLens(input.lens);
  const jobs = input.beats.map((beat) => compactCreativeJob(beat, input.envelope));
  return [
    { role: "system" as const, content: buildSystemPrompt() },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "REALIZE_APPROVED_CREATIVE_JOBS",
        lens: input.lens || "AUTO",
        lensProfile: lens,
        reality: {
          subject: input.envelope.subject,
          entities: input.envelope.suppliedEntities.slice(0, 16),
          actions: input.envelope.suppliedActions.slice(0, 16),
          states: input.envelope.suppliedStates.slice(0, 16),
          phrases: input.envelope.suppliedPhrases.slice(0, 20),
          events: input.envelope.events.slice(0, 24).map((event) => ({ id: event.id, label: event.label })),
        },
        jobs,
        priorTexts: input.priorTexts ?? [],
        output: { variantsByBeat: jobs.map((job) => ({ order: job.order, variants: ["A", "B", "C"] })) },
      }, null, 2),
    },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try {
    const parsed = JSON.parse(clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as { variantsByBeat?: unknown };
    if (!Array.isArray(parsed.variantsByBeat)) return;
    const variantsByBeat = parsed.variantsByBeat.map((item) => {
      const value = item as { order?: unknown; variants?: unknown };
      return { order: Number(value.order), variants: Array.isArray(value.variants) ? value.variants.map(clean).filter(Boolean).slice(0, 3) : [] };
    }).filter((item) => Number.isFinite(item.order) && item.order > 0 && item.variants.length > 0);
    return variantsByBeat.length ? { variantsByBeat } : undefined;
  } catch {
    return undefined;
  }
}

export function deterministicCreativeFallback(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  const subject = clean(envelope.subject);
  const labels = sourceLabels(beat, envelope);
  const s = semantic(beat);
  if (!s || !labels.length) return [];
  const relation = clean(s.relation?.kind).toLowerCase();
  const current = extractObject(labels[labels.length - 1], subject);
  const target = extractObject(clean(s.after) || labels[labels.length - 1], subject);
  const candidates: string[] = [];
  const agency = /agency|choice|decision|deviation|interruption|rebellion|unexpected|intent|surprise/i.test(relation);
  const ownership = /ownership|possession|belong|property/i.test(relation);
  const contrast = /contrast|opposition|difference|tension/i.test(relation);
  const callback = /return|recurrence|again|callback|memory/i.test(relation);
  const consequence = /cause|consequence|result|effect/i.test(relation);
  if (agency && subject && target) {
    if (/payoff|release/i.test(clean(beat.role))) candidates.push(`${subject} had other plans for ${target}.`);
    else if (current) candidates.push(`Apparently, ${current} had competition.`);
  }
  if (ownership && target) candidates.push(`${target} became the point.`);
  if (contrast && current && target) candidates.push(`${current}, then ${target}.`);
  if (callback && current) candidates.push(`So much for ${current}.`);
  if (consequence && current) candidates.push(`${current} had consequences.`);
  if (!candidates.length && subject && target) candidates.push(`${subject} had other plans for ${target}.`);
  return uniqueStrings(candidates);
}

function lexicalNovelty(text: string, prior: readonly MouthCandidate[]): number {
  if (!prior.length) return 1;
  const current = meaningful(text);
  return metric(1 - Math.max(...prior.map((candidate) => overlap(current, meaningful(candidate.text))), 0));
}

function maybeRecoverExactSource(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope }): string {
  const labels = sourceLabels(input.beat, input.envelope);
  if (!exactSource(input.text, labels)) return clean(input.text);
  if (clean(input.beat.role).toLowerCase() === "establishing" || !semantic(input.beat)) return clean(input.text);
  return deterministicCreativeFallback(input.beat, input.envelope)[0] ?? clean(input.text);
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return evaluateCandidate(maybeRecoverExactSource(input), input.beat, input.envelope, input.priorTexts ?? []);
}

export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {
  if (!clean(candidate.text) || candidate.inventionRisk >= 0.9) return false;
  if (candidate.reasons.includes("generic-summary-risk") || candidate.reasons.includes("process-language-risk")) return false;
  if (candidate.reasons.includes("explicit-explanation-risk") && candidate.forbiddenMoveRisk >= 0.9) return false;
  if (candidate.endpointExactness >= 0.999 && candidate.beatOrder > 1) return false;
  if (candidate.beatOrder === 1 && candidate.endpointExactness >= 0.999) return true;
  return candidate.reasons.includes("approved-semantic-realization") &&
    candidate.reasons.includes("meaning-executed") &&
    (candidate.reasons.includes("authorial-turn") || candidate.meaningScore >= 0.34) &&
    candidate.score >= 0.3;
}

function pathIncrement(candidate: MouthCandidate, prior: readonly MouthCandidate[], pool: MouthCandidatePool): number {
  const novelty = lexicalNovelty(candidate.text, prior);
  const state = pool.viewerState;
  const fit = metric(candidate.transitionScore * 0.2 + state.stateShift * 0.16 + state.curiosityPressure * 0.2 + state.predictionError * 0.14 + candidate.observerDiscoveryScore * 0.3);
  return metric(candidate.score * 0.35 + candidate.meaningScore * 0.14 + candidate.cohesionScore * 0.1 + candidate.obligationCoverage * 0.06 + fit * 0.12 + novelty * 0.06 +
    (candidate.reasons.includes("authorial-turn") ? 0.09 : 0) + (candidate.reasons.includes("source-specific") ? 0.05 : 0) +
    (candidate.reasons.includes("compressed") ? 0.04 : 0) - (candidate.reasons.includes("explicit-explanation-risk") ? 0.12 : 0) - candidate.forbiddenMoveRisk * 0.12);
}

function dedupe(candidates: readonly MouthCandidate[]): MouthCandidate[] {
  const seen = new Set<string>();
  const result: MouthCandidate[] = [];
  for (const candidate of candidates) {
    const key = clean(candidate.text).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

export function selectBestMouthSequence(pools: readonly MouthCandidatePool[], options: MouthBeamOptions = {}): MouthSequencePath {
  const ordered = [...pools].sort((a, b) => a.order - b.order);
  if (!ordered.length) return { candidates: [], texts: [], score: 0 };
  const width = Math.max(1, Math.floor(options.width ?? 12));
  const perBeat = Math.max(1, Math.floor(options.candidatesPerBeat ?? 8));
  let paths: Array<{ candidates: MouthCandidate[]; score: number }> = [{ candidates: [], score: 0 }];
  for (let poolIndex = 0; poolIndex < ordered.length; poolIndex += 1) {
    const pool = ordered[poolIndex];
    const creative = dedupe(pool.candidates).filter(isAuthorizedMouthCandidate).filter((candidate) => !candidate.reasons.includes("literal-source-restatement"));
    const openingLiteral = poolIndex === 0
      ? dedupe(pool.candidates).filter((candidate) => candidate.endpointExactness >= 0.999 && candidate.inventionRisk < 0.9 && !candidate.reasons.includes("generic-summary-risk"))
      : [];
    const eligible = dedupe([...creative, ...openingLiteral]);
    if (!eligible.length) return { candidates: [], texts: [], score: 0 };
    eligible.sort((a, b) => b.score - a.score);
    const bounded = eligible.slice(0, Math.max(width, perBeat));
    const expanded: Array<{ candidates: MouthCandidate[]; score: number }> = [];
    for (const path of paths) {
      for (const candidate of bounded) {
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

export function completeMouthPools(input: { envelope: RealityEnvelope; beats: readonly MouthCandidateBeat[]; generated?: MouthCandidateBatch }): MouthCandidatePool[] {
  return input.beats.map((beat) => {
    if (!beat.viewerState) throw new Error(`Mouth beat ${beat.order} is missing viewerState`);
    const generated = input.generated?.variantsByBeat.find((item) => item.order === beat.order)?.variants ?? [];
    const generatedCandidates = generated.map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));
    const fallbackCandidates = deterministicCreativeFallback(beat, input.envelope).map((text) => scoreMouthCandidate({ text, beat, envelope: input.envelope }));
    return {
      order: beat.order,
      viewerState: beat.viewerState,
      nextPromise: clean(beat.next),
      frontier: clean(beat.frontier),
      candidates: dedupe([...generatedCandidates, ...fallbackCandidates]),
    };
  });
}
