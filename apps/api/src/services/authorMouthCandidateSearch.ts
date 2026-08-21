/**
 * QRE AUTHOR MOUTH · CANONICAL CANDIDATE REALIZATION
 *
 * Production boundary:
 * REALITY → MEANING → CREATIVE REALIZATION → COMPLETE SEQUENCE LANGUAGE
 *
 * The model supplies language.
 * QRE owns truth, semantic obligations, sequence selection, endpoint preservation,
 * candidate legality, and final gating.
 */
import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { localModelGenerate } from "./localModelRuntime.js";

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  priorTexts?: readonly string[];
  lens?: string;
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
  /\b(?:this means|this reveals|this shows|the point is|the reason is|the meaning is|which means|in other words|therefore|as a result)/i;

const PLACEHOLDER =
  /^(?:\.\.\.|candidate[_\s-]?(?:one|two|three|four|five)|line[_\s-]?(?:one|two|three|four|five)|short line(?: one| two| three| four| five)?)$/i;

const FIGURATIVE_FRAME =
  /\blike (?:a|an)\b|\bas if\b|\bas though\b|\bapparently\b|\bseemed like\b|\bthe room approved\b|\bthe mirror approved\b|\bpeace was\b|\bterms were\b/i;

const FIGURATIVE_PEOPLE =
  /\b(?:lawyer|judge|king|queen|boss|manager|officer|celebrity|star)\b/gi;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

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
  const mode = clean(beat.realizationMode).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();

  return (
    role === "payoff" ||
    attention === "payoff" ||
    mode === "payoff" ||
    mode === "payoff_compression" ||
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

function concreteRisk(text: string, envelope: RealityEnvelope): number {
  const lower = clean(text).toLowerCase();
  const source = suppliedTerms(envelope);
  if (!lower) return 1;

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

  const figurative = FIGURATIVE_FRAME.test(lower);

  for (const rule of concretePatterns) {
    const matches = lower.match(rule.pattern);
    if (!matches) continue;
    if (rule.terminal) return 1;

    const matched = matches[0] ?? "";
    if (figurative && FIGURATIVE_PEOPLE.test(matched)) {
      FIGURATIVE_PEOPLE.lastIndex = 0;
      continue;
    }

    const unsupported = tokens(matched)
      .map(stem)
      .some((word) => !source.has(word));
    if (unsupported) return 1;
  }

  FIGURATIVE_PEOPLE.lastIndex = 0;
  return 0;
}

function forbiddenRisk(
  text: string,
  beat: MouthCandidateBeat,
): number {
  const lower = clean(text).toLowerCase();
  const forbidden = unique(beat.forbiddenMoves ?? []).map((value) => value.toLowerCase());

  let risk = 0;
  if (META.test(lower)) risk = 1;
  if (OPERATION_LANGUAGE.test(lower)) risk = 1;
  if (GENERIC.test(lower)) risk = Math.max(risk, 0.8);
  if (QUESTION.test(lower)) risk = Math.max(risk, 0.7);

  if (forbidden.includes("planner vocabulary") && META.test(lower)) risk = 1;
  if (forbidden.includes("analytic explanation") && ANALYTIC_EXPLANATION.test(lower)) risk = 1;
  if (forbidden.includes("new dialogue")) {
    if (/["“”]/.test(text) || /^(?:said|says|asked|asks|replied|replies)\b/i.test(lower)) risk = 1;
  }

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
  if (!move || move === "none") return 0.55;

  switch (move) {
    case "status_inversion":
      return /\b(?:like|apparently|already|still|anyway|terms|boss|owned|rule|rules|official|business)\b/.test(lower) ? 0.9 : 0.35;
    case "contrast":
      return /\b(?:but|still|yet|anyway|except|instead)\b/.test(lower) ? 0.9 : 0.35;
    case "implication":
      return ANALYTIC_EXPLANATION.test(lower) ? 0.15 : 0.9;
    case "understatement":
      return tokens(text).length <= 7 ? 0.9 : 0.35;
    case "personification":
      return /\b(?:approved|agreed|judged|decided|had other plans|wasn't impressed|was not impressed)\b/.test(lower) ? 0.9 : 0.45;
    case "recontextualization":
      return /\b(?:apparently|suddenly|then|of course|turns out|that explained|so)\b/.test(lower) ? 0.9 : 0.4;
    case "double_meaning":
      return /\b(?:terms|peace|deal|contract|approved|business|official|apparently)\b/.test(lower) ? 0.9 : 0.4;
    case "callback":
      return /\b(?:again|still|apparently|same|that|back|returned)\b/.test(lower) ? 0.85 : 0.4;
    default:
      return 0.55;
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
    overlap(setOf(text), suppliedTerms(input.envelope)) * 0.5 +
    (supported.length ? 0.5 : 0),
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

  const collageRisk =
    input.beat.eventIds &&
    input.beat.eventIds.length > 1 &&
    tokens(text).length > 4 &&
    supported.length >= input.beat.eventIds.length &&
    strategyExecution < 0.55
      ? 0.7
      : 0;

  const restatement =
    input.beat.eventIds?.some(
      (id) => similarity(text, eventLabel(input.envelope, id)) >= 0.92,
    )
      ? 0.8
      : 0;

  const creativeIndependence = metric(
    1 - Math.min(1, restatement + collageRisk * 0.5),
  );

  const creativeScore = metric(
    strategyExecution * 0.7 +
    creativeIndependence * 0.3,
  );

  const score = isPayoffBeat(input.beat)
    ? metric(
        endpoint * 0.9 +
        novelty * 0.05 +
        compression * 0.05 -
        invention * 0.5 -
        forbidden * 0.8,
      )
    : metric(
        creativeScore * 0.34 +
        novelty * 0.12 +
        compression * 0.08 +
        meaning * 0.12 +
        grounding * 0.08 +
        transition * 0.08 +
        (1 - restatement) * 0.08 +
        (1 - collageRisk) * 0.05 +
        (forbidden === 0 ? 0.05 : 0) -
        invention * 0.35,
      );

  const reasons: string[] = [];
  if (grounding < 0.28) reasons.push("weak-grounding");
  if (meaning < 0.28) reasons.push("weak-meaning-execution");
  if (strategyExecution < 0.45) reasons.push("weak-creative-execution");
  if (creativeScore < 0.42 && !isPayoffBeat(input.beat)) reasons.push("weak-creative-realization");
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
    cohesionScore: priorTexts.length ? metric(1 - repetition) : 0.5,
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
  return candidate.score >= 0.24;
}

export function selectBestMouthCandidate(input: {
  texts: readonly string[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidateSelection {
  const scored = input.texts.map((text) =>
    scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts: input.priorTexts,
    }),
  );

  const candidates = scored
    .filter((candidate) => candidateIsLegal(candidate, input.beat))
    .sort((a, b) => b.score - a.score);

  const rejected = scored.filter((candidate) => !candidateIsLegal(candidate, input.beat));

  if (
    rejected.length &&
    (candidates.length === 0 || process.env.QRE_AUTHOR_DEBUG_MOUTH_REJECTIONS === "true")
  ) {
    console.log(
      `[QRE MOUTH REJECT] beat=${input.beat.order} rejected=${rejected.length} accepted=${candidates.length}`,
    );
    for (const candidate of rejected) {
      console.log(
        JSON.stringify({
          beat: input.beat.order,
          text: candidate.text,
          score: candidate.score,
          inventionRisk: candidate.inventionRisk,
          forbiddenMoveRisk: candidate.forbiddenMoveRisk,
          meaningScore: candidate.meaningScore,
          transitionScore: candidate.transitionScore,
          groundingScore: candidate.groundingScore,
          reasons: candidate.reasons,
        }),
      );
    }
  }

  return { selected: candidates[0], candidates };
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  const beats = [...input.beats].sort((a, b) => a.order - b.order);
  return buildCompleteSequenceMouthMessages(input, beats);
}

function buildCompleteSequenceMouthMessages(
  input: MouthCandidateGenerationInput,
  beats: readonly MouthCandidateBeat[],
): Array<{ role: "system" | "user"; content: string }> {
  const sequence = beats.map((beat, index) => ({
    order: beat.order,
    role: beat.role,
    attentionFunction: beat.attentionFunction,
    creativeMove: beat.creativeMove,
    realizationMode: beat.realizationMode,
    realizationStrategies: beat.realizationStrategies ?? [],
    creativeRealization: beat.creativeRealization ?? null,
    sourceAnchors: beat.eventIds ?? [],
    change: beat.change,
    next: beat.next || beat.frontier,
    rhetoricalJob: isPayoffBeat(beat)
      ? "EXACT PAYOFF"
      : index === 0
        ? "ESTABLISH"
        : index === 1
          ? "CONTRAST"
          : index === 2
            ? "ESCALATE"
            : "IMPLY_OR_RECONTEXTUALIZE",
    endpoint: endpointText(beat),
  }));

  const system = [
    "QRE CANONICAL MOUTH · COMPLETE EXPERIENCE WRITER.",
    "",
    "QRE has already solved reality, meaning, character reading, trajectory, truth constraints, and payoff.",
    "You supply language only.",
    "",
    "SOURCE FACTS ARE TRUTH CONSTRAINTS, NOT A SCRIPT.",
    "Do not narrate the receipt.",
    "Do not summarize events.",
    "Do not paraphrase the upstream creative realization.",
    "",
    "WRITE A COMPLETE EXPERIENCE.",
    "The lines must feel causally connected and cumulative.",
    "Every line should make the next line more desirable.",
    "Later lines should deepen, escalate, callback, or recontextualize earlier lines.",
    "Never reset into an independent caption.",
    "",
    "RHYTHM:",
    "ESTABLISH → CONTRAST → ESCALATE → IMPLY / RECONTEXTUALIZE → PAYOFF.",
    "",
    "PREFER:",
    "short",
    "sharp",
    "specific",
    "quotable",
    "subtext",
    "status",
    "attitude",
    "understatement",
    "double meaning",
    "personification",
    "reversal",
    "callback",
    "",
    "FIGURATIVE LANGUAGE IS LEGAL.",
    "A phrase such as 'walked in like a lawyer already notified' is rhetorical framing, not a literal claim that a lawyer appeared.",
    "Use metaphor and personification when they reveal the approved meaning without inventing an event.",
    "",
    "DO NOT:",
    "write analyst language",
    "say this means, this reveals, this shows, the contrast is, the strategy is, or the point is",
    "repeat subject + trait + explanation",
    "compress several supplied facts into one sentence",
    "invent literal people, places, props, actions, reactions, sounds, dialogue, chronology, or outcomes",
    "use generic inspirational filler",
    "",
    "PAYOFF IS SACRED.",
    "The supplied terminal endpoint must appear exactly and alone as the final line.",
    "",
    "RETURN JSON ONLY.",
    `Return exactly ${MAX_SEQUENCE_CANDIDATES} complete candidate sequences.`,
    `Each sequence must contain exactly ${beats.length} lines.`,
    "The final line of every sequence must be the exact supplied endpoint.",
    '{"candidateSequences":[{"lines":["LINE 1","LINE 2","LINE 3","LINE 4","EXACT PAYOFF"]}]}'
  ].join("\n");

  const user = {
    task: "write_complete_creative_sequences",
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
  const text = clean(raw)
    .replace(/^```(?:json|text|txt)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!text) return [];

  try {
    const value = JSON.parse(text) as { candidateSequences?: unknown };
    if (!Array.isArray(value.candidateSequences)) return [];

    return value.candidateSequences
      .filter(
        (entry): entry is { lines?: unknown } =>
          Boolean(entry) && typeof entry === "object",
      )
      .map((entry) =>
        Array.isArray(entry.lines)
          ? entry.lines.map(normalizeLine).filter((line) => !hasPlaceholder(line))
          : [],
      )
      .filter((lines) => lines.length === beatCount)
      .slice(0, MAX_SEQUENCE_CANDIDATES);
  } catch {
    return [];
  }
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  const sequences = parseCompleteSequenceBatch(raw, 1);
  if (sequences.length) {
    return { variantsByBeat: [{ order: 1, variants: sequences[0] ?? [] }] };
  }
  return undefined;
}

export type MouthCandidatePool = {
  order: number;
  candidates: MouthCandidate[];
};

export async function generateMouthCandidatePools(
  input: MouthCandidateGenerationInput & {
    risk?: string;
    feedback?: string;
  },
): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const messages = buildCompleteSequenceMouthMessages(input, ordered);

  if (input.feedback) {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      last.content += "\n\nQRE SEQUENCE FEEDBACK:\n" + input.feedback;
    }
  }

  const result = await localModelGenerate(messages, "json", {
    numPredict: Math.min(3072, Math.max(2048, ordered.length * 512)),
    temperature: input.risk === "safe" ? 0.78 : 0.9,
  });

  const sequences = parseCompleteSequenceBatch(result.text, ordered.length);
  const pools: MouthCandidatePool[] = ordered.map((beat) => ({
    order: beat.order,
    candidates: [],
  }));

  for (const sequence of sequences) {
    for (let index = 0; index < ordered.length; index += 1) {
      const beat = ordered[index]!;
      if (isPayoffBeat(beat)) continue;

      const line = sequence[index];
      if (!line) continue;

      const priorTexts = [
        ...(input.priorTexts ?? []),
        ...sequence.slice(0, index),
      ];

      const candidate = scoreMouthCandidate({
        text: line,
        beat,
        envelope: input.envelope,
        priorTexts,
      });

      if (candidateIsLegal(candidate, beat)) {
        pools[index]!.candidates.push(candidate);
      }
    }
  }

  for (let index = 0; index < ordered.length; index += 1) {
    const beat = ordered[index]!;
    const candidates = [
      ...new Map(
        pools[index]!.candidates.map((candidate) => [candidate.text, candidate]),
      ).values(),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CANDIDATES);

    pools[index] = {
      order: beat.order,
      candidates,
    };
  }

  const payoffIndex = ordered.findIndex(isPayoffBeat);
  if (payoffIndex >= 0) {
    const payoffBeat = ordered[payoffIndex]!;
    const endpoint = endpointText(payoffBeat);

    if (endpoint) {
      const exact = scoreMouthCandidate({
        text: endpoint,
        beat: payoffBeat,
        envelope: input.envelope,
        priorTexts: input.priorTexts ?? [],
      });

      pools[payoffIndex] = {
        order: payoffBeat.order,
        candidates: [exact],
      };
    }
  }

  return {
    pools,
    rawText: result.text,
  };
}
