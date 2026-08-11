import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";

/**
 * Converts a cognitive trajectory into observable event/state material before
 * prose realization. This is domain-neutral and evidence-first: it consumes
 * conserved premise slots and compiled beat entities, and never fabricates a
 * domain-specific event catalogue.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};

function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function roleValues(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function firstRole(plan: CognitiveExperiencePlan | undefined, ...roles: string[]): string {
  for (const role of roles) {
    const value = roleValues(plan, role)[0];
    if (value) return value;
  }
  return "";
}

function subjectOf(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return (
    firstRole(plan, "subject") ||
    clean(plan?.centralSubject) ||
    clean(beat.entities?.[0]) ||
    "the subject"
  );
}

function evidenceFor(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...(plan?.premise?.slots ?? []).flatMap((slot) => slot.values),
    ...(plan?.contentModel ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.rewardModel ?? []),
    ...(beat.entities ?? []),
  ]);
}

function participants(plan?: CognitiveExperiencePlan): string[] {
  return unique([
    ...roleValues(plan, "participants"),
    ...roleValues(plan, "social"),
  ]);
}

/**
 * Build one observable event/state record from a StoryBeat.
 *
 * The return shape is intentionally inferred rather than exported as a second
 * contract. @qre/contracts remains the authority for all public input types.
 */
export function buildExperienceEvent(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  const subject = subjectOf(beat, plan);
  const evidence = evidenceFor(beat, plan);
  const people = participants(plan);
  const action = firstRole(plan, "action", "event", "interaction");
  const object = firstRole(plan, "artifact", "place", "medium", "affordance");
  const transformation = firstRole(plan, "transformation");
  const outcome = firstRole(plan, "outcome", "reward");
  const progression = firstRole(plan, "progression");

  switch (beat.kind) {
    case "orientation":
    case "need":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "begin", object, stateChange: "arrival", consequence: outcome, participants: people, evidence };
    case "hook":
    case "threshold":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "enter", object, stateChange: "engagement", consequence: outcome || object, participants: people, evidence };
    case "encounter":
    case "contribution":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "encounter", object: object || people[0], stateChange: "interaction", consequence: outcome || transformation, participants: people, evidence };
    case "instruction":
    case "action":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "act", object, stateChange: "participation", consequence: outcome || transformation, participants: people, evidence };
    case "challenge":
    case "escalation":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "respond", object: object || firstRole(plan, "constraint"), stateChange: beat.kind === "escalation" ? "intensification" : "challenge", consequence: transformation || outcome, participants: people, evidence };
    case "discovery":
    case "reveal":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "discover", object, stateChange: "knowledge", consequence: outcome || transformation, participants: people, evidence };
    case "transformation":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "change", object, stateBefore: firstRole(plan, "before", "origin", "temporal"), stateAfter: transformation || outcome, stateChange: transformation || "changed", consequence: outcome || transformation, participants: people, evidence };
    case "reflection":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "retain", object: firstRole(plan, "memory", "artifact", "event"), stateChange: "interpretation", consequence: outcome || firstRole(plan, "meaning", "emotion"), participants: people, evidence };
    case "identity":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "express", object, stateChange: "identity", consequence: outcome, participants: people, evidence };
    case "milestone":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "reach", object: progression || object, stateChange: "progression", consequence: outcome || transformation, participants: people, evidence };
    case "unlock":
    case "earned_access":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "unlock", object: object || outcome, stateChange: "access", consequence: outcome, participants: people, evidence };
    case "payoff":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "receive", object: object || outcome, stateChange: "resolved", consequence: outcome || transformation, participants: people, evidence };
    case "next_step":
    case "continuation":
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "continue", object: plan?.futureEvolution?.[0] || object, stateChange: "open", consequence: plan?.futureEvolution?.[0] || outcome, participants: people, evidence };
    default:
      return { beatId: beat.id, kind: beat.kind, subject, action: action || "continue", object, stateChange: transformation ? "change" : "active", consequence: outcome || transformation, participants: people, evidence };
  }
}

export function buildExperienceEventWorld(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
) {
  return beats.map((beat) => buildExperienceEvent(beat, plan));
}

/**
 * Compact prose material for the language realization boundary. It describes
 * what happened, not what the compiler thinks it means.
 */
export function eventRealizationHint(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const event = buildExperienceEvent(beat, plan);
  const subject = cap(event.subject);
  const action = clean(event.action);
  const object = clean(event.object);
  const before = clean("stateBefore" in event ? event.stateBefore : "");
  const after = clean("stateAfter" in event ? event.stateAfter : "");
  const consequence = clean(event.consequence);

  if (before && after) {
    return `${subject} moves from ${before} to ${after} through ${action}${object ? ` with ${object}` : ""}${consequence ? `, leaving ${consequence}` : ""}.`;
  }
  if (after) {
    return `${subject} changes into ${after} through ${action}${object ? ` with ${object}` : ""}${consequence ? `, leaving ${consequence}` : ""}.`;
  }
  if (action && object && consequence) {
    return `${subject} ${action} ${object}, and the result is ${consequence}.`;
  }
  if (action && object) return `${subject} ${action} ${object}.`;
  if (action && consequence) return `${subject} ${action}; what happens next is ${consequence}.`;
  return `${subject} ${action || "continues"}.`;
}
