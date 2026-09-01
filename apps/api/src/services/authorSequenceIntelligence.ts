/**
 * Canonical Author sequence intelligence.
 *
 * Deterministic, viewer-facing semantics only:
 * novelty -> uncertainty -> information value -> attention -> tension ->
 * information seeking -> narrative engagement.
 *
 * This module never invents reality. It converts approved sequence evidence
 * into the cognitive state that explains why a cut exists and what it opens.
 */
import type {
  CutNecessity,
  InformationFrontier,
  MagnetCircle,
  SequenceTransition,
  SubjectContinuity,
  ViewerMomentum,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten a new one more".split(/\s+/),
);

const INTERNAL = /\b(?:attention strategy|operator(?: mix|s)?|build from beat|round\s*\d|cognitive(?: plan| brain)?|cognition|preserve forward|land the chosen|find subtle tension|contradictions?:\s*none|why this beat|viewer-facing|writing process|information frontier|narrative engagement)\b/i;
const VAGUE = /^(?:the unexpected|the unknown|unseen chaos|hidden intentions|the next step|what happens next|more to come|the end|closure|a new identity|viewer interest|information seeking)$/i;

function words(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 4 && !STOP.has(word)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const word of a) if (b.has(word)) hits += 1;
  return hits / a.size;
}

function safeFrontier(value: string): string {
  const candidate = clean(value);
  if (!candidate || INTERNAL.test(candidate) || VAGUE.test(candidate)) return "";
  return candidate;
}

export function computeMagnet(
  before: ViewerMomentum,
  change: string,
  next: string,
  gain: string,
): MagnetCircle {
  const known = words(before.known.join(" "));
  const changeWords = words(change);
  const nextWords = words(next);
  const novelty = metric(1 - overlap(changeWords, known));
  const unresolved = clean(before.unresolved);
  const frontier = safeFrontier(next);
  const uncertainty = metric(
    (nextWords.size ? 0.3 : 0.02) +
      (unresolved || before.curiosityGap ? 0.22 : 0) +
      (["question", "surprise", "escalation"].includes(gain) ? 0.22 : 0) +
      (frontier.includes("?") ? 0.16 : 0),
  );
  const informationValue = metric(
    novelty * 0.4 +
      (changeWords.size ? 0.16 : 0) +
      (nextWords.size ? 0.14 : 0) +
      (["surprise", "reframe", "discovery", "consequence", "callback", "payoff"].includes(gain) ? 0.26 : 0),
  );
  const attention = metric(novelty * 0.5 + informationValue * 0.5);
  const tension = metric(uncertainty * Math.max(informationValue, 0.2));
  const informationSeeking = metric(
    (nextWords.size ? 0.26 : 0) +
      (unresolved ? 0.25 : 0) +
      (before.forwardPull ? 0.2 : 0) +
      (before.currentWant ? 0.1 : 0) +
      (frontier.includes("?") ? 0.12 : 0),
  );
  const narrativeEngagement = metric((attention + tension + informationSeeking) / 3);
  const magnetStrength = metric(
    novelty * 0.15 +
      uncertainty * 0.17 +
      informationValue * 0.2 +
      attention * 0.16 +
      tension * 0.19 +
      informationSeeking * 0.09 +
      narrativeEngagement * 0.04,
  );

  return {
    novelty,
    uncertainty,
    informationValue,
    attention,
    tension,
    informationSeeking,
    narrativeEngagement,
    magnetStrength,
    unresolved: frontier || clean(change) || unresolved,
    nextNeed: frontier || before.forwardPull,
  };
}

export function buildInformationFrontier(
  before: ViewerMomentum,
  change: string,
  next: string,
  magnet: MagnetCircle,
): InformationFrontier {
  const frontier = safeFrontier(next || change || before.unresolved || "");
  return {
    known: before.known,
    frontier,
    novelty: magnet.novelty,
    uncertainty: magnet.uncertainty,
    informationValue: magnet.informationValue,
    tension: magnet.tension,
    nextNeed: frontier || undefined,
  };
}

export function buildSubjectContinuity(
  subject: string,
  established: boolean,
  text: string,
  order: number,
): SubjectContinuity {
  const cleanSubject = clean(subject);
  const escaped = cleanSubject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = Boolean(cleanSubject) && new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = /\b(?:he|she|they|it|him|her|them|his|their|its)\b/i.test(text);

  return {
    established: established || Boolean(cleanSubject),
    subject: cleanSubject,
    referenceMode: explicit ? "name" : pronoun ? "pronoun" : "implicit",
    referenceCost: explicit && established ? 0.35 : pronoun && established ? 0.1 : 0,
    lastExplicitReference: explicit ? order : undefined,
  };
}

export function buildSequenceTransition(
  before: ViewerMomentum,
  change: string,
  next: string,
  gain: string,
  subject: string,
  established: boolean,
  order: number,
  necessityReason: string,
): SequenceTransition {
  const frontier = safeFrontier(next);
  const magnet = computeMagnet(before, change, frontier, gain);
  const subjectContinuity = buildSubjectContinuity(subject, established, change, order);
  const informationFrontier = buildInformationFrontier(before, change, frontier, magnet);
  const necessary = order === 1 || !frontier || magnet.magnetStrength >= 0.36;
  const necessity: CutNecessity = {
    necessary,
    reason: clean(necessityReason) || "advances approved reality",
    removalDamage: frontier
      ? `Weakens the next unresolved need: ${frontier}`
      : `Removes the current change: ${clean(change)}`,
  };

  const after: ViewerMomentum = {
    known: before.known,
    expected: frontier || undefined,
    activeQuestion: gain === "question" ? frontier || clean(change) : before.activeQuestion,
    curiosityGap: frontier || before.curiosityGap,
    predictionShift: clean(change) || before.predictionShift,
    currentWant: frontier || undefined,
    unresolved: magnet.unresolved,
    forwardPull: frontier || undefined,
    payoffDebt: before.payoffDebt,
    magnet,
    subjectContinuity,
    informationFrontier,
  };

  return {
    before,
    change: clean(change),
    after,
    nextPressure: frontier || undefined,
    necessity,
  };
}

export function initialMomentum(
  subject: string,
  baselineFacts: readonly string[] = [],
): ViewerMomentum {
  const known = [...new Set(baselineFacts.map(clean).filter(Boolean))];
  return {
    known,
    subjectContinuity: {
      established: false,
      subject: clean(subject),
      referenceMode: "implicit",
      referenceCost: 0,
    },
    informationFrontier: {
      known,
      frontier: "",
      novelty: 0,
      uncertainty: 0,
      informationValue: 0,
      tension: 0,
    },
  };
}

function segmentWords(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 4 && !STOP.has(word));
}

function segmentIdentity(a: string, b: string): number {
  const aw = new Set(segmentWords(a));
  const bw = new Set(segmentWords(b));
  if (!aw.size || !bw.size) return 0;
  let hits = 0;
  for (const word of aw) if (bw.has(word)) hits += 1;
  return hits / Math.max(aw.size, bw.size);
}

function groupingChange(parts: readonly ViewerMomentum[], fallback: string): string {
  const latest = [...parts].reverse().find((part) => clean(part.predictionShift));
  return clean(latest?.predictionShift) || fallback;
}

function groupingNext(parts: readonly ViewerMomentum[], fallback: string): string {
  const latest = [...parts].reverse().find((part) => clean(part.forwardPull || part.curiosityGap || part.activeQuestion));
  return clean(latest?.forwardPull || latest?.curiosityGap || latest?.activeQuestion) || fallback;
}

function groupingGain(parts: readonly ViewerMomentum[], fallback: string): string {
  const values = parts.map((part) => part.magnet).filter(Boolean);
  if (!values.length) return fallback;
  const average = values.reduce((sum, value) => sum + value!.informationValue, 0) / values.length;
  return average >= 0.55 ? "discovery" : fallback;
}

export function chooseAdaptiveGroups(steps: readonly { eventIds?: readonly string[]; viewerChange?: string; nextQuestion?: string; operation?: string }[]): number[][] {
  const n = steps.length;
  if (n <= 1) return n ? [[0]] : [];
  const groups: number[][] = [];
  let start = 0;
  while (start < n) {
    const remaining = n - start;
    const forcePayoff = start > 0 && remaining <= 2;
    const maxGroup = remaining >= 7 ? 3 : remaining >= 4 ? 2 : 1;
    let end = start;
    while (end + 1 < n && end - start + 1 < maxGroup) {
      const current = steps[end];
      const next = steps[end + 1];
      const sameOperation = current?.operation && next?.operation && current.operation === next.operation;
      const a = clean(current?.viewerChange);
      const b = clean(next?.viewerChange);
      const similarity = segmentIdentity(a, b);
      const complementary = Boolean(current?.eventIds?.length && next?.eventIds?.length);
      const lowValue = Boolean(next?.operation === "support" || next?.operation === "context");
      const shouldCompress = sameOperation || similarity >= 0.34 || lowValue || (complementary && remaining > 3);
      if (!shouldCompress || forcePayoff) break;
      end += 1;
    }
    groups.push(Array.from({ length: end - start + 1 }, (_, offset) => start + offset));
    start = end + 1;
  }
  if (groups.length >= 3) return groups;
  if (n <= 3) return groups;
  return [groups.flat()];
}
