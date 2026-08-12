/**
 * COGNITIVE TRAJECTORY
 *
 * The trajectory is the scene compositor, not a beat counter.
 *
 * IMPORTANT DESIGN RULE:
 * Mechanics explain WHY an experience should behave a certain way.
 * They do not each earn their own beat.
 *
 * A prompt with four concrete events should not become sixteen sentences just
 * because cognition detected sixteen useful mechanics. The number of beats is
 * therefore derived primarily from concrete event density and the selected
 * causal shape.
 */

import type {
  CognitiveExperiencePlan,
  StoryBeatKind,
} from "@qre/contracts";

import {
  inferExperienceMechanics,
  type ExperienceMechanic,
  type MechanicSignal,
} from "./cognitiveMechanics.js";

export type CognitiveEventPressure = {
  mechanic: ExperienceMechanic;
  beat: StoryBeatKind;
  force: string;
  observableChange: string;
  causalRequirement: string;
};

export type CognitiveTrajectoryCandidate = {
  id: string;
  beats: StoryBeatKind[];
  score: number;
  rationale: string[];
};

export type CognitiveTrajectory = {
  beats: StoryBeatKind[];
  mechanics: MechanicSignal[];
  eventPressure: CognitiveEventPressure[];
  score: number;
  rationale: string[];
  candidates: CognitiveTrajectoryCandidate[];
};

const PHASE: Record<StoryBeatKind, number> = {
  orientation: 10,
  hook: 15,
  need: 18,
  threshold: 20,
  origin: 22,
  encounter: 30,
  challenge: 35,
  discovery: 40,
  reveal: 45,
  instruction: 30,
  action: 50,
  feedback: 55,
  contribution: 52,
  escalation: 60,
  transformation: 70,
  reflection: 75,
  provenance: 76,
  identity: 77,
  milestone: 78,
  unlock: 80,
  payoff: 90,
  earned_access: 91,
  next_step: 95,
  continuation: 100,
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|future|memory|memories|history|context|result|outcome|change|transformation|development|behavior|behaviour|reason to continue|what happens next)\b/i;

const DELIVERY = /\b(?:receipt|prompt|output|client|customer|audience|user|users|qr|nfc|scan|tag|code|message|text|send|sending|deliver|delivery)\b/i;

const CONCRETE_ACTION = /\b(?:arriv|enter|walk|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|shake|shook|chew|chewed|run|ran|call|called)\w*\b/i;

const SHAPE_SIGNALS: Record<string, ExperienceMechanic[]> = {
  completion: [
    "transformation",
    "consequence",
    "relief",
    "delight",
    "pampering",
    "indulgence",
    "contribution",
    "momentum",
  ],
  discovery: [
    "discovery",
    "surprise",
    "uncertainty",
    "suspense",
    "reveal",
    "wonder",
    "novelty",
  ],
  participatory: [
    "participation",
    "agency",
    "authorship",
    "reciprocity",
    "adaptation",
    "consequence",
  ],
  journey: [
    "anticipation",
    "momentum",
    "escalation",
    "contrast",
    "immersion",
    "relief",
  ],
};

const SHAPES: Record<string, StoryBeatKind[]> = {
  completion: [
    "orientation",
    "action",
    "escalation",
    "transformation",
    "payoff",
  ],
  discovery: [
    "orientation",
    "hook",
    "discovery",
    "reveal",
    "payoff",
  ],
  participatory: [
    "orientation",
    "action",
    "feedback",
    "transformation",
    "payoff",
  ],
  journey: [
    "orientation",
    "encounter",
    "escalation",
    "transformation",
    "payoff",
  ],
};

const PRESSURE: Partial<
  Record<ExperienceMechanic, Omit<CognitiveEventPressure, "mechanic" | "beat">>
> = {
  anticipation: {
    force: "build expectation",
    observableChange: "the next event becomes more imminent",
    causalRequirement: "the next beat must provide concrete evidence of approach",
  },
  discovery: {
    force: "reveal something previously unavailable",
    observableChange: "a concrete detail changes what the subject knows or notices",
    causalRequirement: "the discovery must come from evidence already present",
  },
  surprise: {
    force: "break the immediate expectation",
    observableChange: "an unexpected but defensible condition appears",
    causalRequirement: "the turn must attach to concrete evidence",
  },
  participation: {
    force: "make an action consequential",
    observableChange: "a participant's action changes the available condition",
    causalRequirement: "a visible response must follow the action",
  },
  consequence: {
    force: "make an earlier action matter",
    observableChange: "a later condition follows from an earlier event",
    causalRequirement: "the later state must remain traceable to the earlier action",
  },
  escalation: {
    force: "increase magnitude or consequence",
    observableChange: "the next condition exceeds the previous one",
    causalRequirement: "the increase must be visible in action, object, reaction, or result",
  },
  transformation: {
    force: "change the subject or situation",
    observableChange: "before and after are observably different",
    causalRequirement: "the change must be earned by preceding events",
  },
  contrast: {
    force: "make the difference between states visible",
    observableChange: "two conditions become easy to compare",
    causalRequirement: "the later condition must expose the earlier one by contrast",
  },
  relief: {
    force: "remove an active burden",
    observableChange: "a constrained condition becomes easier or safer",
    causalRequirement: "the relief must follow the concrete resolution",
  },
  delight: {
    force: "produce an unexpectedly satisfying response",
    observableChange: "a positive reaction follows a concrete turn",
    causalRequirement: "the reaction must be caused by what just happened",
  },
  pampering: {
    force: "increase concrete care",
    observableChange: "another layer of care is delivered",
    causalRequirement: "each care action must produce a visible condition",
  },
  indulgence: {
    force: "add desirable excess",
    observableChange: "an optional but concrete extra enters the experience",
    causalRequirement: "the extra must build on what is already happening",
  },
  agency: {
    force: "make choice consequential",
    observableChange: "the world responds to a participant's choice",
    causalRequirement: "the response must be visible",
  },
  authorship: {
    force: "make contribution identifiable",
    observableChange: "the result bears evidence of who shaped it",
    causalRequirement: "the authored change must persist into the result",
  },
  reciprocity: {
    force: "make interaction produce a response",
    observableChange: "one side responds to what the other did",
    causalRequirement: "the response must reference the preceding action",
  },
  adaptation: {
    force: "change behavior because of what just happened",
    observableChange: "the next action differs in response to current state",
    causalRequirement: "the reason for the adaptation must remain identifiable",
  },
  momentum: {
    force: "let the current state propel the next event",
    observableChange: "one event naturally creates pressure for another",
    causalRequirement: "the next beat must follow from the changed state",
  },
  uncertainty: {
    force: "withhold certainty",
    observableChange: "a concrete question remains unresolved",
    causalRequirement: "the reveal must answer the question with evidence",
  },
  suspense: {
    force: "delay resolution under pressure",
    observableChange: "a risk or unknown condition becomes harder to ignore",
    causalRequirement: "the unresolved condition must tighten before release",
  },
  reveal: {
    force: "make hidden information visible",
    observableChange: "a concrete detail becomes available",
    causalRequirement: "the reveal must expose a detail rather than explain it",
  },
  novelty: {
    force: "introduce something not previously encountered",
    observableChange: "a genuinely new concrete element enters attention",
    causalRequirement: "the new element must affect what happens next",
  },
  wonder: {
    force: "expand perceived possibility through discovery",
    observableChange: "a concrete discovery is more remarkable than expected",
    causalRequirement: "the remarkable turn must come from the discovery",
  },
  immersion: {
    force: "increase environmental involvement",
    observableChange: "more of the surrounding world becomes active",
    causalRequirement: "the environment must affect attention or action",
  },
};

function activeSignals(signals: MechanicSignal[]): MechanicSignal[] {
  return signals
    .filter((signal) => signal.confidence >= 0.55)
    .sort((a, b) => b.confidence - a.confidence);
}

function mechanicScore(
  signals: MechanicSignal[],
  shape: string,
): number {
  const wanted = new Set(SHAPE_SIGNALS[shape] ?? []);

  return activeSignals(signals).reduce(
    (score, signal) =>
      score + (wanted.has(signal.mechanic) ? signal.confidence * 2 : 0),
    0,
  );
}

function signalEvidence(
  signals: MechanicSignal[],
): string[] {
  return activeSignals(signals).map(
    (signal) => `${signal.mechanic}: ${signal.evidence.join("; ")}`,
  );
}

function premiseValues(
  plan: CognitiveExperiencePlan | undefined,
  role: string,
): string[] {
  return [...new Set(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map((value) => String(value).replace(/\s+/g, " ").trim())
      .filter(Boolean) ?? [],
  )];
}

function concrete(value: string): boolean {
  const text = value.trim();
  return Boolean(
    text &&
    text.length >= 3 &&
    !ABSTRACT.test(text) &&
    !DELIVERY.test(text),
  );
}

function countConcreteEvents(
  plan?: CognitiveExperiencePlan,
  prompt?: string,
): number {
  const premiseEvents = [
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "outcome"),
    ...premiseValues(plan, "transformation"),
  ].filter(concrete);

  const promptActions = (prompt ?? "")
    .toLowerCase()
    .match(CONCRETE_ACTION) ?? [];

  const actionCount = new Set(promptActions.map((value) => value.toLowerCase())).size;
  const directCount = premiseEvents.length;

  return Math.max(1, Math.min(7, Math.max(actionCount, directCount)));
}

function sceneSize(
  plan?: CognitiveExperiencePlan,
  prompt?: string,
): number {
  const events = countConcreteEvents(plan, prompt);

  // A scene is earned by what actually happens, not by how many mechanics
  // cognition discovered. Four concrete events generally deserve five beats:
  // arrival + action + turn + transformation + payoff.
  if (events <= 1) return 4;
  if (events === 2) return 4;
  if (events === 3) return 5;
  if (events === 4) return 5;
  if (events === 5) return 6;
  return 7;
}

function hasMechanic(
  signals: MechanicSignal[],
  mechanics: ExperienceMechanic[],
): boolean {
  const wanted = new Set(mechanics);
  return activeSignals(signals).some((signal) => wanted.has(signal.mechanic));
}

function chooseShape(
  signals: MechanicSignal[],
  plan?: CognitiveExperiencePlan,
): string {
  const candidates = ["completion", "discovery", "participatory", "journey"];

  const scored = candidates.map((shape) => ({
    shape,
    score: mechanicScore(signals, shape),
  }));

  // Completion is the universal default whenever the plan contains an actual
  // before/after or concrete outcome. This is what makes service-style stories
  // read as scenes instead of abstract journeys.
  const hasOutcome =
    premiseValues(plan, "outcome").some(concrete) ||
    premiseValues(plan, "transformation").filter(concrete).length >= 2;

  if (hasOutcome && hasMechanic(signals, ["transformation", "consequence", "relief", "pampering", "delight"])) {
    return "completion";
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.shape ?? "completion";
}

function buildScene(
  shape: string,
  size: number,
  signals: MechanicSignal[],
  plan?: CognitiveExperiencePlan,
): StoryBeatKind[] {
  const base = [...(SHAPES[shape] ?? SHAPES.completion)];
  const active = activeSignals(signals);
  const beats = [...base];

  // Extra evidence earns an extra scene beat, but only when it creates a real
  // narrative operation. We never append one beat per mechanic.
  if (size >= 6 && !beats.includes("encounter")) {
    beats.splice(1, 0, "encounter");
  } else if (size >= 6 && !beats.includes("feedback")) {
    beats.splice(Math.max(1, beats.length - 2), 0, "feedback");
  }

  if (
    size >= 7 &&
    hasMechanic(active, ["discovery", "surprise", "reveal", "novelty"]) &&
    !beats.includes("reveal")
  ) {
    beats.splice(Math.max(1, beats.length - 2), 0, "reveal");
  }

  const directiveKinds = plan?.realization?.directives
    ?.map((directive) => directive.kind)
    .filter((kind) => PHASE[kind] !== undefined) ?? [];

  // Preserve an explicit useful operation when it is both concrete and
  // compatible with the selected scene. This is intentionally bounded.
  for (const kind of directiveKinds) {
    if (beats.length >= Math.max(4, size)) break;
    if (
      [
        "action",
        "encounter",
        "challenge",
        "discovery",
        "reveal",
        "feedback",
        "contribution",
        "escalation",
        "transformation",
        "payoff",
      ].includes(kind) &&
      !beats.includes(kind)
    ) {
      const payoffIndex = beats.indexOf("payoff");
      beats.splice(payoffIndex >= 0 ? payoffIndex : beats.length, 0, kind);
    }
  }

  return unique(beats)
    .filter((beat) => PHASE[beat] !== undefined)
    .sort((a, b) => PHASE[a] - PHASE[b])
    .slice(0, Math.max(4, Math.min(7, size)));
}

function scoreTrajectory(
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
  shape: string,
): number {
  let score = mechanicScore(signals, shape);

  for (const signal of activeSignals(signals)) {
    const pressureBeat = SHAPE_SIGNALS[shape]?.includes(signal.mechanic)
      ? true
      : false;
    if (pressureBeat) score += signal.confidence;
  }

  if (beats.includes("orientation")) score += 0.4;
  if (beats.includes("payoff")) score += 1.0;
  if (beats.includes("transformation")) score += 0.8;
  if (beats.length >= 4 && beats.length <= 6) score += 0.6;

  // Shorter scenes win ties. Long output must be earned by evidence.
  score -= Math.max(0, beats.length - 5) * 0.45;

  return Number(score.toFixed(3));
}

function alternativeShape(primary: string): string {
  switch (primary) {
    case "discovery":
      return "completion";
    case "participatory":
      return "completion";
    case "journey":
      return "completion";
    default:
      return "journey";
  }
}

function candidate(
  id: string,
  shape: string,
  beats: StoryBeatKind[],
  signals: MechanicSignal[],
): CognitiveTrajectoryCandidate {
  return {
    id,
    beats,
    score: scoreTrajectory(beats, signals, shape),
    rationale: [
      `${shape} scene shape selected from concrete evidence and active mechanics`,
      `scene length is bounded by event density rather than mechanic count`,
    ],
  };
}

export function composeCognitiveTrajectory(args: {
  plan?: CognitiveExperiencePlan;
  prompt?: string;
}): CognitiveTrajectory {
  const mechanics = inferExperienceMechanics({
    plan: args.plan,
    premise: args.plan?.premise,
    prompt: args.prompt,
  });

  const size = sceneSize(args.plan, args.prompt);
  const shape = chooseShape(mechanics, args.plan);
  const beats = buildScene(shape, size, mechanics, args.plan);

  const alternate = alternativeShape(shape);
  const alternateBeats = buildScene(
    alternate,
    size,
    mechanics,
    args.plan,
  );

  const candidates = [
    candidate("primary", shape, beats, mechanics),
    candidate("alternative", alternate, alternateBeats, mechanics),
  ].sort((a, b) => b.score - a.score);

  const eventPressure: CognitiveEventPressure[] = [];
  for (const signal of activeSignals(mechanics)) {
    const pressure = PRESSURE[signal.mechanic];
    if (!pressure) continue;

    const compatibleBeat = beats.find((beat) =>
      SHAPE_SIGNALS[shape]?.includes(signal.mechanic) &&
      ["hook", "encounter", "action", "feedback", "discovery", "reveal", "escalation", "transformation", "payoff"].includes(beat),
    );

    if (!compatibleBeat) continue;

    eventPressure.push({
      mechanic: signal.mechanic,
      beat: compatibleBeat,
      ...pressure,
    });
  }

  return {
    beats,
    mechanics,
    eventPressure,
    score: candidates[0]?.score ?? 0,
    rationale: [
      `selected ${shape} from concrete event density`,
      `scene budget: ${size} beats`,
      ...signalEvidence(mechanics).slice(0, 8),
    ],
    candidates,
  };
}
