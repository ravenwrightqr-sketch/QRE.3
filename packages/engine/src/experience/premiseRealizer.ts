import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  StoryBeat,
  StoryBeatKind,
} from "@qre/contracts";

/**
 * CANONICAL UNIVERSAL PREMISE REALIZER
 *
 * Cognition owns meaning.
 * Trajectory owns causal structure.
 * The universal compiler owns structure.
 * This boundary turns selected operations + conserved premise evidence into
 * observable language.
 *
 * Critical invariant: semantic significance is not presentation copy.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase().replace(/[’]/g, "'");
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
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

const ABSTRACT_DIRECTIVE = [
  /make .* matter/i,
  /make .* meaningful/i,
  /make .* explicit/i,
  /connect .* to meaning/i,
  /connect .* with identity/i,
  /surface .* evidence/i,
  /preserve .* context/i,
  /adapt to accumulated/i,
  /adapt to .* history/i,
  /allow participants to/i,
  /let participants/i,
  /enter living memory/i,
  /witness .* contribute/i,
  /affect shared state/i,
  /change what can happen next/i,
  /determine what happens next/i,
  /use the current state/i,
  /carry .* into the present/i,
  /recognize what .* means/i,
  /recognize .* significance/i,
  /create a reason to continue/i,
  /provide the next relevant knowledge/i,
  /resolve the current experience/i,
  /continue from the current state/i,
  /advance the selected cognitive direction/i,
  /the intended experiential result/i,
  /the useful target/i,
  /the next available relationship/i,
  /the next supported condition/i,
];

const ROLES: CognitivePremiseRole[] = [
  "subject", "event", "medium", "artifact", "participants", "outcome",
  "emotion", "affordance", "temporal", "place", "social", "transformation",
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

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    premise(plan)?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map(clean)
      .filter(Boolean) ?? [],
  );
}

function first(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string {
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

function abstractDirective(value: string): boolean {
  return ABSTRACT_DIRECTIVE.some((pattern) => pattern.test(value));
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = first(plan, "subject");
  if (explicit) return explicit;
  const central = clean(plan?.centralSubject);
  if (central && words(central).length <= 6) return central;
  const entity = clean(beat.entities?.[0]);
  if (entity) return entity;
  return central ? words(central)[0] ?? central : "the subject";
}

function evidenceCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  return unique(
    ROLES.flatMap((role) => values(plan, role))
      .concat(beat.entities ?? [])
      .map(sentence)
      .filter(Boolean)
      .filter((value) => !generic(value))
      .filter((value) => lower(value) !== subjectValue)
      .filter((value) => !STOP.has(lower(value))),
  );
}

function evidenceForBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan, limit = 3): string[] {
  const candidates = evidenceCandidates(beat, plan);
  return candidates
    .map((value, index) => {
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
      return { value, score: (slot?.salience ?? 0) * 5 + roleBonus - index * 0.01 };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.value)
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
    .filter((item) => item.from === from && item.to === to && item.confidence >= 0.72)
    .flatMap((relation) =>
      values(plan, from).flatMap((fromValue) =>
        values(plan, to).map((toValue) => ({ relation, fromValue, toValue })),
      ),
    );
}

function relationClause(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const priorities: Partial<Record<StoryBeatKind, Array<[CognitivePremiseRole, CognitivePremiseRole]>>> = {
    orientation: [["subject", "place"], ["subject", "event"], ["event", "medium"]],
    hook: [["subject", "outcome"], ["event", "medium"]],
    threshold: [["subject", "medium"], ["event", "place"]],
    origin: [["subject", "artifact"], ["subject", "temporal"], ["event", "place"]],
    encounter: [["subject", "event"], ["subject", "artifact"], ["participants", "outcome"]],
    discovery: [["subject", "artifact"], ["subject", "medium"]],
    reveal: [["subject", "artifact"], ["subject", "outcome"]],
    action: [["subject", "affordance"], ["subject", "artifact"], ["subject", "medium"]],
    feedback: [["subject", "transformation"], ["subject", "outcome"]],
    contribution: [["participants", "outcome"], ["subject", "social"]],
    escalation: [["subject", "transformation"], ["subject", "constraint"]],
    transformation: [["transformation", "outcome"], ["subject", "transformation"]],
    reflection: [["subject", "temporal"], ["subject", "artifact"]],
    identity: [["subject", "artifact"], ["subject", "social"]],
    milestone: [["subject", "outcome"], ["subject", "transformation"]],
    payoff: [["subject", "outcome"], ["transformation", "outcome"]],
    continuation: [["subject", "temporal"], ["subject", "outcome"]],
  };

  for (const [from, to] of priorities[beat.kind] ?? []) {
    const match = relationValues(plan, from, to)[0];
    if (!match) continue;
    const { fromValue, toValue } = match;
    if (from === "event" && to === "medium") return `${cap(fromValue)} reaches people through ${toValue}`;
    if (from === "subject" && to === "medium") return `${cap(fromValue)} uses ${toValue}`;
    if (from === "subject" && to === "event") return `${cap(fromValue)} enters ${toValue}`;
    if (from === "subject" && to === "artifact") return `${cap(fromValue)} works with ${toValue}`;
    if (from === "subject" && to === "place") return `${cap(fromValue)} arrives at ${toValue}`;
    if (from === "subject" && to === "outcome") return `${cap(fromValue)} moves toward ${sentence(toValue)}`;
    if (from === "subject" && to === "temporal") return `${cap(fromValue)} returns to ${sentence(toValue)}`;
    if (from === "subject" && to === "affordance") return `${cap(fromValue)} can ${sentence(toValue)}`;
    if (from === "subject" && to === "transformation") return `${cap(fromValue)} changes through ${sentence(toValue)}`;
    if (from === "subject" && to === "social") return `${cap(fromValue)} connects with ${toValue}`;
    if (from === "participants" && to === "outcome") return `${cap(fromValue)} move toward ${sentence(toValue)}`;
    if (from === "transformation" && to === "outcome") return `${cap(fromValue)} leads toward ${sentence(toValue)}`;
    if (from === "event" && to === "place") return `${cap(fromValue)} unfolds at ${toValue}`;
  }
  return "";
}

function directiveFor(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const item = plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
  if (!item || item.confidence < 0.72 || !clean(item.action)) return undefined;
  return item;
}

function directiveText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const item = directiveFor(beat, plan);
  if (!item) return undefined;
  const action = sentence(item.action);
  if (!action || abstractDirective(action)) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  switch (beat.kind) {
    case "orientation": return `${name} enters the experience by ${action}.`;
    case "hook": return `${name} encounters the first turn: ${action}.`;
    case "need": return `${name} needs to ${action}.`;
    case "threshold": return `${name} crosses into the next state by ${action}.`;
    case "origin": return `${name} brings an available detail into the present: ${action}.`;
    case "encounter": return `${name} encounters a new condition: ${action}.`;
    case "challenge": return `${name} responds to the challenge by ${action}.`;
    case "discovery": return `${name} discovers something when ${action}.`;
    case "reveal": return `${name} discovers the consequence: ${action}.`;
    case "instruction": return `${name} gets a concrete next move: ${action}.`;
    case "action": return `${name} acts: ${action}.`;
    case "feedback": return `${name} sees the result when ${action}.`;
    case "contribution": return `${name} changes the shared experience by ${action}.`;
    case "escalation": return `${name} pushes the situation further by ${action}.`;
    case "transformation": return `${name} changes as ${action}.`;
    case "reflection": return `${name} recognizes what happened: ${action}.`;
    case "provenance": return `${name} preserves the origin through ${action}.`;
    case "identity": return `${name} becomes distinct through ${action}.`;
    case "milestone": return `${name} reaches a new state when ${action}.`;
    case "unlock": return `${name} unlocks the next state by ${action}.`;
    case "earned_access": return `${name} earns the next state by ${action}.`;
    case "payoff": return `${name} reaches the result: ${action}.`;
    case "next_step": return `${name} takes the next step: ${action}.`;
    case "continuation": return `${name} leaves the experience open by ${action}.`;
    default: return `${name} advances by ${action}.`;
  }
}

function fallbackText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(subject(beat, plan));
  const relation = relationClause(beat, plan);
  const evidence = evidenceForBeat(beat, plan, 3);
  const context = evidence.length === 1
    ? evidence[0]
    : evidence.length === 2
      ? `${evidence[0]} and ${evidence[1]}`
      : evidence.length > 2
        ? `${evidence.slice(0, -1).join(", ")}, and ${evidence.at(-1)}`
        : "";
  const outcome = first(plan, "outcome");
  const transformation = values(plan, "transformation");
  const affordance = first(plan, "affordance");

  if (relation) return sentence(relation);

  switch (beat.kind) {
    case "orientation": return context ? `${name} enters a situation shaped by ${context}.` : `${name} enters the situation.`;
    case "hook": return context ? `${name} encounters ${context}, and the situation turns active.` : `${name} encounters the first active condition.`;
    case "need": return outcome ? `${name} needs to reach ${sentence(outcome)}.` : context ? `${name} has to work through ${context}.` : `${name} faces the immediate need.`;
    case "threshold": return context ? `${name} moves deeper into ${context}.` : `${name} crosses into the next state.`;
    case "origin": return context ? `${name} brings ${context} into the present.` : `${name} starts from what is already known.`;
    case "encounter": return context ? `${name} encounters ${context}, changing the next condition.` : `${name} encounters a new condition.`;
    case "challenge": return context ? `${name} has to deal with ${context}.` : `${name} faces a condition that requires a response.`;
    case "discovery": return context ? `${name} discovers how ${context} changes the situation.` : `${name} discovers a new consequence.`;
    case "reveal": return context ? `${name} sees what ${context} changes.` : `${name} sees a consequence that was not visible at the beginning.`;
    case "instruction": return affordance ? `${name} gets a usable next move: ${sentence(affordance)}.` : `${name} gets a concrete next move.`;
    case "action": return affordance ? `${name} acts: ${sentence(affordance)}.` : context ? `${name} acts on ${context}.` : `${name} takes the next concrete action.`;
    case "feedback": return outcome ? `${name} gets a result that moves toward ${sentence(outcome)}.` : context ? `${name} sees what ${context} changes.` : `${name} sees the result of the action.`;
    case "contribution": return context ? `${name} adds ${context}, changing what becomes available next.` : `${name} adds something that changes what becomes available next.`;
    case "escalation": return context ? `${name} pushes ${context} further than before.` : `${name} pushes the situation into a more intense state.`;
    case "transformation": return transformation.length >= 2 ? `${name} moves from ${sentence(transformation[0])} toward ${sentence(transformation[1])}.` : context ? `${name} is changed by what happens with ${context}.` : `${name} changes because of what happens.`;
    case "reflection": return context ? `${name} looks back on what ${context} changed.` : `${name} recognizes the consequence of what happened.`;
    case "provenance": return context ? `${name} preserves the origin in ${context}.` : `${name} preserves where the experience came from.`;
    case "identity": return context ? `${name} becomes identifiable through ${context}.` : `${name} becomes more distinct through what has happened.`;
    case "milestone": return outcome ? `${name} reaches ${sentence(outcome)}.` : context ? `${name} reaches a new state through ${context}.` : `${name} reaches a new state.`;
    case "unlock":
    case "earned_access": return outcome ? `${name} earns access to ${sentence(outcome)}.` : context ? `${name} unlocks what comes next through ${context}.` : `${name} earns access to the next state.`;
    case "payoff": return outcome ? `${name} reaches ${sentence(outcome)}.` : context ? `${name} reaches a result shaped by ${context}.` : `${name} reaches the result created by what happened before.`;
    case "next_step": return affordance ? `${name} takes the next step: ${sentence(affordance)}.` : `${name} takes the next step from the current state.`;
    case "continuation": return context ? `${name} carries ${context} into what comes next.` : `${name} leaves the next turn open.`;
    default: return context ? `${name} continues through ${context}.` : `${name} continues from the current state.`;
  }
}

function preserveConcreteEvidence(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const evidence = evidenceForBeat(beat, plan, 3);
  const missing = evidence.filter((value) => !lower(text).includes(lower(value)));
  if (!missing.length) return text;

  const additions = missing.slice(0, 2);
  switch (beat.kind) {
    case "orientation": return `${sentence(text)} ${additions.join(" and ")} are present from the start.`;
    case "encounter": return `${sentence(text)} Then ${additions.join(" and ")} enter the scene.`;
    case "discovery":
    case "reveal": return `${sentence(text)} The next detail is ${additions.join(" and ")}.`;
    case "escalation": return `${sentence(text)} The escalation also changes ${additions.join(" and ")}.`;
    case "transformation": return `${sentence(text)} The change is visible in ${additions.join(" and ")}.`;
    case "payoff": return `${sentence(text)} The result remains tied to ${additions.join(" and ")}.`;
    default: return text;
  }
}

function preserveSemanticAction(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const item = directiveFor(beat, plan);
  const action = sentence(item?.action);
  if (!item || !action || abstractDirective(action) || lower(text).includes(lower(action))) return text;
  return `${sentence(text)} ${cap(action)}.`;
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);
  for (const pattern of DEAD_PROSE) {
    result = result.replace(pattern, "").replace(/\s{2,}/g, " ").trim();
  }
  return sentence(result);
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  let text = clean(directiveText(beat, plan) ?? fallbackText(beat, plan));
  if (generic(text) || abstractDirective(text)) text = clean(fallbackText(beat, plan));
  text = removeCompilerFiller(text);
  text = preserveConcreteEvidence(text, beat, plan);
  text = preserveSemanticAction(text, beat, plan);
  text = removeCompilerFiller(text);
  return `${sentence(text)}.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value)) || abstractDirective(value);
}

/** Diagnostic-only. It never selects a story or changes realization. */
export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const text = lower([
    beat.text,
    subject(beat, plan),
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
  ].join(" "));

  return {
    evidence: evidenceCandidates(beat, plan).length > 0,
    relationship: Boolean(plan?.premise?.relations.some((item) => item.confidence >= 0.72)),
    temporal: Boolean(first(plan, "temporal")),
    social: Boolean(first(plan, "social") || first(plan, "participants")),
    transformation: Boolean(first(plan, "transformation")),
    constraint: Boolean(first(plan, "constraint")),
    outcome: Boolean(first(plan, "outcome")) || /\b(remember|discover|return|connect|play|learn|change)\b/i.test(text),
  };
}
