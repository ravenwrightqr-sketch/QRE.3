/**
 * QRE AUTHOR MOUTH · CANONICAL CANDIDATE REALIZATION
 *
 * Ownership:
 * - receives an approved Realization Slot / Beat
 * - asks the model for language only
 * - hard-gates invented concrete reality
 * - scores semantic execution
 * - returns candidates to the existing sequence Beam
 *
 * Does NOT own reality, movie planning, meaning selection, endpoint choice,
 * or sequence planning.
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
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>,
) => Promise<{ text: string }>;

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten".split(
    /\s+/
  ),
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

const META = /\b(?:beat|viewer|audience|strategy|planner|planning|cognition|realization|writing process|author brief|meaning spine|beat graph)\b/i;
const GENERIC = /\b(?:beautiful|magical|unforgettable|incredible|journey|special|meaningful|cinematic|perfect day|new chapter|happy ending)\b/i;
const QUESTION = /\?/;
const OPERATION_LANGUAGE = /\b(?:contrast(?:s|ed)?|reframe|reframing|transformation|transforms?|highlight(?:s|ed)?|explains?|shows? the contrast|changes? the meaning|conclusion)\b/i;

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

function setOf(text: string): Set<string> {
  return new Set(tokens(text).map(stem));
}

function overlap(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
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
  return mode.includes("payoff") || role === "payoff" || attention === "payoff";
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
  const source = suppliedTerms(envelope);
  const words = tokens(text);
  if (!words.length) return 1;
  let unsupported = 0;
  for (const word of words) {
    const value = stem(word);
    if (STOP.has(value) || INTERPRETIVE.has(value)) continue;
    if (!source.has(value)) unsupported += 1;
  }
  return metric(unsupported / Math.max(1, words.length));
}

function forbiddenRisk(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  const lower = clean(text).toLowerCase();
  const source = suppliedTerms(envelope);
  const forbidden = unique(beat.forbiddenMoves ?? []).map((value) => value.toLowerCase());
  let risk = 0;

  if (META.test(lower) || OPERATION_LANGUAGE.test(lower)) risk = 1;
  if (GENERIC.test(lower)) risk = Math.max(risk, 0.8);
  if (QUESTION.test(lower)) risk = Math.max(risk, 0.7);

  const concreteRules: Array<[string, RegExp]> = [
    ["new person", /\b(?:someone|man|woman|stranger|person)\b/i],
    ["new object", /\b(?:table|door|window|chair|phone|bag|leash|scissors)\b/i],
    ["new location", /\b(?:street|park|room|kitchen|salon|store|office|outside|inside)\b/i],
    ["new action", /\b(?:walked|ran|jumped|grabbed|threw|opened|closed|smiled|laughed|cried|snatched|stalked|entered)\b/i],
    ["new body reaction", /\b(?:trembled|blinked|sighed|stared|shrugged|winked|flinched|eyes|tail)\b/i],
    ["new sound", /\b(?:roar|growl|bark|scream|whistle|buzz|bang)\b/i],
    ["new outcome", /\b(?:won|lost|escaped|returned|disappeared|arrived|died|survived)\b/i],
    ["new chronology", /\b(?:later|earlier|tomorrow|yesterday|the next day|years later)\b/i],
  ];

  for (const [name, pattern] of concreteRules) {
    if (!pattern.test(lower)) continue;
    if (name === "new outcome" || name === "new chronology") risk = Math.max(risk, 1);
    else {
      const match = lower.match(pattern)?.[0] ?? "";
      const unsupported = tokens(match).map(stem).some((word) => !source.has(word));
      if (unsupported) risk = Math.max(risk, 1);
    }
  }

  for (const rule of forbidden) {
    if (rule === "planner vocabulary" || rule === "analytic explanation" || rule === "new dialogue" || rule === "source-keyword collage") {
      risk = 1;
    }
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

function transitionScore(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {
  if (isPayoffBeat(beat)) return endpointExactness(text, beat);
  const change = clean(beat.change);
  const next = clean(beat.next || beat.frontier);
  const relations = supportedRelations(supportedEventIds(text, envelope), envelope).length;
  return metric(
    Math.min(1, relations / 2) * 0.4 +
      (change ? similarity(text, change) : 0.2) * 0.35 +
      (next ? similarity(text, next) : 0.2) * 0.25,
  );
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
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
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
    overlap(setOf(text), suppliedTerms(input.envelope)) * 0.6 +
      (supported.length ? 0.4 : 0),
  );
  const meaning = relationMeaning(text, input.beat, input.envelope);
  const transition = transitionScore(text, input.beat, input.envelope);
  const endpoint = endpointExactness(text, input.beat);
  const invention = concreteRisk(text, input.envelope);
  const forbidden = forbiddenRisk(text, input.beat, input.envelope);
  const repetition = repetitionRisk(text, priorTexts);
  const novelty = metric(1 - repetition);
  const compression = compressionScore(text);
  const obligationCoverage = metric(meaning * 0.6 + transition * 0.4);
  const relationContract = input.beat.relationKinds?.length ? meaning : 0.5;
  const collageRisk =
    input.beat.eventIds && input.beat.eventIds.length > 1 &&
    tokens(text).length > 4 &&
    supported.length >= input.beat.eventIds.length &&
    meaning < 0.5 ? 0.7 : 0;
  const cohesion = priorTexts.length ? metric(overlap(setOf(text), setOf(priorTexts.join(" ")))) : 0.5;
  const restatement = input.beat.eventIds?.some((id) => similarity(text, eventLabel(input.envelope, id)) >= 0.92) ? 0.8 : 0;

  const score = isPayoffBeat(input.beat)
    ? metric(
        endpoint * 0.85 +
          grounding * 0.05 +
          compression * 0.05 +
          novelty * 0.05 -
          invention * 0.4 -
          forbidden * 0.7,
      )
    : metric(
        grounding * 0.18 +
          meaning * 0.2 +
          transition * 0.24 +
          obligationCoverage * 0.12 +
          relationContract * 0.08 +
          cohesion * 0.04 +
          novelty * 0.06 +
          compression * 0.08 -
          invention * 0.35 -
          forbidden * 0.5 -
          collageRisk * 0.15 -
          restatement * 0.12,
      );

  const reasons: string[] = [];
  if (grounding < 0.42) reasons.push("weak-grounding");
  if (meaning < 0.4) reasons.push("weak-meaning-execution");
  if (transition < 0.4) reasons.push("weak-meaning-transition");
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

function candidateIsLegal(candidate: MouthCandidate, beat: MouthCandidateBeat): boolean {
  if (!candidate.text) return false;
  if (candidate.forbiddenMoveRisk > 0) return false;
  if (candidate.inventionRisk >= 0.62) return false;
  if (candidate.text.split(/\s+/).filter(Boolean).length > 10) return false;
  if (isPayoffBeat(beat)) return candidate.endpointExactness === 1;
  return true;
}

export function selectBestMouthCandidate(input: {
  texts: readonly string[];
  beat: MouthCandidateBeat;
  envelope: RealityEnvelope;
  priorTexts?: readonly string[];
}): MouthCandidateSelection {
  const candidates = input.texts
    .map((text) => scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts: input.priorTexts,
    }))
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

  const anchors = (beat.eventIds ?? []).map((id) => ({
    id,
    label: eventLabel(input.envelope, id),
  }));
  const relations = input.envelope.relations
    .filter((relation) =>
      (beat.eventIds ?? []).includes(relation.from) ||
      (beat.eventIds ?? []).includes(relation.to),
    )
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
    "Write 5 materially different short viewer-facing lines for this beat.",
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
    "PAYOFF: if this beat is the payoff, return only the exact supplied endpoint phrase.",
    "OUTPUT: JSON only, one variantsByBeat entry.",
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
    outputShape: { variantsByBeat: [{ order: beat.order, variants: ["..."] }] },
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

  try {
    const value = JSON.parse(text) as { variantsByBeat?: unknown };
    if (!Array.isArray(value.variantsByBeat)) return undefined;

    const variantsByBeat = value.variantsByBeat
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        order: Number(entry.order ?? 0),
        variants: Array.isArray(entry.variants)
          ? unique(entry.variants).slice(0, 8)
          : [],
      }))
      .filter((entry) => entry.order > 0 && entry.variants.length > 0);

    return { variantsByBeat };
  } catch {
    return undefined;
  }
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
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts: texts,
      });
      texts.push(exact.text);
      candidates.push(exact);
      continue;
    }

    const messages = buildMouthCandidateMessages({
      ...input,
      beats: [beat],
      priorTexts: texts,
    });
    const result = await input.model(messages);
    rawParts.push(result.text);

    const parsed = parseMouthCandidateBatch(result.text);
    let variants = parsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];

    if (variants.length < 2) {
      const repairMessages: Array<{ role: "system" | "user"; content: string }> = [
        messages[0]!,
        {
          role: "user",
          content:
            messages[1]!.content +
            "\nREPAIR: create 5 materially different lines for the same approved beat. Preserve reality and meaning. Return only JSON variantsByBeat.",
        },
      ];
      const repair = await input.model(repairMessages);
      rawParts.push(repair.text);
      const repaired = parseMouthCandidateBatch(repair.text);
      const repairVariants = repaired?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];
      variants = unique([...variants, ...repairVariants]).slice(0, 8);
    }

    const selection = selectBestMouthCandidate({
      texts: variants,
      beat,
      envelope: input.envelope,
      priorTexts: texts,
    });

    if (selection.selected) {
      texts.push(selection.selected.text);
      candidates.push(selection.selected);
    } else {
      texts.push("");
    }
  }

  return {
    texts,
    candidates,
    rawText: rawParts.join("\n--- BEAT ---\n"),
  };
}
