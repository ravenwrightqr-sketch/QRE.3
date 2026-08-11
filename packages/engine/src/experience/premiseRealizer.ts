import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * ============================================================
 * CANONICAL UNIVERSAL PREMISE REALIZER
 * ============================================================
 *
 * Cognition owns meaning.
 * The universal compiler owns structure.
 * This boundary owns observable language only.
 *
 * It conserves:
 *   1. semantic roles,
 *   2. explicit premise relations,
 *   3. concrete evidence already present upstream,
 *   4. semantic realization directives,
 *   5. progression already selected by cognition/compiler structure.
 *
 * It must never become a second planner, a domain-template registry, or a
 * prose explanation of what the compiler believes happened.
 * ============================================================
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase().replace(/[’]/g, "'");

const sentence = (value: unknown): string =>
  clean(value).replace(/[.!?]+$/, "");

const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};

const DEAD_PROSE = [
  /the experience puts into focus/i,
  /deserves a closer look/i,
  /gives the story somewhere concrete to begin/i,
  /the next layer/i,
  /the next move follows from the state reached here/i,
  /what the experience has revealed/i,
  /has become more meaningful through the interaction/i,
  /the experience leaves a meaning behind/i,
  /giving the moment a direction/i,
  /lands differently because of everything that happened/i,
  /the supplied premise/i,
  /the supplied context/i,
  /the concrete detail is/i,
  /the next concrete condition in the premise/i,
  /reaches the result established by the premise/i,
];

const ROLES: CognitivePremiseRole[] = [
  "subject",
  "event",
  "medium",
  "artifact",
  "participants",
  "outcome",
  "emotion",
  "affordance",
  "temporal",
  "place",
  "social",
  "transformation",
  "constraint",
];

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

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function values(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    premise(plan)?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map(clean)
      .filter(Boolean) ?? [],
  );
}

function first(
  plan: CognitiveExperiencePlan | undefined,
  role: CognitivePremiseRole,
): string {
  return values(plan, role)[0] ?? "";
}

function words(value: unknown): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(lower(word)));
}

function generic(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = first(plan, "subject");
  if (explicit) return explicit;

  const entity = clean(beat.entities?.[0]);
  if (entity) return entity;

  const central = clean(plan?.centralSubject);
  if (central) {
    const centralWords = words(central);
    if (centralWords.length <= 4) return central;
    return centralWords.find((word) => !STOP.has(lower(word))) ?? central;
  }

  return "the experience";
}

function semanticEvidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const subjectValue = lower(subject(beat, plan));
  const candidates = ROLES.flatMap((role) => values(plan, role))
    .concat(beat.entities ?? [])
    .map(sentence)
    .filter(Boolean)
    .filter((value) => !generic(value))
    .filter((value) => lower(value) !== subjectValue)
    .filter((value) => !STOP.has(lower(value)));

  return unique(candidates);
}

function evidenceForBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  limit = 3,
): string[] {
  const candidates = semanticEvidence(beat, plan);
  const scored = candidates.map((value, index) => {
    const slot = premise(plan)?.slots.find((candidate) =>
      candidate.values.some((item) => lower(item) === lower(value)),
    );

    const roleBonus =
      slot?.role === "event" ? 1.4
      : slot?.role === "artifact" ? 1.3
      : slot?.role === "medium" ? 1.2
      : slot?.role === "outcome" ? 1.15
      : slot?.role === "transformation" ? 1.1
      : 0;

    return {
      value,
      score: (slot?.salience ?? 0) * 5 + roleBonus - index * 0.01,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.value)
    .filter((value, index, all) =>
      all.findIndex((candidate) => lower(candidate) === lower(value)) === index,
    )
    .slice(0, limit);
}

function relationValues(
  plan: CognitiveExperiencePlan | undefined,
  from: CognitivePremiseRole,
  to: CognitivePremiseRole,
): Array<{ relation: CognitivePremiseRelation; fromValue: string; toValue: string }> {
  const current = premise(plan);
  if (!current) return [];

  return current.relations
    .filter(
      (item) =>
        item.from === from &&
        item.to === to &&
        item.confidence >= 0.72,
    )
    .flatMap((relation) =>
      values(plan, from).flatMap((fromValue) =>
        values(plan, to).map((toValue) => ({ relation, fromValue, toValue })),
      ),
    );
}

/** Convert an explicit cognitive relationship into an observable clause. */
function semanticRelation(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const priority: Partial<Record<StoryBeat["kind"], Array<[CognitivePremiseRole, CognitivePremiseRole]>>> = {
    orientation: [["subject", "place"], ["subject", "event"], ["subject", "artifact"], ["event", "medium"]],
    hook: [["subject", "outcome"], ["event", "medium"], ["participants", "outcome"]],
    need: [["subject", "constraint"], ["subject", "outcome"]],
    threshold: [["subject", "medium"], ["event", "medium"], ["event", "place"]],
    origin: [["subject", "artifact"], ["subject", "temporal"], ["event", "place"]],
    encounter: [["participants", "outcome"], ["subject", "event"], ["subject", "artifact"]],
    challenge: [["subject", "constraint"], ["subject", "outcome"]],
    discovery: [["subject", "artifact"], ["subject", "medium"], ["event", "medium"]],
    reveal: [["subject", "outcome"], ["subject", "artifact"], ["subject", "medium"]],
    instruction: [["subject", "affordance"], ["subject", "medium"], ["subject", "constraint"]],
    action: [["subject", "affordance"], ["subject", "artifact"], ["subject", "medium"]],
    feedback: [["subject", "transformation"], ["subject", "outcome"]],
    contribution: [["participants", "outcome"], ["subject", "social"], ["subject", "artifact"]],
    escalation: [["subject", "transformation"], ["subject", "constraint"], ["subject", "outcome"]],
    transformation: [["transformation", "outcome"], ["subject", "transformation"], ["subject", "outcome"]],
    reflection: [["subject", "temporal"], ["subject", "outcome"], ["subject", "artifact"]],
    provenance: [["subject", "artifact"], ["subject", "event"], ["event", "place"]],
    identity: [["subject", "artifact"], ["subject", "social"], ["subject", "event"]],
    milestone: [["subject", "outcome"], ["subject", "transformation"]],
    unlock: [["subject", "outcome"], ["subject", "affordance"]],
    earned_access: [["subject", "outcome"], ["subject", "affordance"], ["subject", "constraint"]],
    payoff: [["subject", "outcome"], ["transformation", "outcome"], ["participants", "outcome"]],
    next_step: [["subject", "outcome"], ["subject", "temporal"], ["subject", "affordance"]],
    continuation: [["subject", "temporal"], ["subject", "outcome"], ["participants", "outcome"]],
  };

  for (const [from, to] of priority[beat.kind] ?? []) {
    const match = relationValues(plan, from, to)[0];
    if (!match) continue;
    const { fromValue, toValue } = match;

    if (from === "event" && to === "medium") return `${cap(fromValue)} reaches people through ${toValue}`;
    if (from === "subject" && to === "medium") return `${cap(fromValue)} uses ${toValue} to enter the experience`;
    if (from === "subject" && to === "event") return `${cap(fromValue)} enters ${toValue}`;
    if (from === "subject" && to === "artifact") return `${cap(fromValue)} is connected to ${toValue}`;
    if (from === "subject" && to === "place") return `${cap(fromValue)} arrives at ${toValue}`;
    if (from === "subject" && to === "outcome") return `${cap(fromValue)} moves toward ${sentence(toValue)}`;
    if (from === "subject" && to === "constraint") return `${cap(fromValue)} has to deal with ${sentence(toValue)}`;
    if (from === "subject" && to === "temporal") return `${cap(fromValue)} returns to ${sentence(toValue)}`;
    if (from === "subject" && to === "affordance") return `${cap(fromValue)} gets a way to ${sentence(toValue)}`;
    if (from === "subject" && to === "transformation") return `${cap(fromValue)} changes through ${sentence(toValue)}`;
    if (from === "subject" && to === "social") return `${cap(fromValue)} connects with ${toValue}`;
    if (from === "participants" && to === "outcome") return `${cap(fromValue)} move the experience toward ${sentence(toValue)}`;
    if (from === "transformation" && to === "outcome") return `${cap(fromValue)} leads toward ${sentence(toValue)}`;
    if (from === "event" && to === "place") return `${cap(fromValue)} unfolds at ${toValue}`;
  }

  return "";
}

function directive(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const item = plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
  if (!item || item.confidence < 0.72 || !clean(item.action)) return undefined;
  return item;
}

function directiveText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const item = directive(beat, plan);
  if (!item) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  const action = sentence(item.action);
  if (!action) return undefined;

  switch (beat.kind) {
    case "orientation": return `${name} enters the experience by ${action}.`;
    case "hook": return `${name} encounters the first turn: ${action}.`;
    case "need": return `${name} needs to ${action}.`;
    case "threshold": return `${name} crosses into the next state by ${action}.`;
    case "origin": return `${name} brings the relevant past into the present by ${action}.`;
    case "encounter": return `${name} encounters a new condition when ${action}.`;
    case "challenge": return `${name} has to respond by ${action}.`;
    case "discovery": return `${name} discovers something when ${action}.`;
    case "reveal": return `${name} discovers the consequence: ${action}.`;
    case "instruction": return `${name} gets a concrete next move: ${action}.`;
    case "action": return `${name} acts: ${action}.`;
    case "feedback": return `${name} sees the result when ${action}.`;
    case "contribution": return `${name} changes the shared experience by ${action}.`;
    case "escalation": return `${name} pushes the situation further by ${action}.`;
    case "transformation": return `${name} changes as ${action}.`;
    case "reflection": return `${name} recognizes what happened: ${action}.`;
    case "provenance": return `${name} preserves the origin by ${action}.`;
    case "identity": return `${name} becomes distinct through ${action}.`;
    case "milestone": return `${name} reaches a new state when ${action}.`;
    case "unlock": return `${name} unlocks the next state by ${action}.`;
    case "earned_access": return `${name} earns the next state by ${action}.`;
    case "payoff": return `${name} reaches the intended result: ${action}.`;
    case "next_step": return `${name} uses the current state to ${action}.`;
    case "continuation": return `${name} leaves the experience open by ${action}.`;
    default: return `${name} advances by ${action}.`;
  }
}

function fallbackText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(subject(beat, plan));
  const relation = semanticRelation(beat, plan);
  const evidence = evidenceForBeat(beat, plan, 3);
  const context = evidence.length === 1
    ? evidence[0]
    : evidence.length === 2
      ? `${evidence[0]} and ${evidence[1]}`
      : evidence.length > 2
        ? `${evidence.slice(0, -1).join(", ")}, and ${evidence.at(-1)}`
        : "";
  const outcome = first(plan, "outcome") || plan?.whyInteract?.find(Boolean) || "";
  const transformation = values(plan, "transformation");
  const future = plan?.futureEvolution?.find(Boolean) || first(plan, "temporal");
  const progression = plan?.progressionModel?.find(Boolean) || "";
  const interaction = plan?.interactionModel?.find(Boolean) || "";
  const content = plan?.contentModel?.find(Boolean) || "";

  if (relation) return `${sentence(relation)}.`;

  switch (beat.kind) {
    case "orientation": return context ? `${name} enters a situation shaped by ${context}.` : `${name} enters the situation.`;
    case "hook": return outcome ? `${name} encounters ${sentence(outcome)}, giving the story a reason to move.` : context ? `${name} encounters ${context}, and the situation turns active.` : `${name} encounters the first active condition.`;
    case "need": return outcome ? `${name} needs to reach ${sentence(outcome)}.` : context ? `${name} has to work through ${context}.` : `${name} faces the immediate need.`;
    case "threshold": return interaction ? `${name} crosses into the next state by ${sentence(interaction)}.` : context ? `${name} moves deeper into ${context}.` : `${name} moves from the initial situation into action.`;
    case "origin": return context ? `${name} brings ${context} into the present.` : `${name} brings the relevant history into the present.`;
    case "encounter": return context ? `${name} encounters ${context}, changing what happens next.` : `${name} encounters a new condition that changes what happens next.`;
    case "challenge": return progression ? `${name} has to deal with ${sentence(progression)}.` : context ? `${name} has to work through ${context}.` : `${name} meets a condition that requires a response.`;
    case "discovery": return context ? `${name} discovers how ${context} changes the situation.` : `${name} discovers a new consequence of what has happened.`;
    case "reveal": return context ? `${name} sees what ${context} changes.` : `${name} sees a consequence that was not visible at the beginning.`;
    case "instruction": return content ? `${name} gets a usable next move: ${sentence(content)}.` : interaction ? `${name} can act next by ${sentence(interaction)}.` : `${name} receives a concrete next move.`;
    case "action": return interaction ? `${name} acts through ${sentence(interaction)}.` : context ? `${name} acts on ${context}.` : `${name} takes the next concrete action.`;
    case "feedback": return outcome ? `${name} gets a result that moves toward ${sentence(outcome)}.` : context ? `${name} sees what ${context} changes.` : `${name} gets a result that changes the next decision.`;
    case "contribution": return context ? `${name} adds ${context}, changing what becomes available next.` : `${name} adds something that changes what becomes available next.`;
    case "escalation": return progression ? `${name} pushes the situation further through ${sentence(progression)}.` : context ? `${name} pushes ${context} further than before.` : `${name} pushes the situation into a more intense state.`;
    case "transformation": return transformation.length >= 2 ? `${name} moves from ${sentence(transformation[0])} toward ${sentence(transformation[1])}.` : outcome ? `${name} changes through the experience and moves toward ${sentence(outcome)}.` : context ? `${name} is changed by what happens with ${context}.` : `${name} changes because of what happens.`;
    case "reflection": return context ? `${name} looks back on what ${context} changed.` : outcome ? `${name} recognizes how the experience moved toward ${sentence(outcome)}.` : `${name} recognizes the consequence of what happened.`;
    case "provenance": return context ? `${name} preserves the origin in ${context}.` : `${name} preserves where the experience came from.`;
    case "identity": return context ? `${name} becomes identifiable through ${context}.` : `${name} becomes more distinct through what has happened.`;
    case "milestone": return progression ? `${name} reaches a new state through ${sentence(progression)}.` : outcome ? `${name} reaches ${sentence(outcome)}.` : `${name} reaches the next state.`;
    case "unlock":
    case "earned_access": return outcome ? `${name} earns access to ${sentence(outcome)}.` : context ? `${name} unlocks what comes next through ${context}.` : `${name} earns access to the next state.`;
    case "payoff": return outcome ? `${name} reaches ${sentence(outcome)}.` : context ? `${name} reaches a result shaped by ${context}.` : `${name} reaches the result created by the experience.`;
    case "next_step": return progression ? `${name} uses the current state to ${sentence(progression)}.` : interaction ? `${name} uses the current state to ${sentence(interaction)}.` : future ? `${name} uses the current state to move toward ${sentence(future)}.` : `${name} takes the next action.`;
    case "continuation": return future ? `${name} leaves room for ${sentence(future)}.` : context ? `${name} leaves the next turn connected to ${context}.` : `${name} leaves the experience open for another turn.`;
    default: return context ? `${name} continues through ${context}.` : `${name} continues from the current state.`;
  }
}

function preserveConcreteEvidence(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const evidence = evidenceForBeat(beat, plan, 3);
  if (!evidence.length) return text;

  const normalized = lower(text);
  const missing = evidence.filter((value) => !normalized.includes(lower(value)));
  if (!missing.length) return text;

  const additions = missing.slice(0, 3);
  switch (beat.kind) {
    case "orientation": return `${sentence(text)} The situation includes ${additions.join(", ")}.`;
    case "hook": return `${sentence(text)} That turn involves ${additions.join(", ")}.`;
    case "encounter": return `${sentence(text)} The encounter brings in ${additions.join(", ")}.`;
    case "discovery":
    case "reveal": return `${sentence(text)} What becomes visible includes ${additions.join(", ")}.`;
    case "escalation": return `${sentence(text)} The escalation draws ${additions.join(", ")} deeper into the action.`;
    case "transformation": return `${sentence(text)} The change is expressed through ${additions.join(", ")}.`;
    case "reflection": return `${sentence(text)} The consequence is tied to ${additions.join(", ")}.`;
    case "payoff": return `${sentence(text)} The result is shaped by ${additions.join(", ")}.`;
    case "continuation": return `${sentence(text)} The next turn remains connected to ${additions.join(", ")}.`;
    default: return `${sentence(text)} The action involves ${additions.join(", ")}.`;
  }
}

function preserveSemanticAction(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const item = directive(beat, plan);
  const action = sentence(item?.action);
  if (!item || !action || lower(text).includes(lower(action))) return text;
  return `${sentence(text)} ${cap(action)}.`;
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);
  for (const pattern of DEAD_PROSE) {
    result = result.replace(pattern, "").replace(/\s{2,}/g, " ").trim();
  }
  return sentence(result);
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const directed = directiveText(beat, plan);
  let text = clean(directed ?? fallbackText(beat, plan));

  if (generic(text)) text = clean(fallbackText(beat, plan));
  text = removeCompilerFiller(text);
  text = preserveConcreteEvidence(text, beat, plan);
  text = preserveSemanticAction(text, beat, plan);
  text = removeCompilerFiller(text);

  return `${sentence(text)}.`;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/** Diagnostic-only. It never selects a story or changes realization. */
export function classifyPremise(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): Record<string, boolean> {
  const text = lower([
    beat.text,
    subject(beat, plan),
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.futureEvolution ?? []),
  ].join(" "));

  return {
    evidence: semanticEvidence(beat, plan).length > 0,
    relationship: Boolean(plan?.premise?.relations.some((item) => item.confidence >= 0.72)),
    temporal: Boolean(first(plan, "temporal") || plan?.futureEvolution?.length),
    social: Boolean(first(plan, "social") || first(plan, "participants")),
    transformation: Boolean(first(plan, "transformation")),
    constraint: Boolean(first(plan, "constraint")),
    outcome: Boolean(first(plan, "outcome")) || /\b(remember|discover|return|connect|play|learn|change)\b/i.test(text),
  };
}
