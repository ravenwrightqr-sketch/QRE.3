import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  StoryBeat,
} from "@qre/contracts";

/**
 * Role-aware semantic realization.
 *
 * The semantic directive produced by cognition is authoritative. This layer
 * turns that operation-level meaning into presentation copy, then falls back
 * to conserved-premise realization for compatibility with older plans.
 */

const clean = (value: string) => value.replace(/\s+/g, " ").trim();
const cap = (value: string) => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The experience";
};
const sentence = (value: string) => clean(value).replace(/[.!?]+$/, "");
const lower = (value: string) => clean(value).toLowerCase();

const DEAD = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
];

function values(premise: CognitivePremise | undefined, role: string): string[] {
  return [
    ...new Set(
      premise?.slots
        .filter((slot) => slot.role === role)
        .flatMap((slot) => slot.values)
        .map(clean)
        .filter(Boolean) ?? [],
    ),
  ];
}

function first(premise: CognitivePremise | undefined, role: string): string {
  return values(premise, role)[0] ?? "";
}

function join(valuesValue: string[], fallback: string): string {
  if (!valuesValue.length) return fallback;
  if (valuesValue.length === 1) return valuesValue[0];
  if (valuesValue.length === 2) return `${valuesValue[0]} and ${valuesValue[1]}`;
  return `${valuesValue.slice(0, -1).join(", ")}, and ${valuesValue.at(-1)}`;
}

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function generic(value: string): boolean {
  return DEAD.some((pattern) => pattern.test(value));
}

function directiveText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const directive = plan?.realization?.directives.find(
    (candidate) => candidate.kind === beat.kind,
  );

  if (!directive || directive.confidence < 0.72) return undefined;

  const subject = directive.subject || plan?.centralSubject || beat.entities?.[0] || "the subject";
  const action = sentence(directive.action);
  const after = sentence(directive.stateAfter);

  switch (beat.kind) {
    case "orientation":
      return `${cap(subject)} establishes the experience by ${action}.`;
    case "hook":
      return `${cap(subject)} gives the interaction a reason to continue: ${action}.`;
    case "need":
      return `${cap(subject)} begins with the immediate need: ${action}.`;
    case "threshold":
      return `${cap(subject)} crosses from the known into the next layer by ${action}.`;
    case "origin":
      return `${cap(subject)} brings available history into the present: ${action}.`;
    case "encounter":
      return `${cap(subject)} brings the next relationship into the experience: ${action}.`;
    case "challenge":
      return `${cap(subject)} presents a condition that must be resolved: ${action}.`;
    case "discovery":
      return `${cap(subject)} makes the next relationship meaningful by ${action}.`;
    case "reveal":
      return `${cap(subject)} reveals what the evidence supports: ${action}.`;
    case "instruction":
      return `${cap(subject)} provides the useful next move: ${action}.`;
    case "action":
      return `Act on ${subject}: ${action}.`;
    case "feedback":
      return `The result becomes evidence for ${subject}: ${action}.`;
    case "contribution":
      return `${cap(subject)} changes when participation becomes contribution: ${action}.`;
    case "escalation":
      return `${cap(subject)} increases the consequence of what happened before: ${action}.`;
    case "transformation":
      return `${cap(subject)} changes through the accumulated interaction: ${action}.`;
    case "reflection":
      return `${cap(subject)} retains what the interaction means now: ${action}.`;
    case "provenance":
      return `${cap(subject)} carries the available evidence: ${action}.`;
    case "identity":
      return `${cap(subject)} becomes an identity-bearing subject through ${action}.`;
    case "milestone":
      return `${cap(subject)} reaches a meaningful state: ${action}.`;
    case "unlock":
      return `${cap(subject)} opens the next state through ${action}.`;
    case "earned_access":
      return `${cap(subject)} earns the next state through ${action}.`;
    case "payoff":
      return `${cap(subject)} reaches the intended result: ${action}.`;
    case "next_step":
      return `${cap(subject)} uses the current state to continue: ${action}.`;
    case "continuation":
      return `${cap(subject)} remains open to what comes next: ${action}.`;
    default:
      return `${cap(subject)} advances the experience through ${action}.`;
  }

  // Keep the state transition available to the type checker and future
  // renderers; the current copy intentionally foregrounds the operation.
  void after;
}

function evidenceLine(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const p = premise(plan);
  const subject = first(p, "subject") || plan?.centralSubject || beat.entities?.[0] || "the experience";
  const event = first(p, "event");
  const medium = first(p, "medium");
  const artifact = first(p, "artifact");
  const outcome = first(p, "outcome");
  const participants = values(p, "participants");
  const place = first(p, "place");
  const temporal = first(p, "temporal");

  const clauses = [
    event ? `event: ${event}` : "",
    medium ? `medium: ${medium}` : "",
    artifact ? `artifact: ${artifact}` : "",
    participants.length ? `participants: ${join(participants.slice(0, 3), "participants")}` : "",
    place ? `place: ${place}` : "",
    temporal ? `time: ${temporal}` : "",
    outcome ? `outcome: ${outcome}` : "",
  ].filter(Boolean);

  if (!clauses.length) return cap(subject);
  return `${cap(subject)} carries ${clauses.join("; ")}.`;
}

function fallbackRealize(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const p = premise(plan);
  const subject = first(p, "subject") || plan?.centralSubject || beat.entities?.[0] || "the experience";
  const event = first(p, "event");
  const medium = first(p, "medium");
  const artifact = first(p, "artifact");
  const outcome = first(p, "outcome");
  const emotion = first(p, "emotion");
  const affordance = first(p, "affordance");
  const temporal = first(p, "temporal");
  const place = first(p, "place");
  const social = values(p, "social");
  const constraint = first(p, "constraint");
  const transformation = values(p, "transformation");
  const why = plan?.whyInteract?.[0] ?? "";
  const progression = plan?.progressionModel?.[0] ?? "";
  const dynamic = plan?.dynamicBehavior?.[0] ?? "";
  const future = plan?.futureEvolution?.[0] ?? "";
  const content = plan?.contentModel?.[0] ?? "";

  switch (beat.kind) {
    case "orientation":
      if (event && medium) return `${cap(subject)} is positioned inside ${event} through ${medium}${place ? ` at ${place}` : ""}.`;
      if (event) return `${cap(subject)} is situated in ${event}${place ? ` at ${place}` : ""}.`;
      if (artifact) return `${cap(subject)} is carried by ${artifact}.`;
      return evidenceLine(beat, plan);
    case "hook":
      if (outcome) return `${cap(subject)} is built around ${sentence(outcome)}.`;
      if (why) return `${cap(why)} ${cap(subject)} makes that intent concrete.`;
      return `${cap(subject)} gives the interaction a concrete reason to continue.`;
    case "need":
      if (constraint) return `${cap(subject)} must honor the constraint: ${sentence(constraint)}.`;
      if (outcome) return `${cap(subject)} starts with the outcome: ${sentence(outcome)}.`;
      return `${cap(subject)} starts from the concrete need in the premise.`;
    case "threshold":
      if (medium && event) return `${cap(subject)} becomes a threshold into ${event} through ${medium}.`;
      if (affordance) return `${cap(subject)} moves from observation into ${sentence(affordance)}.`;
      return `${cap(subject)} moves from observation into participation.`;
    case "origin":
      if (artifact && place) return `${cap(subject)} carries ${artifact} back to ${place}.`;
      if (artifact) return `${cap(subject)} carries its history through ${artifact}.`;
      return `${cap(subject)} brings the supplied history into the present.`;
    case "encounter":
      if (event && artifact) return `${cap(artifact)} meets ${event} through ${subject}, changing what can happen next.`;
      if (social.length && subject) return `${cap(subject)} meets ${join(social.slice(0, 3), "the participants")}, changing the available experience.`;
      return `${cap(subject)} encounters ${artifact || event || "the next concrete condition"}, changing what can happen next.`;
    case "challenge":
      if (constraint) return `${cap(subject)} has to resolve ${sentence(constraint)}.`;
      if (progression) return `${cap(subject)} encounters the next condition in ${sentence(progression)}.`;
      return `${cap(subject)} has to resolve the next concrete condition in the premise.`;
    case "discovery":
    case "reveal":
      if (event && medium) return `${cap(subject)} reveals what ${medium} opens inside ${event}.`;
      if (artifact && outcome) return `${cap(subject)} reveals how ${artifact} connects to ${sentence(outcome)}.`;
      if (content) return `${cap(subject)} reveals ${sentence(content)}.`;
      return `${cap(subject)} reveals another fact carried by the premise.`;
    case "instruction":
      if (content) return `${cap(subject)} provides the useful information: ${sentence(content)}.`;
      if (affordance) return `${cap(subject)} turns the request into a usable action: ${sentence(affordance)}.`;
      return `${cap(subject)} supplies the next usable piece of information.`;
    case "action":
      if (affordance) return `Act on ${subject}: ${sentence(affordance)}.`;
      return `${cap(subject)} turns the premise into the next concrete action.`;
    case "feedback":
      if (outcome) return `The result feeds back into ${subject}: ${sentence(outcome)}.`;
      return `${cap(subject)} uses the result as evidence for the next decision.`;
    case "contribution":
      if (social.length && outcome) return `${cap(join(social.slice(0, 2), "participants"))} can contribute to ${subject}, moving it toward ${sentence(outcome)}.`;
      if (progression) return `${cap(subject)} changes when new material is added: ${sentence(progression)}.`;
      return `${cap(subject)} changes when new material is added.`;
    case "escalation":
      if (event && temporal) return `${cap(subject)} escalates as ${event} and ${temporal} add new conditions.`;
      if (progression) return `${cap(subject)} escalates through ${sentence(progression)}.`;
      return `${cap(subject)} raises the stakes around what comes next.`;
    case "transformation":
      if (transformation.length >= 2) return `${cap(transformation[0])} becomes ${sentence(transformation[1])}.`;
      if (outcome) return `${cap(subject)} changes toward ${sentence(outcome)}.`;
      return `${cap(subject)} changes because of the preceding interaction.`;
    case "reflection":
      if (emotion) return `${cap(subject)} retains ${sentence(emotion)} as part of the experience.`;
      if (outcome) return `${cap(subject)} retains the consequence: ${sentence(outcome)}.`;
      return `${cap(subject)} retains the consequence of what happened.`;
    case "provenance":
    case "identity":
      return evidenceLine(beat, plan);
    case "milestone":
      if (temporal && outcome) return `${cap(subject)} reaches a milestone in ${temporal}: ${sentence(outcome)}.`;
      if (progression) return `${cap(subject)} reaches a milestone in ${sentence(progression)}.`;
      return `${cap(subject)} reaches the next state established by the experience.`;
    case "unlock":
    case "earned_access":
      if (outcome) return `${cap(subject)} unlocks access tied to ${sentence(outcome)}.`;
      if (affordance) return `${cap(subject)} unlocks the next state through ${sentence(affordance)}.`;
      return `${cap(subject)} opens the next state because of what happened before it.`;
    case "payoff":
      if (outcome) return `${cap(subject)} reaches the payoff: ${sentence(outcome)}.`;
      if (emotion) return `${cap(subject)} resolves through ${sentence(emotion)}.`;
      return `${cap(subject)} reaches the result established by the premise.`;
    case "next_step":
      if (future) return `${cap(subject)} continues through ${sentence(future)}.`;
      if (progression) return `${cap(subject)} continues with ${sentence(progression)}.`;
      return `${cap(subject)} uses the current state to determine the next action.`;
    case "continuation":
      if (dynamic) return `${cap(subject)} remains adaptive as ${sentence(dynamic)}.`;
      if (future) return `${cap(subject)} remains open to ${sentence(future)}.`;
      if (temporal) return `${cap(subject)} carries the current state into ${sentence(temporal)}.`;
      return `${cap(subject)} remains open as new context changes what comes next.`;
    default:
      return evidenceLine(beat, plan);
  }
}

function preserveHighSalienceEvidence(
  text: string,
  plan?: CognitiveExperiencePlan,
): string {
  const p = premise(plan);
  const normalized = lower(text);
  const salient = (p?.slots ?? [])
    .filter((slot) => slot.salience >= 0.88)
    .flatMap((slot) => slot.values)
    .map(clean)
    .filter(Boolean)
    .filter((value) => !normalized.includes(lower(value)))
    .slice(0, 3);

  if (!salient.length) return text;
  return `${clean(text).replace(/[.!?]+$/, "")}. Preserved detail: ${salient.join(", ")}.`;
}

export function realizePremiseBeatV2(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  let text = clean(directiveText(beat, plan) ?? fallbackRealize(beat, plan));

  if (generic(text)) {
    text = evidenceLine(beat, plan);
  }

  return preserveHighSalienceEvidence(text, plan);
}

export function realizePremiseBeatsV2(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeatV2(beat, plan),
  }));
}
