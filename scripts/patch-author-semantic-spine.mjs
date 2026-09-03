import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mouthFile = path.join(root, "apps/api/src/services/authorMouth.ts");
const brainFile = path.join(root, "apps/api/src/services/authorBrainCanonical.ts");

function read(file) {
  if (!fs.existsSync(file)) throw new Error("Missing file: " + file);
  return fs.readFileSync(file, "utf8");
}
function write(file, value) {
  fs.writeFileSync(file, value.replace(/\r\n/g, "\n"), "utf8");
}
function ensureOnce(source, marker, replacement, label) {
  if (!source.includes(marker)) throw new Error("Patch anchor not found: " + label);
  return source.replace(marker, replacement);
}
function lines(items) { return items.join("\n"); }

let mouth = read(mouthFile);
let brain = read(brainFile);

const mouthHelpers = lines([
  "/** Structural detector for explanatory closure and future-information leakage. */",
  "function explanationRisk(text: string, beat?: MouthCandidateBeat): number {",
  "  const value = clean(text);",
  "  if (!value || beat?.observerExperience?.explanationForbidden !== true) return 0;",
  "  const patterns = [",
  "    /\\b(?:because|therefore|thus|hence|due to|as a result|thanks to|all thanks to)\\b/i,",
  "    /\\b(?:the reason|the cause|the point|the meaning|the secret|the ingredient)\\b/i,",
  "    /\\b(?:which made|which caused|which meant|that's how|that is how)\\b/i,",
  "  ];",
  "  return metric(patterns.reduce((sum, pattern) => sum + (pattern.test(value) ? 0.5 : 0), 0));",
  "}",
  "function semanticEventIds(beat: MouthCandidateBeat): string[] {",
  "  const semantic = beat.semanticRealization;",
  "  return semantic ? uniqueStrings([...(semantic.evidenceEventIds ?? []), ...(semantic.beforeEventIds ?? []), ...(semantic.afterEventIds ?? []), ...(semantic.callback?.eventIds ?? [])]) : [];",
  "}",
  "function semanticCarrierFit(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {",
  "  const spineIds = semanticEventIds(beat);",
  "  if (!spineIds.some((id) => (beat.eventIds ?? []).includes(id))) return 0;",
  "  const candidateWords = meaningful(text);",
  "  const direct = Math.max(...sourceLabels(beat, envelope).map((label) => overlap(candidateWords, meaningful(label))), 0);",
  "  const semantic = overlap(candidateWords, meaningful(semanticSource(beat).join(\" \")));",
  "  return metric(Math.max(direct, semantic * 0.9));",
  "}",
  "function futureEvidenceLeak(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {",
  "  const positions = (beat.eventIds ?? []).map((id) => envelope.events.findIndex((event) => event.id === id)).filter((position) => position >= 0);",
  "  if (!positions.length) return false;",
  "  const latest = Math.max(...positions);",
  "  const candidateWords = meaningful(text);",
  "  return envelope.events.slice(latest + 1).some((event) => overlap(candidateWords, meaningful(event.label)) >= 0.55);",
  "}",
  "function groupedEvidenceCoverage(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): number {",
  "  const labels = sourceLabels(beat, envelope);",
  "  if (labels.length <= 1) return labels.length ? 1 : 0;",
  "  const words = meaningful(text);",
  "  const covered = labels.filter((label) => overlap(words, meaningful(label)) >= 0.18).length / labels.length;",
  "  return metric(Math.max(covered, semanticCarrierFit(text, beat, envelope)));",
  "}",
  ""
]);

mouth = ensureOnce(
  mouth,
  "/**\n * Structural explanation detector.",
  mouthHelpers,
  "mouth helper insertion",
);

const oldAuthStart = mouth.indexOf("function semanticAuthorization(");
const oldEvalStart = mouth.indexOf("function evaluateCandidate(");
if (oldAuthStart < 0 || oldEvalStart < 0 || oldEvalStart <= oldAuthStart) throw new Error("Mouth authorization anchors are invalid");
const authBlockEnd = mouth.indexOf("\n}\n\nfunction evaluateCandidate", oldAuthStart) + 3;
if (authBlockEnd < 3) throw new Error("Mouth authorization block end not found");
const newAuth = lines([
  "function semanticAuthorization(",
  "  text: string,",
  "  beat: MouthCandidateBeat,",
  "  envelope: RealityEnvelope,",
  "): { authorized: boolean; strength: number } {",
  "  const semantic = beat.semanticRealization;",
  "  if (!semantic) return { authorized: false, strength: 0 };",
  "  const evidence = new Set(semantic.evidenceEventIds ?? []);",
  "  const eventIds = beat.eventIds ?? [];",
  "  const candidateWords = meaningful(text);",
  "  const labels = sourceLabels(beat, envelope);",
  "  const semanticWords = meaningful(semanticSource(beat).join(\" \"));",
  "  const before = meaningful(clean(semantic.before));",
  "  const after = meaningful(clean(semantic.after));",
  "  const beforeAfter = before.size > 0 && after.size > 0 && overlap(candidateWords, before) >= 0.18 && overlap(candidateWords, after) >= 0.18;",
  "  const crossEventExpression = labels.filter((label) => overlap(meaningful(label), candidateWords) >= 0.5).length >= 2;",
  "  const semanticMove = overlap(candidateWords, semanticWords) >= 0.3;",
  "  const carrier = semanticCarrierFit(text, beat, envelope) >= 0.18;",
  "  const anchorIds = uniqueStrings([...(semantic.beforeEventIds ?? []), ...(semantic.afterEventIds ?? [])]);",
  "  const positions = anchorIds.map((id) => envelope.events.findIndex((event) => event.id === id));",
  "  const bridgeEvent = anchorIds.length >= 2 && positions.every((position) => position >= 0) && eventIds.some((id) => { const p = envelope.events.findIndex((event) => event.id === id); return p > Math.min(...positions) && p < Math.max(...positions); });",
  "  const bridgeGrounded = bridgeEvent && labels.some((label) => overlap(candidateWords, meaningful(label)) >= 0.18);",
  "  const bridgeApproved = bridgeEvent && [...evidence].every((id) => anchorIds.includes(id));",
  "  const bridge = Boolean(bridgeApproved && bridgeGrounded);",
  "  if (!(beforeAfter || crossEventExpression || semanticMove || bridge || carrier)) return { authorized: false, strength: 0 };",
  "  return { authorized: true, strength: metric((beforeAfter ? 0.38 : 0) + (crossEventExpression ? 0.22 : 0) + (semanticMove ? 0.2 : 0) + (bridge ? 0.12 : 0) + (carrier ? 0.2 : 0)) };",
  "}"
]);
mouth = mouth.slice(0, oldAuthStart) + newAuth + mouth.slice(authBlockEnd);

const evalStart = mouth.indexOf("function evaluateCandidate(");
const evalEnd = mouth.indexOf("\n}\n\nfunction buildSystemPrompt", evalStart) + 3;
if (evalStart < 0 || evalEnd < 3) throw new Error("Mouth evaluation block not found");
const newEval = lines([
  "function evaluateCandidate(",
  "  text: string,",
  "  beat: MouthCandidateBeat,",
  "  envelope: RealityEnvelope,",
  "  priorTexts: readonly string[],",
  "): MouthCandidate {",
  "  const value = clean(text);",
  "  const labels = sourceLabels(beat, envelope);",
  "  const literal = exactSource(value, labels);",
  "  const whole = worldSource(envelope).join(\" \" );",
  "  const grounding = metric(overlap(meaningful(value), meaningful(labels.join(\" \"))) * 0.75 + overlap(meaningful(value), meaningful(whole)) * 0.25);",
  "  const semantic = semanticAuthorization(value, beat, envelope);",
  "  const invention = metric(concreteRisk(value, whole));",
  "  const novelty = priorTexts.length ? metric(1 - Math.max(...priorTexts.map((prior) => overlap(meaningful(value), meaningful(prior))), 0)) : 1;",
  "  const humanSized = wordCount(value) >= 2 && wordCount(value) <= 16;",
  "  const groupedCoverage = groupedEvidenceCoverage(value, beat, envelope);",
  "  const explanation = explanationRisk(value, beat);",
  "  const futureLeak = futureEvidenceLeak(value, beat, envelope);",
  "  const semanticEligible = semantic.authorized && !futureLeak && explanation === 0;",
  "  const discoveryPreserved = semanticEligible;",
  "  const score = literal",
  "    ? metric(0.58 + grounding * 0.1 + groupedCoverage * (labels.length > 1 ? 0.08 : 0.02) + novelty * 0.06 + (discoveryPreserved ? 0.04 : 0) - explanation * 0.25)",
  "    : metric(semanticEligible ? semantic.strength * 0.32 + groupedCoverage * 0.14 + grounding * 0.08 + novelty * 0.05 + (humanSized ? 0.07 : 0) + 0.2 + (discoveryPreserved ? 0.14 : 0) - explanation * 0.5 : 0);",
  "  const reasons: string[] = [];",
  "  if (literal) reasons.push(\"literal-source-restatement\");",
  "  if (grounding >= 0.24) reasons.push(\"event-grounded\");",
  "  if (semanticEligible) reasons.push(\"approved-semantic-realization\");",
  "  if (semanticEligible && !literal) reasons.push(\"implied-semantic-realization\");",
  "  else if (!literal && !semanticEligible) reasons.push(\"candidate-does-not-express-approved-meaning\");",
  "  if ((beat.eventIds ?? []).length > 1 && groupedCoverage >= 0.5) reasons.push(\"cross-event-expression\");",
  "  if (groupedCoverage >= 0.999) reasons.push(\"grouped-evidence-complete\");",
  "  if (semanticCarrierFit(value, beat, envelope) >= 0.35) reasons.push(\"semantic-carrier-realization\");",
  "  if (discoveryPreserved) reasons.push(\"discovery-preserving\");",
  "  if (explanation > 0) reasons.push(\"explicit-explanation-risk\");",
  "  if (futureLeak) reasons.push(\"future-evidence-leak\");",
  "  if (humanSized) reasons.push(\"human-sized-cut\");",
  "  if (invention >= 0.9) reasons.push(\"unsupported-concrete-risk\");",
  "  return { text: value, beatOrder: beat.order, supportedEventIds: grounding >= 0.18 && invention < 0.9 && !futureLeak && (labels.length <= 1 || groupedCoverage >= 0.5) ? [...(beat.eventIds ?? [])] : [], supportedRelationPairs: (beat.relationKinds ?? []).map(String).filter(Boolean), groundingScore: grounding, meaningScore: semanticEligible ? semantic.strength : literal ? 0.45 : 0, observerDiscoveryScore: semanticEligible ? Math.max(semantic.strength, 0.4) : literal ? 0.12 : 0, transitionScore: metric(Number(beat.viewerState?.stateShift) || 0.4), obligationCoverage: metric(literal ? (labels.length <= 1 ? 1 : 0.5 + groupedCoverage * 0.4) : semanticEligible ? 0.72 + groupedCoverage * 0.28 : 0), relationContractScore: metric((beat.relationKinds ?? []).length ? 0.85 : 0.35), forbiddenMoveRisk: metric(Math.max(invention, explanation)), cohesionScore: metric(0.5 + (semanticEligible ? semantic.strength * 0.3 : 0) + grounding * 0.08 + groupedCoverage * 0.12 - explanation * 0.1), noveltyScore: novelty, compressionScore: humanSized ? 0.95 : 0.65, inventionRisk: metric(Math.max(invention, futureLeak ? 0.95 : 0)), repetitionRisk: 1 - novelty, collageRisk: groupedCoverage < 0.5 && labels.length > 1 ? 0.8 : 0, endpointExactness: literal ? 1 : 0, score, reasons };",
  "}"
]);
mouth = mouth.slice(0, evalStart) + newEval + mouth.slice(evalEnd);

const authStart = mouth.indexOf("export function isAuthorizedMouthCandidate");
const authEnd = mouth.indexOf("\n}\n\nfunction lexicalNovelty", authStart) + 3;
if (authStart < 0 || authEnd < 3) throw new Error("Mouth authorization export not found");
mouth = mouth.slice(0, authStart) + lines([
  "export function isAuthorizedMouthCandidate(candidate: MouthCandidate): boolean {",
  "  if (!clean(candidate.text)) return false;",
  "  if (candidate.inventionRisk >= 0.9 || candidate.forbiddenMoveRisk >= 0.9) return false;",
  "  if (candidate.reasons.includes(\"future-evidence-leak\")) return false;",
  "  if (candidate.reasons.includes(\"explicit-explanation-risk\")) return false;",
  "  if (candidate.endpointExactness >= 0.999) return true;",
  "  return candidate.reasons.includes(\"approved-semantic-realization\");",
  "}"
]) + mouth.slice(authEnd);

write(mouthFile, mouth);
write(brainFile, brain);
console.log("AUTHOR SEMANTIC SPINE PATCH GREEN");
console.log("  authorMouth.ts: carrier + discovery-preserving authorization");
console.log("  authorBrainCanonical.ts: unchanged by this safe runner; run composition patch separately after syntax validation");
