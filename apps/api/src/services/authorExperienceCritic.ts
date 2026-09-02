/**
 * QRE EXPERIENCE CRITIC · canonical post-Mouth evaluator
 *
 * This is not a prose-quality grader. It evaluates whether a realized cut
 * changes the viewer's model of the supplied world.
 *
 * Core rule:
 *   ADD something, MOVE attention, or CREATE/PRESERVE curiosity.
 *
 * A cut is not valuable because it contains source words. It is valuable
 * because the viewer is somewhere meaningfully different afterward.
 */
export type ExperienceCriticInput = {
  text: string;
  currentEvidence: string[];
  futureEvidence: string[];
  viewerBefore: { knows: string[]; expects: string[]; wonders: string[]; openQuestions: string[] };
  viewerAfter: { knows: string[]; expects: string[]; wonders: string[]; openQuestions: string[] };
  attentionTarget: string;
  previousAttentionTarget?: string;
  withheldInformation: string[];
  nextPressure: string;
  terminal: boolean;
};

export type ExperienceCriticResult = {
  accepted: boolean;
  addition: number;
  curiosity: number;
  informationGain: number;
  predictionShift: number;
  attentionMovement: number;
  concreteGrounding: number;
  meaningAccumulation: number;
  promiseCreation: number;
  promisePreservation: number;
  payoffDependency: number;
  futureLeakage: number;
  genericity: number;
  abstractionInflation: number;
  redundancy: number;
  deletionValue: number;
  score: number;
  reasons: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): Set<string> => new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/).filter((w) => w.length >= 4));
const overlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(a.size, b.size);
};
const newRatio = (after: Set<string>, before: Set<string>): number => {
  if (!after.size) return 0;
  let fresh = 0;
  for (const token of after) if (!before.has(token)) fresh += 1;
  return fresh / after.size;
};
const clamp = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const metric = (n: number): number => Number(clamp(n).toFixed(3));

export function evaluateAuthorExperienceCut(input: ExperienceCriticInput): ExperienceCriticResult {
  const text = clean(input.text);
  const textWords = words(text);
  const evidenceWords = words(input.currentEvidence.join(" "));
  const futureWords = words(input.futureEvidence.join(" "));
  const beforeKnown = words(input.viewerBefore.knows.join(" "));
  const beforeExpect = words(input.viewerBefore.expects.join(" "));
  const beforeWonder = words(input.viewerBefore.wonders.join(" "));
  const beforeOpen = words(input.viewerBefore.openQuestions.join(" "));
  const afterKnown = words(input.viewerAfter.knows.join(" "));
  const afterExpect = words(input.viewerAfter.expects.join(" "));
  const afterWonder = words(input.viewerAfter.wonders.join(" "));
  const afterOpen = words(input.viewerAfter.openQuestions.join(" "));

  const evidenceOverlap = overlap(textWords, evidenceWords);
  const futureOverlap = overlap(textWords, futureWords);
  const knowledgeAddition = newRatio(afterKnown, beforeKnown);
  const expectationChange = newRatio(afterExpect, beforeExpect);
  const questionCreation = newRatio(afterWonder, beforeWonder);
  const openQuestionCreation = newRatio(afterOpen, beforeOpen);
  const targetWords = words(input.attentionTarget);
  const previousTargetWords = words(input.previousAttentionTarget ?? "");
  const targetNovelty = newRatio(targetWords, beforeKnown);
  const targetShift = previousTargetWords.size
    ? 1 - overlap(targetWords, previousTargetWords)
    : targetNovelty;
  const pressureWords = words(input.nextPressure);
  const pressureOverlap = overlap(textWords, pressureWords);

  const abstractMarkers = (text.match(/\b(?:ritual|transformation|renewal|journey|moment|experience|beautiful|magical|subtle|quiet|sense|feeling|poised|cycle|resolution|confidence)\b/gi) ?? []).length;
  const concreteMarkers = (text.match(/\b(?:came|walked|called|looked|raised|lifted|took|stole|held|opened|closed|water|bow|mirror|door|phone|hand|face|dog|person|place)\b/gi) ?? []).length;
  const abstractionInflation = metric(abstractMarkers / Math.max(abstractMarkers + concreteMarkers, 1));
  const genericity = metric(text.length > 0 && evidenceOverlap < 0.12 && concreteMarkers === 0 ? 0.9 : (1 - evidenceOverlap) * 0.55);
  const redundancy = metric(Math.max(0, overlap(textWords, beforeKnown) - evidenceOverlap * 0.35));
  const futureLeakage = metric(input.terminal ? 0 : futureOverlap);

  const addition = metric(
    knowledgeAddition * 0.46 +
    evidenceOverlap * 0.24 +
    expectationChange * 0.12 +
    targetNovelty * 0.1 +
    (futureLeakage < 0.2 ? 0.08 : 0),
  );
  const predictionShift = metric(
    expectationChange * 0.42 +
    targetShift * 0.2 +
    questionCreation * 0.18 +
    pressureOverlap * 0.12 +
    (input.nextPressure ? 0.08 : 0),
  );
  const curiosity = metric(
    questionCreation * 0.32 +
    openQuestionCreation * 0.2 +
    predictionShift * 0.2 +
    (input.withheldInformation.length ? 0.16 : 0) +
    (input.futureEvidence.length && !input.terminal ? 0.12 : 0),
  );
  const attentionMovement = metric(
    targetShift * 0.48 +
    targetNovelty * 0.2 +
    predictionShift * 0.18 +
    (input.nextPressure ? 0.14 : 0),
  );
  const stateChange = metric(addition * 0.5 + predictionShift * 0.25 + curiosity * 0.25);
  const concreteGrounding = metric(evidenceOverlap * 0.72 + Math.min(concreteMarkers, 3) / 10);
  const meaningAccumulation = metric(stateChange * 0.48 + evidenceOverlap * 0.28 + (knowledgeAddition > 0 ? 0.24 : 0));
  const promiseCreation = metric(input.nextPressure ? 0.42 + pressureOverlap * 0.38 + curiosity * 0.2 : curiosity * 0.35);
  const promisePreservation = metric(input.withheldInformation.length && !input.terminal ? 0.65 + Math.min(futureOverlap, 0.35) : input.terminal ? 1 : 0.2);
  const payoffDependency = metric(input.terminal ? evidenceOverlap * 0.55 + predictionShift * 0.2 + curiosity * 0.25 : 0);
  const deletionValue = metric(
    addition * 0.3 + attentionMovement * 0.27 + curiosity * 0.28 + concreteGrounding * 0.15,
  );
  const score = metric(
    addition * 0.2 + curiosity * 0.18 + attentionMovement * 0.16 + predictionShift * 0.1 +
    concreteGrounding * 0.13 + meaningAccumulation * 0.08 + promiseCreation * 0.05 +
    promisePreservation * 0.04 + payoffDependency * 0.05 + (1 - futureLeakage) * 0.04 +
    (1 - genericity) * 0.04 + (1 - abstractionInflation) * 0.01 + (1 - redundancy) * 0.02,
  );

  const reasons: string[] = [];
  if (addition < 0.28) reasons.push("low-addition");
  if (attentionMovement < 0.28) reasons.push("weak-attention-movement");
  if (curiosity < 0.28 && !input.terminal) reasons.push("low-curiosity");
  if (concreteGrounding < 0.3) reasons.push("weak-current-evidence-grounding");
  if (abstractionInflation > 0.55) reasons.push("abstraction-replaced-reality");
  if (genericity > 0.65) reasons.push("generic-collapse");
  if (redundancy > 0.7) reasons.push("low-new-information");
  if (futureLeakage > 0.35) reasons.push("future-leakage");
  if (!input.terminal && !input.nextPressure && input.futureEvidence.length && curiosity < 0.4) reasons.push("no-next-pressure");
  if (deletionValue < 0.34) reasons.push("fails-delete-test");

  const coreJobSatisfied = input.terminal
    ? (payoffDependency >= 0.28 || addition >= 0.28 || attentionMovement >= 0.28)
    : (addition >= 0.28 || attentionMovement >= 0.28 || curiosity >= 0.28);

  return {
    accepted: reasons.length === 0 && coreJobSatisfied && score >= 0.46,
    addition,
    curiosity,
    informationGain: addition,
    predictionShift,
    attentionMovement,
    concreteGrounding,
    meaningAccumulation,
    promiseCreation,
    promisePreservation,
    payoffDependency,
    futureLeakage,
    genericity,
    abstractionInflation,
    redundancy,
    deletionValue,
    score,
    reasons,
  };
}
