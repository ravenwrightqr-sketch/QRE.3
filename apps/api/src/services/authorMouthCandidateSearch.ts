/**
 * STATUS: CANONICAL
 * ROLE: Ask the model for viewer-facing wording for already-approved beats.
 *
 * CORE LAW:
 *
 * Reality is immutable. Expression is not.
 *
 * Mouth may compress, sharpen, reframe, surprise, imply, metaphorize,
 * contradict, fragment, or otherwise find stronger human expression of
 * already-approved material.
 *
 * The evaluator protects unsupported concrete reality directly.
 *
 * Candidate diversity is a search-space law, not a style template.
 */

import type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
  ViewerStateCut,
} from "@qre/contracts";

import type { RealityEnvelope } from "./authorRealityEnvelope.js";

import {
  evaluateMouthInterpretation,
} from "./authorMouthInterpretation.js";

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

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const unique = (
  values: readonly unknown[],
): string[] =>
  [...new Set(
    values
      .map(clean)
      .filter(Boolean),
  )];

const META =
  /\b(?:qre|compiler|cognition|meaning spine|beat graph|information frontier|planner|planning|operator mix|viewer sees|audience sees|writing process)\b/i;

const INTERNAL_RENDER_RESIDUE =
  /\b(?:occurred\s*:\s*(?:occurred\s*:\s*)+|future\s*:\s*[a-z0-9_-]+|retired\s+future|author\s+chapter|tempo\s*:\s*\w+|changed\s*:\s*(?:event[-_:])?[a-z0-9_-]+|reality\s+anchors?\s*:|show\s+me\s+another\s+moment\s+from\s+(?:this|the)\s+asset(?:'s)?\s+world|let\s+the\s+significance\s+emerge|canonical\s+(?:semantic|relation|before|after|payoff|cognitive)|observer\s+(?:experience|objective|surprise|curiosity|attention|landing)\s*:|memory\s+projection|state\s+persistence)\b/i;

const GENERIC =
  /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|new chapter)\b/i;

const BAD_INTERPRETIVE_EXPLANATION =
  /\b(?:the viewer|this reveals|this means|which means|in this context|is now transformed into|was a cover for|reveals? that|symbolizes?|represents?|the mystery|what does .* mean|why does .* mean|the final revelation|the punchline here)\b/i;

const PLANNING_RESIDUE =
  /\b(?:perform the approved semantic change|maintain forward movement|anchor the realization|allow later supplied evidence|preserve the source-derived endpoint|terminate on the supplied endpoint|do not merely restate|what relationship deserves|what becomes connected|what does this relationship make newly meaningful|what is now true at the supplied ending|the supplied endpoint lands|establish supplied evidence)\b/i;

const PHYSICAL_INVENTION =
  /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|hides?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|enters?|approaches?|leaves?|returns?|turns?|steps?|swipes?|swiped|grips?|grabbed|throws?|threw|pulls?|pulled|pushes?|pushed|kicks?|kicked|touches?|touched|holds?|held|carries?|carried|opens?|opened|closes?|closed|drifts?|drifted|vanishes?|vanished)\b/i;

const INTERNAL_VIEWER_LANGUAGE =
  /\b(?:uncommitted|oriented|settled|disrupted|curious|pressurized|certain|reframed|engaged|breathing|expectant|resolved)\b/i;

const ABSTRACT_NOUNISH =
  /\b(?:warmth|connection|recognition|loosening|ease|momentum|lightness|relief|anticipation|possibility|opening|silence|current|pull|tension|distance|gravity|comfort|energy|rhythm|feeling|shift|bloom|flow|stillness|space|pressure|weight|closeness|uncertainty|quiet|heat|cold|spark|drift|rush|calm)\b/i;

const LOW_INFORMATION_PHRASE =
  /^(?:something(?:\s+\w+){0,3}|it was something|a moment|the moment|a feeling|the feeling|something changed|something shifted|everything changed)\.?$/i;

const CONTRAST_LANGUAGE =
  /\b(?:but|yet|still|almost|only|except|instead|rather|never|not|no|nothing|everything|suddenly|until|before|after|then)\b/i;

const CONCRETE_DETAIL_MARKER =
  /\b(?:footsteps?|room|rooms|street|streets|door|doors|window|windows|table|tables|chair|chairs|floor|floors|wall|walls|ceiling|bed|beds|car|cars|truck|trucks|road|roads|sidewalk|sidewalks|house|houses|building|buildings|garden|gardens|yard|yards|sky|cloud|clouds|rain|snow|sunlight|moonlight|lamp|lamps|lighting|lights|music|song|songs|voice|voices|skin|hand|hands|finger|fingers|eyes|eye|face|faces|hair|clothes|shirt|dress|phone|phones|coffee|cup|cups|glass|glasses|food|drink)\b/i;

const IDENTITY_DETAIL_MARKER =
  /\b(?:he|him|his|she|her|hers|the man|the woman|the boy|the girl|the guy|the lady|girlfriend|boyfriend|wife|husband|mother|father|daughter|son|sister|brother|partner)\b/i;

const normalizeToken = (
  token: string,
): string => {
  const lower = token.toLowerCase();
  if (lower.length > 6 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 5 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
};

const tokenSet = (
  text: string,
): Set<string> =>
  new Set(
    clean(text)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((token) => token.length >= 3)
      .map(normalizeToken),
  );

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, a.size);
}

function metric(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function phraseSupportedText(candidateText: string, label: string): boolean {
  const phrase = clean(label).toLowerCase();
  const candidate = clean(candidateText).toLowerCase();
  if (!phrase || !candidate) return false;
  return candidate.includes(phrase) || overlap(tokenSet(candidate), tokenSet(phrase)) >= 0.5;
}

function eventLabel(envelope: RealityEnvelope, id: string): string {
  return clean(envelope.events.find((event) => event.id === id)?.label);
}

function identityEvidenceText(envelope: RealityEnvelope): string {
  return [
    envelope.subject,
    ...envelope.suppliedEntities,
    ...envelope.events.map((event) => event.label),
  ].map(clean).filter(Boolean).join(" ");
}

function sourceForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): string[] {
  return unique([
    ...(beat.eventIds ?? []).map((id) => eventLabel(envelope, id)),
    ...((beat.relationKinds ?? []).map(String)),
  ]);
}

function supportedEventsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope) {
  const ids = new Set(beat.eventIds ?? []);
  return envelope.events.filter((event) => ids.has(event.id));
}

function relationPairsForBeat(beat: MouthCandidateBeat, envelope: RealityEnvelope): Array<[string, string]> {
  const wanted = new Set(beat.eventIds ?? []);
  return envelope.relations
    .filter((relation) => wanted.has(relation.fromEventId) || wanted.has(relation.toEventId))
    .map((relation) => [relation.fromEventId, relation.toEventId]);
}

function endpointExactForBeat(value: string, beat: MouthCandidateBeat, envelope: RealityEnvelope): boolean {
  return sourceForBeat(beat, envelope).some((label) => clean(value).toLowerCase() === clean(label).toLowerCase());
}

function hasSupportedIdentityLanguage(value: string, envelope: RealityEnvelope): boolean {
  const text = clean(value);
  if (!IDENTITY_DETAIL_MARKER.test(text)) return true;
  return overlap(tokenSet(text), tokenSet(identityEvidenceText(envelope))) >= 0.2;
}

function introducesUnsupportedConcreteDetail(value: string, wholeSourceText: string): boolean {
  const text = clean(value);
  if (!text || !CONCRETE_DETAIL_MARKER.test(text)) return false;
  const abstractOnly = ABSTRACT_NOUNISH.test(text) && !/\b(?:the|a|an|my|your|our|their|his|her|this|that)\s+\w+/i.test(text);
  if (abstractOnly) return false;
  const sourceTokens = tokenSet(wholeSourceText);
  const matchedConcreteToken = text.toLowerCase().match(CONCRETE_DETAIL_MARKER)?.[0];
  if (!matchedConcreteToken) return false;
  return !sourceTokens.has(normalizeToken(matchedConcreteToken));
}

export function deriveViewerStateCut(
  beat: MouthCandidateBeat,
  index: number,
  beats: readonly MouthCandidateBeat[],
  envelope: RealityEnvelope,
): ViewerStateCut {
  const currentIds = unique(beat.eventIds ?? []);
  const priorBeats = beats.slice(0, index);
  const priorIds = new Set(priorBeats.flatMap((item) => item.eventIds ?? []));
  const newEventCount = currentIds.filter((id) => !priorIds.has(id)).length;
  const newEventRatio = currentIds.length ? metric(newEventCount / currentIds.length) : 0;
  const currentSource = sourceForBeat(beat, envelope).join(" ");
  const priorSource = priorBeats.flatMap((item) => sourceForBeat(item, envelope)).join(" ");
  const cleanSemanticText = (value: string): string => clean(value)
    .replace(/\b(?:establish|another|the supplied sequence|make this supplied material|this supplied sequence)\b[^:]{0,80}:\s*/gi, "")
    .replace(/\b(?:canonical semantic thesis|canonical semantic turn|canonical relation|canonical before|canonical after|canonical payoff dependency)\b[^.]*\.?\s*/gi, "")
    .trim();
  const currentChange = cleanSemanticText(clean(beat.change));
  const usableCurrentMeaning = currentChange || currentSource || "new material";
  const priorMeanings = priorBeats.map((item) => cleanSemanticText(clean(item.change)) || sourceForBeat(item, envelope).join(" ")).filter(Boolean);
  const priorMeaning = priorMeanings.length ? priorMeanings[priorMeanings.length - 1] : "";
  const continuity = priorSource && currentSource ? metric(overlap(tokenSet(currentSource), tokenSet(priorSource))) : 0;
  const relationPresence = Boolean(beat.relationKinds?.length);
  const semanticDifference = priorMeaning && usableCurrentMeaning ? metric(1 - overlap(tokenSet(usableCurrentMeaning), tokenSet(priorMeaning))) : index === 0 ? 0.55 : 0.35;
  const informationTurn = metric(newEventRatio * 0.42 + semanticDifference * 0.33 + (relationPresence ? 0.15 : 0) + (continuity < 0.35 ? 0.10 : 0));
  const contrast = metric(informationTurn * 0.58 + (continuity < 0.45 ? 0.22 : 0) + (relationPresence ? 0.20 : 0));
  const interruption = metric(informationTurn * 0.46 + contrast * 0.31 + (index === 0 ? 0.08 : 0) + (continuity < 0.3 ? 0.15 : 0));
  const futurePressure = clean(beat.next || beat.frontier || "");
  const curiosityPressure = metric((beat.paysOff?.length ? 0.10 : index >= beats.length - 1 ? 0.18 : 0.42) + (futurePressure ? 0.28 : 0) + informationTurn * 0.20 + (relationPresence ? 0.12 : 0));
  const payoffPressure = metric(beat.paysOff?.length ? 1 : index === beats.length - 2 ? 0.82 : Math.min(0.68, 0.22 + index * 0.09));
  const stateShift = metric(informationTurn * 0.32 + contrast * 0.20 + interruption * 0.16 + curiosityPressure * 0.12 + semanticDifference * 0.10 + (relationPresence ? 0.10 : 0));
  const predictionError = metric(informationTurn * 0.34 + interruption * 0.28 + contrast * 0.20 + (futurePressure ? 0.10 : 0) + (relationPresence ? 0.08 : 0));
  let attentionMove: ViewerStateCut["attentionMove"];
  if (beat.paysOff?.length) attentionMove = "land";
  else if (stateShift >= 0.76 && relationPresence) attentionMove = "recontextualize";
  else if (interruption >= 0.76) attentionMove = "interrupt";
  else if (contrast >= 0.70) attentionMove = "recontextualize";
  else if (curiosityPressure >= 0.78) attentionMove = "tighten";
  else if (stateShift >= 0.60) attentionMove = "escalate";
  else attentionMove = "release";
  const beforeState = index === 0 ? "The encounter is newly present." : priorMeaning ? `What was already established: ${priorMeaning}.` : "The established meaning continues.";
  const afterState = relationPresence ? `The meaning now includes ${usableCurrentMeaning}. A meaningful relation is active.` : `The meaning now includes ${usableCurrentMeaning}.`;
  return { beforeState, afterState, attentionMove, curiosityPressure, contrast, interruption, accumulation: metric(continuity * 0.52 + (1 - newEventRatio) * 0.22 + (relationPresence ? 0.16 : 0) + informationTurn * 0.10), tempo: metric(0.34 + interruption * 0.34 + stateShift * 0.32), payoffPressure, stateShift, predictionError, evidenceEventIds: currentIds };
}

function rhetoricalForm(value: string): string {
  const text = clean(value);
  if (/[?]$/.test(text)) return "question";
  if (/^(?:a|an|the)\b/i.test(text)) return "article-fragment";
  if (text.split(/\s+/).filter(Boolean).length === 1) return "single-word";
  if (/^(?:almost|still|suddenly|finally|then|and then|just)\b/i.test(text)) return "adverb-led";
  if (/^(?:felt|feel|feels|kept|keep|continued|continue|found|noticed|remember|forgot|forgotten|stayed|stay|remain|remains|became|becomes|was|were|is|it's|it was)\b/i.test(text)) return "verb-led";
  if (CONTRAST_LANGUAGE.test(text)) return "contrastive";
  return "free";
}

function realizationMode(value: string): string {
  const text = clean(value);
  const words = text.split(/\s+/).filter(Boolean).length;
  const form = rhetoricalForm(text);
  if (LOW_INFORMATION_PHRASE.test(text)) return "generic-abstract";
  if (PHYSICAL_INVENTION.test(text)) return "physical-action";
  if (form === "single-word") return "compressed-hit";
  if (form === "question") return "question";
  if (CONTRAST_LANGUAGE.test(text)) return "contrast";
  if (ABSTRACT_NOUNISH.test(text) && words <= 5) return "experiential-nominal";
  if (form === "verb-led") return "experiential-verb";
  if (form === "article-fragment") return "compressed-fragment";
  if (words <= 5) return "compressed-expression";
  return "sentence-expression";
}

function genericAbstractionRisk(value: string): number {
  const text = clean(value);
  if (!text) return 1;
  if (LOW_INFORMATION_PHRASE.test(text)) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  const abstractWords = text.match(/\b(?:something|everything|feeling|moment|connection|warmth|ease|recognition|lightness|relief|possibility|shift|opening|momentum|flow|current|pull|tension|silence)\b/gi)?.length ?? 0;
  const concreteWords = text.match(/\b(?:conversation|talking|words|walk|house|wedding|music|laugh|voice|name|dog|cat|home|door|car|business|work|friend|family)\b/gi)?.length ?? 0;
  return metric((abstractWords / Math.max(1, words)) * 0.65 + (concreteWords === 0 ? 0.25 : 0) + (words <= 2 ? 0.1 : 0));
}

function candidateDiversityValue(value: string): number {
  const form = rhetoricalForm(value);
  const mode = realizationMode(value);
  const formValue: Record<string, number> = { question: 1, contrastive: 0.96, "single-word": 0.94, "verb-led": 0.9, "adverb-led": 0.84, "article-fragment": 0.62, free: 0.74 };
  const modeValue: Record<string, number> = { "compressed-hit": 1, question: 0.96, contrast: 0.98, "experiential-verb": 0.92, "experiential-nominal": 0.68, "compressed-expression": 0.82, "compressed-fragment": 0.74, "sentence-expression": 0.76, "generic-abstract": 0.18, "physical-action": 0.08 };
  return metric((formValue[form] ?? 0.7) * 0.42 + (modeValue[mode] ?? 0.7) * 0.58 - genericAbstractionRisk(value) * 0.2);
}

function semanticContrastPotential(value: string, sourceText: string, wholeSourceText: string): number {
  const text = clean(value); if (!text) return 0;
  const current = tokenSet(text); const source = tokenSet(sourceText); const whole = tokenSet(wholeSourceText);
  const localAnchor = overlap(current, source); const worldAnchor = overlap(current, whole);
  const contradiction = CONTRAST_LANGUAGE.test(text); const experiential = ABSTRACT_NOUNISH.test(text);
  const relational = /\b(?:close|closer|distance|between|toward|towards|with|together|apart|us|me|you|them)\b/i.test(text);
  const tension = /\b(?:tension|pressure|edge|danger|uneasy|wrong|strange|sharp|heavy|quiet|silence)\b/i.test(text);
  const warmth = /\b(?:warm|warmth|ease|soft|soften|light|close|comfort|gentle|easy)\b/i.test(text);
  return metric(localAnchor * 0.4 + worldAnchor * 0.25 + (contradiction ? 0.15 : 0) + (experiential ? 0.08 : 0) + (relational ? 0.06 : 0) + (tension || warmth ? 0.06 : 0));
}

function semanticContrastLabel(value: string): string {
  const text = clean(value);
  if (/\b(?:but|yet|instead|rather|never|not|no|nothing)\b/i.test(text)) return "reversal";
  if (/\b(?:danger|uneasy|wrong|strange|tension|edge|heavy)\b/i.test(text)) return "tension";
  if (/\b(?:warm|warmth|ease|soft|soften|light|comfort|gentle)\b/i.test(text)) return "warmth";
  if (/\b(?:close|closer|between|toward|towards|together)\b/i.test(text)) return "connection";
  if (/\b(?:distance|apart|space|silence|away)\b/i.test(text)) return "distance";
  if (/\b(?:recognized|recognition|noticed|remember)\b/i.test(text)) return "recognition";
  if (rhetoricalForm(text) === "single-word") return "compressed-hit";
  if (rhetoricalForm(text) === "question") return "question";
  if (rhetoricalForm(text) === "verb-led") return "movement";
  return "neutral";
}

function evaluateCandidate(text: string, beat: MouthCandidateBeat, envelope: RealityEnvelope, priorTexts: readonly string[] = []): MouthCandidate {
  const value = clean(text);
  const sourceLabels = sourceForBeat(beat, envelope);
  const sourceText = sourceLabels.join(" ");
  const wholeSourceText = [envelope.subject, ...envelope.events.map((event) => event.label), ...envelope.suppliedPhrases, ...envelope.suppliedEntities, ...envelope.suppliedActions, ...envelope.suppliedStates, ...envelope.recurringSignals, ...envelope.sensorySignals, ...envelope.unresolvedTensions].join(" ");
  const currentTokens = tokenSet(value);
  const sourceTokens = tokenSet(sourceText);
  const wholeSourceTokens = tokenSet(wholeSourceText);
  const groundingScore = metric(overlap(currentTokens, sourceTokens));
  const wholeSourceAnchor = metric(overlap(currentTokens, wholeSourceTokens));
  const supportedEvents = supportedEventsForBeat(beat, envelope);
  const supportedEventIds = supportedEvents.filter((event) => phraseSupportedText(value, event.label) || overlap(currentTokens, tokenSet(event.label)) >= 0.25).map((event) => event.id);
  const supportedRelationPairs = relationPairsForBeat(beat, envelope);
  const endpointExactness = endpointExactForBeat(value, beat, envelope) ? 1 : 0;
  const semanticBeat = Boolean(beat.relationKinds?.length || beat.attentionFunction || beat.role);
  const interpretation = evaluateMouthInterpretation({ text: value, sourceLabels, envelope, beat });
  const reasons: string[] = [];
  const repetitionSet = new Set(priorTexts.flatMap((item) => [...tokenSet(item)]));
  const repetitionRisk = priorTexts.length ? metric(overlap(currentTokens, repetitionSet)) : 0;
  const noveltyScore = metric(1 - Math.min(1, repetitionRisk * 1.25));
  const wordCount = value.split(/\s+/).filter(Boolean).length;
  const compressionScore = wordCount <= 4 ? 1 : wordCount <= 8 ? 0.98 : wordCount <= 12 ? 0.94 : wordCount <= 20 ? 0.88 : wordCount <= 30 ? 0.76 : wordCount <= 40 ? 0.62 : 0.48;
  const viewerState = beat.viewerState ?? deriveViewerStateCut(beat, 0, [beat], envelope);
  const internalViewerStateLeak = matchesInternalViewerState(value, viewerState);
  const unsupportedIdentityLanguage = !hasSupportedIdentityLanguage(value, envelope);
  const beatCoverage = sourceLabels.length ? metric(overlap(currentTokens, sourceTokens)) : 0;
  const beatHasConcreteEvidence = Boolean(beat.eventIds?.length);
  const approvedSemanticRealization = interpretation.accepted && interpretation.unsupportedConcreteRisk === 0 && semanticBeat && (interpretation.creativeFraming >= 0.38 || interpretation.reasons.includes("semantic-compression") || interpretation.reasons.includes("grounded-creative-interpretation"));
  const concreteDetailRisk = introducesUnsupportedConcreteDetail(value, wholeSourceText) ? 1 : 0;
  const unsupportedConcreteRisk = Math.max(interpretation.unsupportedConcreteRisk, unsupportedIdentityLanguage ? 1 : 0, concreteDetailRisk);
  const forbiddenMoveRisk = metric(unsupportedConcreteRisk);
  const beatObligation = beatHasConcreteEvidence ? metric(beatCoverage * 0.62 + (supportedEventIds.length ? 0.18 : 0) + (approvedSemanticRealization ? 0.20 : 0)) : metric(wholeSourceAnchor * 0.35 + (interpretation.creativeFraming ?? 0.5) * 0.65);
  const associativeLift = metric(Math.min(1, wholeSourceAnchor * 0.55 + (interpretation.creativeFraming ?? 0.5) * 0.45));
  const contrastPotential = semanticContrastPotential(value, sourceText, wholeSourceText);
  const meaningScore = metric((viewerState.stateShift ?? 0.5) * 0.19 + (viewerState.curiosityPressure ?? 0.5) * 0.14 + (viewerState.contrast ?? 0.5) * 0.13 + (interpretation.creativeFraming ?? 0.5) * 0.18 + beatObligation * 0.18 + (semanticBeat ? 0.08 : 0) + contrastPotential * 0.10);
  const transitionScore = metric((viewerState.predictionError ?? 0.4) * 0.48 + (viewerState.interruption ?? 0.4) * 0.27 + (viewerState.accumulation ?? 0.5) * 0.25);
  const obligationCoverage = metric(beatObligation * 0.78 + (supportedEventIds.length ? Math.min(0.22, supportedEventIds.length * 0.11) : 0));
  const relationContractScore = metric(supportedRelationPairs.length ? 0.8 : semanticBeat ? 0.35 : 0.2);
  const creativeLane = interpretation.accepted && literalRestatementFor(value, sourceLabels) === 0 && forbiddenMoveRisk < 0.9 && !internalViewerStateLeak && (beatCoverage >= 0.12 || endpointExactness === 1 || approvedSemanticRealization || (!beatHasConcreteEvidence && wholeSourceAnchor >= 0.2));
  const effectiveGrounding = metric(Math.max(groundingScore, creativeLane ? Math.min(0.72, beatObligation * 0.62 + associativeLift * 0.18 + (approvedSemanticRealization ? 0.18 : 0)) : 0));
  const cohesionScore = metric(0.55 + (1 - repetitionRisk) * 0.25 + effectiveGrounding * 0.2);
  const inventionRisk = forbiddenMoveRisk > 0.35 ? Math.max(0.72, forbiddenMoveRisk) : metric(Math.max(0, 0.22 - effectiveGrounding * 0.18));
  const collageRisk = value.split(/[.!?]+/).filter(Boolean).length > 2 && wordCount > 22 ? 0.35 : 0;
  const startsWithArticle = /^(?:a|an|the)\b/i.test(value);
  const singleWord = wordCount === 1;
  const questionForm = /[?]$/.test(value);
  const contrastiveForm = CONTRAST_LANGUAGE.test(value) && /[.!?]$/.test(value);
  const experientialForm = startsWithArticle ? "article-fragment" : singleWord ? "single-word" : questionForm ? "question" : contrastiveForm ? "contrastive" : rhetoricalForm(value);
  const recentForms = priorTexts.slice(-2).map(rhetoricalForm);
  const repeatedFormCount = recentForms.filter((form) => form === experientialForm).length;
  const articleRepetitionCount = recentForms.filter((form) => form === "article-fragment").length;
  const articleRepetitionPenalty = startsWithArticle ? articleRepetitionCount * 0.05 : 0;
  const formDiversityPenalty = repeatedFormCount * 0.08;
  const candidateDiversity = candidateDiversityValue(value);
  const genericRisk = genericAbstractionRisk(value);
  const distinctiveRealization = metric((interpretation.creativeFraming ?? 0) * 0.25 + meaningScore * 0.18 + transitionScore * 0.13 + noveltyScore * 0.12 + compressionScore * 0.09 + candidateDiversity * 0.10 + contrastPotential * 0.13);
  const experientialRealization = interpretation.accepted && (supportedEventIds.length > 0 || approvedSemanticRealization) && endpointExactness === 0 && literalRestatementFor(value, sourceLabels) === 0 && unsupportedConcreteRisk === 0 && (interpretation.reasons.includes("semantic-compression") || interpretation.reasons.includes("grounded-creative-interpretation") || interpretation.creativeFraming >= 0.38 || approvedSemanticRealization) && !internalViewerStateLeak;
  const experientialStrength = experientialRealization ? metric(interpretation.creativeFraming * 0.30 + distinctiveRealization * 0.21 + compressionScore * 0.14 + transitionScore * 0.10 + candidateDiversity * 0.11 + contrastPotential * 0.14) : 0;
  const semanticSpecificity = metric(meaningScore * 0.26 + transitionScore * 0.16 + (1 - genericRisk) * 0.20 + noveltyScore * 0.11 + candidateDiversity * 0.10 + contrastPotential * 0.17);
  const abstractionPenalty = genericRisk >= 0.8 ? 0.14 : genericRisk >= 0.6 ? 0.08 : genericRisk >= 0.4 ? 0.04 : 0;
  const experientialFormNovelty = experientialRealization ? metric(repeatedFormCount === 0 ? 1 : repeatedFormCount === 1 ? 0.55 : 0.2) : 0;
  if (!value) reasons.push("missing-text");
  if (META.test(value)) reasons.push("meta-language");
  if (INTERNAL_RENDER_RESIDUE.test(value)) reasons.push("internal-render-residue");
  if (unsupportedIdentityLanguage) reasons.push("unsupported-identity-language");
  if (internalViewerStateLeak) reasons.push("internal-viewer-state-language");
  if (GENERIC.test(value)) reasons.push("generic-summary");
  if (LOW_INFORMATION_PHRASE.test(value)) reasons.push("low-information-abstraction");
  if (PLANNING_RESIDUE.test(value)) reasons.push("planning-residue");
  if (BAD_INTERPRETIVE_EXPLANATION.test(value)) reasons.push("interpretive-explanation");
  if (wordCount > 24) reasons.push("too-long");
  if (!sourceLabels.length) reasons.push("missing-grounding");
  if (beatHasConcreteEvidence && beatObligation < 0.16 && !endpointExactness && !creativeLane) reasons.push("weak-beat-obligation");
  if (effectiveGrounding < 0.08 && !endpointExactness && !creativeLane) reasons.push("weak-grounding");
  if (repetitionRisk > 0.75) reasons.push("repetition");
  if (forbiddenMoveRisk >= 0.9) reasons.push("invention-risk");
  if (concreteDetailRisk > 0) reasons.push("unsupported-concrete-detail");
  if (supportedEventIds.length) reasons.push("event-grounded");
  if (supportedRelationPairs.length) reasons.push("relation-grounded");
  if (beatObligation >= 0.45) reasons.push("beat-grounded");
  if (approvedSemanticRealization) reasons.push("approved-semantic-realization");
  if (creativeLane) reasons.push("bounded-creative-bet", "semantic-turn-grounded");
  else if (semanticBeat && beatObligation >= 0.16 && effectiveGrounding >= 0.16) reasons.push("semantic-turn-grounded");
  if (experientialRealization) reasons.push("experiential-realization");
  if (interpretation.accepted && distinctiveRealization >= 0.68 && (interpretation.reasons.includes("semantic-compression") || creativeLane || approvedSemanticRealization)) reasons.push("distinctive-realization");
  if (contrastPotential >= 0.55) reasons.push("semantic-contrast");
  const contrastLabel = semanticContrastLabel(value); if (contrastLabel !== "neutral") reasons.push(`contrast:${contrastLabel}`);
  const score = metric(effectiveGrounding * 0.12 + beatObligation * 0.13 + meaningScore * 0.15 + transitionScore * 0.11 + obligationCoverage * 0.08 + relationContractScore * 0.04 + cohesionScore * 0.05 + noveltyScore * 0.06 + compressionScore * 0.05 + (1 - inventionRisk) * 0.08 + (creativeLane ? 0.06 : 0) + distinctiveRealization * 0.05 + experientialStrength * 0.06 + semanticSpecificity * 0.08 + experientialFormNovelty * 0.02 + candidateDiversity * 0.03 + contrastPotential * 0.05 - articleRepetitionPenalty - formDiversityPenalty * 0.5 - abstractionPenalty - collageRisk * 0.025);
  return { text: value, beatOrder: beat.order, supportedEventIds, supportedRelationPairs, groundingScore: effectiveGrounding, meaningScore, observerDiscoveryScore: 0, transitionScore, obligationCoverage, relationContractScore, forbiddenMoveRisk, cohesionScore, noveltyScore, compressionScore, inventionRisk, repetitionRisk, collageRisk, endpointExactness, score, reasons };
}

function literalRestatementFor(value: string, labels: readonly string[]): number {
  const normalized = clean(value).replace(/[.!?]+$/g, "").toLowerCase();
  return labels.some((label) => normalized === clean(label).replace(/[.!?]+$/g, "").toLowerCase()) ? 1 : 0;
}

export function scoreMouthCandidate(input: { text: string; beat: MouthCandidateBeat; envelope: RealityEnvelope; priorTexts?: readonly string[] }): MouthCandidate {
  return evaluateCandidate(input.text, input.beat, input.envelope, input.priorTexts);
}

export function buildMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const messages = input.envelope.sourceMessages ?? [];
  return messages.length ? messages : [{ role: "user", content: "" }];
}

export function parseMouthCandidateBatch(raw: string): MouthCandidateBatch | undefined {
  try { return JSON.parse(raw) as MouthCandidateBatch; } catch { return undefined; }
}

export function selectMouthCandidatePool(input: { beat: MouthCandidateBeat; candidates: readonly MouthCandidate[] }): MouthCandidateSelection {
  const authorized = input.candidates.filter((candidate) =>
    candidate.inventionRisk < 0.35 &&
    candidate.forbiddenMoveRisk < 0.35 &&
    candidate.reasons.every((reason) => reason !== "internal-render-residue" && reason !== "meta-language" && reason !== "planning-residue" && reason !== "interpretive-explanation"),
  );
  const selected = [...authorized].sort((a, b) => b.score - a.score)[0];
  return selected ? { candidate: selected, candidates: authorized } : { candidate: undefined, candidates: [] };
}
