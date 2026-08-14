import type { CognitiveExperiencePlan, CognitiveExperienceRealization, CognitiveBeatDirective, ExperienceMeaning, ExperienceType, ExperienceTone, ExperienceEntities, CognitivePremise, CognitivePremiseRole, CognitivePremiseRelation, CognitivePremiseSlot } from "@qre/contracts";
import type { WorldModel, WorldEvent } from "./worldModel.js";
import type { SignificanceResult } from "./significanceEngine.js";
import type { CreativeCandidate } from "./creativePolicy.js";

export type PlannedMoment = {
  event: WorldEvent;
  text: string;
  order: number;
  kind: CognitiveBeatDirective["kind"];
  evidence: string[];
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];

function kind(index: number, total: number): CognitiveBeatDirective["kind"] {
  if (total <= 1) return "payoff";
  if (index === 0) return "orientation";
  if (index === total - 1) return "payoff";
  if (index === total - 2) return "transformation";
  return index % 2 === 0 ? "discovery" : "escalation";
}

/**
 * Experience type is an output classification, not a domain classifier.
 * The cognitive core does not inspect industries/topics to choose a compiler.
 */
function chooseType(world: WorldModel): ExperienceType {
  if (world.events.length > 1) return "story";
  if (world.memoryMatches.length > 0) return "memory";
  return "story";
}

function tones(world: WorldModel): readonly ExperienceTone[] {
  switch (world.lens) {
    case "comedy": return ["humorous", "playful", "cinematic"];
    case "horror": return ["dark", "mysterious", "cinematic"];
    case "romance": return ["romantic", "emotional", "cinematic"];
    case "wild": return ["energetic", "playful", "cinematic"];
    case "mysterious": return ["mysterious", "cinematic"];
    default: return ["cinematic"];
  }
}

function meaning(world: WorldModel): ExperienceMeaning {
  const subject = world.participants[0] ?? world.entities[0] ?? "the experience";
  return {
    why: "Turn supplied reality into an experience worth attention and memory.",
    relationship: world.participants.length > 1 ? { subject: world.participants[0]!, object: world.participants[1]!, type: "shared_experience" } : undefined,
    emotions: [world.lens],
    memories: ["persistent", "continuation"],
    desiredFeeling: [world.lens === "neutral" ? "memorable" : world.lens],
    transformation: world.events.length > 1 ? "separate facts become a connected experience" : `supplied reality becomes an experience about ${subject}`,
  };
}

function premise(world: WorldModel): CognitivePremise {
  const evidence = (values: string[]) => unique(values).map((detail) => ({ source: "prompt" as const, detail, confidence: 1 }));
  const slots: Array<{ role: CognitivePremiseRole; values: string[]; salience: number }> = [
    { role: "subject", values: world.participants.slice(0, 1), salience: 1 },
    { role: "participants", values: world.participants, salience: 1 },
    { role: "event", values: world.events.map((event) => event.action ?? event.raw), salience: 0.95 },
    { role: "artifact", values: world.events.map((event) => event.object ?? ""), salience: 0.9 },
    { role: "place", values: world.places, salience: 1 },
    { role: "temporal", values: world.times, salience: 1 },
    { role: "emotion", values: world.events.map((event) => event.state ?? ""), salience: 0.7 },
  ];
  const premiseSlots: CognitivePremiseSlot[] = slots
    .filter((slot) => slot.values.length)
    .map((slot) => ({
      role: slot.role,
      values: unique(slot.values),
      status: "observed",
      confidence: 1,
      salience: slot.salience,
      evidence: evidence(slot.values),
    }));
  const premiseRelations: CognitivePremiseRelation[] = world.relations.map((relation) => ({
    from: "participants",
    to: relation.relation === "experienced_at" ? "place" : relation.relation === "connected_to" ? "artifact" : "participants",
    relation: relation.relation,
    confidence: 1,
    evidence: evidence([relation.evidenceId]),
  }));
  return { slots: premiseSlots, relations: premiseRelations };
}

export function planExperience(world: WorldModel, significance: SignificanceResult, selected: CreativeCandidate[]): { moments: PlannedMoment[]; plan: CognitiveExperiencePlan; type: ExperienceType; tone: readonly ExperienceTone[]; meaning: ExperienceMeaning } {
  const moments = selected.map((candidate, index) => {
    const event = world.events.find((item) => item.id === candidate.eventId)!;
    return { event, text: candidate.text, order: index, kind: kind(index, selected.length), evidence: event.evidence.map((item) => item.detail) };
  });
  const realization: CognitiveExperienceRealization = {
    direction: selected.length > 1 ? "story" : "memory",
    directives: moments.map((moment) => ({ kind: moment.kind, intent: "perform the highest-value truthful change or detail", subject: moment.event.participants.join(" and "), action: moment.event.action ?? moment.event.state ?? "", stateBefore: "", stateAfter: moment.event.state ?? "", relationalFocus: unique([...moment.event.participants, moment.event.object ?? "", moment.event.place ?? "", moment.event.time ?? ""]), evidence: moment.event.evidence.map((item) => ({ source: item.source, detail: item.detail, confidence: item.confidence })), confidence: 1 })),
    semanticArc: world.events.map((event) => event.raw),
    conservedRoles: ["subject", "participants", "event", "place", "temporal", "artifact"],
    confidence: 1,
  };
  const plan: CognitiveExperiencePlan = {
    direction: selected.length > 1 ? "story" : "memory",
    centralSubject: world.participants[0] ?? world.entities[0] ?? "the experience",
    audience: [],
    whyInteract: ["experience the reality rather than read a report"],
    emotionalIntent: [world.lens === "neutral" ? "memorable" : world.lens],
    purpose: "turn reality into a causally ordered experience",
    interactionModel: ["open or scan and play sequentially"],
    storyStructure: moments.map((moment) => moment.kind),
    memoryModel: ["preserve evidence", "connect history", "leave continuation space"],
    geographicModel: world.places,
    socialModel: world.participants,
    discoveryModel: [...significance.patterns, "unusual details"],
    rewardModel: [], commerceModel: [],
    progressionModel: [...significance.changes, "new events can change meaning"],
    contentModel: world.entities,
    dynamicBehavior: ["resolve known memory before asking", "preserve identity independently of grammar", "adapt to accepted and rejected creative preferences"],
    futureEvolution: significance.continuations,
    creativePossibilities: ["contrast", "personification", "understatement", "escalation", "callback", "reveal", "earned payoff"],
    premise: premise(world),
    realization,
  };
  return { moments, plan, type: chooseType(world), tone: tones(world), meaning: meaning(world) };
}

export type PlannerEntities = ExperienceEntities;
