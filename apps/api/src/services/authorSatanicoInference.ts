import type {
  LatentMovieCandidate,
  ObserverExperienceObjective,
  RealityGraph,
} from "@qre/contracts";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3),
  );

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const PREFERENCE = /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/i;
const CONTRAST = /\b(?:but|yet|although|instead|rather|except|while|however|still)\b/i;
const CONTINUATION = /\b(?:again|returned|return|back|second|third|another|repeated|repeat|kept|continued|still|until|later|anniversary|years?)\b/i;
const EXPECTATION = /\b(?:didn'?t|did not|never)\s+(?:expect|plan|think|assume)|\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|unlike\s+expected)\b/i;
const NEGATIVE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|ready|sharp|dapper|beautiful|handsome)\b/i;
const OBJECT = /\b(?:bow|bath|bathroom|room|mirror|photo|picture|gift|keys?|car|house|home|table|dress|coat|shirt|collar|tool|tools|food|cake|book|letter|ticket|phone|screen|door|window|box|bag|ring|flower|flowers|water|music|blue|red|green|yellow|white|black|coffee)\b/i;

function labelFor(graph: RealityGraph, id: string): string {
  return clean(graph.events.find((item) => item.id === id)?.label);
}

function subjectName(graph: RealityGraph): string {
  return clean(
    [...(graph.entityContinuity ?? [])]
      .sort((a, b) => b.salienceScore - a.salienceScore)[0]?.name,
  );
}

function orderedIds(candidate: LatentMovieCandidate): string[] {
  return unique(candidate.trajectory.flatMap((step) => step.eventIds));
}

function subjectMention(label: string, subject: string): boolean {
  return Boolean(subject) && label.toLowerCase().includes(subject.toLowerCase());
}

function tokenSet(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function sharedTokens(left: string, right: string): number {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function concreteTokens(label: string): string[] {
  return [...tokenSet(label)].filter((token) => OBJECT.test(token));
}

function pairSpan(ids: readonly string[], selected: readonly string[]): number {
  const positions = selected
    .map((id) => ids.indexOf(id))
    .filter((index) => index >= 0);
  if (positions.length < 2 || ids.length < 2) return 0;
  return metric(
    (Math.max(...positions) - Math.min(...positions)) /
      Math.max(1, ids.length - 1),
  );
}

function preferenceConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { labels: string[]; score: number } | undefined {
  const ids = orderedIds(candidate);
  const subject = subjectName(graph);
  const preferenceLabels = ids
    .map((id) => labelFor(graph, id))
    .filter((label) => PREFERENCE.test(label));

  if (preferenceLabels.length < 2) return undefined;

  const subjectHits = subject
    ? preferenceLabels.filter((label) => subjectMention(label, subject)).length
    : 0;
  const variety = new Set(
    preferenceLabels
      .map((label) =>
        label
          .toLowerCase()
          .replace(
            /\b(?:love|loves|like|likes|prefer|prefers|favorite|favourite|enjoy|enjoys|into)\b/gi,
            "",
          )
          .trim(),
      )
      .filter(Boolean),
  ).size;

  return {
    labels: preferenceLabels,
    score: metric(
      Math.min(1, preferenceLabels.length / 4) * 0.52 +
        Math.min(1, variety / 3) * 0.3 +
        (subjectHits ? 0.18 : 0),
    ),
  };
}

function callbackConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { detail: string; score: number } | undefined {
  const ids = orderedIds(candidate);
  let best: { detail: string; score: number } | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    const earlier = labelFor(graph, ids[i]!);
    const earlierObjects = concreteTokens(earlier);
    if (!earlierObjects.length) continue;

    for (let j = i + 1; j < ids.length; j += 1) {
      const later = labelFor(graph, ids[j]!);
      const laterObjects = concreteTokens(later);
      const shared = earlierObjects.filter((object) => laterObjects.includes(object));
      if (!shared.length) continue;

      const relation = graph.relations.find(
        (item) =>
          ((item.from === ids[i] && item.to === ids[j]) ||
            (item.from === ids[j] && item.to === ids[i])) &&
          ["repeats", "recontextualizes"].includes(item.kind),
      );
      const explicit = CONTINUATION.test(later) || /\b(?:same|remembered)\b/i.test(later);
      const spread = pairSpan(ids, [ids[i]!, ids[j]!]);
      const score =
        (relation ? 0.72 + Math.min(0.16, relation.strength * 0.16) : 0.48) +
        (explicit ? 0.12 : 0) +
        spread * 0.08;

      if (!best || score > best.score) {
        best = { detail: shared[0]!, score };
      }
    }
  }

  return best;
}

function stateChangeConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { from: string; to: string; score: number } | undefined {
  const ids = orderedIds(candidate);
  let best: { from: string; to: string; score: number } | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    const from = labelFor(graph, ids[i]!);
    const fromNeg = NEGATIVE.test(from);
    const fromPos = POSITIVE.test(from);
    if (!fromNeg && !fromPos) continue;

    for (let j = i + 1; j < ids.length; j += 1) {
      const to = labelFor(graph, ids[j]!);
      const toNeg = NEGATIVE.test(to);
      const toPos = POSITIVE.test(to);
      if ((!toNeg && !toPos) || from.toLowerCase() === to.toLowerCase()) continue;

      const polarity = fromNeg && toPos ? 1 : fromPos && toNeg ? 0.94 : 0.72;
      const explicitShift = /\b(?:became|changed|now|felt|looks|looked)\b/i.test(to) ? 0.1 : 0;
      const score = polarity * 0.78 + explicitShift + pairSpan(ids, [ids[i]!, ids[j]!]) * 0.12;
      if (!best || score > best.score) {
        best = { from: from, to: to, score };
      }
    }
  }

  return best;
}

function contrastConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { score: number } | undefined {
  const ids = orderedIds(candidate);
  let best: number | undefined;

  for (let i = 0; i < ids.length - 1; i += 1) {
    const left = labelFor(graph, ids[i]!);
    const right = labelFor(graph, ids[i + 1]!);
    const relation = graph.relations.find(
      (item) =>
        ((item.from === ids[i] && item.to === ids[i + 1]) ||
          (item.from === ids[i + 1] && item.to === ids[i])) &&
        item.kind === "contrasts",
    );
    const explicit = CONTRAST.test(right) || CONTRAST.test(left) || EXPECTATION.test(right);
    const semantic = sharedTokens(left, right);
    const score = (relation ? 0.8 + relation.strength * 0.2 : 0.42) +
      (explicit ? 0.12 : 0) + semantic * 0.08;
    if (best === undefined || score > best) best = score;
  }

  return best === undefined ? undefined : { score: metric(best) };
}

function convergenceConstellation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): { score: number } | undefined {
  const ids = orderedIds(candidate);
  let best: number | undefined;

  for (let i = 0; i < ids.length; i += 1) {
    let connections = 0;
    for (let j = 0; j < ids.length; j += 1) {
      if (i === j) continue;
      const relation = graph.relations.find(
        (item) =>
          ((item.from === ids[i] && item.to === ids[j]) ||
            (item.from === ids[j] && item.to === ids[i])) &&
          ["converges", "causes", "changes", "recontextualizes"].includes(item.kind),
      );
      if (relation) connections += relation.strength;
      else connections += sharedTokens(labelFor(graph, ids[i]!), labelFor(graph, ids[j]!)) * 0.35;
    }

    const score = connections / Math.max(1, ids.length - 1);
    if (best === undefined || score > best) best = score;
  }

  return best === undefined ? undefined : { score: metric(Math.min(1, best)) };
}

/**
 * Rank how much grounded meaning can be left for the observer to discover.
 *
 * High value means the supplied evidence strongly supports a latent read, while
 * the read itself remains unstated. The function never creates or authorizes a
 * concrete event; it only scores relationships already present in the graph.
 */
export function scoreSatanicoObserverInference(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): number {
  const ids = orderedIds(candidate);
  if (ids.length < 3) return 0;

  const preference = preferenceConstellation(graph, candidate);
  const callback = callbackConstellation(graph, candidate);
  const stateChange = stateChangeConstellation(graph, candidate);
  const contrast = contrastConstellation(graph, candidate);
  const convergence = convergenceConstellation(graph, candidate);

  const relationDensity = metric(
    graph.relations.filter(
      (relation) => ids.includes(relation.from) && ids.includes(relation.to) &&
        !["before", "after", "involves", "belongs_to"].includes(relation.kind),
    ).length / Math.max(1, ids.length),
  );

  const delayedMeaning = metric(
    (candidate.callbackPotential ?? 0) * 0.3 +
      (candidate.uncertainty ?? 0) * 0.22 +
      (candidate.novelty ?? 0) * 0.14 +
      (candidate.attentionPotential ?? 0) * 0.14 +
      relationDensity * 0.2,
  );

  const explanationRisk = metric(
    (1 - (candidate.uncertainty ?? 0)) * 0.28 +
      (candidate.repetitionRisk ?? 0) * 0.22 +
      (candidate.truthRisk ?? 0) * 0.28 +
      (candidate.specificity ?? 0) * 0.12 +
      0.1,
  );

  const patternScores = [
    preference?.score ?? 0,
    callback ? metric(callback.score) : 0,
    stateChange ? metric(stateChange.score) : 0,
    contrast?.score ?? 0,
    convergence?.score ?? 0,
  ];
  const strongest = Math.max(...patternScores);
  const second = [...patternScores].sort((a, b) => b - a)[1] ?? 0;
  const competition = metric(Math.min(1, strongest * 0.7 + second * 0.3));

  return metric(
    strongest * 0.34 +
      competition * 0.12 +
      delayedMeaning * 0.22 +
      (candidate.informationValue ?? 0) * 0.1 +
      (candidate.specificity ?? 0) * 0.08 +
      (candidate.consequencePotential ?? 0) * 0.07 +
      (candidate.callbackPotential ?? 0) * 0.05 +
      (candidate.truthRisk <= 0.18 ? 0.08 : 0) -
      explanationRisk * 0.12,
  );
}

export function deriveSatanicoObserverObjective(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): ObserverExperienceObjective | undefined {
  const preference = preferenceConstellation(graph, candidate);
  if (preference && preference.score >= 0.58) {
    const subject = subjectName(graph) || "the subject";
    const labels = preference.labels;
    const finalDetail = labels[labels.length - 1] ?? "the final supplied preference";
    return {
      objective: `Let the observer infer that ${subject} has a very specific pattern of preference from ${labels.slice(0, 3).join("; ")}.`,
      surprise: "The pattern should become visible before the Author names it.",
      curiosity: `Do not explain why ${subject} has the pattern. Leave the observer room to complete the character read themselves.`,
      attention: [
        "establish one concrete preference",
        "add a second preference that changes the pattern",
        "withhold the abstraction",
        `use ${finalDetail} as the last piece of evidence`,
      ],
      landing: "Let the observer name the pattern internally; the final cut supplies evidence rather than the conclusion.",
      explanationForbidden: true,
    };
  }

  const callback = callbackConstellation(graph, candidate);
  if (callback && callback.score >= 0.72) {
    return {
      objective: `Let the observer notice that ${callback.detail} has returned with a different significance.`,
      surprise: "The later supplied appearance should make the earlier detail feel intentional in hindsight.",
      curiosity: `Do not explain what ${callback.detail} means. Make the observer remember the earlier occurrence and connect it themselves.`,
      attention: [
        `establish ${callback.detail}`,
        "move attention elsewhere",
        `return to ${callback.detail}`,
        "let the observer recontextualize it",
      ],
      landing: "The callback is the evidence; the observer supplies the meaning.",
      explanationForbidden: true,
    };
  }

  const stateChange = stateChangeConstellation(graph, candidate);
  if (stateChange && stateChange.score >= 0.82) {
    const subject = subjectName(graph) || "the subject";
    return {
      objective: `Let the observer feel ${subject} move from the supplied earlier state to the supplied later state without naming the transformation for them.`,
      surprise: "The change should be recognized from the before-and-after evidence.",
      curiosity: "Hold the starting state in memory while the supplied sequence accumulates a different one.",
      attention: [
        `establish ${stateChange.from}`,
        "accumulate supplied evidence",
        "delay the label",
        `land on ${stateChange.to}`,
      ],
      landing: "Let the later supplied state answer the earlier one.",
      explanationForbidden: true,
    };
  }

  const contrast = contrastConstellation(graph, candidate);
  if (contrast && contrast.score >= 0.72) {
    return {
      objective: "Let the observer hold two supplied readings in tension until the contrast becomes self-evident.",
      surprise: "The contrast should change what an earlier supplied detail feels like.",
      curiosity: "Do not resolve the contradiction before the supplied evidence earns the new reading.",
      attention: ["establish one reading", "introduce the contrast", "hold both", "let recognition happen"],
      landing: "Let the observer resolve the tension internally.",
      explanationForbidden: true,
    };
  }

  const convergence = convergenceConstellation(graph, candidate);
  if (convergence && convergence.score >= 0.58) {
    return {
      objective: "Let several supplied details become more meaningful together than they were separately.",
      surprise: "The observer should discover the common pattern rather than receive a summary of it.",
      curiosity: "Keep the abstraction unstated while the concrete details accumulate.",
      attention: ["establish detail A", "add detail B", "add a non-obvious detail C", "let the pattern emerge"],
      landing: "Let the observer complete the relationship themselves.",
      explanationForbidden: true,
    };
  }

  return undefined;
}
