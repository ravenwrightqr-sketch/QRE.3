/**
 * QRE GROUNDED AUTHOR SEQUENCE PLANNER
 *
 * Canonical responsibility:
 *   RealityGraph + RealityEnvelope + optional lens/presence
 *     -> discover the strongest movie latent in supplied reality
 *     -> express that movie as short semantic beats
 *
 * This is NOT a next-event picker and NOT prose generation.
 * A movie is a relationship among supplied facts: tension, contrast,
 * character, escalation, callback, transformation, and payoff.
 * Reality remains immutable. The Mouth owns wording later.
 */
import type { RealityGraph, RealityRelation } from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type PlannedAuthorBeat = {
  order: number;
  role: string;
  gainKind: string;
  change: string;
  next: string;
  frontier: string;
  necessity: string;
  eventIds: string[];
  attentionFunction:
    | "hook"
    | "question"
    | "turn"
    | "escalation"
    | "reframe"
    | "callback"
    | "payoff"
    | "release"
    | "discovery";
  setsUp: string[];
  paysOff: string[];
  creativeMove:
    | "contrast"
    | "status_inversion"
    | "understatement"
    | "double_meaning"
    | "personification"
    | "callback"
    | "recontextualization"
    | "implication"
    | "none";
  nextBeatPullTarget: number;
};

export type GroundedBeatPlan = {
  premise: string;
  baselineFacts: string[];
  attentionArc: string;
  beats: PlannedAuthorBeat[];
  closing?: string;
  source: "grounded_sequence_planner";
};

type PresenceCut = {
  text: string;
  role: "arrival" | "location" | "release";
  gainKind: "new_fact" | "payoff";
  attentionFunction: "hook" | "discovery" | "payoff" | "release";
};

type MovieKind =
  | "contradiction"
  | "character"
  | "callback"
  | "transformation"
  | "service"
  | "relationship";

type MovieCandidate = {
  kind: MovieKind;
  eventIds: string[];
  endpointId: string;
  score: number;
  coverage: number;
  tension: number;
  relation: number;
  contrast: number;
  payoff: number;
  lensFit: number;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const words = (value: string): string[] =>
  clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 3);

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const uniq = (values: readonly string[], limit = 24): string[] =>
  [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

function eventById(graph: RealityGraph, id: string) {
  return graph.events.find((event) => event.id === id);
}

function label(graph: RealityGraph, id: string): string {
  return clean(eventById(graph, id)?.label || "supplied detail");
}

function relationBetween(graph: RealityGraph, a: string, b: string): RealityRelation[] {
  return graph.relations
    .filter((relation) =>
      (relation.from === a && relation.to === b) ||
      (relation.from === b && relation.to === a),
    )
    .sort((left, right) => right.strength - left.strength);
}

function relationScore(graph: RealityGraph, a: string, b: string): number {
  return relationBetween(graph, a, b)[0]?.strength ?? 0;
}

function relationKind(graph: RealityGraph, a: string, b: string): RealityRelation["kind"] | undefined {
  return relationBetween(graph, a, b)[0]?.kind;
}

function endpointId(graph: RealityGraph, envelope: RealityEnvelope): string {
  return envelope.endpointEventId || graph.events.at(-1)?.id || "";
}

function tokenOverlap(a: string, b: string): number {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / Math.max(left.size, right.size);
}

function stateScore(text: string): number {
  return /\b(?:nervous|scared|happy|sad|angry|proud|fierce|excited|calm|tired|relaxed)\b/i.test(text) ? 1 : 0;
}

function actionScore(text: string): number {
  return /\b(?:arrived|came|started|began|met|stole|shook|cleaned|finished|left|returned|walked|made|got|visited|groomed|dropped)\b/i.test(text) ? 1 : 0;
}

function objectScore(text: string): number {
  return /\b(?:bow|treat|dryer|bulldog|kitchen|bathroom|pool|sand|knife|photo|door|house)\b/i.test(text) ? 1 : 0;
}

function opposition(a: string, b: string): number {
  const combined = `${a} ${b}`.toLowerCase();
  const negative = /\b(?:hate|hates|scared|afraid|nervous|refused|enemy|against|no)\b/.test(combined);
  const positive = /\b(?:love|loves|happy|favorite|again|still|approved|won|victory|likes)\b/.test(combined);
  if (negative && positive) return 1;
  if (negative) return 0.65;
  return 0;
}

function lensFit(lens: string | undefined, labels: readonly string[]): number {
  const value = `${lens ?? ""} ${labels.join(" ")}`.toLowerCase();
  let score = 0.5;
  if (/game|round|mission|heist|spy|noir|deadpan|mock|status|funny|fierce|absurd/.test(value)) score += 0.15;
  if (/hates|loves|bow|dryer|bulldog|kitchen|bathroom|clean|tko|treat/.test(value)) score += 0.15;
  return metric(score);
}

function eventImportance(graph: RealityGraph, id: string, endpoint: string): number {
  const event = eventById(graph, id);
  if (!event) return 0;
  const incident = graph.relations
    .filter((relation) => relation.from === id || relation.to === id)
    .reduce((sum, relation) => sum + relation.strength, 0);

  return metric(
    incident * 0.28 +
      stateScore(event.label) * 0.16 +
      actionScore(event.label) * 0.12 +
      objectScore(event.label) * 0.16 +
      Math.min(0.18, words(event.label).length * 0.03) +
      (id === endpoint ? 0.1 : 0),
  );
}

function openingCandidates(graph: RealityGraph, envelope: RealityEnvelope): string[] {
  const preferred = envelope.openingEventIds.filter((id) => eventById(graph, id));
  const ranked = graph.events
    .map((event, index) => ({
      id: event.id,
      score:
        (preferred.includes(event.id) ? 0.5 : 0) +
        stateScore(event.label) * 0.28 +
        actionScore(event.label) * 0.15 +
        objectScore(event.label) * 0.07 -
        index * 0.001,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id);

  return uniq([...preferred, ...ranked], 5);
}

function candidateEvents(graph: RealityGraph, endpoint: string, opening: string): string[] {
  return graph.events
    .filter((event) => event.id !== endpoint && event.id !== opening)
    .map((event) => event.id)
    .sort((a, b) => eventImportance(graph, b, endpoint) - eventImportance(graph, a, endpoint))
    .slice(0, 8);
}

function movieKind(
  graph: RealityGraph,
  ids: readonly string[],
): MovieKind {
  const labels = ids.map((id) => label(graph, id));
  const contradiction = ids.slice(0, -1).reduce((best, id, index) =>
    Math.max(best, opposition(label(graph, id), label(graph, ids[index + 1]))), 0);
  if (contradiction >= 0.8) return "contradiction";
  if (ids.some((id) => /again|still|repeat|recurr/i.test(label(graph, id)))) return "callback";
  if (ids.some((id) => stateScore(label(graph, id)) > 0)) return "transformation";
  if (ids.some((id) => objectScore(label(graph, id)) > 0) && labels.some((text) => /hate|hates|love|loves/i.test(text))) return "character";
  if (ids.some((id) => /groom|clean|kitchen|bath|pool|service/i.test(label(graph, id)))) return "service";
  return "relationship";
}

function candidateScore(
  graph: RealityGraph,
  ids: readonly string[],
  endpoint: string,
  lens?: string,
): Omit<MovieCandidate, "eventIds" | "endpointId" | "kind"> & { kind: MovieKind } {
  const labels = ids.map((id) => label(graph, id));
  const relationValues = ids.slice(1).map((id, index) => relationScore(graph, ids[index], id));
  const relation = metric(relationValues.reduce((sum, value) => sum + value, 0) / Math.max(1, relationValues.length));
  const tension = metric(ids.slice(0, -1).reduce((best, id, index) =>
    Math.max(best, opposition(label(graph, id), label(graph, ids[index + 1]))), 0));
  const contrast = metric(ids.slice(0, -1).reduce((best, id, index) =>
    Math.max(best, tokenOverlap(label(graph, id), label(graph, ids[index + 1]))), 0));
  const coverage = metric(ids.slice(0, -1).reduce((sum, id) => sum + eventImportance(graph, id, endpoint), 0) / Math.max(1, ids.length - 1));
  const payoff = metric(relationScore(graph, ids.at(-2) ?? "", endpoint));
  const lensFitScore = lensFit(lens, labels);
  const kind = movieKind(graph, ids);
  const lengthFit = ids.length === 4 ? 1 : ids.length === 3 || ids.length === 5 ? 0.9 : 0.75;
  const attention = metric(
    tension * 0.42 +
      Math.min(1, ids.slice(1, -1).length / 3) * 0.2 +
      lengthFit * 0.2 +
      lensFitScore * 0.18,
  );

  return {
    kind,
    score: metric(
      coverage * 0.18 +
        relation * 0.18 +
        tension * 0.22 +
        contrast * 0.08 +
        payoff * 0.14 +
        attention * 0.15 +
        lensFitScore * 0.05,
    ),
    coverage,
    tension,
    relation,
    contrast,
    payoff,
    lensFit: lensFitScore,
  };
}

function discoverMovies(
  graph: RealityGraph,
  envelope: RealityEnvelope,
  lens?: string,
): MovieCandidate[] {
  const endpoint = endpointId(graph, envelope);
  if (!endpoint) return [];

  const movies: MovieCandidate[] = [];
  const openings = openingCandidates(graph, envelope);

  for (const opening of openings) {
    const pool = candidateEvents(graph, endpoint, opening);

    const candidates = new Set<string>();
    for (const id of pool) candidates.add(id);

    // Prefer semantic pairs that naturally create a contradiction/callback.
    for (const a of pool) {
      for (const b of pool) {
        if (a === b) continue;
        const al = label(graph, a);
        const bl = label(graph, b);
        if (tokenOverlap(al, bl) >= 0.2 || opposition(al, bl) >= 0.65) {
          const ids = uniq([opening, a, b, endpoint], 6);
          if (ids.length >= 3) {
            const scored = candidateScore(graph, ids, endpoint, lens);
            movies.push({ ...scored, eventIds: ids, endpointId: endpoint });
          }
        }
      }
    }

    // Also discover graph-supported service/relationship movies.
    for (const a of pool) {
      const direct = relationScore(graph, opening, a);
      const endpointLink = relationScore(graph, a, endpoint);
      if (direct > 0 || endpointLink > 0) {
        const ids = uniq([opening, a, endpoint], 6);
        const scored = candidateScore(graph, ids, endpoint, lens);
        movies.push({ ...scored, eventIds: ids, endpointId: endpoint });
      }
    }

    for (const a of pool.slice(0, 6)) {
      for (const b of pool.slice(0, 6)) {
        if (a === b) continue;
        if (relationScore(graph, a, b) < 0.15 && tokenOverlap(label(graph, a), label(graph, b)) < 0.2) continue;
        const ids = uniq([opening, a, b, endpoint], 6);
        if (ids.length < 4) continue;
        const scored = candidateScore(graph, ids, endpoint, lens);
        movies.push({ ...scored, eventIds: ids, endpointId: endpoint });
      }
    }
  }

  const dedup = new Map<string, MovieCandidate>();
  for (const movie of movies) {
    const key = movie.eventIds.join("|");
    const existing = dedup.get(key);
    if (!existing || movie.score > existing.score) dedup.set(key, movie);
  }

  return [...dedup.values()].sort((a, b) => b.score - a.score).slice(0, 12);
}

function beatForOpening(graph: RealityGraph, id: string): PlannedAuthorBeat {
  const text = label(graph, id);
  return {
    order: 1,
    role: "hook",
    gainKind: "new_fact",
    change: `Establish the supplied opening state: ${text}.`,
    next: "The character or situation now has something to prove.",
    frontier: text,
    necessity: "The opening establishes the movie's initial state.",
    eventIds: [id],
    attentionFunction: "hook",
    setsUp: [text],
    paysOff: [],
    creativeMove: "none",
    nextBeatPullTarget: 0.65,
  };
}

function beatForMiddle(
  graph: RealityGraph,
  ids: readonly string[],
  index: number,
  kind: MovieKind,
): PlannedAuthorBeat {
  const from = ids[index - 1];
  const to = ids[index];
  const fromLabel = label(graph, from);
  const toLabel = label(graph, to);
  const directRelation = relationKind(graph, from, to);
  const shared = tokenOverlap(fromLabel, toLabel);
  const opp = opposition(fromLabel, toLabel);

  let attentionFunction: PlannedAuthorBeat["attentionFunction"] = "discovery";
  let creativeMove: PlannedAuthorBeat["creativeMove"] = "implication";
  let role = "discovery";
  let gainKind = "discovery";
  let change = `Make the supplied detail newly meaningful: ${toLabel}.`;

  if (kind === "callback" || /again|still|repeat/i.test(toLabel)) {
    attentionFunction = "callback";
    role = "callback";
    gainKind = "callback";
    creativeMove = "callback";
    change = `Bring the supplied recurring detail back: ${toLabel}.`;
  } else if (opp >= 0.65 || (shared >= 0.25 && kind === "contradiction")) {
    attentionFunction = "reframe";
    role = "reframe";
    gainKind = "reframe";
    creativeMove = "status_inversion";
    change = `Turn the supplied contradiction into the character tension: ${fromLabel} -> ${toLabel}.`;
  } else if (directRelation === "changes") {
    attentionFunction = "escalation";
    role = "escalation";
    gainKind = "escalation";
    creativeMove = "status_inversion";
    change = `Escalate the supplied change: ${fromLabel} -> ${toLabel}.`;
  } else if (directRelation === "contrasts") {
    attentionFunction = "reframe";
    role = "reframe";
    gainKind = "reframe";
    creativeMove = "contrast";
    change = `Reframe the supplied contrast: ${fromLabel} -> ${toLabel}.`;
  } else if (directRelation === "recontextualizes") {
    attentionFunction = "turn";
    role = "turn";
    gainKind = "reframe";
    creativeMove = "recontextualization";
    change = `Let the supplied relationship change the reading: ${fromLabel} -> ${toLabel}.`;
  } else if (index === 1) {
    attentionFunction = "turn";
    role = "turn";
    gainKind = "discovery";
  }

  return {
    order: index + 1,
    role,
    gainKind,
    change,
    next: `What does ${toLabel} make the viewer expect now?`,
    frontier: toLabel,
    necessity: "This cut earns its place by changing the interpretation of supplied reality.",
    eventIds: [from, to],
    attentionFunction,
    setsUp: [fromLabel],
    paysOff: [],
    creativeMove,
    nextBeatPullTarget: metric(0.55 + relationScore(graph, from, to) * 0.35 + opp * 0.1),
  };
}

function beatForPayoff(graph: RealityGraph, previous: string, endpoint: string, kind: MovieKind): PlannedAuthorBeat {
  const endpointLabel = label(graph, endpoint);
  const previousLabel = label(graph, previous);
  return {
    order: 99,
    role: "payoff",
    gainKind: "payoff",
    change: `Land the supplied ending: ${endpointLabel}. Let the selected movie turn that supplied state into a clean final attitude without inventing a new fact.`,
    next: endpointLabel,
    frontier: endpointLabel,
    necessity: "The supplied endpoint closes the discovered movie.",
    eventIds: [previous, endpoint],
    attentionFunction: "payoff",
    setsUp: [previousLabel],
    paysOff: [endpointLabel],
    creativeMove:
      kind === "character" || kind === "contradiction" || kind === "transformation"
        ? "status_inversion"
        : "recontextualization",
    nextBeatPullTarget: 0,
  };
}

function movieToBeats(graph: RealityGraph, movie: MovieCandidate): PlannedAuthorBeat[] {
  const beats: PlannedAuthorBeat[] = [beatForOpening(graph, movie.eventIds[0])];
  for (let index = 1; index < movie.eventIds.length - 1; index += 1) {
    beats.push(beatForMiddle(graph, movie.eventIds, index, movie.kind));
  }
  const previous = movie.eventIds[movie.eventIds.length - 2];
  beats.push(beatForPayoff(graph, previous, movie.endpointId, movie.kind));
  return beats.slice(0, 6).map((beat, index) => ({ ...beat, order: index + 1 }));
}

function presenceCuts(values: readonly string[] | undefined): PresenceCut[] {
  const rows = (values ?? []).map(clean).filter(Boolean);
  const cuts: PresenceCut[] = [];

  for (const row of rows) {
    const lower = row.toLowerCase();
    if (/checkout|check-out|depart|departure|left|exit/.test(lower)) {
      cuts.push({ text: row, role: "release", gainKind: "payoff", attentionFunction: "release" });
      continue;
    }
    if (/geo|location|pin|lat|lng|latitude|longitude|arrival|checkin|check-in|arrived|presence|timestamp|time/.test(lower)) {
      cuts.push({
        text: row,
        role: /geo|location|pin|lat|lng|latitude|longitude/.test(lower) ? "location" : "arrival",
        gainKind: "new_fact",
        attentionFunction: /geo|location|pin|lat|lng|latitude|longitude/.test(lower) ? "discovery" : "hook",
      });
    }
  }

  return cuts.slice(0, 3);
}

function composePresence(
  beats: PlannedAuthorBeat[],
  presence: readonly PresenceCut[],
  endpointId: string,
): PlannedAuthorBeat[] {
  if (!presence.length) return beats.map((beat, index) => ({ ...beat, order: index + 1 }));

  const endpoint = beats.find((beat) =>
    beat.eventIds.includes(endpointId) && beat.attentionFunction === "payoff",
  );
  const regular = beats.filter((beat) => beat !== endpoint);
  const arrivals = presence.filter((cut) => cut.role === "arrival" || cut.role === "location");
  const releases = presence.filter((cut) => cut.role === "release");
  const regularCapacity = Math.max(0, 6 - arrivals.length - releases.length - (endpoint ? 1 : 0));
  const output: PlannedAuthorBeat[] = [];

  for (const cut of arrivals) {
    output.push({
      order: 0,
      role: cut.role,
      gainKind: cut.gainKind,
      change: `Use the authorized presence cut exactly as supplied: ${cut.text}.`,
      next: "The experience begins.",
      frontier: cut.text,
      necessity: "User-authorized presence is an intentional film cut.",
      eventIds: [],
      attentionFunction: cut.attentionFunction,
      setsUp: [],
      paysOff: [],
      creativeMove: "none",
      nextBeatPullTarget: 0.55,
    });
  }

  output.push(...regular.slice(0, regularCapacity));

  for (const cut of releases) {
    output.push({
      order: 0,
      role: "release",
      gainKind: "payoff",
      change: `Use the authorized checkout/presence cut exactly as supplied: ${cut.text}.`,
      next: "The supplied experience has landed.",
      frontier: cut.text,
      necessity: "User-authorized checkout is an intentional film cut.",
      eventIds: [],
      attentionFunction: "release",
      setsUp: output.length ? [output[output.length - 1]?.change ?? ""] : [],
      paysOff: [],
      creativeMove: "understatement",
      nextBeatPullTarget: 0.4,
    });
  }

  if (endpoint) output.push(endpoint);
  return output.slice(0, 6).map((beat, index) => ({ ...beat, order: index + 1 }));
}

export function buildGroundedAuthorSequence(input: {
  graph: RealityGraph;
  envelope: RealityEnvelope;
  subject?: string;
  lens?: string;
  presenceSummary?: readonly string[];
}): GroundedBeatPlan | undefined {
  if (!input.graph.events.length) return undefined;

  const endpoint = endpointId(input.graph, input.envelope);
  if (!endpoint) return undefined;

  const movies = discoverMovies(input.graph, input.envelope, input.lens);
  const selected = movies[0];
  if (!selected) return undefined;

  const beats = movieToBeats(input.graph, selected);
  if (beats.length < 3) return undefined;

  const composed = composePresence(
    beats,
    presenceCuts(input.presenceSummary),
    endpoint,
  );

  return {
    premise: `${input.subject ? `${input.subject}: ` : ""}movie discovered from supplied reality${input.lens ? ` through a ${input.lens} lens` : ""}.`,
    baselineFacts: uniq(input.graph.events.map((event) => event.label), 16),
    attentionArc: composed.map((beat) => beat.attentionFunction).join(" → "),
    beats: composed,
    closing: label(input.graph, endpoint),
    source: "grounded_sequence_planner",
  };
}
