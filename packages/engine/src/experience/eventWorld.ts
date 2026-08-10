import type {
  CognitiveExperiencePlan,
  StoryBeat,
} from "@qre/contracts";

/**
 * Event-world boundary.
 *
 * The cognitive plan decides what the experience is trying to do. This module
 * turns that semantic trajectory into observable events and state transitions
 * before language realization. It is intentionally domain-neutral: a spa, a
 * haunted hallway, a family recipe, a game, or a utility task all use the same
 * event grammar.
 *
 * No facts are invented. Every event field is selected from conserved premise
 * slots, plan fields, or the already compiled beat. Missing evidence stays
 * missing rather than being filled with generic narrative machinery.
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

function roleValues(
  plan: CognitiveExperiencePlan | undefined,
  role: string,
): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function firstRole(
  plan: CognitiveExperiencePlan | undefined,
  ...roles: string[]
): string {
  for (const role of roles) {
    const value = roleValues(plan, role)[0];
    if (value) return value;
  }
  return "";
}

function subjectOf(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  return (
    firstRole(plan, "subject") ||
    clean(plan?.centralSubject) ||
    clean(beat.entities?.[0]) ||
    "the subject"
  );
}

function evidenceFor(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  return unique([
    ...roleValues(plan, "event"),
    ...roleValues(plan, "action"),
    ...roleValues(plan, "artifact"),
    ...roleValues(plan, "place"),
    ...roleValues(plan, "medium"),
    ...roleValues(plan, "transformation"),
    ...roleValues(plan, "outcome"),
    ...roleValues(plan, "affordance"),
    ...roleValues(plan, "participants"),
    ...roleValues(plan, "social"),
    ...roleValues(plan, "temporal"),
    ...roleValues(plan, "emotion"),
    ...(beat.entities ?? []),
  ]);
}

function firstEvidence(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  roles: string[],
): string {
  for (const role of roles) {
    const value = firstRole(plan, role);
    if (value) return value;
  }

  return evidenceFor(beat, plan)[0] ?? "";
}

function mechanicCorpus(plan?: CognitiveExperiencePlan): string {
  return lower([
    plan?.direction,
    plan?.purpose,
    ...(plan?.storyStructure ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.creativePossibilities ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.rewardModel ?? []),
  ].join(" "));
}

/**
 * Build the event world for one beat.
 *
 * The returned object deliberately has no new exported type. TypeScript infers
 * its shape from the conserved contract inputs, keeping the public contract
 * layer authoritative.
 */
export function buildExperienceEvent(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
) {
  const subject = subjectOf(beat, plan);
  const corpus = mechanicCorpus(plan);
  const event = firstEvidence(beat, plan, ["event", "action"]);
  const object = firstEvidence(beat, plan, ["artifact", "place", "medium", "affordance"]);
  const transformation = firstEvidence(beat, plan, ["transformation"]);
  const outcome = firstEvidence(beat, plan, ["outcome"]);
  const participants = roleValues(plan, "participants").concat(roleValues(plan, "social"));

  switch (beat.kind) {
    case "orientation":
    case "need":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "begin",
        object,
        stateChange: "arrival",
        consequence: outcome,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "hook":
    case "threshold":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "enter",
        object,
        stateChange: "engagement",
        consequence: outcome || object,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "encounter":
    case "contribution":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "encounter",
        object: object || participants[0] || "",
        stateChange: "interaction",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "instruction":
    case "action":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || firstRole(plan, "interaction") || "act",
        object,
        stateChange: "participation",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "challenge":
    case "escalation":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "respond",
        object: object || firstRole(plan, "constraint", "affordance"),
        stateChange: beat.kind === "escalation" ? "intensification" : "challenge",
        consequence: transformation || outcome,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "discovery":
    case "reveal":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "discover",
        object: object || firstRole(plan, "discovery"),
        stateChange: "knowledge",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "transformation":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || firstRole(plan, "action") || "change",
        object,
        stateBefore: firstRole(plan, "before", "origin", "temporal"),
        stateAfter: transformation || outcome,
        stateChange: transformation || "changed",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "reflection":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "retain",
        object: firstRole(plan, "memory", "artifact", "event"),
        stateChange: "interpretation",
        consequence: outcome || firstRole(plan, "meaning", "emotion"),
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "identity":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "express",
        object: object || firstRole(plan, "identity", "artifact"),
        stateChange: "identity",
        consequence: outcome,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "milestone":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "reach",
        object: firstRole(plan, "progression", "outcome") || object,
        stateChange: "progression",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "unlock":
    case "earned_access":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "unlock",
        object: object || firstRole(plan, "reward", "outcome"),
        stateChange: "access",
        consequence: outcome || firstRole(plan, "reward"),
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "payoff":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "receive",
        object: object || firstRole(plan, "reward", "outcome"),
        stateChange: "resolved",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    case "next_step":
    case "continuation":
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "continue",
        object: firstRole(plan, "future", "evolution") || plan?.futureEvolution?.[0] || object,
        stateChange: "open",
        consequence: plan?.futureEvolution?.[0] || outcome,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };

    default:
      return {
        beatId: beat.id,
        kind: beat.kind,
        subject,
        action: event || "continue",
        object,
        stateChange: corpus.includes("transform") ? "change" : "active",
        consequence: outcome || transformation,
        participants: unique(participants),
        evidence: evidenceFor(beat, plan),
      };
  }
}

/**
 * Build all event-world states for a trajectory while preserving beat order.
 */
export function buildExperienceEventWorld(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
) {
  return beats.map((beat) => buildExperienceEvent(beat, plan));
}

/**
 * A prose-ready realization hint. It does not pretend to be the final prose
 * generator; it gives that generator concrete event/state material so it can
 * dramatize the premise instead of paraphrasing semantic labels.
 */
export function eventRealizationHint(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const event = buildExperienceEvent(beat, plan);
  const subject = cap(event.subject);
  const action = clean(event.action);
  const object = clean(event.object);
  const before = clean((event as { stateBefore?: string }).stateBefore);
  const after = clean((event as { stateAfter?: string }).stateAfter);
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

  if (action && object) {
    return `${subject} ${action} ${object}.`;
  }

  if (action && consequence) {
    return `${subject} ${action}; what happens next is ${consequence}.`;
  }

  return `${subject} ${action || "continues"}.`;
}
