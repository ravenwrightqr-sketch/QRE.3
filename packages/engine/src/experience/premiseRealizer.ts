import type {
  CognitiveExperiencePlan,
  CognitivePremise,
  CognitivePremiseRelation,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";
import { inferExperienceMechanics } from "./cognitiveMechanics.js";

/**
 * =============================================================================
 * CANONICAL UNIVERSAL PREMISE REALIZER
 * =============================================================================
 *
 * This is the language-authority boundary between cognition and experience.
 *
 * Cognition decides what is meaningful.
 * Premise construction conserves what is actually known.
 * Trajectory selects where cognitive pressure acts.
 * This module converts that pressure into observable language.
 *
 * HARD RULES
 * ----------
 * 1. Never turn a mechanic name into prose by quoting the mechanic itself.
 * 2. Never invent domain facts to satisfy a mechanic.
 * 3. Prefer an authoritative semantic directive when it is executable.
 * 4. Reject empty, compiler-only, or purely abstract directives.
 * 5. Concrete premise evidence must survive into presentation when available.
 * 6. A mechanic must become participant/environment behavior, not metadata.
 * 7. The final sentence must describe something that could actually be seen,
 *    done, encountered, changed, withheld, revealed, retained, or continued.
 *
 * The realizer is deliberately domain-neutral. "agency" therefore becomes
 * choice; "suspense" becomes unresolved/withheld information; "legacy" becomes
 * something left available for later; "mastery" becomes successful control.
 * The nouns and facts still come from the supplied premise.
 * =============================================================================
 */

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const lower = (value: unknown): string =>
  clean(value).toLowerCase().replace(/[’]/g, "'");

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

const unique = <T>(items: T[]): T[] => [...new Set(items)];

function premise(plan?: CognitiveExperiencePlan): CognitivePremise | undefined {
  return plan?.premise;
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

  return "the participant";
}

function semanticEvidence(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
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

function evidenceForBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
  limit = 3,
): string[] {
  const scored = semanticEvidence(beat, plan).map((value, index) => {
    const slot = premise(plan)?.slots.find((candidate) =>
      candidate.values.some((item) => lower(item) === lower(value)),
    );

    const roleBonus =
      slot?.role === "event" ? 1.4 :
      slot?.role === "artifact" ? 1.3 :
      slot?.role === "medium" ? 1.2 :
      slot?.role === "outcome" ? 1.15 :
      slot?.role === "transformation" ? 1.1 :
      slot?.role === "constraint" ? 1.05 : 0;

    return {
      value,
      score: (slot?.salience ?? 0) * 5 + roleBonus - index * 0.01,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => item.value)
    .filter(
      (value, index, all) =>
        all.findIndex((candidate) => lower(candidate) === lower(value)) === index,
    )
    .slice(0, limit);
}

function relationValues(
  plan: CognitiveExperiencePlan | undefined,
  from: CognitivePremiseRole,
  to: CognitivePremiseRole,
): Array<{
  relation: CognitivePremiseRelation;
  fromValue: string;
  toValue: string;
}> {
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

function semanticRelation(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const priority: Partial<
    Record<StoryBeat["kind"], Array<[CognitivePremiseRole, CognitivePremiseRole]>>
  > = {
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

/**
 * Semantic directives are authoritative only when they contain an executable
 * action. This is the language-authority guard that prevents values such as
 * "to", "continuity", or "carry the current state forward" from becoming
 * fake concrete events.
 */
function normalizeDirectiveAction(value: unknown): string {
  let action = sentence(value);

  action = action
    .replace(/^the\s+concrete\s+action\s+is\s+to\s*/i, "")
    .replace(/^the\s+action\s+is\s+to\s*/i, "")
    .replace(/^action\s*:\s*/i, "")
    .replace(/^payoff\s+action\s*:\s*/i, "")
    .trim();

  return sentence(action);
}

function lexicalEvidence(value: string): string[] {
  return unique(
    words(value).filter((word) => !STOP.has(lower(word))),
  );
}

function isExecutableDirective(action: string): boolean {
  if (!action) return false;
  if (generic(action)) return false;

  if (/^(?:to|a|an|the)$/i.test(action)) return false;

  if (/^(?:continuity|meaning|significance|context|identity|evidence|experience|direction|purpose|state|condition|result|relationship)$/i.test(action)) {
    return false;
  }

  if (/^(?:the\s+)?(?:current|preceding|changed|resulting|active|accumulated)\s+(?:state|condition|experience|situation)$/i.test(action)) {
    return false;
  }

  if (/^(?:carry|advance|continue|preserve|maintain)\s+(?:the\s+)?(?:current|present|resulting|available)\s+(?:state|condition|experience|situation|context)$/i.test(action)) {
    return false;
  }

  const lexical = lexicalEvidence(action);
  if (lexical.length < 2) return false;

  return true;
}

function directive(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): { subject?: string; action: string; confidence: number } | undefined {
  const item = plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
  if (!item || item.confidence < 0.72) return undefined;

  const action = normalizeDirectiveAction(item.action);
  if (!isExecutableDirective(action)) return undefined;

  return {
    subject: clean(item.subject),
    action,
    confidence: item.confidence,
  };
}

/**
 * The cognitive vocabulary is converted into behavioral operations here.
 * These are presentation primitives, not domain templates.
 */
const MECHANIC_OPERATIONS: Record<string, StoryBeat["kind"][]> = {
  anticipation: ["hook", "threshold"],
  uncertainty: ["threshold", "encounter", "reveal"],
  suspense: ["threshold", "encounter", "reveal"],
  discovery: ["discovery", "reveal"],
  surprise: ["reveal", "transformation"],
  reversal: ["reveal", "transformation"],
  participation: ["action", "feedback", "contribution"],
  agency: ["action", "feedback", "next_step"],
  consequence: ["action", "feedback", "transformation"],
  competition: ["challenge", "escalation"],
  mastery: ["challenge", "feedback", "milestone"],
  contribution: ["encounter", "contribution", "feedback"],
  authorship: ["action", "contribution", "identity"],
  reciprocity: ["encounter", "action", "feedback"],
  accumulation: ["contribution", "milestone"],
  momentum: ["encounter", "escalation", "next_step"],
  escalation: ["escalation", "payoff"],
  transformation: ["transformation"],
  contrast: ["orientation", "transformation"],
  reveal: ["reveal"],
  memory: ["origin", "reflection"],
  ritual: ["origin", "action", "continuation"],
  continuation: ["continuation"],
  adaptation: ["feedback", "next_step"],
  pampering: ["encounter", "transformation"],
  indulgence: ["encounter", "escalation", "transformation"],
  excess: ["escalation", "payoff"],
  spectacle: ["encounter", "escalation", "payoff"],
  delight: ["encounter", "transformation", "payoff"],
  euphoria: ["escalation", "payoff"],
  celebration: ["encounter", "milestone", "payoff"],
  prestige: ["threshold", "identity", "payoff"],
  novelty: ["discovery", "reveal"],
  curation: ["discovery", "action", "feedback"],
  scarcity: ["threshold", "challenge", "unlock"],
  recognition: ["identity", "milestone", "payoff"],
  ownership: ["identity", "milestone", "payoff"],
  legacy: ["reflection", "provenance", "continuation"],
  resonance: ["reflection", "payoff", "continuation"],
  intimacy: ["encounter", "reflection", "payoff"],
  catharsis: ["escalation", "transformation", "payoff"],
  relief: ["challenge", "payoff"],
  wonder: ["threshold", "discovery", "reveal"],
  awe: ["encounter", "escalation", "payoff"],
  embodiment: ["threshold", "action", "feedback"],
  immersion: ["threshold", "encounter", "transformation"],
};

function activeMechanics(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const signals = inferExperienceMechanics({
    plan,
    premise: plan?.premise,
  });

  return signals
    .filter((signal) => signal.confidence >= 0.7)
    .filter((signal) => MECHANIC_OPERATIONS[signal.mechanic]?.includes(beat.kind))
    .sort((a, b) => b.confidence - a.confidence)
    .map((signal) => signal.mechanic);
}

function contextEvidence(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const evidence = evidenceForBeat(beat, plan, 2);
  if (evidence.length === 1) return evidence[0];
  if (evidence.length >= 2) return `${evidence[0]} and ${evidence[1]}`;
  return "";
}

/**
 * Convert mechanic pressure into observable participant/environment behavior.
 *
 * Notice what is deliberately absent: no dog, spa, haunted-house, birthday,
 * restaurant, concert, or other domain branch. The concrete noun is supplied
 * by the premise; the mechanic only determines the behavior applied to it.
 */
function realizeMechanic(
  mechanic: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string | undefined {
  const name = cap(subject(beat, plan));
  const context = contextEvidence(beat, plan);

  switch (mechanic) {
    case "agency":
      return context
        ? `${name} gets the move: they choose how to engage with ${context}.`
        : `${name} gets the move: they choose what happens next.`;
    case "ownership":
      return context
        ? `${name} claims ${context} as something they can keep or shape.`
        : `${name} claims a part of the experience and can shape what comes next.`;
    case "mastery":
      return context
        ? `${name} takes control of ${context} and makes the next move work.`
        : `${name} takes control of the situation and makes the next move work.`;
    case "prestige":
      return context
        ? `${name} is given access to ${context} as something exclusive.`
        : `${name} is given access to something exclusive.`;
    case "participation":
      return context
        ? `${name} takes part by acting on ${context}.`
        : `${name} takes part by making an observable move.`;
    case "contribution":
      return context
        ? `${name} adds ${context}, changing what becomes available next.`
        : `${name} leaves a contribution that changes what becomes available next.`;
    case "legacy":
      return context
        ? `${name} leaves ${context} behind for someone else to encounter later.`
        : `${name} leaves something behind that another participant can encounter later.`;
    case "suspense":
    case "uncertainty":
      return context
        ? `${name} can see ${context}, but what it leads to remains unresolved and partly withheld.`
        : `${name} can see enough to continue, but the important outcome remains unresolved and partly withheld.`;
    case "anticipation":
      return context
        ? `${name} sees ${context} approaching, but the result has not arrived yet.`
        : `${name} sees the next condition approaching without knowing the result yet.`;
    case "discovery":
      return context
        ? `${name} discovers that ${context} changes what is possible.`
        : `${name} discovers a new detail that changes what is possible.`;
    case "reveal":
      return context
        ? `${name} sees ${context} come into view.`
        : `${name} sees a previously hidden detail come into view.`;
    case "surprise":
      return context
        ? `${name} discovers that ${context} is not what was expected.`
        : `${name} encounters a result that was not expected.`;
    case "escalation":
    case "excess":
    case "indulgence":
      return context
        ? `${name} goes further with ${context} than before.`
        : `${name} goes further than before, increasing what is happening.`;
    case "pampering":
      return context
        ? `${name} receives more attention through ${context}.`
        : `${name} receives increasingly attentive treatment.`;
    case "spectacle":
    case "awe":n      return context
        ? `${name} sees ${context} brought fully into view.`
        : `${name} sees the result brought fully into view.`;
    case "celebration":
    case "euphoria":
    case "delight":
      return context
        ? `${name} turns ${context} into a moment worth celebrating.`
        : `${name} turns the result into a moment worth celebrating.`;
    case "memory":
      return context
        ? `${name} connects ${context} to what is happening now.`
        : `${name} connects what is happening now to preserved context.`;
    case "resonance":
      return context
        ? `${name} recognizes how ${context} carries meaning into the present.`
        : `${name} recognizes how the result carries forward into the present.`;
    case "transformation":n      return context
        ? `${name} is visibly different after ${context}.`
        : `${name} is visibly different after what has happened.`;
    case "contrast":
      return context
        ? `${name} can see the difference between ${context} and what came before.`
        : `${name} can see a clear difference from what came before.`;
    case "adaptation":
      return context
        ? `${name} adjusts to ${context} as the situation changes.`
        : `${name} adjusts as the situation changes.`;
    case "momentum":
      return context
        ? `${name} carries ${context} into the next turn.`
        : `${name} carries the current action into the next turn.`;
    case "consequence":
      return context
        ? `${name} sees what changes because of ${context}.`
        : `${name} sees the consequence of the preceding action.`;
    case "competition":
      return context
        ? `${name} faces ${context} and has to respond.`
        : `${name} faces a condition that requires a response.`;
    case "reciprocity":
      return context
        ? `${name} acts on ${context} and receives a changed response.`
        : `${name} acts and receives a changed response.`;
    case "authorship":n      return context
        ? `${name} puts their own choice into ${context}.`
        : `${name} puts their own choice into the result.`;
    case "accumulation":
      return context
        ? `${name} adds ${context} to what has already been established.`
        : `${name} adds another piece to what has already been established.`;
    case "curation":
      return context
        ? `${name} selects from ${context} and shapes what remains.`
        : `${name} selects what remains and shapes the result.`;
    case "scarcity":
      return context
        ? `${name} encounters ${context} while access remains limited.`
        : `${name} encounters an opportunity while access remains limited.`;
    case "recognition":
      return context
        ? `${name} is recognized through ${context}.`
        : `${name} is recognized through what they have done.`;
    case "intimacy":
      return context
        ? `${name} gets closer to ${context}.`
        : `${name} gets closer to what is happening.`;
    case "catharsis":
      return context
        ? `${name} moves through ${context} and reaches a release.`
        : `${name} moves through the accumulated tension and reaches a release.`;
    case "relief":
      return context
        ? `${name} reaches ${context} after the preceding pressure.`
        : `${name} reaches relief after the preceding pressure.`;
    case "wonder":
      return context
        ? `${name} encounters ${context} as something not yet fully understood.`
        : `${name} encounters something not yet fully understood.`;
    case "embodiment":
    case "immersion":
      return context
        ? `${name} experiences ${context} directly.`
        : `${name} experiences the current state directly.`;
    case "ritual":
      return context
        ? `${name} performs the repeated action around ${context}.`
        : `${name} performs the meaningful repeated action.`;
    case "continuation":
      return context
        ? `${name} carries ${context} into what comes next.`
        : `${name} leaves the next turn open for another action.`;
    case "novelty":
      return context
        ? `${name} encounters ${context} as something new.`
        : `${name} encounters a new detail.`;
    case "reversal":
      return context
        ? `${name} discovers that ${context} changes the direction of the situation.`
        : `${name} discovers that the situation has changed direction.`;
    default:
      return undefined;
  }
}

function mechanicExpression(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  for (const mechanic of activeMechanics(beat, plan)) {
    const expression = realizeMechanic(mechanic, beat, plan);
    if (expression) return expression;
  }
  return undefined;
}

function directiveText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const item = directive(beat, plan);
  if (!item) return undefined;

  const name = cap(item.subject || subject(beat, plan));
  const action = sentence(item.action);

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
  if (!item) return text;

  const action = sentence(item.action);
  if (!action || lower(text).includes(lower(action))) return text;

  return `${sentence(text)} ${cap(action)}.`;
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);
  for (const pattern of DEAD_PROSE) {
    result = result.replace(pattern, "").replace(/\s{2,}/g, " ").trim();
  }
  return sentence(result);
}

function finalValidation(text: string, beat: StoryBeat): string {
  let result = removeCompilerFiller(text);

  if (!result) {
    result = `${cap(beat.entities?.[0] || "The participant")} takes the next observable action`;
  }

  return sentence(result);
}

export function realizePremiseBeat(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const directed = directiveText(beat, plan);
  const mechanic = mechanicExpression(beat, plan);

  /*
   * Authority order:
   *
   * executable directive > mechanic realization > semantic relation >
   * evidence-grounded fallback.
   *
   * The directive remains authoritative, but only after passing the
   * executable-action guard. This is the exact boundary that prevents an
   * abstract directive from poisoning the final language.
   */
  let text = clean(directed ?? mechanic ?? fallbackText(beat, plan));

  if (generic(text)) {
    text = clean(mechanic ?? fallbackText(beat, plan));
  }

  text = removeCompilerFiller(text);
  text = preserveConcreteEvidence(text, beat, plan);
  text = preserveSemanticAction(text, beat, plan);
  text = removeCompilerFiller(text);

  return `${finalValidation(text, beat)}.`;
}

export function realizePremiseBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: realizePremiseBeat(beat, plan),
  }));
}

export function isGenericCompilerProse(value: string): boolean {
  return DEAD_PROSE.some((pattern) => pattern.test(value));
}

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
