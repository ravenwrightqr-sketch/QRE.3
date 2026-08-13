import type { CognitiveExperiencePlan, StoryBeatKind } from "@qre/contracts";
import { inferExperienceMechanics, type ExperienceMechanic, type MechanicSignal } from "./cognitiveMechanics.js";

/**
 * Scene compositor: mechanics constrain the scene; they do not become
 * individual sentences. Length is earned by concrete evidence density.
 *
 * The trajectory is the structural bridge between cognition and realization:
 * active mechanics may require concrete beat types, and those requirements
 * must survive into the final scene plan.
 */
export type CognitiveEventPressure = { mechanic: ExperienceMechanic; beat: StoryBeatKind; force: string; observableChange: string; causalRequirement: string };
export type CognitiveTrajectoryCandidate = { id: string; beats: StoryBeatKind[]; score: number; rationale: string[] };
export type CognitiveTrajectory = { beats: StoryBeatKind[]; mechanics: MechanicSignal[]; eventPressure: CognitiveEventPressure[]; score: number; rationale: string[]; candidates: CognitiveTrajectoryCandidate[] };

const PHASE: Record<StoryBeatKind, number> = {
  orientation: 10, hook: 15, need: 18, threshold: 20, origin: 22, encounter: 30,
  challenge: 35, discovery: 40, reveal: 45, instruction: 48, action: 50,
  contribution: 52, feedback: 55, escalation: 60, transformation: 70,
  reflection: 75, provenance: 76, identity: 77, milestone: 78, unlock: 80,
  payoff: 90, earned_access: 91, next_step: 95, continuation: 100,
};

const ACTION = /\b(?:arriv|enter|walk|went|come|came|leave|left|return|groom|clean|wash|repair|fix|restore|build|make|create|design|write|cook|bake|serve|prepare|open|close|visit|travel|drive|ride|paint|dance|sing|play|choose|pick|select|decide|touch|hold|wear|taste|smell|look|see|watch|share|give|take|bring|receive|check|inspect|test|measure|install|remove|change|turn|transform|upgrade|finish|complete|celebrat|marry|photograph|capture|record|teach|learn|discover|find|collect|organize|organise|decorate|style|trim|cut|brush|dry|massage|relax|pamper|spoil|treat|ready|groomed|cleaned|repaired|polished|painted|shake|shook|chew|chewed|run|ran|call|called)\w*\b/i;
const ABSTRACT = /\b(?:situation|experience|interaction|process|journey|moment|meaning|progression|model|state|condition|possibility|potential|future|memory|memories|history|context|result|outcome|change|transformation|development|behavior|behaviour|reason to continue|what happens next)\b/i;
const DELIVERY = /\b(?:receipt|prompt|output|client|customer|audience|user|users|qr|nfc|scan|tag|code|message|text|send|sending|deliver|delivery)\b/i;

const SHAPE_SIGNALS: Record<string, ExperienceMechanic[]> = {
  completion: ["transformation", "consequence", "relief", "delight", "pampering", "indulgence", "excess", "escalation", "contribution", "momentum"],
  discovery: ["discovery", "surprise", "uncertainty", "suspense", "reveal", "wonder", "novelty"],
  participatory: ["participation", "agency", "authorship", "reciprocity", "adaptation", "consequence", "contribution"],
  journey: ["anticipation", "momentum", "escalation", "contrast", "immersion", "relief", "excess"],
};

const SHAPES: Record<string, StoryBeatKind[]> = {
  completion: ["orientation", "action", "escalation", "transformation", "payoff"],
  discovery: ["orientation", "hook", "discovery", "reveal", "payoff"],
  participatory: ["orientation", "action", "feedback", "transformation", "payoff"],
  journey: ["orientation", "encounter", "escalation", "transformation", "payoff"],
};

const PRESSURE: Partial<Record<ExperienceMechanic, Omit<CognitiveEventPressure, "mechanic" | "beat">>> = {
  anticipation: { force: "build expectation", observableChange: "the next event becomes imminent", causalRequirement: "concrete evidence must show approach" },
  discovery: { force: "reveal a hidden layer", observableChange: "a concrete detail changes attention", causalRequirement: "the discovery must come from available evidence" },
  surprise: { force: "break expectation", observableChange: "an unexpected defensible condition appears", causalRequirement: "the turn must attach to evidence" },
  participation: { force: "make action consequential", observableChange: "a participant action changes the condition", causalRequirement: "a visible response follows" },
  contribution: { force: "make contribution visible", observableChange: "a contribution changes the shared state", causalRequirement: "the contribution must be observable in what follows" },
  consequence: { force: "make action matter", observableChange: "a later condition follows an earlier event", causalRequirement: "the result remains traceable" },
  accumulation: { force: "compound prior material", observableChange: "the current state contains more than the earlier state", causalRequirement: "each added element must remain connected to prior evidence" },
  escalation: { force: "increase magnitude", observableChange: "the next condition exceeds the previous", causalRequirement: "the increase must be visible" },
  excess: { force: "make the experience disproportionately more than necessary", observableChange: "an optional concrete extra exceeds the ordinary requirement", causalRequirement: "the extra must grow from the existing experience rather than appear randomly" },
  transformation: { force: "change the subject or situation", observableChange: "before and after differ visibly", causalRequirement: "the change is earned by preceding events" },
  contrast: { force: "make states comparable", observableChange: "two conditions become visibly distinct", causalRequirement: "the later state exposes the earlier one" },
  relief: { force: "remove a burden", observableChange: "a constrained condition becomes easier", causalRequirement: "resolution causes the relief" },
  delight: { force: "produce satisfaction", observableChange: "a positive reaction follows a concrete turn", causalRequirement: "the turn causes the reaction" },
  pampering: { force: "increase care", observableChange: "another concrete layer of care appears", causalRequirement: "each care action permits the next" },
  indulgence: { force: "add desirable excess", observableChange: "an optional concrete extra appears", causalRequirement: "the extra builds on what came before" },
  agency: { force: "make choice consequential", observableChange: "the world responds to a choice", causalRequirement: "the response is visible" },
  reciprocity: { force: "make interaction reciprocal", observableChange: "one side responds to another", causalRequirement: "the response references the prior action" },
  adaptation: { force: "change behavior from feedback", observableChange: "the next action differs", causalRequirement: "the prior result explains the difference" },
  momentum: { force: "propel the next event", observableChange: "one event creates pressure for another", causalRequirement: "the next beat follows naturally" },
  uncertainty: { force: "withhold certainty", observableChange: "a concrete question remains open", causalRequirement: "later evidence answers it" },
  suspense: { force: "delay resolution", observableChange: "risk or unknown condition tightens", causalRequirement: "pressure increases before release" },
  reveal: { force: "make hidden information visible", observableChange: "a concrete detail appears", causalRequirement: "show the detail rather than explain it" },
  novelty: { force: "introduce something new", observableChange: "a new concrete element enters attention", causalRequirement: "the new element affects what follows" },
  wonder: { force: "expand possibility", observableChange: "a concrete discovery exceeds expectation", causalRequirement: "the discovery causes the turn" },
  immersion: { force: "activate the environment", observableChange: "more surroundings become active", causalRequirement: "environment changes attention or action" },
};

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const active = (signals: MechanicSignal[]): MechanicSignal[] => signals.filter((s) => s.confidence >= 0.55).sort((a, b) => b.confidence - a.confidence);

function premise(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(plan?.premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values).map((value) => String(value).replace(/\s+/g, " ").trim()).filter(Boolean) ?? []);
}

function concrete(value: string): boolean {
  return Boolean(value.trim() && value.trim().length >= 3 && !ABSTRACT.test(value) && !DELIVERY.test(value));
}

function evidenceCount(plan?: CognitiveExperiencePlan, prompt?: string): number {
  const direct = [...premise(plan, "event"), ...premise(plan, "artifact"), ...premise(plan, "outcome"), ...premise(plan, "transformation")].filter(concrete).length;
  const matches = (prompt ?? "").toLowerCase().match(new RegExp(ACTION.source, "gi")) ?? [];
  return Math.max(1, Math.min(7, Math.max(direct, new Set(matches).size)));
}

function sceneBudget(plan?: CognitiveExperiencePlan, prompt?: string): number {
  const count = evidenceCount(plan, prompt);
  if (count <= 4) return 5;
  if (count === 5) return 6;
  return 7;
}

function shapeScore(signals: MechanicSignal[], shape: string): number {
  const wanted = new Set(SHAPE_SIGNALS[shape] ?? []);
  return active(signals).reduce((score, signal) => score + (wanted.has(signal.mechanic) ? signal.confidence * 2 : 0), 0);
}

function hasMechanic(signals: MechanicSignal[], wanted: ExperienceMechanic[]): boolean {
  const set = new Set(wanted);
  return active(signals).some((signal) => set.has(signal.mechanic));
}

function chooseShape(signals: MechanicSignal[], plan?: CognitiveExperiencePlan): string {
  const hasOutcome = premise(plan, "outcome").some(concrete) || premise(plan, "transformation").filter(concrete).length >= 2;
  if (hasOutcome && hasMechanic(signals, ["transformation", "consequence", "relief", "pampering", "delight"])) return "completion";
  return ["completion", "discovery", "participatory", "journey"].map((shape) => ({ shape, score: shapeScore(signals, shape) })).sort((a, b) => b.score - a.score)[0]?.shape ?? "completion";
}

function requiredBeats(signals: MechanicSignal[]): StoryBeatKind[] {
  const required = new Set<StoryBeatKind>();
  for (const signal of active(signals)) {
    switch (signal.mechanic) {
      case "anticipation":
      case "uncertainty":
      case "suspense":
        required.add("hook");
        break;
      case "discovery":
        required.add("discovery");
        break;
      case "reveal":
        required.add("reveal");
        break;
      case "participation":
      case "contribution":
      case "pampering":
      case "accumulation":
      case "reciprocity":
        required.add("encounter");
        break;
      case "escalation":
      case "excess":
      case "indulgence":
      case "momentum":
        required.add("escalation");
        break;
      case "transformation":
        required.add("transformation");
        break;
      case "consequence":
      case "relief":
      case "delight":
      case "euphoria":
      case "celebration":
        required.add("payoff");
        break;
    }
  }
  return [...required].sort((a, b) => PHASE[a] - PHASE[b]);
}

function fitScene(shape: string, budget: number, signals: MechanicSignal[]): StoryBeatKind[] {
  const base = [...(SHAPES[shape] ?? SHAPES.completion)];
  const beats = [...base];
  const required = requiredBeats(signals);

  for (const beat of required) {
    if (!beats.includes(beat)) {
      const insertion = beats.findIndex((kind) => PHASE[kind] > PHASE[beat]);
      beats.splice(insertion < 0 ? beats.length : insertion, 0, beat);
    }
  }

  // Evidence remains the normal length governor, but a high-confidence
  // mechanic is allowed to earn the structural beat it requires.
  const maxBudget = Math.min(8, Math.max(budget, required.length >= 2 ? 6 : budget));
  const preferred = unique(beats);
  if (preferred.length <= maxBudget) return preferred.sort((a, b) => PHASE[a] - PHASE[b]);

  const protectedBeats = new Set<StoryBeatKind>(["orientation", ...required, "transformation", "payoff"]);
  return preferred
    .filter((beat) => protectedBeats.has(beat) || preferred.length <= maxBudget)
    .slice(0, maxBudget)
    .sort((a, b) => PHASE[a] - PHASE[b]);
}

function alternateShape(primary: string): string {
  if (primary === "discovery" || primary === "journey" || primary === "participatory") return "completion";
  return "journey";
}

function scoreTrajectory(beats: StoryBeatKind[], signals: MechanicSignal[], shape: string): number {
  let score = shapeScore(signals, shape);
  if (beats.includes("orientation")) score += 0.5;
  if (beats.includes("transformation")) score += 0.9;
  if (beats.includes("payoff")) score += 1.1;
  if (beats.length >= 5 && beats.length <= 6) score += 0.7;
  score += requiredBeats(signals).filter((beat) => beats.includes(beat)).length * 0.35;
  score -= Math.max(0, beats.length - 6) * 0.4;
  return Number(score.toFixed(3));
}

function candidate(id: string, shape: string, beats: StoryBeatKind[], signals: MechanicSignal[]): CognitiveTrajectoryCandidate {
  return { id, beats, score: scoreTrajectory(beats, signals, shape), rationale: [`${shape} causal scene shape`, "length derived from concrete evidence density", "active mechanics earn required structural beats", "mechanics constrain the scene instead of becoming individual beats"] };
}

function pressureBeat(mechanic: ExperienceMechanic, beats: StoryBeatKind[]): StoryBeatKind | undefined {
  const preferred: Partial<Record<ExperienceMechanic, StoryBeatKind[]>> = {
    anticipation: ["hook", "encounter"],
    discovery: ["discovery", "reveal"],
    surprise: ["hook", "encounter", "reveal"],
    participation: ["encounter", "action", "feedback"],
    contribution: ["encounter", "contribution"],
    accumulation: ["encounter", "escalation"],
    consequence: ["escalation", "transformation", "payoff"],
    escalation: ["escalation", "transformation"],
    excess: ["escalation", "payoff"],
    pampering: ["encounter", "action", "escalation"],
    indulgence: ["escalation", "payoff"],
    transformation: ["transformation", "payoff"],
    contrast: ["action", "transformation"],
    relief: ["transformation", "payoff"],
    delight: ["payoff"],
    agency: ["action", "feedback"],
    reciprocity: ["encounter", "feedback"],
    adaptation: ["feedback", "transformation"],
    momentum: ["escalation", "encounter"],
    uncertainty: ["hook", "discovery"],
    suspense: ["hook", "reveal"],
    reveal: ["reveal"],
    novelty: ["encounter", "discovery"],
    wonder: ["discovery", "payoff"],
    immersion: ["encounter", "transformation"],
  };
  return (preferred[mechanic] ?? []).find((beat) => beats.includes(beat));
}

export function composeCognitiveTrajectory(args: { plan?: CognitiveExperiencePlan; prompt?: string }): CognitiveTrajectory {
  const mechanics = inferExperienceMechanics({ plan: args.plan, premise: args.plan?.premise, prompt: args.prompt });
  const budget = sceneBudget(args.plan, args.prompt);
  const shape = chooseShape(mechanics, args.plan);
  const beats = fitScene(shape, budget, mechanics);
  const altShape = alternateShape(shape);
  const alternate = fitScene(altShape, budget, mechanics);
  const candidates = [candidate("primary", shape, beats, mechanics), candidate("alternative", altShape, alternate, mechanics)].sort((a, b) => b.score - a.score);

  const eventPressure: CognitiveEventPressure[] = [];
  for (const signal of active(mechanics)) {
    const pressure = PRESSURE[signal.mechanic];
    const beat = pressureBeat(signal.mechanic, beats);
    if (!pressure || !beat) continue;
    eventPressure.push({ mechanic: signal.mechanic, beat, ...pressure });
  }

  return {
    beats,
    mechanics,
    eventPressure,
    score: candidates[0]?.score ?? 0,
    rationale: [`scene budget: ${budget} beats`, `selected shape: ${shape}`, `required beats: ${requiredBeats(mechanics).join(", ") || "none"}`, ...active(mechanics).slice(0, 10).map((s) => `${s.mechanic}: ${s.evidence.join("; ")}`)],
    candidates,
  };
}
