/**
 * QRE EXPERIENCE CRITIC · canonical post-Mouth evaluator
 *
 * This is not a prose-quality grader. It checks whether a realized cut
 * materially changes the viewer's model of the supplied world.
 */
export type ExperienceCriticInput = {
  text: string;
  currentEvidence: string[];
  futureEvidence: string[];
  viewerBefore: { knows: string[]; expects: string[]; wonders: string[]; openQuestions: string[] };
  viewerAfter: { knows: string[]; expects: string[]; wonders: string[]; openQuestions: string[] };
  attentionTarget: string;
  withheldInformation: string[];
  nextPressure: string;
  terminal: boolean;
};

export type ExperienceCriticResult = {
  accepted: boolean;
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
const clamp = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const metric = (n: number): number => Number(clamp(n).toFixed(3));

export function evaluateAuthorExperienceCut(input: ExperienceCriticInput): ExperienceCriticResult {
  const text = clean(input.text);
  const textWords = words(text);
  const evidenceWords = words(input.currentEvidence.join(" "));
  const futureWords = words(input.futureEvidence.join(" "));
  const beforeWords = words([...input.viewerBefore.knows, ...input.viewerBefore.expects, ...input.viewerBefore.wonders].join(" "));
  const afterWords = words([...input.viewerAfter.knows, ...input.viewerAfter.expects, ...input.viewerAfter.wonders].join(" "));
  const evidenceOverlap = overlap(textWords, evidenceWords);
  const futureOverlap = overlap(textWords, futureWords);
  const stateDelta = 1 - overlap(beforeWords, afterWords);
  const targetOverlap = overlap(textWords, words(input.attentionTarget));
  const pressureOverlap = overlap(textWords, words(input.nextPressure));
  const abstractMarkers = (text.match(/\b(?:ritual|transformation|renewal|journey|moment|experience|beautiful|magical|subtle|quiet|sense|feeling|poised|cycle|resolution|confidence)\b/gi) ?? []).length;
  const concreteMarkers = (text.match(/\b(?:came|walked|called|looked|raised|lifted|took|stole|held|opened|closed|water|bow|mirror|door|phone|hand|face|dog|person|place)\b/gi) ?? []).length;
  const abstractionInflation = metric(abstractMarkers / Math.max(abstractMarkers + concreteMarkers, 1));
  const genericity = metric(text.length > 0 && evidenceOverlap < 0.12 && concreteMarkers === 0 ? 0.9 : (1 - evidenceOverlap) * 0.55);
  const redundancy = metric(Math.max(0, overlap(textWords, beforeWords) - evidenceOverlap * 0.4));
  const futureLeakage = metric(input.terminal ? 0 : futureOverlap);
  const informationGain = metric(evidenceOverlap * 0.45 + stateDelta * 0.3 + targetOverlap * 0.15 + (futureLeakage < 0.2 ? 0.1 : 0));
  const predictionShift = metric(stateDelta * 0.55 + pressureOverlap * 0.2 + (input.futureEvidence.length && input.nextPressure ? 0.25 : 0));
  const attentionMovement = metric(targetOverlap * 0.45 + predictionShift * 0.35 + (input.nextPressure ? 0.2 : 0));
  const concreteGrounding = metric(evidenceOverlap * 0.75 + Math.min(concreteMarkers, 3) / 10);
  const meaningAccumulation = metric(stateDelta * 0.5 + evidenceOverlap * 0.3 + (input.viewerAfter.knows.length > input.viewerBefore.knows.length ? 0.2 : 0));
  const promiseCreation = metric(input.nextPressure ? 0.55 + pressureOverlap * 0.45 : 0);
  const promisePreservation = metric(input.withheldInformation.length && !input.terminal ? 0.65 + Math.min(futureOverlap, 0.35) : input.terminal ? 1 : 0.2);
  const payoffDependency = metric(input.terminal ? evidenceOverlap * 0.7 + predictionShift * 0.3 : 0);
  const deletionValue = metric(informationGain * 0.35 + attentionMovement * 0.3 + concreteGrounding * 0.2 + promiseCreation * 0.15);
  const score = metric(
    informationGain * 0.18 + predictionShift * 0.13 + attentionMovement * 0.13 + concreteGrounding * 0.15 +
    meaningAccumulation * 0.1 + promiseCreation * 0.07 + promisePreservation * 0.06 + payoffDependency * 0.08 +
    (1 - futureLeakage) * 0.05 + (1 - genericity) * 0.03 + (1 - abstractionInflation) * 0.01 + (1 - redundancy) * 0.01,
  );
  const reasons: string[] = [];
  if (concreteGrounding < 0.3) reasons.push("weak-current-evidence-grounding");
  if (informationGain < 0.35) reasons.push("low-information-gain");
  if (attentionMovement < 0.3) reasons.push("weak-attention-movement");
  if (abstractionInflation > 0.55) reasons.push("abstraction-replaced-reality");
  if (genericity > 0.65) reasons.push("generic-collapse");
  if (redundancy > 0.7) reasons.push("low-new-information");
  if (futureLeakage > 0.35) reasons.push("future-leakage");
  if (!input.terminal && !input.nextPressure && input.futureEvidence.length) reasons.push("no-next-pressure");
  if (deletionValue < 0.35) reasons.push("fails-delete-test");
  return {
    accepted: reasons.length === 0 && score >= 0.48,
    informationGain, predictionShift, attentionMovement, concreteGrounding, meaningAccumulation,
    promiseCreation, promisePreservation, payoffDependency, futureLeakage, genericity, abstractionInflation,
    redundancy, deletionValue, score, reasons,
  };
}
