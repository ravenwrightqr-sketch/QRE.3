const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map((value) => clean(value)).filter(Boolean))];

export type AuthorBehaviorProfile = {
  confidence: number;
  compressionPreference: number;
  explanationAversion: number;
  callbackAffinity: number;
  surprisePreference: number;
  accelerationPreference: number;
  revisitAffinity: number;
  learnedSignals: string[];
};

const POSITIVE_SHORT = /\b(?:short|punchy|sharp|tight|attitude|dry|terse|quick|fast|snappy)\b/i;
const POSITIVE_CALLBACK = /\b(?:callback|revisit|revisited|recall|returning|continuity)\b/i;
const POSITIVE_SURPRISE = /\b(?:surprise|surprising|unexpected|sharp reveal|twist|jolt|contrast|reframe|recontextual)\b/i;
const POSITIVE_ACCELERATION = /\b(?:fast|quick|pace|tempo|accelerat|tighten|early hit|hook)\b/i;
const NEGATIVE_EXPLANATION = /\b(?:explain|explanatory|explanation|longform|essay|wordy|verbose|slow|setup>setup|too much context)\b/i;
const NEGATIVE_REPETITION = /\b(?:repeat|repetitive|same wording|restart|retread|again and again)\b/i;

function joined(values: readonly string[]): string {
  return values.map(clean).filter(Boolean).join(" ");
}

export function buildAuthorBehaviorProfile(values: readonly string[]): AuthorBehaviorProfile {
  const signals = unique(values);
  const accepted = signals.filter((value) => /^(?:accepted:|behavior-preference:|preference:|style:|trajectory:|feedback:)/i.test(value));
  const rejected = signals.filter((value) => /^rejected:/i.test(value));
  const behavioral = signals.filter((value) => /^(?:engagement:|friction:|prior tempo:|tempo:|revisit:|future:|carry:)/i.test(value));

  const acceptedText = joined(accepted);
  const rejectedText = joined(rejected);
  const behaviorText = joined(behavioral);
  const evidenceCount = accepted.length + rejected.length + behavioral.length;
  const confidence = metric(Math.min(1, evidenceCount / 12));

  const shortHits = [acceptedText, behaviorText].filter((text) => POSITIVE_SHORT.test(text)).length;
  const explanationHits = [rejectedText, behaviorText].filter((text) => NEGATIVE_EXPLANATION.test(text)).length;
  const callbackHits = [acceptedText, behaviorText].filter((text) => POSITIVE_CALLBACK.test(text)).length;
  const surpriseHits = [acceptedText, behaviorText].filter((text) => POSITIVE_SURPRISE.test(text)).length;
  const accelerationHits = [acceptedText, behaviorText].filter((text) => POSITIVE_ACCELERATION.test(text)).length;
  const revisitHits = [acceptedText, behaviorText].filter((text) => POSITIVE_CALLBACK.test(text) || /\brevisit\b/i.test(text)).length;
  const repetitionPain = NEGATIVE_REPETITION.test(rejectedText) ? 0.18 : 0;

  const engagementMatch = behaviorText.match(/engagement:(0(?:\.\d+)?|1(?:\.0+)?)/);
  const frictionMatch = behaviorText.match(/friction:(0(?:\.\d+)?|1(?:\.0+)?)/);
  const engagement = engagementMatch ? Number(engagementMatch[1]) : 0;
  const friction = frictionMatch ? Number(frictionMatch[1]) : 0;
  const replaySignal = /\breplay\b/i.test(behaviorText);

  const compressionPreference = metric(confidence * (0.18 + shortHits * 0.24 + Math.min(0.25, replaySignal ? 0.25 : 0)));
  const explanationAversion = metric(confidence * (0.12 + explanationHits * 0.3 + repetitionPain + friction * 0.2));
  const callbackAffinity = metric(confidence * (0.16 + callbackHits * 0.28 + revisitHits * 0.12));
  const surprisePreference = metric(confidence * (0.14 + surpriseHits * 0.28));
  const accelerationPreference = metric(confidence * (0.1 + accelerationHits * 0.22 + engagement * 0.18 - friction * 0.08));
  const revisitAffinity = metric(confidence * (0.12 + revisitHits * 0.3 + callbackHits * 0.12));

  const learnedSignals: string[] = [];
  if (compressionPreference >= 0.35) learnedSignals.push("PREFER SHORT PUNCHY CUTS");
  if (explanationAversion >= 0.35) learnedSignals.push("AVOID EXPLANATORY REALIZATION");
  if (callbackAffinity >= 0.35) learnedSignals.push("REWARD MEANINGFUL CALLBACKS");
  if (surprisePreference >= 0.35) learnedSignals.push("REWARD SURPRISE AND REFRAMING");
  if (accelerationPreference >= 0.35) learnedSignals.push("PREFER EARLIER ATTENTION PULL");
  if (revisitAffinity >= 0.35) learnedSignals.push("REVISIT ESTABLISHED MATERIAL WHEN NEW MEANING EXISTS");

  return {
    confidence,
    compressionPreference,
    explanationAversion,
    callbackAffinity,
    surprisePreference,
    accelerationPreference,
    revisitAffinity,
    learnedSignals,
  };
}

export function summarizeAuthorBehaviorProfile(profile: AuthorBehaviorProfile): string[] {
  return [
    `LEARNED PROFILE CONFIDENCE=${profile.confidence}`,
    `COMPRESSION PREFERENCE=${profile.compressionPreference}`,
    `EXPLANATION AVERSION=${profile.explanationAversion}`,
    `CALLBACK AFFINITY=${profile.callbackAffinity}`,
    `SURPRISE PREFERENCE=${profile.surprisePreference}`,
    `ACCELERATION PREFERENCE=${profile.accelerationPreference}`,
    `REVISIT AFFINITY=${profile.revisitAffinity}`,
    ...profile.learnedSignals,
    "LEARNED PROFILE IS PREFERENCE ONLY; IT NEVER CHANGES SOURCE TRUTH.",
  ];
}
