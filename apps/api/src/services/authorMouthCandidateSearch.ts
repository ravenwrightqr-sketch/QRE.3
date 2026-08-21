import type {
  MouthCandidate,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { localModelGenerate } from "./localModelRuntime.js";

/**
 * Canonical Mouth boundary.
 *
 * QRE owns reality, meaning, beat movement, strategy, truth constraints,
 * legality, scoring, and selection. The model owns language realization.
 * One generation call produces complete candidate sequences.
 */
export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
};

export type MouthCandidatePool = {
  order: number;
  candidates: MouthCandidate[];
};

const MAX_CANDIDATES = 8;
const MAX_SEQUENCE_CANDIDATES = 4;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten"
    .split(/\s+/),
);

const META =
  /\b(?:beat|viewer|audience|strategy|planner|planning|cognition|realization|writing process|author brief|meaning spine|beat graph|sequence model|candidate pool|truth gate|attention editor|creative realization)\b/i;

const GENERIC =
  /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending)\b/i;

const QUESTION = /\?/;

const OPERATION_LANGUAGE =
  /\b(?:contrast(?:s|ed)?|reframe|reframing|transformation|transforms?|highlight(?:s|ed)?|explains?|shows? the contrast|changes? the meaning|the meaning is|the strategy is|the operation is|conclusion)\b/i;

const ANALYTIC_EXPLANATION =
  /\b(?:this means|this reveals|this shows|the point is|the reason is|the meaning is|which means|in other words|therefore|as a result)\b/i;

const PLACEHOLDER =
  /^(?:\.\.\.|candidate[_\s-]?(?:one|two|three|four|five)|line[_\s-]?(?:one|two|three|four|five)|short line(?: one| two| three| four| five)?)$/i;

const FIGURATIVE_FRAME =
  /\blike (?:a|an)\b|\bas if\b|\bas though\b|\bapparently\b|\bseemed like\b|\bthe room\b.*\bapproved\b|\bpeace was\b|\bterms were\b/i;

const FIGURATIVE_PEOPLE =
  /\b(?:lawyer|judge|king|queen|boss|manager|officer|celebrity|star)\b/gi;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function tokens(text: string): string[] {
  return unique(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3 && !STOP.has(token)),
  );
}

function stem(token: string): string {
  const value = token.toLowerCase();
  if (value.length > 6 && value.endsWith("ing")) return value.slice(0, -3);
  if (value.length > 5 && value.endsWith("ed")) return value.slice(0, -2);
  if (value.length > 5 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith("s")) return value.slice(0, -1);
  return value;
}

function setOf(text: string): Set<string> {
  return new Set(tokens(text).map(stem));
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }
  return hits / Math.max(1, left.size);
}

function similarity(left: string, right: string): number {
  return metric(overlap(setOf(left), setOf(right)));
}

function suppliedTerms(envelope: RealityEnvelope): Set<string> {
  return new Set(envelope.suppliedTerms.map(stem));
}

function eventLabel(envelope: RealityEnvelope, id: string): string {
  return envelope.events.find((event) => event.id === id)?.label ?? "";
}

function supportedEventIds(text: string, envelope: RealityEnvelope): string[] {
  return envelope.events
    .filter((event) => similarity(text, event.label) >= 0.34)
    .map((event) => event.id);
}

function supportedRelations(eventIds: readonly string[], envelope: RealityEnvelope): string[] {
  const ids = new Set(eventIds);
  return envelope.relations
    .filter((relation) => ids.has(relation.from) && ids.has(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);
}

function isPayoffBeat(beat: MouthCandidateBeat): boolean {
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  const mode = clean(beat.realizationMode).toLowerCase();
  return (
    role === "payoff" ||
    attention === "payoff" ||
    mode === "payoff" ||
    mode.includes("payoff")
  );
}

function endpointText(beat: MouthCandidateBeat): string {
  return unique(beat.paysOff ?? [])[0] ?? "";
}

function endpointExactness(text: string, beat: MouthCandidateBeat): number {
  if (!isPayoffBeat(beat)) return 0;
  const actual = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  const expected = clean(endpointText(beat)).replace(/[.!?]+$/g, "").toLowerCase();
  return expected && actual === expected ? 1 : 0;
}

function isFigurativeFraming(text: string): boolean {
  return FIGURATIVE_FRAME.test(text);
}

function concreteRisk(text: string, envelope: RealityEnvelope): number {
  const lower = clean(text).toLowerCase();
  if (!lower) return 1;

  const source = suppliedTerms(envelope);
  const concretePatterns: Array<{ pattern: RegExp; terminal?: boolean }> = [
    { pattern: /\b(?:eyes?|tail|ears?|hands?|feet?|fingers?|shoulders?|face|mouth|head|legs?|paws?)\b/i },
    { pattern: /\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched|wagged|smiled|cried|laughed|smirked|gasped)\b/i },
    { pattern: /\b(?:walked|ran|jumped|grabbed|threw|opened|closed|snatched|stalked|entered|picked|held|carried|touched|pulled|pushed|dragged|hugged|kissed)\b/i },
    { pattern: /\b(?:roar|roared|growl|growled|bark|barked|scream|screamed|whistle|whistled|buzz|buzzed|bang|banged|shouted|yelled)\b/i },
    { pattern: /\b(?:someone|man|woman|stranger|lawyer|judge|handler|owner|employee|customer|person|friend|enemy|guest)\b/i },
    { pattern: /\b(?:street|park|room|kitchen|salon|store|office|arena|courtroom|backstage|hotel|house|car|red carpet|restaurant|stage)\b/i },
    { pattern: /\b(?:table|door|window|chair|phone|bag|leash|scissors|camera|weapon|ticket|box|microphone|dress|suit)\b/i },
    { pattern: /\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived|celebrated|failed|succeeded)\b/i, terminal: true },
    { pattern: /\b(?:later|earlier|tomorrow|yesterday|the next day|years later|weeks later|months later)\b/i, terminal: true },
  ];

  const figurative = isFigurativeFraming(lower);

  for (const rule of concretePatterns) {
    const match = lower.match(rule.pattern);
    if (!match) continue;
    if (rule.terminal) return 1;

    const matched = match[0] ?? "";
    if (figurative && FIGURATIVE_PEOPLE.test(matched)) {
      FIGURATIVE_PEOPLE.lastIndex = 0;
      continue;
    }
    FIGURATIVE_PEOPLE.lastIndex = 0;

    const unsupported = tokens(matched).some((word) => !source.has(stem(word)));
    if (unsupported) return 1;
  }

  return 0;
}

function forbiddenRisk(text: string, beat: MouthCandidateBeat): number {
  const lower = clean(text).toLowerCase();
  const forbidden = new Set(unique(beat.forbiddenMoves ?? []).map((value) => value.toLowerCase()));

  let risk = 0;
  if (META.test(lower) || OPERATION_LANGUAGE.test(lower)) risk = 1;
  if (GENERIC.test(lower)) risk = Math.max(risk, 0.8);
  if (QUESTION.test(lower)) risk = Math.max(risk, 0.7);
  if (forbidden.has("analytic explanation") && ANALYTIC_EXPLANATION.test(lower)) risk = 1;
  if (forbidden.has("new dialogue") && /["“”]/.test(text)) risk = 1;

  return metric(risk);
}

function relationMeaning(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const supported = new Set(supportedEventIds(text, envelope));
  const required = unique(beat.eventIds ?? []);
  const coverage = required.length
    ? required.filter((id) => supported.has(id)).length / required.length
    : 0.5;
  const relationCount = supportedRelations([...supported], envelope).length;
  const relationBonus = beat.relationKinds?.length
    ? Math.min(1, relationCount / Math.max(1, beat.relationKinds.length))
    : Math.min(1, relationCount / 2);
  return metric(coverage * 0.55 + relationBonus * 0.45);
}

function strategyExecutionScore(text: string, beat: MouthCandidateBeat): number {
  const move = clean(beat.creativeMove).toLowerCase();
  const lower = clean(text).toLowerCase();
  if (!move || move === "none") return 0.5;

  switch (move) {
    case "status_inversion":
      return metric(/\b(?:like|apparently|already|still|anyway|terms|boss|owned|rule|rules|official|business)\b/.test(lower) ? 0.9 : 0.35);
    case "contrast":
      return metric(/\b(?:but|still|yet|anyway|except|instead|first)\b/.test(lower) ? 0.9 : 0.4);
    case "implication":
      return metric(ANALYTIC_EXPLANATION.test(lower) ? 0.15 : 0.85);
    case "understatement":
      return metric(tokens(text).length <= 7 ? 0.9 : 0.35);
    case "personification":
      return metric(/\b(?:approved|agreed|judged|decided|had other plans|wasn't impressed|was not impressed)\b/.test(lower) ? 0.85 : 0.4);
    case "recontextualization":
      return metric(/\b(?:apparently|so|suddenly|then|of course|turns out|that explained)\b/.test(lower) ? 0.85 : 0.4);
    case "double_meaning":
      return metric(/\b(?:terms|peace|deal|contract|approved|business|official|apparently)\b/.test(lower) ? 0.85 : 0.4);
    case "callback":
      return metric(/\b(?:again|still|apparently|same|that|back|returned)\b/.test(lower) ? 0.8 : 0.35);
    default:
      return 0.5;
  }
}

function compressionScore(text: string): number {
  const count = tokens(text).length;
  if (!count) return 0;
  if (count <= 7) return 1;
  if (count <= 10) return 0.45;
  return 0;
}

function repetitionRisk(text: string, priorTexts: readonly string[]): number {
  if (!priorTexts.length) return 0;
  return Math.max(...priorTexts.map((prior) => similarity(text, prior)));
}

function normalizeLine(value: unknown): string {
  return clean(value)
    .replace(/^[-*\d.)\s]+/, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

function hasPlaceholder(value: unknown): boolean {
  const text = normalizeLine(value);
  return !text || PLACEHOLDER.test(text);
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  const text = normalizeLine(input.text);
  const priorTexts = input.priorTexts ?? [];
  const supported = supportedEventIds(text, input.envelope);
  const relations = supportedRelations(supported, input.envelope);
  const grounding = metric(
    overlap(setOf(text), suppliedTerms(input.envelope)) * 0.5 + (supported.length ? 0.5 : 0),
  );
  const meaning = relationMeaning(text, input.beat, input.envelope);
  const transition = meaning;
  const endpoint = endpointExactness(text, input.beat);
  const invention = concreteRisk(text, input.envelope);
  const forbidden = forbiddenRisk(text, input.beat);
  const repetition = repetitionRisk(text, priorTexts);
  const novelty = metric(1 - repetition);
  const compression = compressionScore(text);
  const strategyExecution = strategyExecutionScore(text, input.beat);

  const restatement = (input.beat.eventIds ?? []).some(
    (id) => similarity(text, eventLabel(input.envelope, id)) >= 0.92,
  ) ? 0.8 : 0;

  const collageRisk =
    (input.beat.eventIds?.length ?? 0) > 1 &&
    tokens(text).length > 4 &&
    supported.length >= (input.beat.eventIds?.length ?? 0) &&
    strategyExecution < 0.55
      ? 0.7
      : 0;

  const creativeIndependence = metric(1 - Math.min(1, restatement + collageRisk * 0.5));
  const creativeExecution = input.beat.creativeRealization
    ? metric(creativeIndependence * 0.45 + strategyExecution * 0.55)
    : 0;

  const score = isPayoffBeat(input.beat)
    ? metric(endpoint * 0.9 + novelty * 0.05 + compression * 0.05 - invention * 0.5 - forbidden * 0.8)
    : metric(
        creativeExecution * 0.38 +
          novelty * 0.12 +
          compression * 0.12 +
          meaning * 0.12 +
          grounding * 0.09 +
          transition * 0.08 +
          (1 - restatement) * 0.05 +
          (1 - collageRisk) * 0.04 -
          invention * 0.35,
      );

  const reasons: string[] = [];
  if (grounding < 0.28) reasons.push("weak-grounding");
  if (meaning < 0.28) reasons.push("weak-meaning-execution");
  if (strategyExecution < 0.45) reasons.push("weak-creative-execution");
  if (creativeExecution < 0.42 && !isPayoffBeat(input.beat)) reasons.push("weak-creative-realization");
  if (invention > 0.45) reasons.push("high-invention-risk");
  if (forbidden > 0) reasons.push("forbidden-slot-move");
  if (repetition > 0.8) reasons.push("high-repetition");
  if (compression < 0.45) reasons.push("poor-compression");
  if (collageRisk > 0) reasons.push("keyword-assembly");
  if (restatement > 0) reasons.push("source-restatement");
  if (isPayoffBeat(input.beat) && endpoint !== 1) reasons.push("non-exact-payoff");

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds: supported,
    supportedRelationPairs: relations,
    groundingScore: grounding,
    meaningScore: meaning,
    transitionScore: transition,
    obligationCoverage: metric(meaning * 0.65 + strategyExecution * 0.35),
    relationContractScore: input.beat.relationKinds?.length ? meaning : 0.5,
    forbiddenMoveRisk: forbidden,
    cohesionScore: priorTexts.length ? novelty : 0.5,
    noveltyScore: novelty,
    compressionScore: compression,
    inventionRisk: invention,
    repetitionRisk: repetition,
    collageRisk,
    endpointExactness: endpoint,
    score,
    reasons,
  };
}

function candidateIsLegal(candidate: MouthCandidate, beat: MouthCandidateBeat): boolean {
  if (!candidate.text) return false;
  if (hasPlaceholder(candidate.text)) return false;
  if (candidate.forbiddenMoveRisk > 0) return false;
  if (candidate.inventionRisk >= 0.62) return false;
  if (candidate.text.split(/\s+/).filter(Boolean).length > 10) return false;
  if (isPayoffBeat(beat)) return candidate.endpointExactness === 1;
  return candidate.score >= 0.42;
}

export function selectBestMouthCandidate(input: {
  texts: readonly string[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidateSelection {
  const scored = input.texts.map((text) =>
    scoreMouthCandidate({ text, beat: input.beat, envelope: input.envelope, priorTexts: input.priorTexts }),
  );
  const candidates = scored.filter((candidate) => candidateIsLegal(candidate, input.beat)).sort((a, b) => b.score - a.score);
  const rejected = scored.filter((candidate) => !candidateIsLegal(candidate, input.beat));

  if (rejected.length && (candidates.length === 0 || process.env.QRE_AUTHOR_DEBUG_MOUTH_REJECTIONS === "true")) {
    console.log(`[QRE MOUTH REJECT] beat=${input.beat.order} rejected=${rejected.length} accepted=${candidates.length}`);
  }

  return { selected: candidates[0], candidates };
}

function compactExpressionJob(beat: MouthCandidateBeat): Record<string, unknown> {
  const realization = beat.creativeRealization;
  const isPayoff = isPayoffBeat(beat);
  return {
    order: beat.order,
    attention: clean(beat.attentionFunction),
    move: clean(beat.creativeMove),
    mode: clean(beat.realizationMode),
    change: clean(beat.change),
    job: clean(realization?.realizationIntent || realization?.creativeOpportunity || "Perform the approved change without explaining it."),
    nextPull: clean(beat.next || beat.frontier),
    sourceEvents: beat.eventIds ?? [],
    sourceLabels: beat.setsUp ?? [],
    obligations: beat.obligations ?? [],
    forbidden: beat.forbiddenMoves ?? [],
    endpoint: isPayoff ? endpointText(beat) : "",
  };
}

function buildCompleteSequenceMouthMessages(
  input: MouthCandidateGenerationInput,
  beats: readonly MouthCandidateBeat[],
): Array<{ role: "system" | "user"; content: string }> {
  const sequence = beats.map(compactExpressionJob);
  const system = [
    "QRE MOUTH. LANGUAGE INSTRUMENT, NOT AUTHOR.",
    "QRE has already decided reality, meaning, behavior, progression, strategy, and payoff.",
    "Your only job is to express those approved jobs as short, natural language.",
    "",
    "STYLE: short, conversational, sharp, behavioral, cumulative, addictive.",
    "Use ordinary words unless an unusual phrase makes the behavior sharper.",
    "",
    "RHYTHM: start with what changed; turn it; prove it through behavior; push it; land the payoff.",
    "Do not force five beats when the supplied sequence has a different length.",
    "Every line must make the next line more wanted.",
    "A later line should change how an earlier line reads.",
    "",
    "DO NOT sound poetic, literary, inspirational, or cinematic.",
    "DO NOT decorate a line just to make it pretty.",
    "DO NOT explain the meaning or write analyst language.",
    "DO NOT repeat facts as captions or invent literal people, places, props, actions, reactions, chronology, dialogue, or outcomes.",
    "",
    "FIGURATIVE LANGUAGE IS LEGAL when it is clearly framing rather than a literal new event.",
    "",
    "PAYOFF: the supplied endpoint must appear exactly and alone as the final line.",
    "",
    "RETURN JSON ONLY.",
    `Return exactly ${MAX_SEQUENCE_CANDIDATES} complete candidate sequences.`,
    `Each sequence must contain exactly ${beats.length} lines.`,
    '{"candidateSequences":[{"lines":["LINE 1","LINE 2","LINE 3","LINE 4","EXACT PAYOFF"]}]}',
  ].join("\n");

  const user = {
    task: "write_complete_sequences",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    truthConstraints: input.envelope.suppliedPhrases,
    priorTexts: input.priorTexts ?? [],
    sequence,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}

function parseCompleteSequenceBatch(raw: string, beatCount: number): string[][] {
  const text = clean(raw).replace(/^```(?:json|text|txt)?/i, "").replace(/```$/i, "").trim();
  if (!text) return [];

  try {
    const value = JSON.parse(text) as { candidateSequences?: unknown };
    if (!Array.isArray(value.candidateSequences)) return [];
    return value.candidateSequences
      .filter((entry): entry is { lines?: unknown } => Boolean(entry) && typeof entry === "object")
      .map((entry) => Array.isArray(entry.lines) ? entry.lines.map(normalizeLine).filter((line) => !hasPlaceholder(line)) : [])
      .filter((lines) => lines.length === beatCount)
      .slice(0, MAX_SEQUENCE_CANDIDATES);
  } catch {
    return [];
  }
}

export async function generateMouthCandidatePools(
  input: MouthCandidateGenerationInput & { risk?: string; feedback?: string },
): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const messages = buildCompleteSequenceMouthMessages(input, ordered);

  if (input.feedback) {
    const last = messages[messages.length - 1];
    if (last?.role === "user") last.content += `\nQRE FEEDBACK: ${input.feedback}`;
  }

  const result = await localModelGenerate(messages, "json", {
    numPredict: Math.min(3072, Math.max(2048, ordered.length * 512)),
    temperature: input.risk === "safe" ? 0.78 : 0.9,
  });

  const sequences = parseCompleteSequenceBatch(result.text, ordered.length);
  const pools: MouthCandidatePool[] = ordered.map((beat) => ({ order: beat.order, candidates: [] }));

  for (const sequence of sequences) {
    for (let index = 0; index < ordered.length; index += 1) {
      const beat = ordered[index]!;
      const line = sequence[index];
      if (!line || isPayoffBeat(beat)) continue;

      const priorTexts = [...(input.priorTexts ?? []), ...sequence.slice(0, index)];
      const candidate = scoreMouthCandidate({ text: line, beat, envelope: input.envelope, priorTexts });
      if (candidateIsLegal(candidate, beat)) pools[index]!.candidates.push(candidate);
    }
  }

  for (let index = 0; index < ordered.length; index += 1) {
    const beat = ordered[index]!;
    const candidates = [...new Map(pools[index]!.candidates.map((candidate) => [candidate.text, candidate])).values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES);
    pools[index] = { order: beat.order, candidates };
  }

  const payoffIndex = ordered.findIndex(isPayoffBeat);
  if (payoffIndex >= 0) {
    const payoffBeat = ordered[payoffIndex]!;
    const endpoint = endpointText(payoffBeat);
    if (endpoint) {
      pools[payoffIndex] = {
        order: payoffBeat.order,
        candidates: [scoreMouthCandidate({ text: endpoint, beat: payoffBeat, envelope: input.envelope, priorTexts: input.priorTexts ?? [] })],
      };
    }
  }

  return { pools, rawText: result.text };
}