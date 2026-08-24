/**
 * QRE GROUNDED AUTHOR SEQUENCE PLANNER
 *
 * One canonical responsibility:
 *   RealityGraph + Cognition + optional lens + optional presence
 *   -> a short sequence of grounded semantic cuts.
 *
 * This is the movie-selection boundary.
 * It never writes viewer prose and never invents facts.
 * Latent movies are hypotheses only; this planner owns beat selection.
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
    | "release";
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
  role: "arrival" | "location" | "completion";
  gainKind: "new_fact" | "payoff";
  attentionFunction: "hook" | "discovery" | "payoff";
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const uniq = (values: readonly string[], limit = 24): string[] =>
  [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);

const words = (value: string): string[] =>
  clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 3);

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

function eventById(graph: RealityGraph, id: string) {
  return graph.events.find((event) => event.id === id);
}

function relationBetween(graph: RealityGraph, a: string, b: string): RealityRelation[] {
  return graph.relations
    .filter(
      (relation) =>
        (relation.from === a && relation.to === b) ||
        (relation.from === b && relation.to === a),
    )
    .sort((left, right) => right.strength - left.strength);
}

function relationScore(graph: RealityGraph, from: string, to: string): number {
  const relation = relationBetween(graph, from, to)[0];
  return relation ? relation.strength : 0;
}

function relationKind(graph: RealityGraph, from: string, to: string): RealityRelation["kind"] | undefined {
  return relationBetween(graph, from, to)[0]?.kind;
}

function eventSalience(
  graph: RealityGraph,
  eventId: string,
  endpointId: string,
  recurring: readonly string[],
): number {
  const event = eventById(graph, eventId);
  if (!event) return 0;

  const incident = graph.relations
    .filter((relation) => relation.from === eventId || relation.to === eventId)
    .reduce((sum, relation) => sum + relation.strength, 0);

  const specificity = Math.min(1, words(event.label).length * 0.09 + event.entities.length * 0.04);
  const repeated = recurring.some((signal) => event.label.toLowerCase().includes(signal.toLowerCase())) ? 0.18 : 0;
  const endpoint = eventId === endpointId ? 0.22 : 0;
  const state = /\b(?:nervous|scared|happy|proud|fierce|angry|sad|excited|calm|tired)\b/i.test(event.label) ? 0.13 : 0;
  const action = /\b(?:came|arrived|started|met|stole|shook|cleaned|finished|left|returned|walked|made|got)\b/i.test(event.label) ? 0.12 : 0;

  return metric(Math.min(1, incident * 0.22 + specificity * 0.28 + repeated + endpoint + state + action));
}

function relationTransition(kind: RealityRelation["kind"] | undefined) {
  switch (kind) {
    case "contrasts":
      return { attention: "reframe" as const, role: "reframe", gain: "reframe", move: "contrast" as const };
    case "recontextualizes":
      return { attention: "reframe" as const, role: "reframe", gain: "reframe", move: "recontextualization" as const };
    case "changes":
      return { attention: "escalation" as const, role: "escalation", gain: "escalation", move: "status_inversion" as const };
    case "repeats":
      return { attention: "callback" as const, role: "callback", gain: "callback", move: "callback" as const };
    case "before":
    case "after":
      return { attention: "turn" as const, role: "consequence", gain: "consequence", move: "recontextualization" as const };
    case "involves":
      return { attention: "turn" as const, role: "discovery", gain: "discovery", move: "implication" as const };
    case "converges":
      return { attention: "turn" as const, role: "discovery", gain: "discovery", move: "recontextualization" as const };
    default:
      return { attention: "turn" as const, role: "discovery", gain: "discovery", move: "none" as const };
  }
}

function lexicalOverlap(a: string, b: string): number {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return 0;
  let hits = 0;
  for (const token of left) if (right.has(token)) hits += 1;
  return hits / left.size;
}

function lensBoost(lens: string | undefined, label: string): number {
  const value = `${lens ?? ""} ${label}`.toLowerCase();
  if (/game|round|mission|heist|spy/.test(value) && /again|still|round|started|finished|clean|bath|kitchen|service/.test(value)) return 0.08;
  if (/noir|horror|dark/.test(value) && /night|door|knife|glass|missing|again|still/.test(value)) return 0.08;
  if (/funny|comedy|absurd|fierce/.test(value) && /hates|loves|stole|bow|dryer|bulldog|sand/.test(value)) return 0.08;
  return 0;
}

function chooseOpening(graph: RealityGraph, envelope: RealityEnvelope): string | undefined {
  const candidates = envelope.openingEventIds.length
    ? envelope.openingEventIds
    : graph.events.map((event) => event.id);

  return candidates
    .map((id) => ({
      id,
      score:
        (envelope.openingEventIds.includes(id) ? 0.3 : 0) +
        (/\b(?:nervous|scared|first|came|arrived|started|began)\b/i.test(eventById(graph, id)?.label ?? "") ? 0.24 : 0) +
        eventSalience(graph, id, envelope.endpointEventId, envelope.recurringSignals),
    }))
    .sort((a, b) => b.score - a.score)[0]?.id;
}

function chooseNext(
  graph: RealityGraph,
  selected: readonly string[],
  endpointId: string,
  lens: string | undefined,
): { id: string; relation?: RealityRelation["kind"]; score: number } | undefined {
  const used = new Set(selected);
  const current = selected[selected.length - 1];
  const unused = graph.events.filter((event) => !used.has(event.id) && event.id !== endpointId);

  const ranked = unused
    .map((event) => {
      const direct = current ? relationScore(graph, current, event.id) : 0;
      const toSelected = Math.max(
        ...selected.map((id) => relationScore(graph, id, event.id)),
        0,
      );
      const endpointLink = endpointId ? relationScore(graph, event.id, endpointId) : 0;
      const novelty = selected.length ? 1 - lexicalOverlap(event.label, selected.map((id) => eventById(graph, id)?.label ?? "").join(" ")) : 1;
      const score = metric(
        direct * 0.34 +
        toSelected * 0.18 +
        endpointLink * 0.2 +
        eventSalience(graph, event.id, endpointId, []) * 0.16 +
        novelty * 0.08 +
        lensBoost(lens, event.label),
      );
      return { id: event.id, relation: relationKind(graph, current ?? "", event.id), score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0];
}

function chooseBridge(
  graph: RealityGraph,
  selected: readonly string[],
  endpointId: string,
): string | undefined {
  const used = new Set(selected);
  return graph.events
    .filter((event) => event.id !== endpointId && !used.has(event.id))
    .map((event) => ({
      id: event.id,
      score:
        Math.max(...selected.map((id) => relationScore(graph, id, event.id)), 0) * 0.58 +
        relationScore(graph, event.id, endpointId) * 0.42,
    }))
    .sort((a, b) => b.score - a.score)[0]?.id;
}

function presenceCuts(values: readonly string[] | undefined): PresenceCut[] {
  const rows = (values ?? []).map(clean).filter(Boolean);
  const cuts: PresenceCut[] = [];

  for (const row of rows) {
    const lower = row.toLowerCase();
    if (/checkout|check-out|depart|departure|left|exit/.test(lower)) {
      cuts.push({ text: row, role: "completion", gainKind: "payoff", attentionFunction: "payoff" });
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

  return cuts.slice(0, 4);
}

function makeBeat(
  graph: RealityGraph,
  fromId: string | undefined,
  toId: string,
  order: number,
  endpoint: boolean,
  selected: readonly string[],
  lens: string | undefined,
): PlannedAuthorBeat {
  const to = eventById(graph, toId);
  const from = fromId ? eventById(graph, fromId) : undefined;
  const kind = relationKind(graph, fromId ?? "", toId);
  const transition = endpoint
    ? { attention: "payoff" as const, role: "payoff", gain: "payoff", move: "recontextualization" as const }
    : relationTransition(kind);
  const source = to?.label ?? "supplied evidence";
  const prior = from?.label ?? "the established reality";
  const pull = endpoint ? 0 : metric(0.5 + lensBoost(lens, source) + relationScore(graph, fromId ?? "", toId) * 0.35);

  return {
    order,
    role: transition.role,
    gainKind: transition.gain,
    change: endpoint
      ? `Land the supplied endpoint: ${source}.`
      : `${kind ?? "connects"}: ${prior} -> ${source}.`,
    next: endpoint ? source : `What does ${source} change next?`,
    frontier: endpoint ? source : source,
    necessity: selected.length === 0
      ? "Establishes the strongest supplied opening state."
      : "Earns the next cut through an evidence-backed relationship or changed significance.",
    eventIds: [toId],
    attentionFunction: transition.attention,
    setsUp: from ? [from.label] : [],
    paysOff: endpoint ? [source] : [],
    creativeMove: transition.move,
    nextBeatPullTarget: pull,
  };
}

export function buildGroundedAuthorSequence(input: {
  graph: RealityGraph;
  envelope: RealityEnvelope;
  subject?: string;
  lens?: string;
  presenceSummary?: readonly string[];
}): GroundedBeatPlan | undefined {
  if (!input.graph.events.length) return undefined;

  const endpointId = input.envelope.endpointEventId || input.graph.events[input.graph.events.length - 1]?.id || "";
  if (!endpointId) return undefined;

  const opening = chooseOpening(input.graph, input.envelope) ?? input.graph.events[0]?.id;
  if (!opening) return undefined;

  const material = input.graph.events.length;
  const relationCount = input.graph.relations.length;
  const attentionRich = material >= 4 && relationCount >= 2;
  const softTarget = Math.min(6, Math.max(3, Math.round(2.5 + material * 0.45)));

  const selected: string[] = [opening];
  const beats: PlannedAuthorBeat[] = [
    makeBeat(input.graph, undefined, opening, 1, false, [], input.lens),
  ];

  while (selected.length < softTarget - 1) {
    const next = chooseNext(input.graph, selected, endpointId, input.lens);
    if (!next || next.score < 0.38) break;
    selected.push(next.id);
    beats.push(makeBeat(input.graph, selected[selected.length - 2], next.id, beats.length + 1, false, selected, input.lens));
  }

  if (attentionRich && beats.length < 3) {
    const bridge = chooseBridge(input.graph, selected, endpointId);
    if (bridge) {
      selected.push(bridge);
      beats.push(makeBeat(input.graph, selected[selected.length - 2], bridge, beats.length + 1, false, selected, input.lens));
    }
  }

  if (!selected.includes(endpointId)) {
    selected.push(endpointId);
    beats.push(makeBeat(input.graph, selected.length > 1 ? selected[selected.length - 2] : undefined, endpointId, beats.length + 1, true, selected, input.lens));
  } else {
    const endpointIndex = beats.findIndex((beat) => beat.eventIds.includes(endpointId));
    if (endpointIndex >= 0) {
      beats.splice(endpointIndex, 1);
      selected.splice(selected.indexOf(endpointId), 1);
      selected.push(endpointId);
      beats.push(makeBeat(input.graph, selected.length > 1 ? selected[selected.length - 2] : undefined, endpointId, beats.length + 1, true, selected, input.lens));
    }
  }

  const presence = presenceCuts(input.presenceSummary);
  if (presence.length) {
    const arrival = presence.filter((cut) => cut.role === "arrival" || cut.role === "location");
    const completion = presence.filter((cut) => cut.role === "completion");
    const insertAt = Math.min(1, beats.length);

    for (const cut of [...arrival].reverse()) {
      beats.splice(insertAt, 0, {
        order: 0,
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.text,
        next: "The real work starts here.",
        frontier: cut.text,
        necessity: "User-authorized presence is an intentional film moment.",
        eventIds: [],
        attentionFunction: cut.attentionFunction,
        setsUp: [],
        paysOff: [],
        creativeMove: "none",
        nextBeatPullTarget: 0.52,
      });
    }

    for (const cut of completion) {
      const end = beats.length - 1;
      beats.splice(Math.max(0, end), 0, {
        order: 0,
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.text,
        next: "",
        frontier: cut.text,
        necessity: "User-authorized check-out/presence is an intentional film moment.",
        eventIds: [],
        attentionFunction: cut.attentionFunction,
        setsUp: beats.length ? [beats[Math.max(0, end - 1)]?.change ?? ""] : [],
        paysOff: [],
        creativeMove: "none",
        nextBeatPullTarget: 0.45,
      });
    }
  }

  const normalized = beats
    .slice(0, 6)
    .map((beat, index) => ({ ...beat, order: index + 1 }));

  const arc = normalized.map((beat) => beat.attentionFunction).join(" → ");
  const baselineFacts = uniq([
    ...(input.graph.events.slice(0, 8).map((event) => event.label)),
    ...(input.envelope.recurringSignals ?? []),
  ], 16);

  return {
    premise: `${input.subject ? `${input.subject}: ` : ""}grounded short-film sequence from supplied reality${input.lens ? ` through a ${input.lens} lens` : ""}.`,
    baselineFacts,
    attentionArc: arc,
    beats: normalized,
    closing: eventById(input.graph, endpointId)?.label,
    source: "grounded_sequence_planner",
  };
}
