import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  StoryBeat,
} from "@qre/contracts";

/**
 * Next-generation premise realization boundary.
 *
 * Semantic directives remain authoritative, but presentation must also retain
 * concrete prompt evidence that is not represented by a premise role (for
 * example "cleaning" in a housekeeper prompt). This layer therefore combines
 * three sources without inventing facts:
 *   1. semantic directive operation,
 *   2. conserved premise roles,
 *   3. concrete lexical evidence already carried by the compiled beat.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string => clean(value).toLowerCase();

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The experience";
};

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "do", "does", "doing", "for", "from", "get", "give", "gives", "given",
  "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "make", "makes",
  "making", "me", "my", "of", "on", "or", "our", "people", "please", "that", "the",
  "their", "this", "those", "to", "turn", "up", "was", "we", "what", "when", "where",
  "which", "who", "with", "you", "your", "something", "someone", "thing", "experience",
  "story", "about", "through", "just", "more", "than", "then", "now", "will", "keep",
  "after", "before", "very", "really", "want", "needs", "need",
]);

const DEAD = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
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

function promptDetails(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const subject = lower(plan?.centralSubject ?? beat.entities?.[0] ?? "");
  const candidates = [
    ...(beat.entities ?? []),
    ...distinctive(beat.text),
  ].map(sentence).filter(Boolean);

  const result: string[] = [];

  for (const candidate of candidates) {
    const value = clean(candidate);
    if (!value || generic(value) || lower(value) === subject) continue;

    const words = distinctive(value);
    if (!words.length) continue;

    // Prefer exact entities because makeBeat carries prompt-derived keywords
    // there. Longer lexical units are retained when they are already present.
    const score =
      ((beat.entities ?? []).some((entity) => lower(entity) === lower(value)) ? 5 : 0) +
      Math.min(words.length, 4);

    const existing = result.findIndex((item) => lower(item) === lower(value));
    if (existing >= 0) continue;

    result.push(value);
    if (result.length >= 12) break;

    void score;
  }

  return result;
}

function detailForBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const details = promptDetails(beat, plan);
  const subject = lower(plan?.centralSubject ?? beat.entities?.[0] ?? "");
  const candidates = details.filter((value) => !lower(value).includes(subject));

  // Prefer distinctive concrete words that often carry the actual activity.
  const activity = candidates.find((value) =>
    /\b(?:cleaning|cleaned|grooming|groomed|bath|bubbles|tattoo|recipe|concert|wedding|birthday|haunted|spa|luxury|clue|robot|museum|truck|surfboard|watch|guitar|pick)\b/i.test(value),
  );

  return activity ?? candidates[0] ?? "";
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
  if (!action) return undefined;

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
}

function fallbackText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subject = first(plan, "subject") || plan?.centralSubject || beat.entities?.[0] || "the experience";
  const event = first(plan, "event");
  const medium = first(plan, "medium");
  const artifact = first(plan, "artifact");
  const outcome = first(plan, "outcome");
  const detail = detailForBeat(beat, plan);
  const future = plan?.futureEvolution?.[0] ?? "";
  const progression = plan?.progressionModel?.[0] ?? "";
  const why = plan?.whyInteract?.[0] ?? "";

  switch (beat.kind) {
    case "orientation":
      if (event && medium) return `${cap(subject)} sits inside ${event} through ${medium}.`;
      if (event) return `${cap(subject)} sits inside ${event}.`;
      return detail ? `${cap(subject)} starts with ${detail}.` : `${cap(subject)} starts with the concrete premise.`;
    case "hook":
      return why
        ? `${cap(why)} ${cap(subject)} gives that idea somewhere to happen.`
        : detail
          ? `${cap(detail)} gives ${subject} its first active turn.`
          : `${cap(subject)} gives the interaction a concrete reason to continue.`;
    case "encounter":
      return detail
        ? `${cap(detail)} enters the experience around ${subject}, changing what happens next.`
        : `${cap(subject)} encounters the next concrete condition in the premise.`;
    case "transformation":
      return detail
        ? `${cap(subject)} changes through what happens around ${detail}.`
        : progression
          ? `${cap(subject)} changes as ${sentence(progression)}.`
          : `${cap(subject)} changes because of the preceding interaction.`;
    case "payoff":
      return outcome
        ? `${cap(subject)} reaches the payoff: ${sentence(outcome)}.`
        : detail
          ? `${cap(subject)} leaves the interaction changed by ${detail}.`
          : `${cap(subject)} reaches the result established by the premise.`;
    case "continuation":
      return future
        ? `${cap(subject)} remains open to ${sentence(future)}.`
        : `${cap(subject)} carries the current state into what comes next.`;
    case "threshold":
      return medium && event
        ? `${cap(subject)} becomes a threshold into ${event} through ${medium}.`
        : detail
          ? `${cap(subject)} moves past the surface through ${detail}.`
          : `${cap(subject)} moves from observation into the next layer.`;
    case "reveal":
    case "discovery":
      return detail
        ? `${cap(subject)} reveals more through ${detail}.`
        : `${cap(subject)} reveals another concrete part of the premise.`;
    case "need":
      return outcome
        ? `${cap(subject)} starts with ${sentence(outcome)}.`
        : `${cap(subject)} starts from the concrete need in the premise.`;
    case "instruction":
      return detail
        ? `${cap(subject)} makes the next useful move concrete through ${detail}.`
        : `${cap(subject)} supplies the next usable piece of information.`;
    case "action":
      return detail
        ? `Act on ${subject}: ${detail}.`
        : `${cap(subject)} becomes the next concrete action.`;
    case "feedback":
      return detail
        ? `${cap(detail)} becomes evidence for what happens next with ${subject}.`
        : `${cap(subject)} uses the result as evidence for the next decision.`;
    case "challenge":
      return progression
        ? `${cap(subject)} encounters the next condition in ${sentence(progression)}.`
        : `${cap(subject)} has to resolve the next concrete condition in the premise.`;
    case "escalation":
      return detail
        ? `${cap(subject)} raises the stakes around ${detail}.`
        : `${cap(subject)} raises the stakes around what comes next.`;
    case "reflection":
      return detail
        ? `${cap(subject)} retains what ${detail} changed about the experience.`
        : `${cap(subject)} retains the consequence of what happened.`;
    case "identity":
      return detail
        ? `${cap(subject)} becomes identifiable through ${detail}.`
        : `${cap(subject)} becomes identifiable through the supplied context.`;
    case "milestone":
      return progression
        ? `${cap(subject)} reaches a milestone in ${sentence(progression)}.`
        : `${cap(subject)} reaches the next state established by the experience.`;
    case "unlock":
    case "earned_access":
      return outcome
        ? `${cap(subject)} opens access tied to ${sentence(outcome)}.`
        : `${cap(subject)} opens the next state because of what happened before it.`;
    case "next_step":
      return future
        ? `${cap(subject)} continues through ${sentence(future)}.`
        : `${cap(subject)} uses the current state to determine the next action.`;
    default:
      return detail
        ? `${cap(subject)} continues with ${detail}.`
        : `${cap(subject)} continues from the supplied premise.`;
  }
}

function preserveConcreteEvidence(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const normalized = lower(text);
  const details = promptDetails(beat, plan)
    .filter((detail) => !normalized.includes(lower(detail)))
    .filter((detail) => distinctive(detail).length > 0);

  // Do not dump a keyword list into the story. One missing concrete detail is
  // enough to keep the premise anchored without turning the prose robotic.
  const detail = details.find((value) =>
    /\b(?:cleaning|cleaned|grooming|groomed|bath|bubbles|tattoo|recipe|concert|wedding|birthday|haunted|spa|luxury|clue|robot|museum|truck|surfboard|watch|guitar|pick)\b/i.test(value),
  ) ?? details[0];

  if (!detail) return text;

  if (beat.kind === "orientation" || beat.kind === "encounter" || beat.kind === "transformation") {
    return `${sentence(text)} The concrete detail is ${detail}.`;
  }

  return text;
}

export function realizePremiseBeatV3(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  let text = clean(directiveText(beat, plan) ?? fallbackText(beat, plan));

  if (generic(text)) {
    text = clean(fallbackText(beat, plan));
  }

  return preserveConcreteEvidence(text, beat, plan);
}

export function realizePremiseBeatsV3(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeatV3(beat, plan),
  }));
}
