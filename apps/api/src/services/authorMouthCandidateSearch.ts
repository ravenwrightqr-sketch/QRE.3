import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type MouthCandidateBeat = {
  order: number;
  role?: string;
  attentionFunction?: string;
  creativeMove?: string;
  realizationMode?: string;
  eventIds?: string[];
  change?: string;
  next?: string;
  frontier?: string;
  setsUp?: string[];
  paysOff?: string[];
};

export type MouthCandidate = {
  text: string;
  beatOrder: number;
  supportedEventIds: string[];
  supportedRelationPairs: string[];
  groundingScore: number;
  meaningScore: number;
  cohesionScore: number;
  noveltyScore: number;
  compressionScore: number;
  inventionRisk: number;
  repetitionRisk: number;
  score: number;
  reasons: string[];
};

export type MouthCandidateSelection = {
  selected?: MouthCandidate;
  candidates: MouthCandidate[];
};

export type MouthCandidateBatch = {
  variantsByBeat: Array<{
    order: number;
    variants: string[];
  }>;
};

export type MouthCandidateGenerationInput = {
  envelope: RealityEnvelope;
  beats: MouthCandidateBeat[];
  priorTexts?: string[];
  lens?: string;
};

export type MouthCandidateModel = (
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>,
) => Promise<{ text: string }>;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/),
);

const INTERPRETIVE = new Set(
  "apparently almost already again still only instead somehow perhaps maybe finally naturally clearly quietly barely exactly enough".split(/\s+/),
);

const GENERIC_FILLER = /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending|what a day)\b/i;
const QUESTION = /\?/;
const META = /\b(?:beat|viewer|audience|strategy|operator|cognition|frontier|planner|planning|narrative|realization|writing process|author brief)\b/i;

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function tokens(text: string): string[] {
  return unique(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
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

function tokenSet(text: string): Set<string> {
  return new Set(tokens(text).map(stem));
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(1, left.size);
}

function phraseSimilarity(text: string, phrase: string): number {
  return metric(overlap(tokenSet(text), tokenSet(phrase)));
}

function suppliedTerms(envelope: RealityEnvelope): Set<string> {
  return new Set(envelope.suppliedTerms.map(stem));
}

function supportedEventIds(text: string, envelope: RealityEnvelope): string[] {
  return envelope.events
    .filter((event) => phraseSimilarity(text, event.label) >= 0.34)
    .map((event) => event.id);
}

function relationKey(from: string, to: string): string {
  return `${from}->${to}`;
}

function supportedRelationPairs(eventIds: string[], envelope: RealityEnvelope): string[] {
  return envelope.relations
    .filter(
      (relation) =>
        eventIds.includes(relation.from) &&
        eventIds.includes(relation.to),
    )
    .map((relation) => relationKey(relation.from, relation.to));
}

function groundingScore(text: string, envelope: RealityEnvelope): number {
  const source = suppliedTerms(envelope);
  const sourceOverlap = overlap(tokenSet(text), source);
  const phraseSupport = envelope.events.length
    ? Math.max(...envelope.events.map((event) => phraseSimilarity(text, event.label)))
    : 0;
  const relationSupport =
    supportedRelationPairs(supportedEventIds(text, envelope), envelope).length > 0 ? 1 : 0;

  return metric(
    sourceOverlap * 0.5 +
      phraseSupport * 0.35 +
      relationSupport * 0.15,
  );
}

function concreteTokenRisk(text: string, envelope: RealityEnvelope): number {
  const source = suppliedTerms(envelope);
  const words = tokens(text);
  if (!words.length) return 1;

  let unsupported = 0;
  for (const word of words) {
    const normalized = stem(word);
    if (STOP.has(normalized) || INTERPRETIVE.has(normalized)) continue;
    if (!source.has(normalized)) unsupported += 1;
  }

  return metric(unsupported / Math.max(1, words.length));
}

function relationMeaningScore(
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number {
  const eventIds = supportedEventIds(text, envelope);
  const beatEventIds = unique(beat.eventIds ?? []);
  const direct = beatEventIds.length
    ? eventIds.filter((id) => beatEventIds.includes(id)).length /
      Math.max(1, beatEventIds.length)
    : 0;

  const relationCount = supportedRelationPairs(eventIds, envelope).length;
  const mode = clean(beat.realizationMode).toLowerCase();
  const relationalBonus =
    mode.includes("reframe") ||
    mode.includes("contrast") ||
    mode.includes("turn") ||
    mode.includes("callback")
      ? Math.min(1, relationCount / 2)
      : Math.min(1, relationCount / 3);

  return metric(direct * 0.55 + relationalBonus * 0.45);
}

function cohesionScore(text: string, priorTexts: readonly string[]): number {
  if (!priorTexts.length) return 0.5;
  return metric(overlap(tokenSet(text), tokenSet(priorTexts.join(" "))));
}

function repetitionRisk(text: string, priorTexts: readonly string[]): number {
  if (!priorTexts.length) return 0;
  return Math.max(...priorTexts.map((prior) => phraseSimilarity(text, prior)));
}

function noveltyScore(text: string, priorTexts: readonly string[]): number {
  return metric(1 - repetitionRisk(text, priorTexts));
}

function compressionScore(text: string): number {
  const count = tokens(text).length;
  if (!count) return 0;
  if (count <= 4) return 1;
  if (count <= 7) return 0.86;
  if (count <= 10) return 0.45;
  return 0;
}

function meaningShiftEvidence(
  beat: MouthCandidateBeat,
  text: string,
  envelope: RealityEnvelope,
): number {
  const change = clean(beat.change);
  if (!change) return 0.25;

  const changeSupport = phraseSimilarity(text, change);
  const eventIds = supportedEventIds(text, envelope);
  const currentSupport = eventIds.length > 0 ? 1 : 0;
  const relational = supportedRelationPairs(eventIds, envelope).length > 0 ? 1 : 0;

  return metric(
    Math.max(
      currentSupport * 0.25 + relational * 0.5 + changeSupport * 0.25,
      changeSupport,
    ),
  );
}

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: string[];
}): MouthCandidate {
  const text = clean(input.text);
  const priorTexts = input.priorTexts ?? [];
  const eventIds = supportedEventIds(text, input.envelope);
  const relations = supportedRelationPairs(eventIds, input.envelope);
  const grounding = groundingScore(text, input.envelope);
  const inventionRisk = Math.max(
    concreteTokenRisk(text, input.envelope),
    GENERIC_FILLER.test(text) ? 0.8 : 0,
    META.test(text) ? 0.8 : 0,
  );
  const meaning = relationMeaningScore(text, input.beat, input.envelope);
  const cohesion = cohesionScore(text, priorTexts);
  const repetition = repetitionRisk(text, priorTexts);
  const novelty = noveltyScore(text, priorTexts);
  const compression = compressionScore(text);
  const transition = meaningShiftEvidence(input.beat, text, input.envelope);
  const questionPenalty = QUESTION.test(text) ? 0.5 : 0;

  const score = metric(
    grounding * 0.24 +
      meaning * 0.22 +
      transition * 0.16 +
      cohesion * 0.12 +
      novelty * 0.1 +
      compression * 0.1 -
      inventionRisk * 0.2 -
      repetition * 0.08 -
      questionPenalty * 0.1,
  );

  const reasons: string[] = [];
  if (grounding < 0.34) reasons.push("weak-grounding");
  if (meaning < 0.34) reasons.push("weak-meaning-execution");
  if (inventionRisk > 0.45) reasons.push("high-invention-risk");
  if (repetition > 0.8) reasons.push("high-repetition");
  if (compression < 0.45) reasons.push("poor-compression");
  if (QUESTION.test(text)) reasons.push("question-leak");

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds: eventIds,
    supportedRelationPairs: relations,
    groundingScore: grounding,
    meaningScore: meaning,
    cohesionScore: cohesion,
    noveltyScore: novelty,
    compressionScore: compression,
    inventionRisk,
    repetitionRisk: repetition,
    score,
    reasons,
  };
}

export function selectBestMouthCandidate(input: {
  texts: readonly string[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: string[];
}): MouthCandidateSelection {
  const candidates = input.texts
    .map((text) =>
      scoreMouthCandidate({
        text,
        beat: input.beat,
        envelope: input.envelope,
        priorTexts: input.priorTexts,
      }),
    )
    .filter((candidate) => candidate.text.length > 0)
    .sort((a, b) => b.score - a.score);

  return {
    selected: candidates[0],
    candidates,
  };
}

export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{ role: "system" | "user"; content: string }> {
  const system = [
    "QRE MOUTH CANDIDATE GENERATOR.",
    "The movie, Meaning Spine, and Beat Graph already exist.",
    "Generate language variants only. QRE will select the winner deterministically.",
    "Never invent a concrete event, object, person, place, action, reaction, body movement, sound, or outcome.",
    "Concrete wording must be traceable to supplied events.",
    "Semantic interpretation may be novel when supported by graph relationships.",
    "Do not ask questions.",
    "Do not output explanations or planning metadata.",
    "Generate 5 materially different short variants for each beat.",
    "Prefer 2-7 words per variant.",
    'Return JSON only: {"variantsByBeat":[{"order":1,"variants":["...","..."]}]}',
  ].join("\n");

  const user = {
    task: "generate_mouth_candidates",
    lens: clean(input.lens),
    priorTexts: input.priorTexts ?? [],
    realityEnvelope: input.envelope,
    beats: input.beats,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  const text = clean(raw)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const value = JSON.parse(text) as { variantsByBeat?: unknown };
    if (!Array.isArray(value.variantsByBeat)) return undefined;

    const variantsByBeat = value.variantsByBeat
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const item = entry as Record<string, unknown>;
        const variants = Array.isArray(item.variants)
          ? item.variants.map(clean).filter(Boolean).slice(0, 8)
          : [];
        return {
          order: Number(item.order ?? 0),
          variants,
        };
      })
      .filter((entry) => entry.order > 0 && entry.variants.length > 0);

    return { variantsByBeat };
  } catch {
    return undefined;
  }
}

export async function generateAndSelectMouthCandidates(
  input: MouthCandidateGenerationInput & { model: MouthCandidateModel },
): Promise<{
  texts: string[];
  candidates: MouthCandidate[];
  rawText: string;
}> {
  const result = await input.model(
    buildMouthCandidateMessages(input),
  );

  const parsed = parseMouthCandidateBatch(result.text);
  if (!parsed) {
    return { texts: [], candidates: [], rawText: result.text };
  }

  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const texts: string[] = [];
  const selected: MouthCandidate[] = [];

  for (const beat of ordered) {
    const entry = parsed.variantsByBeat.find(
      (item) => item.order === beat.order,
    );

    const selection = selectBestMouthCandidate({
      texts: entry?.variants ?? [],
      beat,
      envelope: input.envelope,
      priorTexts: texts,
    });

    if (selection.selected) {
      texts.push(selection.selected.text);
      selected.push(selection.selected);
    } else {
      texts.push("");
    }
  }

  return {
    texts,
    candidates: selected,
    rawText: result.text,
  };
}
