import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  StoryBeat,
} from "@qre/contracts";

/**
 * Next-generation premise realization boundary.
 *
 * Cognition owns meaning. This layer realizes that meaning as concrete story
 * language without inventing facts. It deliberately combines:
 *   1. the semantic directive,
 *   2. conserved premise roles and relations,
 *   3. lexical evidence already carried by the compiled beat.
 *
 * This is a semantic grammar, not a subject-specific template catalog.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase();
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "do", "does", "doing", "for", "from", "get", "give", "gives", "given",
  "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "make", "makes",
  "making", "me", "my", "of", "on", "or", "our", "people", "please", "that", "the",
  "their", "this", "those", "to", "turn", "up", "was", "we", "what", "when", "where",
  "which", "who", "with", "you", "your", "something", "someone", "thing", "experience",
  "story", "about", "through", "just", "more", "than", "then", "now", "will", "keep",
  "after", "before", "very", "really", "want", "needs", "need", "next", "concrete",
  "current", "available", "supported", "meaningful", "intended", "useful", "immediate",
]);

const DEAD = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
  /the operative move is/i,
];

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function values(plan: CognitiveExperiencePlan | undefined, role: string): string[] {
  return [
    ...new Set(
      premise(plan)?.slots
        .filter((slot) => slot.role === role)
        .flatMap((slot) => slot.values)
        .map(clean)
        .filter(Boolean) ?? [],
    ),
  ];
}

function first(plan: CognitiveExperiencePlan | undefined, role: string): string {
  return values(plan, role)[0] ?? "";
}

function tokens(value: unknown): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter(Boolean);
}

function distinctive(value: unknown): string[] {
  return tokens(value)
    .filter((word) => word.length > 3)
    .filter((word) => !STOP.has(lower(word)));
}

function generic(value: string): boolean {
  return DEAD.some((pattern) => pattern.test(value));
}

function evidence(plan?: CognitiveExperiencePlan, beat?: StoryBeat): string[] {
  const slotValues = (premise(plan)?.slots ?? []).flatMap((slot) => slot.values);
  const planValues = [
    ...(plan?.contentModel ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.discoveryModel ?? []),
    ...(plan?.progressionModel ?? []),
    ...(plan?.dynamicBehavior ?? []),
    ...(plan?.futureEvolution ?? []),
    ...(plan?.rewardModel ?? []),
  ];
  return [...new Set([...slotValues, ...(beat?.entities ?? []), ...planValues].map(clean).filter(Boolean))];
}

function promptDetails(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subject = lower(first(plan, "subject") || plan?.centralSubject || beat.entities?.[0] || "");
  const result: string[] = [];

  for (const candidate of evidence(plan, beat)) {
    const value = clean(candidate);
    const normalized = lower(value);
    if (!value || generic(value) || normalized === subject || !distinctive(value).length) continue;
    if (result.some((item) => lower(item) === normalized)) continue;
    result.push(value);
    if (result.length >= 16) break;
  }

  return result;
}

/**
 * Pick concrete semantic evidence for a beat, but never use the directive's
 * internal action as though it were story-world evidence. A directive such as
 * "make X matter through memory" is an instruction to the compiler, not a fact
 * that happened in the world.
 */
function detailForBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  excludedAction?: string,
): string {
  const details = promptDetails(beat, plan).filter((detail) => {
    if (!excludedAction) return true;
    const candidate = lower(detail);
    const action = lower(excludedAction);
    return candidate !== action && !action.includes(candidate);
  });

  const roleOrder: string[] = (() => {
    switch (beat.kind) {
      case "origin":
      case "reflection":
        return ["temporal", "artifact", "memory", "event", "place"];
      case "encounter":
      case "contribution":n        return ["participants", "social", "action", "affordance", "artifact", "event"];
      case "threshold":
        return ["medium", "place", "event", "artifact", "affordance"];
      case "discovery":
      case "reveal":
        return ["artifact", "event", "affordance", "place", "action"];
      case "challenge":
      case "escalation":
        return ["constraint", "affordance", "event", "artifact", "action"];
      case "transformation":
        return ["transformation", "outcome", "affordance", "action", "artifact", "event"];
      case "payoff":
        return ["outcome", "transformation", "affordance", "action", "artifact", "emotion"];
      default:
        return ["event", "artifact", "place", "affordance", "action", "emotion", "social"];
    }
  })();

  const subject = lower(first(plan, "subject") || plan?.centralSubject || "");
  for (const role of roleOrder) {
    const value = first(plan, role);
    if (!value) continue;
    const normalized = lower(value);
    if (normalized.includes(subject)) continue;
    if (excludedAction && (normalized === lower(excludedAction) || lower(excludedAction).includes(normalized))) continue;
    return value;
  }

  return details[0] ?? "";
}

function directiveFor(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  return plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
}

/**
 * Directive actions are cognitive instructions, not finished prose. Only retain
 * an action as a short natural-language clause when it already reads like an
 * observable action. Internal compiler language ("make X matter", "through
 * memory", state transitions, arrows, and similar planning syntax) is withheld
 * from the narrative layer and represented through the semantic grammar below.
 */
function narrativeAction(action: string): string | undefined {
  const value = sentence(action);
  if (!value) return undefined;

  if (
    /(?:\bmake\b.*\b(?:matter|meaningful)\b|\bthrough\b\s+(?:memory|cognition|semantics?|interaction|experience)\b|\bstate\b|\b(?:scan\s*→|→)\b|\bselected\b|\bcompiler\b|\bsemantic\b)/i.test(
      value,
    )
  ) {
    return undefined;
  }

  if (value.length > 110) return undefined;
  return value;
}

function directiveText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const directive = directiveFor(beat, plan);
  if (!directive || directive.confidence < 0.72) return undefined;

  const subject = directive.subject || plan?.centralSubject || beat.entities?.[0] || "the subject";
  const action = narrativeAction(directive.action);
  const detail = detailForBeat(beat, plan, directive.action);
  const outcome = first(plan, "outcome");
  const future = plan?.futureEvolution?.[0] ?? "";
  const relation = premise(plan)?.relations.find(
    (candidate) => candidate.from === "subject" || candidate.to === "subject",
  );
  const related = relation
    ? first(plan, relation.from === "subject" ? relation.to : relation.from)
    : detail;

  switch (beat.kind) {
    case "orientation":
      return related
        ? `${cap(subject)} starts with ${related}${action ? `, where ${action}` : ""}.`
        : `${cap(subject)} enters the experience${action ? ` as ${action}` : ""}.`;
    case "hook":
      return detail
        ? `${cap(detail)} gives ${subject} a reason to continue${action ? `: ${action}` : "."}`
        : `${cap(subject)} has a reason to continue${action ? `: ${action}` : "."}`;
    case "need":
      return outcome
        ? `${cap(subject)} begins with ${outcome}${action ? `: ${action}` : "."}`
        : `${cap(subject)} begins with the immediate need in the premise${action ? `: ${action}` : "."}`;
    case "threshold":
      return detail
        ? `${cap(subject)} crosses into the next stage through ${detail}${action ? ` as ${action}` : ""}.`
        : `${cap(subject)} crosses into the next stage${action ? ` as ${action}` : ""}.`;
    case "origin":
      return detail
        ? `${cap(subject)} brings ${detail} into the present${action ? `, where ${action}` : ""}.`
        : `${cap(subject)} brings the supplied history into the present.`;
    case "encounter":
      return detail
        ? `${cap(subject)} meets ${detail} as the experience moves forward${action ? `: ${action}` : "."}`
        : `${cap(subject)} meets the next concrete relationship${action ? `: ${action}` : "."}`;
    case "challenge":
      return detail
        ? `${cap(subject)} has to deal with ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} faces the next concrete condition${action ? `: ${action}` : "."}`;
    case "discovery":
      return detail
        ? `${cap(subject)} discovers ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} discovers another concrete part of the premise.`;
    case "reveal":
      return detail
        ? `${cap(subject)} reveals ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} reveals what the evidence supports.`;
    case "instruction":
      return detail
        ? `${cap(subject)} puts ${detail} into usable form${action ? `: ${action}` : "."}`
        : `${cap(subject)} provides the next usable move.`;
    case "action":
      return detail
        ? `${cap(subject)} acts through ${detail}${action ? `: ${action}` : "."}`
        : action
          ? `${cap(subject)} ${action}.`
          : `${cap(subject)} takes the next concrete action.`;
    case "feedback":
      return detail
        ? `${cap(detail)} becomes evidence for ${subject}${action ? `: ${action}` : "."}`
        : `${cap(subject)} uses the result as evidence for what happens next.`;
    case "contribution":
      return detail
        ? `${cap(subject)} changes when ${detail} enters the shared experience${action ? `: ${action}` : "."}`
        : `${cap(subject)} changes when participation becomes contribution.`;
    case "escalation":
      return detail
        ? `${cap(subject)} raises the stakes around ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} raises the stakes from what happened before.`;
    case "transformation":
      return detail
        ? `${cap(subject)} changes through ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} changes because of what happened before.`;
    case "reflection":
      return detail
        ? `${cap(subject)} looks back through ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} carries the consequence forward.`;
    case "provenance":
      return detail
        ? `${cap(subject)} carries the evidence of ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} carries the available evidence.`;
    case "identity":
      return detail
        ? `${cap(subject)} becomes recognizable through ${detail}${action ? `: ${action}` : "."}`
        : `${cap(subject)} becomes recognizable through its supplied context.`;
    case "milestone":
      return outcome
        ? `${cap(subject)} reaches ${outcome}${action ? `: ${action}` : "."}`
        : `${cap(subject)} reaches the next meaningful state.`;
    case "unlock":
    case "earned_access":
      return outcome
        ? `${cap(subject)} opens access tied to ${outcome}${action ? `: ${action}` : "."}`
        : `${cap(subject)} opens the next state because of what happened.`;
    case "payoff":
      return outcome
        ? `${cap(subject)} reaches ${outcome}${action ? `: ${action}` : "."}`
        : `${cap(subject)} reaches the result established by the premise.`;
    case "next_step":
      return future
        ? `${cap(subject)} carries the current experience into ${future}${action ? `: ${action}` : "."}`
        : `${cap(subject)} uses the current state to continue.`;
    case "continuation":
      return future
        ? `${cap(subject)} remains open to ${future}${action ? `: ${action}` : "."}`
        : `${cap(subject)} remains open to what comes next.`;
    default:
      return `${cap(subject)} advances from what is already true${action ? `: ${action}` : "."}`;
  }
}

function fallbackText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subject = first(plan, "subject") || plan?.centralSubject || beat.entities?.[0] || "the subject";
  const detail = detailForBeat(beat, plan);
  const outcome = first(plan, "outcome");
  const progression = plan?.progressionModel?.[0] ?? "";
  const future = plan?.futureEvolution?.[0] ?? "";

  switch (beat.kind) {
    case "orientation":
      return detail ? `${cap(subject)} starts with ${detail}.` : `${cap(subject)} starts with the supplied premise.`;
    case "hook":
      return detail ? `${cap(detail)} gives ${subject} its first active turn.` : `${cap(subject)} has a concrete reason to continue.`;
    case "need":
      return outcome ? `${cap(subject)} starts with ${sentence(outcome)}.` : `${cap(subject)} starts from the concrete need in the premise.`;
    case "threshold":
      return detail ? `${cap(subject)} moves past the surface through ${detail}.` : `${cap(subject)} moves into the next stage.`;
    case "origin":
      return detail ? `${cap(subject)} brings ${detail} into the present.` : `${cap(subject)} brings the supplied history into the present.`;
    case "encounter":
      return detail ? `${cap(subject)} encounters ${detail}, changing what can happen next.` : `${cap(subject)} encounters the next concrete condition.`;
    case "challenge":
      return progression ? `${cap(subject)} has to resolve ${sentence(progression)}.` : `${cap(subject)} has to resolve the next concrete condition.`;
    case "discovery":
    case "reveal":
      return detail ? `${cap(subject)} reveals ${detail}.` : `${cap(subject)} reveals another concrete part of the premise.`;
    case "instruction":
      return detail ? `${cap(subject)} makes ${detail} usable.` : `${cap(subject)} supplies the next usable information.`;
    case "action":
      return detail ? `${cap(subject)} acts through ${detail}.` : `${cap(subject)} takes the next concrete action.`;
    case "feedback":
      return detail ? `${cap(detail)} becomes evidence for what happens next.` : `${cap(subject)} uses the result as evidence for the next decision.`;
    case "contribution":
      return detail ? `${cap(subject)} changes when ${detail} is added.` : `${cap(subject)} changes when participation adds something.`;
    case "escalation":
      return detail ? `${cap(subject)} raises the stakes around ${detail}.` : `${cap(subject)} raises the stakes around what comes next.`;
    case "transformation":
      return detail ? `${cap(subject)} changes through ${detail}.` : `${cap(subject)} changes because of what happened before.`;
    case "reflection":
      return detail ? `${cap(subject)} carries the consequence of ${detail}.` : `${cap(subject)} carries the consequence of what happened.`;
    case "identity":
      return detail ? `${cap(subject)} becomes recognizable through ${detail}.` : `${cap(subject)} becomes recognizable through the supplied context.`;
    case "milestone":
      return progression ? `${cap(subject)} reaches a milestone in ${sentence(progression)}.` : `${cap(subject)} reaches the next state.`;
    case "unlock":
    case "earned_access":
      return outcome ? `${cap(subject)} opens access tied to ${sentence(outcome)}.` : `${cap(subject)} opens the next state because of what happened.`;
    case "payoff":
      return outcome ? `${cap(subject)} reaches ${sentence(outcome)}.` : `${cap(subject)} reaches the result established by the premise.`;
    case "next_step":
      return future ? `${cap(subject)} continues through ${sentence(future)}.` : `${cap(subject)} uses the current state to determine what happens next.`;
    case "continuation":
      return future ? `${cap(subject)} remains open to ${sentence(future)}.` : `${cap(subject)} carries the current state forward.`;
    default:
      return detail ? `${cap(subject)} continues with ${detail}.` : `${cap(subject)} continues from the supplied premise.`;
  }
}

function preserveConcreteEvidence(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const normalized = lower(text);
  const details = promptDetails(beat, plan).filter((detail) => !normalized.includes(lower(detail)));
  const detail = details[0];
  if (!detail) return text;

  switch (beat.kind) {
    case "orientation":
      return `${sentence(text)} ${cap(detail)} is part of the scene.`;
    case "encounter":
      return `${sentence(text)} ${cap(detail)} changes the available relationship.`;
    case "transformation":
      return `${sentence(text)} ${cap(detail)} marks the change.`;
    case "payoff":
      return `${sentence(text)} ${cap(detail)} remains attached to the result.`;
    default:
      return text;
  }
}

export function realizePremiseBeatV3(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  let text = clean(directiveText(beat, plan) ?? fallbackText(beat, plan));
  if (generic(text)) text = clean(fallbackText(beat, plan));
  return preserveConcreteEvidence(text, beat, plan);
}

export function realizePremiseBeatsV3(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeatV3(beat, plan) }));
}
