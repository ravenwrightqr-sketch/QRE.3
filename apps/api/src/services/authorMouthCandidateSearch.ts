/**
 * QRE AUTHOR MOUTH · CANONICAL CANDIDATE REALIZATION
 *
 * Model = language search.
 * QRE = reality, legality, grounding, and candidate selection.
 *
 * The model may mis-shape JSON or return unusable language. That is not a
 * product-fatal condition: malformed batches are normalized and grounded
 * fallback candidates are generated from the approved beat/evidence.
 */
import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

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

export type MouthCandidateModel = (
  messages: Array<{ role: "system" | "user"; content: string }>,
) => Promise<{ text: string }>;

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: readonly unknown[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(/\s+/),
);

const INTERPRETIVE = new Set([
  "apparently",
  "almost",
  "already",
  "again",
  "still",
  "only",
  "instead",
  "somehow",
  "perhaps",
  "maybe",
  "finally",
  "naturally",
  "clearly",
  "quietly",
  "barely",
  "exactly",
  "enough",
  "anyway",
  "temporary",
  "temporarily",
  "oddly",
]);

const META = /\b(?:beat|viewer|audience|strategy|planner|planning|cognition|realization|writing process|author brief|meaning spine|beat graph|information frontier)\b/i;
const GENERIC = /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending|transformation)\b/i;
const QUESTION = /\?/;
const OPERATION_LANGUAGE = /\b(?:the contrast|the reframe|the transformation|the payoff|changes? the meaning|highlights? the|recontextualizes?)\b/i;

const normalizeToken = (token: string): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 5 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokens = (text: string): string[] =>
  unique(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3),
  ).map(normalizeToken);

const setOf = (text: string): Set<string> => new Set(tokens(text));

const overlap = (left: Set<string>, right: Set<string>): number => {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(1, left.size);
};

const similarity = (left: string, right: string): number =>
  Number(overlap(setOf(left), setOf(right)).toFixed(3));

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const eventLabel = (envelope: RealityEnvelope, id: string): string =>
  clean(envelope.events.find((event) => event.id === id)?.label);

const suppliedTerms = (envelope: RealityEnvelope): Set<string> =>
  new Set(envelope.suppliedTerms.map(normalizeToken));

const supportedEventIds = (text: string, envelope: RealityEnvelope): string[] =>
  envelope.events
    .filter((event) => similarity(text, event.label) >= 0.34)
    .map((event) => event.id);

const supportedRelations = (
  eventIds: readonly string[],
  envelope: RealityEnvelope,
): string[] => {
  const ids = new Set(eventIds);
  return envelope.relations
    .filter((relation) => ids.has(relation.from) && ids.has(relation.to))
    .map((relation) => `${relation.from}->${relation.to}`);
};

const isPayoffBeat = (beat: MouthCandidateBeat): boolean => {
  const mode = clean(beat.realizationMode).toLowerCase();
  const role = clean(beat.role).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  return mode.includes("payoff") || role === "payoff" || role === "release" || attention === "payoff" || attention === "release";
};

const endpointText = (beat: MouthCandidateBeat): string =>
  unique(beat.paysOff ?? [])[0] ?? "";

const endpointExactness = (text: string, beat: MouthCandidateBeat): number => {
  if (!isPayoffBeat(beat)) return 0;
  const actual = clean(text).replace(/[.!?]+$/g, "").toLowerCase();
  const expected = clean(endpointText(beat)).replace(/[.!?]+$/g, "").toLowerCase();
  return expected && actual === expected ? 1 : 0;
};

const concreteRisk = (text: string, envelope: RealityEnvelope): number => {
  const source = suppliedTerms(envelope);
  const words = tokens(text);
  if (!words.length) return 1;
  let unsupported = 0;
  for (const word of words) {
    if (STOP.has(word) || INTERPRETIVE.has(word)) continue;
    if (!source.has(word)) unsupported += 1;
  }
  return metric(unsupported / words.length);
};

const forbiddenRisk = (
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number => {
  const lower = clean(text).toLowerCase();
  const source = suppliedTerms(envelope);
  let risk = 0;

  if (META.test(lower) || OPERATION_LANGUAGE.test(lower)) risk = 1;
  if (GENERIC.test(lower)) risk = Math.max(risk, 0.8);
  if (QUESTION.test(lower)) risk = Math.max(risk, 0.7);

  const concreteRules: Array<[RegExp, boolean]> = [
    [/\b(?:someone|man|woman|stranger|person)\b/i, false],
    [/\b(?:table|door|window|chair|phone|bag|leash|scissors|kennel|dryer|shampoo)\b/i, false],
    [/\b(?:walked|ran|jumped|grabbed|threw|opened|closed|smiled|laughed|cried|snatched|stalked|entered|darted|trembled|blinked|sighed|stared|shrugged|winked|flinched|eyes|tail)\b/i, false],
    [/\b(?:roar|growl|bark|scream|whistle|buzz|bang)\b/i, false],
    [/\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived|later|earlier|tomorrow|yesterday|the next day|years later)\b/i, true],
  ];

  for (const [pattern, absolute] of concreteRules) {
    const match = lower.match(pattern)?.[0];
    if (!match) continue;
    if (absolute) {
      risk = 1;
      continue;
    }
    if (!tokens(match).every((token) => source.has(token))) risk = 1;
  }

  if (unique(beat.forbiddenMoves ?? []).some((rule) =>
    ["planner vocabulary", "analytic explanation", "new dialogue", "source-keyword collage"].includes(rule),
  )) {
    // Those categories are forbidden only when the line actually exhibits them;
    // they are not a blanket veto on every candidate.
    if (META.test(lower) || OPERATION_LANGUAGE.test(lower)) risk = 1;
  }

  return metric(risk);
};

const relationMeaning = (
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number => {
  const supported = new Set(supportedEventIds(text, envelope));
  const required = unique(beat.eventIds ?? []);
  const coverage = required.length
    ? required.filter((id) => supported.has(id)).length / required.length
    : 0.5;
  const relationCount = supportedRelations([...supported], envelope).length;
  const relationBonus = beat.relationKinds?.length
    ? Math.min(1, relationCount / beat.relationKinds.length)
    : Math.min(1, relationCount / 2);
  return metric(coverage * 0.55 + relationBonus * 0.45);
};

const transitionScore = (
  text: string,
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): number => {
  if (isPayoffBeat(beat)) return endpointExactness(text, beat);
  const change = clean(beat.change);
  const next = clean(beat.next || beat.frontier);
  const relations = supportedRelations(supportedEventIds(text, envelope), envelope).length;
  return metric(
    Math.min(1, relations / 2) * 0.4 +
      (change ? similarity(text, change) : 0.2) * 0.35 +
      (next ? similarity(text, next) : 0.2) * 0.25,
  );
};

const compressionScore = (text: string): number => {
  const count = tokens(text).length;
  if (!count) return 0;
  if (count <= 7) return 1;
  if (count <= 10) return 0.45;
  return 0;
};

const repetitionRisk = (text: string, priorTexts: readonly string[]): number =>
  priorTexts.length ? Math.max(...priorTexts.map((prior) => similarity(text, prior))) : 0;

const normalizeLine = (value: unknown): string =>
  clean(value)
    .replace(/^[-*\d.)\s]+/, "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();

const contractEventIds = (beat: MouthCandidateBeat): string[] =>
  unique([
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ]);

const relationKinds = (beat: MouthCandidateBeat, envelope: RealityEnvelope): Set<string> => {
  const ids = new Set(contractEventIds(beat));
  return new Set(
    envelope.relations
      .filter((relation) => ids.has(relation.from) && ids.has(relation.to))
      .sort((a, b) => b.strength - a.strength)
      .map((relation) => relation.kind),
  );
};

const bounded = (value: string): string =>
  clean(value).split(/\s+/).filter(Boolean).slice(0, 7).join(" ");

const addVariant = (variants: string[], value: string): void => {
  const line = bounded(value);
  if (!line || line.split(/\s+/).length > 7) return;
  if (!variants.some((item) => item.toLowerCase() === line.toLowerCase())) variants.push(line);
};

function groundedFallbackTexts(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const labels = contractEventIds(beat)
    .map((id) => eventLabel(envelope, id))
    .filter(Boolean);
  const first = labels[0] ?? clean(envelope.subject);
  const second = labels[1] ?? "";
  const subject = clean(envelope.subject);
  const relations = relationKinds(beat, envelope);
  const out: string[] = [];

  if (isPayoffBeat(beat)) {
    addVariant(out, endpointText(beat));
    return out;
  }

  if (beat.attentionFunction === "hook" || beat.role === "arrival" || beat.role === "establish") {
    addVariant(out, first);
    if (subject && first && first.toLowerCase() !== subject.toLowerCase()) addVariant(out, `${subject}, ${first}`);
  }

  if (first && second) {
    if (relations.has("changes") || relations.has("contrasts")) {
      addVariant(out, `${first}. ${second}.`);
      addVariant(out, `${first}, but ${second}.`);
      addVariant(out, `${second}, but ${first}.`);
    }
    if (relations.has("recontextualizes")) {
      addVariant(out, `${first}. Then ${second}.`);
      addVariant(out, `${second}, apparently.`);
      addVariant(out, `${first}, still ${second}.`);
    }
    if (relations.has("repeats")) addVariant(out, `${second}, again.`);
  }

  if (!out.length && first) addVariant(out, first);
  if (!out.length && beat.change) addVariant(out, beat.change);
  return out.slice(0, 8);
}

const sourceCoverage = (text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number => {
  const supported = supportedEventIds(text, envelope);
  const required = unique(beat.eventIds ?? []);
  if (!required.length) return supported.length ? 0.8 : 0.2;
  return metric(supported.filter((id) => required.includes(id)).length / required.length);
};

export function scoreMouthCandidate(input: {
  text: string;
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidate {
  let text = normalizeLine(input.text);
  let invention = concreteRisk(text, input.envelope);
  let forbidden = forbiddenRisk(text, input.beat, input.envelope);

  // Deterministic recovery: Qwen's line is not allowed to poison the product.
  if (!text || forbidden >= 0.9 || invention >= 0.82 || /^(?:\w+\s*,\s*){3,}\w+$/i.test(text)) {
    const fallback = groundedFallbackTexts(input.beat, input.envelope)[0];
    if (fallback) {
      text = fallback;
      invention = concreteRisk(text, input.envelope);
      forbidden = forbiddenRisk(text, input.beat, input.envelope);
    }
  }

  const priorTexts = input.priorTexts ?? [];
  const supported = supportedEventIds(text, input.envelope);
  const relations = supportedRelations(supported, input.envelope);
  const grounding = metric(
    overlap(setOf(text), suppliedTerms(input.envelope)) * 0.6 + (supported.length ? 0.4 : 0),
  );
  const meaning = relationMeaning(text, input.beat, input.envelope);
  const transition = transitionScore(text, input.beat, input.envelope);
  const endpoint = endpointExactness(text, input.beat);
  const repetition = repetitionRisk(text, priorTexts);
  const novelty = metric(1 - repetition);
  const compression = compressionScore(text);
  const obligationCoverage = metric(meaning * 0.6 + transition * 0.4);
  const relationContract = input.beat.relationKinds?.length ? meaning : 0.5;
  const coverage = sourceCoverage(text, input.beat, input.envelope);
  const collageRisk =
    input.beat.eventIds && input.beat.eventIds.length > 1 &&
    tokens(text).length > 4 && supported.length >= input.beat.eventIds.length && meaning < 0.5
      ? 0.7
      : 0;
  const cohesion = priorTexts.length ? overlap(setOf(text), setOf(priorTexts.join(" "))) : 0.5;
  const restatement = input.beat.eventIds?.some((id) => similarity(text, eventLabel(input.envelope, id)) >= 0.92) ? 0.8 : 0;

  const score = isPayoffBeat(input.beat)
    ? metric(endpoint * 0.85 + grounding * 0.05 + compression * 0.05 + novelty * 0.05 - invention * 0.4 - forbidden * 0.7)
    : metric(
        grounding * 0.16 +
          meaning * 0.2 +
          transition * 0.24 +
          obligationCoverage * 0.12 +
          relationContract * 0.08 +
          coverage * 0.06 +
          cohesion * 0.04 +
          novelty * 0.06 +
          compression * 0.04 -
          invention * 0.35 -
          forbidden * 0.5 -
          collageRisk * 0.15 -
          restatement * 0.08,
      );

  const reasons: string[] = [];
  if (grounding < 0.42) reasons.push("weak-grounding");
  if (meaning < 0.4) reasons.push("weak-meaning-execution");
  if (transition < 0.4) reasons.push("weak-meaning-transition");
  if (coverage < 0.4) reasons.push("weak-source-coverage");
  if (invention > 0.45) reasons.push("high-invention-risk");
  if (forbidden > 0) reasons.push("forbidden-slot-move");
  if (repetition > 0.8) reasons.push("high-repetition");
  if (compression < 0.45) reasons.push("poor-compression");
  if (collageRisk > 0) reasons.push("keyword-assembly");
  if (restatement > 0) reasons.push("source-restatement");
  if (isPayoffBeat(input.beat) && endpoint !== 1) reasons.push("non-exact-payoff");
  if (!reasons.length && groundedFallbackTexts(input.beat, input.envelope).some((fallback) => normalizeLine(fallback) === text)) {
    reasons.push("grounded-fallback");
  }

  return {
    text,
    beatOrder: input.beat.order,
    supportedEventIds: supported,
    supportedRelationPairs: relations,
    groundingScore: grounding,
    meaningScore: meaning,
    transitionScore: transition,
    obligationCoverage,
    relationContractScore: relationContract,
    forbiddenMoveRisk: forbidden,
    cohesionScore: cohesion,
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

const candidateIsLegal = (candidate: MouthCandidate, beat: MouthCandidateBeat): boolean => {
  if (!candidate.text) return false;
  if (candidate.forbiddenMoveRisk > 0) return false;
  if (candidate.inventionRisk >= 0.62) return false;
  if (candidate.text.split(/\s+/).filter(Boolean).length > 10) return false;
  if (isPayoffBeat(beat)) return candidate.endpointExactness === 1;
  return true;
};

export function selectBestMouthCandidate(input: {
  texts: readonly string[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidateSelection {
  const candidates = input.texts
    .map((text) => scoreMouthCandidate({ text, beat: input.beat, envelope: input.envelope, priorTexts: input.priorTexts }))
    .filter((candidate) => candidateIsLegal(candidate, input.beat))
    .sort((a, b) => b.score - a.score);
  return { selected: candidates[0], candidates };
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{
  role: "system" | "user";
  content: string;
}> {
  const beat = input.beats[0];
  if (!beat) {
    return [
      { role: "system", content: "QRE CANONICAL MOUTH: no approved beat." },
      { role: "user", content: JSON.stringify({ task: "none" }) },
    ];
  }

  const anchors = (beat.eventIds ?? []).map((id) => ({ id, label: eventLabel(input.envelope, id) }));
  const relations = input.envelope.relations
    .filter((relation) => (beat.eventIds ?? []).includes(relation.from) || (beat.eventIds ?? []).includes(relation.to))
    .map((relation) => ({
      from: eventLabel(input.envelope, relation.from),
      to: eventLabel(input.envelope, relation.to),
      kind: relation.kind,
      strength: relation.strength,
    }));

  const system = [
    "QRE CANONICAL MOUTH · ONE APPROVED BEAT.",
    "The upstream Author already chose reality, movie, meaning, relationship, and endpoint.",
    "Your only job is language realization.",
    "Return EXACTLY ONE JSON object with exactly one variantsByBeat entry for THIS beat.",
    "That entry MUST use the supplied beat order and contain 5 materially different variants.",
    "Never create additional beat entries. Never number variants as beats.",
    "2-7 words preferred. One dominant thought. One semantic move.",
    "Make the next cut feel desirable without inventing a new event.",
    "",
    "REALITY LOCK: never invent concrete actions, body reactions, facial expressions, objects, people, places, sounds, dialogue, chronology, or outcomes.",
    "Creative framing may change perspective, status, implication, rhythm, attitude, or genre flavor. It may not add physical reality.",
    "Never write planner language, explain the relationship, or turn the beat into a summary.",
    "Never use a comma-chain or a subject/trait/action scaffold.",
    "",
    "RHYTHM REFERENCES ONLY:",
    "Came in nervous.",
    "Fierce anyway.",
    "Then came the bow.",
    "Blue, apparently.",
    "Peace was temporary.",
    "Do not copy unsupplied facts.",
    "",
    "PAYOFF: if this beat is the payoff, every variant MUST be the exact supplied endpoint phrase.",
    'OUTPUT SHAPE: {"variantsByBeat":[{"order":<this beat order>,"variants":["line1","line2","line3","line4","line5"]}]}',
  ].join("\n");

  const user = {
    task: "realize_one_approved_beat",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    priorTexts: input.priorTexts ?? [],
    suppliedEvidence: input.envelope.suppliedPhrases,
    beat: {
      order: beat.order,
      role: beat.role,
      attentionFunction: beat.attentionFunction,
      creativeMove: beat.creativeMove,
      realizationMode: beat.realizationMode,
      eventIds: beat.eventIds ?? [],
      anchors,
      relationKinds: beat.relationKinds ?? [],
      relationStrength: beat.relationStrength ?? 0,
      relations,
      change: clean(beat.change),
      next: clean(beat.next || beat.frontier),
      obligations: beat.obligations ?? [],
      forbiddenMoves: beat.forbiddenMoves ?? [],
      payoff: isPayoffBeat(beat),
      endpoint: endpointText(beat),
    },
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  const text = clean(raw)
    .replace(/^```(?:json|text|txt)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!text) return undefined;

  let value: { variantsByBeat?: unknown };
  try {
    value = JSON.parse(text) as { variantsByBeat?: unknown };
  } catch {
    return undefined;
  }

  if (!Array.isArray(value.variantsByBeat)) return undefined;

  const normalized = value.variantsByBeat
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      order: Number(entry.order ?? 0),
      variants: Array.isArray(entry.variants) ? unique(entry.variants).slice(0, 8) : [],
    }))
    .filter((entry) => entry.order > 0 && entry.variants.length > 0);

  if (!normalized.length) return undefined;

  // Qwen sometimes interprets "5 variants" as 5 single-variant beat entries.
  // Since the canonical caller sends exactly one approved beat per request,
  // normalize that malformed shape into a shared variant set for each order.
  if (normalized.length > 1 && normalized.every((entry) => entry.variants.length === 1)) {
    const combined = unique(normalized.map((entry) => entry.variants[0])).slice(0, 8);
    return {
      variantsByBeat: normalized.map((entry) => ({ order: entry.order, variants: combined })),
    };
  }

  return { variantsByBeat: normalized };
}

export async function generateAndSelectMouthCandidates(
  input: MouthCandidateGenerationInput & { model: MouthCandidateModel },
): Promise<{ texts: string[]; candidates: MouthCandidate[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const texts: string[] = [];
  const candidates: MouthCandidate[] = [];
  const rawParts: string[] = [];

  for (const beat of ordered) {
    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({ text: endpointText(beat), beat, envelope: input.envelope, priorTexts: texts });
      texts.push(exact.text);
      candidates.push(exact);
      continue;
    }

    const messages = buildMouthCandidateMessages({ ...input, beats: [beat], priorTexts: texts });
    const result = await input.model(messages);
    rawParts.push(result.text);

    const parsed = parseMouthCandidateBatch(result.text);
    let variants = parsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];

    if (variants.length < 2) {
      const repairMessages: Array<{ role: "system" | "user"; content: string }> = [
        messages[0]!,
        {
          role: "user",
          content: messages[1]!.content +
            "\nREPAIR: same approved beat. Return exactly one variantsByBeat entry using this beat order and exactly 5 variants. Do not create extra beat entries.",
        },
      ];
      const repair = await input.model(repairMessages);
      rawParts.push(repair.text);
      const repaired = parseMouthCandidateBatch(repair.text);
      variants = unique([...variants, ...(repaired?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [])]).slice(0, 8);
    }

    if (variants.length < 2) {
      variants = groundedFallbackTexts(beat, input.envelope);
    }

    const selection = selectBestMouthCandidate({ texts: variants, beat, envelope: input.envelope, priorTexts: texts });

    if (selection.selected) {
      texts.push(selection.selected.text);
      candidates.push(selection.selected);
    } else {
      const fallback = groundedFallbackTexts(beat, input.envelope)
        .map((candidate) => scoreMouthCandidate({ text: candidate, beat, envelope: input.envelope, priorTexts: texts }))
        .filter((candidate) => candidateIsLegal(candidate, beat))
        .sort((a, b) => b.score - a.score)[0];

      texts.push(fallback?.text ?? "");
      if (fallback) candidates.push(fallback);
    }
  }

  return { texts, candidates, rawText: rawParts.join("\n--- BEAT ---\n") };
}
