import type {
  CognitiveExperiencePlan,
  CognitiveEvidence,
  CognitivePremiseRole,
  StoryBeat,
} from "@qre/contracts";

/**
 * Canonical cognition -> observable-language boundary.
 *
 * This module is intentionally domain-neutral. It may be lively, funny, tense,
 * or cinematic, but every concrete claim must come from supplied evidence.
 * Creative realization may change framing and rhythm; it may not manufacture
 * a physical event and present it as observed fact.
 */

const ROLES: CognitivePremiseRole[] = [
  "subject", "event", "medium", "artifact", "participants", "outcome",
  "emotion", "affordance", "temporal", "place", "social", "transformation", "constraint",
];

const STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "do", "does", "doing", "for", "from", "get", "gets", "give", "gives",
  "given", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "make",
  "makes", "making", "me", "my", "of", "on", "or", "our", "people", "please", "that",
  "the", "their", "this", "those", "to", "turn", "up", "was", "we", "what", "when",
  "where", "which", "who", "with", "you", "your", "something", "someone", "thing",
  "experience", "story", "about", "through", "just", "more", "than", "then", "now",
  "will", "keep", "after", "before", "very", "really", "want", "needs", "need", "next",
  "concrete", "current", "available", "supported", "meaningful", "intended", "useful",
  "immediate", "observed", "situation", "condition", "state", "change", "changed", "result",
  "interaction", "direction", "significance", "purpose", "context",
]);

const DEAD_PROSE: RegExp[] = [
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

const ABSTRACT_DIRECTIVE: RegExp[] = [
  /make .*?\bmeaningful\b/i,
  /make .*?\bexplicit\b/i,
  /connect .*? to meaning/i,
  /connect .*? with identity/i,
  /surface .*? evidence/i,
  /preserve .*? context/i,
  /adapt to accumulated/i,
  /adapt to .*? history/i,
  /allow participants to/i,
  /let participants/i,
  /enter living memory/i,
  /witness .*? contribute/i,
  /affect shared state/i,
  /change what can happen next/i,
  /determine what happens next/i,
  /use the current state/i,
  /carry .*? into the present/i,
  /recognize what .*? means/i,
  /recognize .*? significance/i,
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

const COMPILER_FRAGMENT: RegExp[] = [
  /^gets increasingly\b/i,
  /^becomes increasingly\b/i,
  /^increasingly\b/i,
  /^the current condition\b/i,
  /^the changed state\b/i,
  /^the next state\b/i,
  /^the resulting state\b/i,
  /^the active condition\b/i,
  /^the accumulated state\b/i,
  /^the preceding state\b/i,
  /^what happens next\b/i,
  /^what follows\b/i,
  /^the situation\b/i,
  /^the experience\b/i,
  /^the interaction\b/i,
  /^the result\b/i,
];

const EXTRACTION_ARTIFACT: RegExp[] = [
  /^n\b/i,
  /^n\s+/i,
  /\band gets$/i,
  /\bgets\s*$/i,
  /^the interaction$/i,
  /^the experience$/i,
  /^the situation$/i,
];

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

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

const matches = (value: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(value));

function cleanEvidence(value: unknown): string {
  return sentence(value)
    .replace(/^n\s+/i, "")
    .replace(/\s+and\s+gets$/i, "")
    .replace(/\s+gets$/i, "")
    .replace(/\bthe interaction\b/gi, "")
    .replace(/\bthe experience\b/gi, "")
    .replace(/\bthe situation\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function safe(value: string): boolean {
  const text = cleanEvidence(value);
  return Boolean(text)
    && !matches(text, DEAD_PROSE)
    && !matches(text, ABSTRACT_DIRECTIVE)
    && !matches(text, COMPILER_FRAGMENT)
    && !matches(text, EXTRACTION_ARTIFACT);
}

function words(value: unknown): string[] {
  return clean(value)
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ""))
    .filter((word) => word.length > 2 && !STOP.has(lower(word)));
}

function premiseValues(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    plan?.premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values)
      .filter((value): value is string => typeof value === "string")
      .map(cleanEvidence)
      .filter(safe) ?? [],
  );
}

function first(plan: CognitiveExperiencePlan | undefined, role: CognitivePremiseRole): string {
  return premiseValues(plan, role)[0] ?? "";
}

function subject(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const explicit = first(plan, "subject");
  if (explicit && !/^n\b/i.test(explicit)) return explicit;
  const entity = cleanEvidence(beat.entities?.[0]);
  if (entity && safe(entity)) return entity;
  const central = cleanEvidence(plan?.centralSubject);
  if (central && safe(central) && words(central).length <= 6) return central;
  return "the subject";
}

/**
 * Preserve phrases, not just nouns. This is the important distinction for
 * service stories: "feathers on a stick" is useful evidence; "feathers" alone
 * is much less useful. No industry vocabulary is required.
 */
function lexicalPhrases(value: unknown): string[] {
  const text = cleanEvidence(value);
  if (!text) return [];

  return unique(
    text
      .split(/\s+(?:and|then|because|when|while|so|but|that)\s+/i)
      .map(cleanEvidence)
      .filter(safe)
      .filter((phrase) => words(phrase).length >= 2 && words(phrase).length <= 12),
  ).slice(0, 8);
}

function lexicalEvidence(value: unknown): string[] {
  return unique(
    words(value)
      .filter((word) => word.length >= 4)
      .filter((word) => !STOP.has(lower(word))),
  );
}

function evidenceCandidates(beat: StoryBeat, plan?: CognitiveExperiencePlan): string[] {
  const subjectValue = lower(subject(beat, plan));
  const roleWeight: Partial<Record<CognitivePremiseRole, number>> = {
    event: 9,
    artifact: 8,
    medium: 7,
    place: 7,
    temporal: 6,
    transformation: 6,
    outcome: 5,
    participants: 4,
    social: 4,
    emotion: 3,
    affordance: 3,
    constraint: 3,
  };

  const ranked: Array<{ value: string; score: number }> = [];

  for (const role of ROLES) {
    for (const value of premiseValues(plan, role)) {
      const salience = plan?.premise?.slots.find((slot) => slot.role === role)?.salience ?? 0;
      ranked.push({ value, score: (roleWeight[role] ?? 1) + salience });
    }
  }

  for (const value of beat.entities ?? []) {
    const cleaned = cleanEvidence(value);
    if (safe(cleaned)) ranked.push({ value: cleaned, score: 6 });
  }

  for (const phrase of lexicalPhrases(beat.text)) {
    ranked.push({ value: phrase, score: 5 });
  }

  for (const value of lexicalEvidence(beat.text)) {
    if (safe(value)) ranked.push({ value, score: 2 });
  }

  return unique(
    ranked
      .sort((a, b) => b.score - a.score)
      .map((item) => item.value)
      .filter((value) => lower(value) !== subjectValue)
      .filter((value) => !STOP.has(lower(value)))
      .filter(safe)
      .slice(0, 8),
  );
}

function directiveFor(beat: StoryBeat, plan?: CognitiveExperiencePlan) {
  return beat.directive ?? plan?.realization?.directives.find((candidate) => candidate.kind === beat.kind);
}

function executableAction(value: unknown, evidence?: CognitiveEvidence[]): string | undefined {
  const action = sentence(value)
    .replace(/^the\s+concrete\s+action\s+is\s+to\s*/i, "")
    .replace(/^the\s+action\s+is\s+to\s*/i, "")
    .replace(/^action\s*:\s*/i, "")
    .replace(/^payoff\s+action\s*:\s*/i, "")
    .trim();

  if (!action || matches(action, DEAD_PROSE) || matches(action, ABSTRACT_DIRECTIVE) || matches(action, COMPILER_FRAGMENT)) return undefined;
  if (/^(?:meaning|significance|context|identity|evidence|experience|direction|purpose|state|condition|result|relationship|continuity)$/i.test(action)) return undefined;
  if (!words(action).length) return undefined;

  // Creative-realization directives may frame the moment, but they cannot
  // introduce a new physical fact into the canonical service receipt/story.
  const creative = (evidence ?? []).some((item) => item.source === "creative_realization");
  if (creative) return undefined;

  return action;
}

type Signal =
  | "suspense"
  | "uncertainty"
  | "memory"
  | "discovery"
  | "reveal"
  | "escalation"
  | "surprise"
  | "transformation"
  | "delight"
  | "continuation";

function signals(beat: StoryBeat, plan?: CognitiveExperiencePlan): Signal[] {
  const source = lower([
    beat.text,
    directiveFor(beat, plan)?.action,
    ...ROLES.flatMap((role) => premiseValues(plan, role)),
    ...(plan?.emotionalIntent ?? []),
  ].filter(Boolean).join(" "));

  const result: Signal[] = [];
  const has = (pattern: RegExp) => pattern.test(source);

  if (has(/\b(?:suspense|threat|menace|terrifying|waiting|withheld|hidden|unknown|unresolved|out of sight|not yet)\b/)) result.push("suspense");
  if (has(/\b(?:uncertainty|uncertain|unknown|not known|can't tell|cannot tell|unclear|doubt)\b/)) result.push("uncertainty");
  if (has(/\b(?:memory|remember|remembered|memorial|kept|preserved|origin|from before|history)\b/)) result.push("memory");
  if (has(/\b(?:discover|discovery|finds?|found|another layer|new detail|new clue|new information)\b/)) result.push("discovery");
  if (has(/\b(?:reveal|revealed|hidden detail|shown|becomes visible|comes to light)\b/)) result.push("reveal");
  if (has(/\b(?:escalat(?:e|es|ed|ing)|escalation|more intense|goes further|increasing|gets worse|gets bigger|gets stronger|ridiculous|absurd|wild)\b/)) result.push("escalation");
  if (has(/\b(?:surprise|surprising|suddenly|unexpected|unpredictable)\b/)) result.push("surprise");
  if (has(/\b(?:transformation|transformed|transform|changes?|changed|different|becomes?)\b/)) result.push("transformation");
  if (has(/\b(?:delight|funny|fun|playful|laugh|laughter|joy)\b/)) result.push("delight");
  if (has(/\b(?:continu(?:e|ation)|carry|forward|next|keep)\b/)) result.push("continuation");

  return unique(result) as Signal[];
}

function context(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const preferred = [
    ...premiseValues(plan, "event"),
    ...premiseValues(plan, "artifact"),
    ...premiseValues(plan, "place"),
    ...premiseValues(plan, "temporal"),
    ...premiseValues(plan, "transformation"),
    ...premiseValues(plan, "outcome"),
    ...evidenceCandidates(beat, plan),
  ];
  const subjectValue = lower(subject(beat, plan));
  return unique(preferred)
    .filter((value) => lower(value) !== subjectValue)
    .filter(safe)
    .slice(0, 2)
    .join(" and ");
}

function expressive(beat: StoryBeat, plan?: CognitiveExperiencePlan): string | undefined {
  const active = signals(beat, plan);
  if (!active.length) return undefined;

  const name = cap(subject(beat, plan));
  const detail = context(beat, plan);

  if (["orientation", "encounter", "discovery", "reveal", "feedback", "escalation", "payoff"].includes(beat.kind)) {
    if (active.includes("suspense")) return detail ? `${name} reaches ${detail}, but what comes next remains out of sight.` : `${name} reaches the next point, but what comes next remains unresolved.`;
    if (active.includes("uncertainty")) return detail ? `${name} has ${detail} in view, but the outcome is still unknown.` : `${name} has enough to continue, but the outcome is still unknown.`;
  }

  if (active.includes("memory") && ["origin", "reflection", "provenance", "payoff"].includes(beat.kind)) {
    return detail ? `${name} brings ${detail} back into the present.` : `${name} brings a remembered detail back into the present.`;
  }

  if (active.includes("discovery") && beat.kind === "discovery") {
    return detail ? `${name} discovers another layer in ${detail}.` : `${name} discovers another layer that was not visible before.`;
  }

  if (active.includes("reveal") && beat.kind === "reveal") {
    return detail ? `${name} sees ${detail} clearly for the first time.` : `${name} sees a hidden detail clearly for the first time.`;
  }

  if (active.includes("surprise") && ["encounter", "discovery", "reveal"].includes(beat.kind)) {
    return detail ? `${name} encounters ${detail} in an unexpected turn.` : `${name} encounters an unexpected turn.`;
  }

  if (active.includes("delight")) {
    if (beat.kind === "orientation" && detail) return `${name} arrives with ${detail} already in play.`;
    if (beat.kind === "encounter" && detail) return `Then ${detail} turns up, and the ordinary part of the job gets a little less ordinary.`;
    if (beat.kind === "escalation" && detail) return `${name} keeps going, with ${detail} now part of the scene.`;
    if (beat.kind === "payoff" && detail) return `${name} gets to the end with ${detail} still part of the story.`;
    if (["encounter", "payoff"].includes(beat.kind)) return `${name} gets an unexpectedly funny turn that earns attention.`;
  }

  if (active.includes("escalation") && beat.kind === "escalation") {
    return detail ? `${name} goes further with ${detail}.` : `${name} goes further, adding another concrete turn to what is already happening.`;
  }

  if (active.includes("transformation") && beat.kind === "transformation") {
    return detail ? `${name} is visibly different after ${detail}.` : `${name} is visibly different from where the experience began.`;
  }

  return undefined;
}

function eventText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const name = cap(subject(beat, plan));
  const evidence = evidenceCandidates(beat, plan).slice(0, 2);
  const pair = evidence.length === 1 ? evidence[0] : evidence.length === 2 ? `${evidence[0]} and ${evidence[1]}` : "";
  const directive = directiveFor(beat, plan);
  const action = executableAction(directive?.action, directive?.evidence);
  const result = first(plan, "outcome");
  const next = first(plan, "affordance");
  const transformation = premiseValues(plan, "transformation");

  if (action) {
    switch (beat.kind) {
      case "orientation": return `${name} ${action}.`;
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
      case "contribution": return `${name} adds to what is happening by ${action}.`;
      case "escalation": return `${name} goes further by ${action}.`;
      case "transformation": return `${name} changes when ${action}.`;
      case "reflection": return `${name} revisits what happened when ${action}.`;
      case "provenance": return `${name} preserves the origin by ${action}.`;
      case "identity": return `${name} establishes its identity when ${action}.`;
      case "milestone": return `${name} reaches a new state when ${action}.`;
      case "unlock": return `${name} unlocks the next state by ${action}.`;
      case "earned_access": return `${name} earns the next state by ${action}.`;
      case "payoff": return `${name} reaches the payoff by ${action}.`;
      case "next_step": return `${name} takes the next step: ${action}.`;
      case "continuation": return `${name} carries the result forward by ${action}.`;
    }
  }

  const pressure = expressive(beat, plan);
  if (pressure) return pressure;

  switch (beat.kind) {
    case "orientation": return pair ? `${name} arrives with ${pair} already in play.` : `${name} arrives and the scene is set.`;
    case "hook": return pair ? `${name} notices ${pair}. That is where the ordinary part stops being quite so ordinary.` : `${name} hits the first detail worth paying attention to.`;
    case "need": return result ? `${name} has a concrete target: ${result}.` : pair ? `${name} has to deal with ${pair}.` : `${name} faces the immediate task.`;
    case "threshold": return pair ? `${name} moves into ${pair}.` : `${name} crosses into the next stage.`;
    case "origin": return pair ? `${name} brings ${pair} into the present.` : `${name} starts with what is already known.`;
    case "encounter": return pair ? `Then ${pair} enters the scene.` : `${name} encounters a concrete new condition.`;
    case "challenge": return pair ? `${name} has to respond to ${pair}.` : `${name} meets a condition that requires a response.`;
    case "discovery": return pair ? `${name} discovers ${pair}.` : `${name} discovers a detail that was not visible at first.`;
    case "reveal": return pair ? `${name} sees ${pair} clearly.` : `${name} sees a detail that was not visible at the beginning.`;
    case "instruction": return next ? `${name} gets a usable next move: ${next}.` : pair ? `${name} has a concrete next move involving ${pair}.` : `${name} gets a concrete next move.`;
    case "action": return next ? `${name} acts: ${next}.` : pair ? `${name} acts on ${pair}.` : `${name} takes the next concrete action.`;
    case "feedback": return result ? `${name} sees the result: ${result}.` : pair ? `${name} sees what changes after ${pair}.` : `${name} sees the result of the action.`;
    case "contribution": return pair ? `${name} adds ${pair} to what is happening.` : `${name} adds a concrete contribution.`;
    case "escalation": return pair ? `${name} goes further with ${pair}.` : `${name} goes further from the condition already established.`;
    case "transformation": return transformation.length >= 2 ? `${name} moves from ${sentence(transformation[0])} to ${sentence(transformation[1])}.` : pair ? `${name} is visibly different after ${pair}.` : `${name} ends differently from where the experience began.`;
    case "reflection": return pair ? `${name} returns to ${pair} and sees its consequence in the present.` : `${name} revisits what happened and sees its consequence.`;
    case "provenance": return pair ? `${name} preserves ${pair} as part of the record.` : `${name} preserves the origin in the record.`;
    case "identity": return pair ? `${name} becomes identifiable through ${pair}.` : `${name} becomes identifiable through what has happened.`;
    case "milestone": return result ? `${name} reaches ${result}.` : pair ? `${name} reaches a new milestone through ${pair}.` : `${name} reaches a new milestone.`;
    case "unlock":
    case "earned_access": return result ? `${name} earns access to ${result}.` : pair ? `${name} opens the next possibility through ${pair}.` : `${name} earns access to the next possibility.`;
    case "payoff": return result ? `${name} reaches ${result}.` : pair ? `${name} reaches the result with ${pair} still in play.` : `${name} reaches the payoff.`;
    case "next_step": return next ? `${name} takes the next step: ${next}.` : pair ? `${name} takes the next step with ${pair} now in play.` : `${name} takes the next step.`;
    case "continuation": return pair ? `${name} carries ${pair} into what comes next.` : `${name} leaves the next turn available.`;
  }
}

function removeCompilerFiller(text: string): string {
  let result = sentence(text);
  for (const pattern of [...DEAD_PROSE, ...ABSTRACT_DIRECTIVE]) result = result.replace(pattern, "");
  return sentence(result.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim());
}

function preserveEvidence(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const missing = evidenceCandidates(beat, plan)
    .filter((value) => !lower(text).includes(lower(value)))
    .slice(0, 2);
  if (!missing.length) return text;

  switch (beat.kind) {
    case "orientation": return `${sentence(text)} ${missing.join(" and ")} are present from the start.`;
    case "encounter": return `${sentence(text)} Then ${missing.join(" and ")} enter the scene.`;
    case "discovery":
    case "reveal": return `${sentence(text)} Another visible detail is ${missing.join(" and ")}.`;
    case "escalation": return `${sentence(text)} It goes further with ${missing.join(" and ")}.`;
    case "transformation": return `${sentence(text)} The difference is visible in ${missing.join(" and ")}.`;
    case "payoff": return `${sentence(text)} The payoff stays tied to ${missing.join(" and ")}.`;
    default: return text;
  }
}

function preserveDirective(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const directive = directiveFor(beat, plan);
  const action = executableAction(directive?.action, directive?.evidence);
  if (!action || lower(text).includes(lower(action))) return text;
  return `${sentence(text)} The concrete action is to ${action}.`;
}

export function realizePremiseBeat(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  let text = eventText(beat, plan);
  text = removeCompilerFiller(text);
  text = preserveEvidence(text, beat, plan);
  text = preserveDirective(text, beat, plan);
  return `${sentence(text)}.`;
}

export function realizePremiseBeats(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: realizePremiseBeat(beat, plan) }));
}

export function isGenericCompilerProse(value: string): boolean {
  return [...DEAD_PROSE, ...ABSTRACT_DIRECTIVE, ...COMPILER_FRAGMENT].some((pattern) => pattern.test(value));
}

export function classifyPremise(beat: StoryBeat, plan?: CognitiveExperiencePlan): Record<string, boolean> {
  const text = lower([
    beat.text,
    subject(beat, plan),
    ...ROLES.flatMap((role) => premiseValues(plan, role)),
    ...(plan?.emotionalIntent ?? []),
  ].join(" "));

  return {
    evidence: evidenceCandidates(beat, plan).length > 0,
    relationship: Boolean(plan?.premise?.relations.some((item) => item.confidence >= 0.72)),
    temporal: Boolean(first(plan, "temporal")),
    social: Boolean(first(plan, "social") || first(plan, "participants")),
    transformation: Boolean(first(plan, "transformation")),
    constraint: Boolean(first(plan, "constraint")),
    outcome: Boolean(first(plan, "outcome")) || /\b(?:remember|discover|return|connect|play|learn|change)\b/i.test(text),
  };
}

void (undefined as unknown as CognitiveEvidence);
