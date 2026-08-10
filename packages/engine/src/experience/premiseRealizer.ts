import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * UNIVERSAL PREMISE REALIZER
 *
 * Cognition owns meaning. The universal compiler owns structure. This layer
 * owns presentation copy exactly once.
 *
 * Realization conserves three things simultaneously:
 *   1. semantic roles,
 *   2. explicit relationships among those roles,
 *   3. concrete lexical evidence already extracted upstream.
 *
 * No domain-specific rescue vocabulary belongs here.
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const lower = (value: unknown): string => clean(value).toLowerCase().replace(/[’]/g, "'");
const sentence = (value: unknown): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: unknown): string => {
  const text = clean(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The premise";
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
  /the story starts pulling/i,
  /the experience moves forward through/i,
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
  "after", "before", "very", "really", "want", "needs", "need",
]);

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
}

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return [...new Set(
    premise(plan)?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .map(clean)
      .filter(Boolean) ?? [],
  )];
}

function first(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string {
  return values(plan, role)[0] ?? "";
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  return clean(plan?.centralSubject) || first(plan, "subject") || clean(beat.entities?.[0]) || "the premise";
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

function relationValues(
  plan: CognitiveExperiencePlan | undefined,
  from: CognitivePremiseRole,
  to: CognitivePremiseRole,
): Array<{ relation: CognitivePremiseRelation; fromValue: string; toValue: string }> {
  const current = premise(plan);
  if (!current) return [];
  const fromValues = values(plan, from);
  const toValues = values(plan, to);

  return current.relations
    .filter((item) => item.from === from && item.to === to && item.confidence >= 0.72)
    .flatMap((relation) => fromValues.flatMap((fromValue) =>
      toValues.map((toValue) => ({ relation, fromValue, toValue })),
    ));
}

function semanticRelation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const priority: Record<StoryBeat["kind"], Array<[CognitivePremiseRole, CognitivePremiseRole]>> = {
    orientation: [["event", "medium"], ["subject", "event"], ["subject", "place"], ["subject", "artifact"]],
    hook: [["subject", "outcome"], ["participants", "outcome"], ["event", "medium"]],
    need: [["subject", "constraint"], ["subject", "outcome"]],
    threshold: [["event", "medium"], ["subject", "medium"], ["event", "place"]],
    origin: [["subject", "artifact"], ["subject", "temporal"], ["event", "place"]],
    encounter: [["participants", "outcome"], ["subject", "event"], ["subject", "artifact"]],
    challenge: [["subject", "constraint"], ["subject", "outcome"]],
    discovery: [["subject", "medium"], ["subject", "artifact"], ["event", "medium"]],
    reveal: [["subject", "medium"], ["subject", "artifact"], ["subject", "outcome"]],
    instruction: [["subject", "medium"], ["subject", "affordance"], ["subject", "constraint"]],
    action: [["subject", "medium"], ["subject", "artifact"], ["subject", "affordance"]],
    feedback: [["subject", "outcome"], ["subject", "transformation"]],
    contribution: [["participants", "outcome"], ["subject", "social"], ["subject", "artifact"]],
    escalation: [["subject", "transformation"], ["subject", "constraint"], ["subject", "outcome"]],
    transformation: [["transformation", "outcome"], ["subject", "artifact"], ["subject", "outcome"]],
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

  for (const [from, to] of priority[beat.kind]) {
    const match = relationValues(plan, from, to)[0];
    if (!match) continue;
    const { fromValue, toValue } = match;

    if (from === "event" && to === "medium") return `${cap(fromValue)} is carried into the experience through ${toValue}`;
    if (from === "subject" && to === "medium") return `${cap(fromValue)} is accessed through ${toValue}`;
    if (from === "subject" && to === "event") return `${cap(fromValue)} is situated within ${toValue}`;
    if (from === "subject" && to === "artifact") return `${cap(fromValue)} is represented by ${toValue}`;
    if (from === "subject" && to === "place") return `${cap(fromValue)} is situated at ${toValue}`;
    if (from === "subject" && to === "outcome") return `${cap(fromValue)} moves toward ${sentence(toValue)}`;
    if (from === "subject" && to === "constraint") return `${cap(fromValue)} must account for ${sentence(toValue)}`;
    if (from === "subject" && to === "temporal") return `${cap(fromValue)} carries forward through ${sentence(toValue)}`;
    if (from === "subject" && to === "affordance") return `${cap(fromValue)} becomes something people can ${sentence(toValue)}`;
    if (from === "subject" && to === "transformation") return `${cap(fromValue)} changes through ${sentence(toValue)}`;
    if (from === "subject" && to === "social") return `${cap(fromValue)} connects with ${toValue}`;
    if (from === "participants" && to === "outcome") return `${cap(fromValue)} can move the experience toward ${sentence(toValue)}`;
    if (from === "transformation" && to === "outcome") return `${cap(fromValue)} leads toward ${sentence(toValue)}`;
    if (from === "event" && to === "place") return `${cap(fromValue)} is situated at ${toValue}`;
  }

  return "";
}

/**
 * Select concrete evidence from existing semantic data. The renderer never
 * asks whether a word belongs to a known domain. A new noun inherits the same
 * treatment automatically.
 */
function lexicalEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const sourceText = clean(beat.text);
  const entityValues = beat.entities ?? [];
  const slotValues = ROLES.flatMap((role) => values(plan, role));

  const candidates = [...slotValues, ...entityValues, ...words(sourceText)]
    .map(sentence)
    .filter(Boolean)
    .filter((value) => !generic(value))
    .filter((value) => lower(value) !== subjectValue);

  const scored = candidates.map((value, index) => {
    const valueWords = words(value);
    const exactEntity = entityValues.some((entity) => lower(entity) === lower(value));
    const appearsInBeat = sourceText.toLowerCase().includes(lower(value));
    const slot = premise(plan)?.slots.find((candidate) =>
      candidate.values.some((item) => lower(item) === lower(value)),
    );

    return {
      value,
      score:
        (slot?.salience ?? 0) * 5 +
        (exactEntity ? 2.5 : 0) +
        (appearsInBeat ? 2 : 0) +
        Math.min(valueWords.length, 4) * 0.4 - index * 0.01,
    };
  });

  return [...new Map(
    scored.sort((a, b) => b.score - a.score).map((item) => [lower(item.value), item.value]),
  ).values()].slice(0, 8);
}

function strongestEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const candidates = lexicalEvidence(beat, plan);
  const realized = lower(beat.text);
  return candidates.find((value) => !realized.includes(lower(value))) ?? candidates[0] ?? "";
}

function directive(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const candidate = plan?.realization?.directives.find((item) => item.kind === beat.kind);
  if (!candidate || candidate.confidence < 0.72 || !clean(candidate.action)) return undefined;
  return candidate;
}

function fallbackText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(subject(beat, plan));
  const relation = semanticRelation(beat, plan);
  const evidence = strongestEvidence(beat, plan);
  const outcome = first(plan, "outcome");
  const transformation = values(plan, "transformation");
  const future = plan?.futureEvolution?.[0] ?? first(plan, "temporal");
  const why = plan?.whyInteract?.[0] ?? "";
  const progression = plan?.progressionModel?.[0] ?? "";
  const interaction = plan?.interactionModel?.[0] ?? "";
  const content = plan?.contentModel?.[0] ?? "";

  switch (beat.kind) {
    case "orientation": return relation ? `${relation}.` : evidence ? `${name} begins with ${evidence}.` : `${name} begins from the supplied premise.`;
    case "hook": return outcome ? `${relation || name} gives the interaction a concrete reason to continue: ${sentence(outcome)}.` : why ? `${cap(why)} ${name} makes that intent concrete.` : evidence ? `${evidence} gives ${subject(beat, plan)} its first active turn.` : `${name} gives the interaction a concrete reason to continue.`;
    case "need": return relation ? `${relation}.` : outcome ? `${name} begins with ${sentence(outcome)}.` : `${name} begins with the concrete need carried by the premise.`;
    case "threshold": return relation ? `${relation}.` : interaction ? `${name} moves into the next state through ${sentence(interaction)}.` : `${name} moves from observation into the next state.`;
    case "origin": return relation ? `${relation}.` : evidence ? `${name} brings ${evidence} into the present.` : `${name} carries what came before into the present.`;
    case "encounter": return relation ? `${relation}, changing what happens next.` : evidence ? `${cap(evidence)} enters the experience around ${subject(beat, plan)}, changing what happens next.` : `${name} encounters the next concrete condition in the premise.`;
    case "challenge": return relation ? `${relation}.` : progression ? `${name} encounters the next condition in ${sentence(progression)}.` : `${name} must resolve the next concrete condition in the premise.`;
    case "discovery":
    case "reveal": return relation ? `${relation}.` : evidence ? `${name} reveals more through ${evidence}.` : `${name} reveals another concrete part of the premise.`;
    case "instruction": return relation ? `${relation}.` : content ? `${name} provides the useful information: ${sentence(content)}.` : interaction ? `${name} makes the next move concrete through ${sentence(interaction)}.` : `${name} supplies the next usable piece of information.`;
    case "action": return relation ? `${relation}.` : interaction ? `Act on ${subject(beat, plan)}: ${sentence(interaction)}.` : evidence ? `Act on ${subject(beat, plan)} through ${evidence}.` : `${name} becomes the next concrete action.`;
    case "feedback": return relation ? `${relation}.` : outcome ? `The result becomes evidence for ${subject(beat, plan)}: ${sentence(outcome)}.` : `${name} uses the result as evidence for what happens next.`;
    case "contribution": return relation ? `${relation}, changing what becomes available next.` : evidence ? `${cap(evidence)} is added to ${subject(beat, plan)}, changing what becomes available next.` : `${name} changes when participation becomes contribution.`;
    case "escalation": return relation ? `${relation}.` : progression ? `${name} escalates through ${sentence(progression)}.` : `${name} raises the stakes around what comes next.`;
    case "transformation": return transformation.length >= 2 ? `${name} changes from ${sentence(transformation[0])} toward ${sentence(transformation[1])}.` : relation ? `${relation}.` : outcome ? `${name} changes toward ${sentence(outcome)}.` : `${name} changes because of the preceding interaction.`;
    case "reflection": return relation ? `${relation}.` : evidence ? `${name} retains what ${evidence} changed about the experience.` : `${name} retains the consequence of what happened.`;
    case "provenance": return evidence ? `${name} preserves the supplied evidence: ${evidence}.` : `${name} preserves the supplied evidence.`;
    case "identity": return relation ? `${relation}.` : evidence ? `${name} becomes identifiable through ${evidence}.` : `${name} becomes identifiable through the supplied context.`;
    case "milestone": return relation ? `${relation}.` : progression ? `${name} reaches a milestone in ${sentence(progression)}.` : `${name} reaches the next state established by the experience.`;
    case "unlock":
    case "earned_access": return relation ? `${relation}.` : outcome ? `${name} opens access tied to ${sentence(outcome)}.` : `${name} opens the next state because of what happened before it.`;
    case "payoff": return relation ? `${relation}.` : outcome ? `${name} reaches the payoff: ${sentence(outcome)}.` : `${name} reaches the result established by the premise.`;
    case "next_step": return relation ? `${relation}.` : progression ? `${name} continues through ${sentence(progression)}.` : `${name} uses the current state to determine the next action.`;
    case "continuation": return relation ? `${relation}, keeping the experience open.` : future ? `${name} remains open to ${sentence(future)}.` : `${name} carries the current state into what comes next.`;
    default: return evidence ? `${name} continues with ${evidence}.` : `${name} continues from the supplied premise.`;
  }
}

function directiveText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const item = directive(beat, plan);
  if (!item) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  const action = sentence(item.action);
  const relation = semanticRelation(beat, plan);
  const outcome = first(plan, "outcome");
  let text: string;

  switch (beat.kind) {
    case "orientation": text = `${name} enters the experience through ${action}.`; break;
    case "hook": text = `${name} gives the experience a reason to continue: ${action}.`; break;
    case "need": text = `${name} begins with the immediate need: ${action}.`; break;
    case "threshold": text = `${name} crosses the threshold by ${action}.`; break;
    case "origin": text = `${name} brings the relevant past into the present: ${action}.`; break;
    case "encounter": text = `${name} encounters the next relationship through ${action}.`; break;
    case "challenge": text = `${name} faces the condition that must be resolved: ${action}.`; break;
    case "discovery": text = `${name} discovers what the interaction makes available: ${action}.`; break;
    case "reveal": text = `${name} reveals what the conserved evidence supports: ${action}.`; break;
    case "instruction": text = `${name} provides the next useful move: ${action}.`; break;
    case "action": text = `Act on ${name}: ${action}.`; break;
    case "feedback": text = `The result becomes evidence for ${name}: ${action}.`; break;
    case "contribution": text = `${name} changes as participation becomes contribution: ${action}.`; break;
    case "escalation": text = `${name} escalates the experience by ${action}.`; break;
    case "transformation": text = `${name} changes through the accumulated interaction: ${action}.`; break;
    case "reflection": text = `${name} retains what the interaction means now: ${action}.`; break;
    case "provenance": text = `${name} carries the available evidence through ${action}.`; break;
    case "identity": text = `${name} becomes more clearly identified through ${action}.`; break;
    case "milestone": text = `${name} reaches a meaningful state: ${action}.`; break;
    case "unlock": text = `${name} opens the next state through ${action}.`; break;
    case "earned_access": text = `${name} earns the next state through ${action}.`; break;
    case "payoff": text = `${name} reaches the intended result: ${action}.`; break;
    case "next_step": text = `${name} uses the current state to continue: ${action}.`; break;
    case "continuation": text = `${name} remains open to what comes next through ${action}.`; break;
    default: text = `${name} advances the experience through ${action}.`;
  }

  if (relation && !lower(text).includes(lower(relation))) text = `${sentence(text)} ${relation}.`;

  if (outcome && ["hook", "payoff", "continuation"].includes(beat.kind)) {
    const outcomeWords = words(outcome);
    if (!outcomeWords.some((word) => lower(text).includes(lower(word)))) {
      text = `${sentence(text)} The intended outcome is ${sentence(outcome)}.`;
    }
  }

  return text;
}

function preserveConcreteEvidence(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const evidence = strongestEvidence(beat, plan);
  if (!evidence || lower(text).includes(lower(evidence))) return text;
  return `${sentence(text)} The concrete detail is ${evidence}.`;
}

function preserveSemanticAction(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const item = directive(beat, plan);
  const action = sentence(item?.action);
  if (!item || !action || lower(text).includes(lower(action))) return text;
  return `${sentence(text)} The operative move is ${action}.`;
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const directed = directiveText(beat, plan);
  let text = clean(directed ?? fallbackText(beat, plan));
  if (generic(text)) text = clean(fallbackText(beat, plan));
  text = preserveConcreteEvidence(text, beat, plan);
  return preserveSemanticAction(text, beat, plan);
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

/** Diagnostic-only classification. It never selects or realizes a story. */
export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const text = lower([
    beat.text,
    subject(beat, plan),
    ...ROLES.flatMap((role) => values(plan, role)),
    ...(plan?.emotionalIntent ?? []),
    ...(plan?.interactionModel ?? []),
    ...(plan?.futureEvolution ?? []),
  ].join(" "));

  return {
    coupled: Boolean(plan?.premise?.relations.length),
    evidence: lexicalEvidence(beat, plan).length > 0,
    outcome: Boolean(first(plan, "outcome")) || /\b(remember|discover|return|connect|play|learn|change)\b/i.test(text),
    relationship: Boolean(plan?.premise?.relations.some((item) => item.confidence >= 0.72)),
    temporal: Boolean(first(plan, "temporal") || plan?.futureEvolution?.length),
    social: Boolean(first(plan, "social") || first(plan, "participants")),
    transformation: Boolean(first(plan, "transformation")),
    constraint: Boolean(first(plan, "constraint")),
  };
}
