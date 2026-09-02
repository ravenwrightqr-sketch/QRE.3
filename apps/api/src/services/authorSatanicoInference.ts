import type {
  LatentMovieCandidate,
  ObserverExperienceObjective,
  RealityGraph,
} from "@qre/contracts";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
const unique = (values: readonly string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

const PREFERENCE = /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i;
const CONTRAST = /\b(?:but|yet|although|instead|rather|except|while|however|still|despite)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const EXPECTATION = /\b(?:didn'?t|did not|never)\s+(?:expect|plan|think|assume)|\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|unlike\s+expected)\b/i;
const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable|hesitant|uncertain)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|beautiful|handsome|joyful)\b/i;
const FIRST = /\b(?:first|initial|began|started|opening|origin|once|one|early)\b/i;
const SUCCESS = /\b(?:best[- ]seller|best seller|popular|success|took off|sold out|hit|favorite|favourite|biggest|most|grew|growth)\b/i;

function event(graph: RealityGraph, id: string) { return graph.events.find((item) => item.id === id); }
function labelFor(graph: RealityGraph, id: string): string { return clean(event(graph, id)?.label); }
function structureFor(graph: RealityGraph, id: string) { return graph.eventStructure?.find((item) => item.eventId === id); }

function subjectName(graph: RealityGraph): string {
  return clean([...(graph.entityContinuity ?? [])].sort((a, b) => b.salienceScore - a.salienceScore)[0]?.name);
}

function orderedIds(candidate: LatentMovieCandidate): string[] { return unique(candidate.trajectory.flatMap((step) => step.eventIds)); }
function subjectMention(label: string, subject: string): boolean { return Boolean(subject) && label.toLowerCase().includes(subject.toLowerCase()); }

function tokenSet(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().replace(/[^a-z0-9'’-]+/g, " ").split(/\s+/).filter((token) => token.length >= 3));
}

function sharedTokens(left: string, right: string): number {
  const a = tokenSet(left); const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let shared = 0; for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function objectMentions(graph: RealityGraph, id: string): string[] {
  return unique(structureFor(graph, id)?.objects ?? []).map((value) => clean(value).toLowerCase());
}
function actionMentions(graph: RealityGraph, id: string): string[] {
  return unique(structureFor(graph, id)?.actions ?? []).map((value) => clean(value).toLowerCase());
}
function stateMentions(graph: RealityGraph, id: string): string[] {
  const structure = structureFor(graph, id);
  return unique([...(structure?.states ?? []), clean(event(graph, id)?.emotionalState)]).map((value) => value.toLowerCase());
}
function semanticTags(graph: RealityGraph, id: string): string[] {
  return unique(structureFor(graph, id)?.semanticTags ?? []).map((value) => value.toLowerCase());
}

function relationBetween(graph: RealityGraph, left: string, right: string) {
  return graph.relations
    .filter((relation) => (relation.from === left && relation.to === right) || (relation.from === right && relation.to === left))
    .sort((a, b) => b.strength - a.strength)[0];
}

function structuralRelation(relation: ReturnType<typeof relationBetween>): boolean {
  return Boolean(relation && ["repeats", "recontextualizes", "contrasts", "changes", "causes", "converges"].includes(relation.kind));
}

function pairSpan(ids: readonly string[], selected: readonly string[]): number {
  const positions = selected.map((id) => ids.indexOf(id)).filter((index) => index >= 0);
  if (positions.length < 2 || ids.length < 2) return 0;
  return metric((Math.max(...positions) - Math.min(...positions)) / Math.max(1, ids.length - 1));
}

function graphConnectivity(graph: RealityGraph, ids: readonly string[]): number {
  if (ids.length < 2) return 0;
  let weighted = 0; let opportunities = 0;
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      opportunities += 1;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      weighted += relation ? relation.strength : sharedTokens(labelFor(graph, ids[i]!), labelFor(graph, ids[j]!)) * 0.22;
    }
  }
  return metric(weighted / Math.max(1, opportunities));
}

function preferenceConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { labels: string[]; score: number } | undefined {
  const ids = orderedIds(candidate); const subject = subjectName(graph);
  const labels = ids.map((id) => labelFor(graph, id)).filter((label) => PREFERENCE.test(label));
  if (labels.length < 2) return undefined;
  const targets = new Set<string>(); for (const id of ids) for (const object of objectMentions(graph, id)) targets.add(object);
  const variety = new Set(labels.map((label) => label.toLowerCase().replace(PREFERENCE, "").trim()).filter(Boolean)).size;
  const subjectHits = subject ? labels.filter((label) => subjectMention(label, subject)).length : 0;
  return { labels, score: metric(Math.min(1, labels.length / 4) * 0.4 + Math.min(1, variety / 3) * 0.22 + Math.min(1, targets.size / 4) * 0.2 + (subjectHits ? 0.18 : 0)) };
}

function callbackConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { detail: string; score: number } | undefined {
  const ids = orderedIds(candidate); let best: { detail: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const earlier = [...objectMentions(graph, ids[i]!), ...actionMentions(graph, ids[i]!)]; if (!earlier.length) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      const later = [...objectMentions(graph, ids[j]!), ...actionMentions(graph, ids[j]!)];
      const shared = earlier.filter((value) => later.includes(value)); if (!shared.length) continue;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      const explicit = CONTINUATION.test(labelFor(graph, ids[j]!)) || /\b(?:same|remembered)\b/i.test(labelFor(graph, ids[j]!));
      const score = metric((relation ? 0.68 + relation.strength * 0.18 : 0.46) + (explicit ? 0.14 : 0) + pairSpan(ids, [ids[i]!, ids[j]!] ) * 0.08);
      if (!best || score > best.score) best = { detail: shared[0]!, score };
    }
  }
  return best;
}

function invariantConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { detail: string; score: number } | undefined {
  const ids = orderedIds(candidate); let best: { detail: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const earlier = new Set([...objectMentions(graph, ids[i]!), ...actionMentions(graph, ids[i]!), ...semanticTags(graph, ids[i]!)]); if (!earlier.size) continue;
    for (let j = i + 2; j < ids.length; j += 1) {
      const later = new Set([...objectMentions(graph, ids[j]!), ...actionMentions(graph, ids[j]!), ...semanticTags(graph, ids[j]!)]);
      const shared = [...earlier].filter((value) => later.has(value)); if (!shared.length) continue;
      const changedMiddle = ids.slice(i + 1, j).filter((id) => stateMentions(graph, id).length || actionMentions(graph, id).length || (structureFor(graph, id)?.transitionScore ?? 0) >= 0.45).length;
      if (!changedMiddle) continue;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      const score = metric(0.48 + Math.min(0.2, changedMiddle * 0.055) + pairSpan(ids, [ids[i]!, ids[j]!] ) * 0.14 + (relation && structuralRelation(relation) ? 0.14 + relation.strength * 0.08 : 0));
      if (!best || score > best.score) best = { detail: shared[0]!, score };
    }
  }
  return best;
}

function originSuccessConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { detail: string; score: number } | undefined {
  const ids = orderedIds(candidate); let best: { detail: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const first = labelFor(graph, ids[i]!); if (!FIRST.test(first)) continue;
    const firstObjects = objectMentions(graph, ids[i]!);
    for (let j = i + 1; j < ids.length; j += 1) {
      const later = labelFor(graph, ids[j]!); if (!SUCCESS.test(later)) continue;
      const shared = firstObjects.filter((object) => objectMentions(graph, ids[j]!).includes(object));
      const semanticLink = shared.length ? 1 : sharedTokens(first, later); if (semanticLink < 0.15) continue;
      const score = metric(0.62 + pairSpan(ids, [ids[i]!, ids[j]!] ) * 0.2 + (shared.length ? 0.12 : semanticLink * 0.08));
      if (!best || score > best.score) best = { detail: shared[0] ?? "the early supplied thread", score };
    }
  }
  return best;
}

function stateChangeConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { from: string; to: string; score: number } | undefined {
  const ids = orderedIds(candidate); let best: { from: string; to: string; score: number } | undefined;
  for (let i = 0; i < ids.length; i += 1) {
    const from = stateMentions(graph, ids[i]!); if (!from.length) continue;
    for (let j = i + 1; j < ids.length; j += 1) {
      const to = stateMentions(graph, ids[j]!); if (!to.length) continue;
      const fromLabel = labelFor(graph, ids[i]!); const toLabel = labelFor(graph, ids[j]!);
      const fromNeg = NEGATIVE.test(fromLabel); const fromPos = POSITIVE.test(fromLabel); const toNeg = NEGATIVE.test(toLabel); const toPos = POSITIVE.test(toLabel);
      if ((!fromNeg && !fromPos) || (!toNeg && !toPos)) continue;
      const polarity = fromNeg && toPos ? 1 : fromPos && toNeg ? 0.94 : fromNeg !== toNeg ? 0.84 : 0.62;
      const relation = relationBetween(graph, ids[i]!, ids[j]!);
      const score = metric(polarity * 0.72 + pairSpan(ids, [ids[i]!, ids[j]!] ) * 0.14 + (relation?.kind === "changes" || relation?.kind === "recontextualizes" ? relation.strength * 0.14 : 0));
      if (!best || score > best.score) best = { from: from[0]!, to: to[0]!, score };
    }
  }
  return best;
}

function contrastConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { score: number } | undefined {
  const ids = orderedIds(candidate); let best: number | undefined;
  for (let i = 0; i < ids.length - 1; i += 1) {
    const left = labelFor(graph, ids[i]!); const right = labelFor(graph, ids[i + 1]!); const relation = relationBetween(graph, ids[i]!, ids[i + 1]!);
    const explicit = CONTRAST.test(left) || CONTRAST.test(right) || EXPECTATION.test(right);
    const score = metric((relation?.kind === "contrasts" ? 0.82 + relation.strength * 0.18 : 0.4) + (explicit ? 0.14 : 0) + sharedTokens(left, right) * 0.06);
    if (best === undefined || score > best) best = score;
  }
  return best === undefined ? undefined : { score: best };
}

function convergenceConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { score: number } | undefined {
  const ids = orderedIds(candidate); let best: number | undefined;
  for (const anchor of ids) {
    let connections = 0;
    for (const other of ids) {
      if (anchor === other) continue;
      const relation = relationBetween(graph, anchor, other);
      connections += relation ? relation.strength : sharedTokens(labelFor(graph, anchor), labelFor(graph, other)) * 0.32;
    }
    const score = connections / Math.max(1, ids.length - 1); if (best === undefined || score > best) best = score;
  }
  return best === undefined ? undefined : { score: metric(Math.min(1, best)) };
}

function accumulationConstellation(graph: RealityGraph, candidate: LatentMovieCandidate): { score: number; detail: string } | undefined {
  const ids = orderedIds(candidate); const subject = subjectName(graph); let best: { score: number; detail: string } | undefined;
  for (const anchor of ids) {
    const anchorLabel = labelFor(graph, anchor); const anchorObjects = objectMentions(graph, anchor); const anchorTags = semanticTags(graph, anchor);
    const related = ids.filter((id) => id !== anchor && ((subject ? subjectMention(labelFor(graph, id), subject) : false) || anchorObjects.some((object) => sharedTokens(object, labelFor(graph, id)) >= 0.35) || anchorTags.some((tag) => semanticTags(graph, id).includes(tag))));
    if (related.length < 2) continue;
    const variedActions = new Set([anchor, ...related].flatMap((id) => actionMentions(graph, id))).size;
    const score = metric(Math.min(1, related.length / 4) * 0.42 + pairSpan(ids, [anchor, related[0]!, related[related.length - 1]!]) * 0.24 + Math.min(1, variedActions / 3) * 0.2 + 0.14);
    if (!best || score > best.score) best = { score, detail: anchorLabel };
  }
  return best;
}

function tensionPotential(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const tensions = (graph.unresolvedTensions ?? []) as unknown[]; const ids = orderedIds(candidate);
  const idText = ids.map((id) => `${labelFor(graph, id)} ${semanticTags(graph, id).join(" ")}`).join(" ").toLowerCase();
  const hits = tensions.filter((tension) => { const text = typeof tension === "string" ? tension : clean((tension as { text?: unknown; label?: unknown }).text ?? (tension as { label?: unknown }).label); return text && sharedTokens(idText, text) >= 0.18; }).length;
  return metric(hits / Math.max(1, tensions.length) + (tensions.length ? 0.08 : 0));
}

function recurrenceGapPotential(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = orderedIds(candidate); let best = 0;
  for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) {
    const left = new Set([...objectMentions(graph, ids[i]!), ...actionMentions(graph, ids[i]!), ...semanticTags(graph, ids[i]!) ]);
    const right = new Set([...objectMentions(graph, ids[j]!), ...actionMentions(graph, ids[j]!), ...semanticTags(graph, ids[j]!) ]);
    if (![...left].some((value) => right.has(value))) continue;
    const gap = j - i - 1; if (gap > 0) best = Math.max(best, Math.min(1, gap / 4));
  }
  return metric(best);
}

function multiRelationAmbiguity(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = orderedIds(candidate); if (ids.length < 3) return 0; let opportunities = 0;
  for (const id of ids) {
    const kinds = new Set<string>();
    for (const other of ids) { if (id === other) continue; const relation = relationBetween(graph, id, other); if (relation && structuralRelation(relation)) kinds.add(relation.kind); }
    if (kinds.size >= 2) opportunities += 1;
  }
  return metric(opportunities / ids.length);
}

function explanationRisk(candidate: LatentMovieCandidate, strongest: number): number {
  const conclusionLeak = candidate.hypothesis.some((line) => /\b(?:obviously|the meaning is|lesson|moral|therefore|the point is)\b/i.test(clean(line))) ? 0.18 : 0;
  return metric((1 - (candidate.uncertainty ?? 0)) * 0.2 + (candidate.repetitionRisk ?? 0) * 0.18 + (candidate.truthRisk ?? 0) * 0.2 + (1 - strongest) * 0.1 + conclusionLeak);
}

export function scoreSatanicoObserverInference(graph: RealityGraph, candidate: LatentMovieCandidate): number {
  const ids = orderedIds(candidate); if (ids.length < 3) return 0;
  const detectors = [
    preferenceConstellation(graph, candidate)?.score ?? 0,
    callbackConstellation(graph, candidate)?.score ?? 0,
    invariantConstellation(graph, candidate)?.score ?? 0,
    originSuccessConstellation(graph, candidate)?.score ?? 0,
    stateChangeConstellation(graph, candidate)?.score ?? 0,
    contrastConstellation(graph, candidate)?.score ?? 0,
    convergenceConstellation(graph, candidate)?.score ?? 0,
    accumulationConstellation(graph, candidate)?.score ?? 0,
  ].sort((a, b) => b - a);

  const strongest = detectors[0] ?? 0; const second = detectors[1] ?? 0;
  const competition = metric(strongest * 0.72 + second * 0.28);
  const density = graphConnectivity(graph, ids);
  const delayed = metric(
    (candidate.callbackPotential ?? 0) * 0.2 +
    recurrenceGapPotential(graph, candidate) * 0.2 +
    multiRelationAmbiguity(graph, candidate) * 0.16 +
    density * 0.14 +
    (candidate.uncertainty ?? 0) * 0.14 +
    tensionPotential(graph, candidate) * 0.16,
  );
  const risk = explanationRisk(candidate, strongest);

  return metric(
    strongest * 0.34 +
    competition * 0.08 +
    delayed * 0.24 +
    (candidate.novelty ?? 0) * 0.08 +
    (candidate.specificity ?? 0) * 0.06 +
    (candidate.informationValue ?? 0) * 0.05 +
    (candidate.consequencePotential ?? 0) * 0.04 +
    (candidate.callbackPotential ?? 0) * 0.04 +
    (density >= 0.35 ? 0.04 : 0) +
    (candidate.truthRisk <= 0.18 ? 0.03 : 0) -
    risk * 0.12,
  );
}

export function deriveSatanicoObserverObjective(graph: RealityGraph, candidate: LatentMovieCandidate): ObserverExperienceObjective | undefined {
  const subject = subjectName(graph) || "the subject";
  const preference = preferenceConstellation(graph, candidate);
  if (preference && preference.score >= 0.55) {
    const finalDetail = preference.labels.at(-1) ?? "the final supplied preference";
    return {
      objective: `Let the observer infer that ${subject} has a very specific pattern of preference from ${preference.labels.slice(0, 3).join("; ")}.`,
      surprise: "The pattern should become visible before the Author names it.",
      curiosity: `Do not explain the pattern in ${subject}; make the observer construct the character read themselves.`,
      attention: ["establish one concrete preference", "add a second preference that shifts the pattern", "withhold the abstraction", `use ${finalDetail} as the last piece of evidence`],
      landing: "Let the observer name the pattern internally; the final cut supplies evidence rather than the conclusion.",
      explanationForbidden: true,
    };
  }
  const callback = callbackConstellation(graph, candidate);
  if (callback && callback.score >= 0.7) return {
    objective: `Let the observer notice that ${callback.detail} has returned with a different significance.`,
    surprise: "The later supplied appearance should make the earlier detail feel newly intentional in hindsight.",
    curiosity: `Do not explain what ${callback.detail} means.`,
    attention: [`establish ${callback.detail}`, "move attention elsewhere", `return to ${callback.detail}`, "let the observer recontextualize it"],
    landing: "The callback is evidence; the observer supplies the meaning.",
    explanationForbidden: true,
  };
  const invariant = invariantConstellation(graph, candidate);
  if (invariant && invariant.score >= 0.68) return {
    objective: `Let the observer notice that ${invariant.detail} remains while surrounding supplied conditions change.`,
    surprise: "Persistence should become significant because the surrounding reality moved.",
    curiosity: "Do not explain why the persistent detail matters.",
    attention: [`establish ${invariant.detail}`, "show supplied change around it", `return attention to ${invariant.detail}`, "leave significance open"],
    landing: "The invariant is evidence, not an announced symbol.",
    explanationForbidden: true,
  };
  const originSuccess = originSuccessConstellation(graph, candidate);
  if (originSuccess && originSuccess.score >= 0.7) return {
    objective: `Let the observer connect ${originSuccess.detail} to later supplied success without being told that it is the origin.`,
    surprise: "An ordinary beginning acquires weight in hindsight.",
    curiosity: "Let the later evidence do the reinterpretation.",
    attention: ["establish the small beginning", "move through supplied growth", "show the later success", "let the observer connect origin to outcome"],
    landing: "Let hindsight create the significance.",
    explanationForbidden: true,
  };
  const stateChange = stateChangeConstellation(graph, candidate);
  if (stateChange && stateChange.score >= 0.78) return {
    objective: `Let the observer feel ${subject} move from the supplied earlier state to the supplied later state without naming the transformation.`,
    surprise: "The change should be recognized from before-and-after evidence.",
    curiosity: "Hold the earlier state in memory while the sequence earns the later one.",
    attention: [`establish ${stateChange.from}`, "accumulate supplied evidence", "delay the label", `land on ${stateChange.to}`],
    landing: "Let the later supplied state answer the earlier one.",
    explanationForbidden: true,
  };
  const contrast = contrastConstellation(graph, candidate);
  if (contrast && contrast.score >= 0.68) return {
    objective: "Let the observer hold two supplied readings in tension until the contrast becomes self-evident.",
    surprise: "The contrast should alter the reading of an earlier detail.",
    curiosity: "Do not resolve the tension before the evidence earns the new reading.",
    attention: ["establish one reading", "introduce the supplied contrast", "hold both readings", "let recognition happen"],
    landing: "Let the observer resolve the tension internally.",
    explanationForbidden: true,
  };
  const convergence = convergenceConstellation(graph, candidate);
  if (convergence && convergence.score >= 0.56) return {
    objective: "Let several supplied details become more meaningful together than they were separately.",
    surprise: "The common pattern should emerge without summary.",
    curiosity: "Keep the abstraction unstated while concrete details accumulate.",
    attention: ["establish detail A", "add detail B", "add a less obvious detail C", "let the observer complete the relation"],
    landing: "Let the observer complete the relationship themselves.",
    explanationForbidden: true,
  };
  const accumulation = accumulationConstellation(graph, candidate);
  if (accumulation && accumulation.score >= 0.6) return {
    objective: `Let repeated supplied contact with ${accumulation.detail} accumulate into a character, object, or situation read without naming the abstraction.`,
    surprise: "The observer should feel the pattern before hearing what it is.",
    curiosity: "Delay synthesis until enough concrete evidence has accumulated.",
    attention: ["establish the anchor", "add a different contact", "add another supplied consequence", "let the observer synthesize"],
    landing: "Accumulation earns the inference.",
    explanationForbidden: true,
  };
  return undefined;
}
