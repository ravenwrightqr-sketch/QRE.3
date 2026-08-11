import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * CANONICAL UNIVERSAL PREMISE REALIZER
 *
 * Cognition owns meaning.
 * Trajectory owns causal pressure.
 * The universal compiler owns structure.
 * This boundary owns the final translation from those constraints into
 * observable, evidence-backed events expressed as natural language.
 *
 * Critical invariant:
 * semantic significance is never presentation copy.
 * A mechanic is not considered realized merely because its vocabulary appears;
 * the resulting beat must describe something that happens, changes, or becomes
 * available because of the preceding state.
 */

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
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
  /the situation is now meaningful/i,
  /the experience becomes more interesting/i,
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
  /go further than before/i,
  /increase the active condition/i,
  /carry the preceding state/i,
  /reach the result produced by what happened before/i,
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

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined { return plan?.premise; }
function unique(items: string[]): string[] { return [...new Set(items.map(clean).filter(Boolean))]; }
function abstractDirective(value: string): boolean { return ABSTRACT_DIRECTIVE.some((pattern) => pattern.test(value)); }
function generic(value: string): boolean { return DEAD_PROSE.some((pattern) => pattern.test(value)); }

function values(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  const raw = premise(plan)?.slots
    .filter((slot) => slot.role === role)
    .flatMap((slot) => slot.values)
    .filter((value): value is string => typeof value === "string") ?? [];
  return unique(raw).filter((value) => role !== "outcome" || !abstractDirective(value));
}

function first(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string { return values(plan, role)[0] ?? ""; }

function words(value: unknown): string[] {
  return clean(value).replace(/[^\p{L}\p{N}'’-]+/gu, " ").split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(lower(word)));
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = first(plan, "subject");
  if (explicit) return explicit;
  const central = clean(plan?.centralSubject);
  if (central && words(central).length <= 8) return central;
  const entity = clean(beat.entities?.[0]);
  if (entity) return entity;
  return central ? words(central)[0] ?? central : "the subject";
}

function evidenceCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const candidates = ROLES.flatMap((role) => values(plan, role).map((value) => {
    const slot = premise(plan)?.slots.find((item) => item.role === role && item.values.some((candidate) => lower(candidate) === lower(value)));
    const priority = role === "event" ? 8 : role === "artifact" ? 7 : role === "medium" ? 6 : role === "place" ? 5 : role === "temporal" ? 4 : role === "outcome" ? 3 : role === "transformation" ? 2 : 1;
    return { value: sentence(value), priority: priority + (slot?.salience ?? 0) };
  }));
  return unique(candidates.sort((a, b) => b.priority - a.priority).map((item) => item.value)
    .concat((beat.entities ?? []).map(sentence))
    .filter(Boolean)
    .filter((value) => lower(value) !== subjectValue)
    .filter((value) => !generic(value))
    .filter((value) => !abstractDirective(value))
    .filter((value) => !STOP.has(lower(value)))).slice(0, 4);
}

function directiveFor(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  const item = plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
  if (!item || item.confidence < 0.72 || !clean(item.action)) return undefined;
  return item;
}

/** Only observable directive actions are allowed into final language. */
function concreteDirectiveAction(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const action = sentence(directiveFor(beat, plan)?.action);
  if (!action || abstractDirective(action) || generic(action)) return undefined;
  if (!/\b(?:arrive|enter|cross|encounter|notice|find|see|discover|handle|touch|use|open|close|move|return|add|share|give|bring|take|show|record|write|read|follow|choose|respond|inspect|clean|wash|groom|serve|play|collect|keep|preserve|reach|earn|claim|own|change|reveal|turn|place|leave|pick|carry|visit|meet|watch|hear|smell|taste|look|hold|build|repair|restore|prepare|deliver|document|photograph|save|store|remember|recognize|compare|connect|continue)\b/i.test(action)) return undefined;
  return action;
}

function evidencePair(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

/** Domain-neutral event realization: actions and transitions, never domain templates. */
function eventText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(subject(beat, plan));
  const evidence = evidenceCandidates(beat, plan);
  const context = evidencePair(evidence.slice(0, 2));
  const action = concreteDirectiveAction(beat, plan);
  const transformation = values(plan, "transformation");
  const outcome = first(plan, "outcome");
  const affordance = first(plan, "affordance");

  if (action) {
    switch (beat.kind) {
      case "orientation": return `${name} begins by ${action}.`;
      case "hook": return `${name} encounters the turn when ${action}.`;
      case "need": return `${name} needs to ${action}.`;
      case "threshold": return `${name} crosses the threshold by ${action}.`;
      case "origin": return `${name} brings ${action} into the present.`;
      case "encounter": return `${name} encounters a new condition when ${action}.`;
      case "challenge": return `${name} faces the challenge by ${action}.`;
      case "discovery": return `${name} discovers something when ${action}.`;
      case "reveal": return `${name} sees the hidden detail when ${action}.`;
      case "instruction": return `${name} gets a usable next move: ${action}.`;
      case "action": return `${name} acts: ${action}.`;
      case "feedback": return `${name} sees the result when ${action}.`;
      case "contribution": return `${name} adds to the shared state when ${action}.`;
      case "escalation": return `${name} pushes the current condition further by ${action}.`;
      case "transformation": return `${name} changes when ${action}.`;
      case "reflection": return `${name} revisits what happened when ${action}.`;
      case "provenance": return `${name} preserves the origin by ${action}.`;
      case "identity": return `${name} establishes its identity when ${action}.`;
      case "milestone": return `${name} reaches a new state when ${action}.`;
      case "unlock": return `${name} unlocks the next state by ${action}.`;
      case "earned_access": return `${name} earns the next state by ${action}.`;
      case "payoff": return `${name} reaches the result when ${action}.`;
      case "next_step": return `${name} takes the next step: ${action}.`;
      case "continuation": return `${name} carries the result forward by ${action}.`;
      default: return `${name} acts: ${action}.`;
    }
  }

  switch (beat.kind) {
    case "orientation": return context ? `${name} enters with ${context} already in view.` : `${name} enters the situation.`;
    case "hook": return context ? `${name} notices ${context}, giving the moment its first active turn.` : `${name} encounters the first active turn.`;
    case "need": return outcome ? `${name} has a concrete target: ${sentence(outcome)}.` : context ? `${name} has to deal with ${context}.` : `${name} faces the immediate problem.`;
    case "threshold": return context ? `${name} moves into ${context}.` : `${name} crosses into the next state.`;
    case "origin": return context ? `${name} brings ${context} into the present.` : `${name} starts from what is already known.`;
    case "encounter": return context ? `${name} encounters ${context}, and the next moment now has something new to respond to.` : `${name} encounters a concrete new condition.`;
    case "challenge": return context ? `${name} has to respond to ${context}.` : `${name} meets a condition that requires a response.`;
    case "discovery": return context ? `${name} finds ${context}, revealing a new part of the situation.` : `${name} discovers a concrete new detail.`;
    case "reveal": return context ? `${name} sees ${context} for what it changes.` : `${name} sees a detail that was not visible at the beginning.`;
    case "instruction": return affordance ? `${name} gets a usable next move: ${sentence(affordance)}.` : context ? `${name} has a concrete next move involving ${context}.` : `${name} gets a concrete next move.`;
    case "action": return affordance ? `${name} acts: ${sentence(affordance)}.` : context ? `${name} acts on ${context}.` : `${name} takes the next concrete action.`;
    case "feedback": return outcome ? `${name} sees a result that changes the route toward ${sentence(outcome)}.` : context ? `${name} sees what changes after ${context}.` : `${name} sees the result of the action.`;
    case "contribution": return context ? `${name} adds ${context} to the experience, and the shared state now contains it.` : `${name} adds a concrete contribution, changing what is available next.`;
    case "escalation": return context ? `${name} pushes ${context} further, so the next condition inherits the change.` : `${name} takes the current condition further, changing what follows.`;
    case "transformation": return transformation.length >= 2 ? `${name} moves from ${sentence(transformation[0])} to ${sentence(transformation[1])}.` : context ? `${name} is visibly different after what happens with ${context}.` : `${name} ends in a different state than the one established at the beginning.`;
    case "reflection": return context ? `${name} returns to ${context} and sees its consequence in the present.` : `${name} revisits what happened and carries its consequence forward.`;
    case "provenance": return context ? `${name} preserves ${context} as part of the record.` : `${name} preserves the origin in the experience.`;
    case "identity": return context ? `${name} becomes identifiable through ${context}.` : `${name} establishes a distinct identity through what has happened.`;
    case "milestone": return outcome ? `${name} reaches ${sentence(outcome)}.` : context ? `${name} reaches a new state through ${context}.` : `${name} reaches a new state.`;
    case "unlock":
    case "earned_access": return outcome ? `${name} earns access to ${sentence(outcome)}.` : context ? `${name} opens the next possibility through ${context}.` : `${name} earns access to the next state.`;
    case "payoff": return outcome ? `${name} reaches ${sentence(outcome)}.` : context ? `${name} reaches a result shaped by ${context}.` : `${name} reaches the result created by the preceding events.`;
    case "next_step": return affordance ? `${name} takes the next step: ${sentence(affordance)}.` : context ? `${name} takes the next step with ${context} now in play.` : `${name} takes the next step from the changed state.`;
    case "continuation": return context ? `${name} carries ${context} into what comes next.` : `${name} leaves a concrete next turn available.`;
    default: return context ? `${name} continues with ${context} now in play.` : `${name} continues from the changed state.`;
  }
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);
  for (const pattern of DEAD_PROSE) result = result.replace(pattern, "");
  return sentence(result.replace(/\s{2,}/g, " ").trim());
}

function preserveConcreteEvidence(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const evidence = evidenceCandidates(beat, plan);
  if (!evidence.length) return text;
  const missing = evidence.filter((value) => !lower(text).includes(lower(value)));
  if (!missing.length) return text;
  const additions = missing.slice(0, 2);
  switch (beat.kind) {
    case "orientation": return `${sentence(text)} ${additions.join(" and ")} are present from the start.`;
    case "encounter": return `${sentence(text)} Then ${additions.join(" and ")} enter the scene.`;
    case "discovery":
    case "reveal": return `${sentence(text)} The next visible detail is ${additions.join(" and ")}.`;
    case "escalation": return `${sentence(text)} The change also reaches ${additions.join(" and ")}.`;
    case "transformation": return `${sentence(text)} The difference is visible in ${additions.join(" and ")}.`;
    case "payoff": return `${sentence(text)} The result remains tied to ${additions.join(" and ")}.`;
    default: return text;
  }
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  let text = eventText(beat, plan);
  text = removeCompilerFiller(text);
  text = preserveConcreteEvidence(text, beat, plan);
  text = removeCompilerFiller(text);
  return `${sentence(text)}.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value)) || ABSTRACT_DIRECTIVE.some((pattern) => pattern.test(value));
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
