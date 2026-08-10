import type {
  CognitiveBeatDirective,
  CognitiveBeatKind,
  CognitiveEvidence,
  CognitiveExperiencePlan,
  CognitiveExperienceRealization,
  CognitivePremise,
  CognitivePremiseRole,
  ExperienceHypothesisKind,
} from "@qre/contracts";

/**
 * Semantic realization layer.
 *
 * Cognition selects meaning; this layer turns that meaning into operation
 * semantics. It produces no presentation copy and no runtime objects.
 */

const STRUCTURES: Record<ExperienceHypothesisKind, CognitiveBeatKind[]> = {
  memory: ["orientation", "origin", "encounter", "reflection", "payoff", "continuation"],
  utility: ["need", "instruction", "action", "feedback", "next_step"],
  game: ["hook", "challenge", "discovery", "escalation", "payoff"],
  discovery: ["threshold", "reveal", "discovery", "payoff", "continuation"],
  social: ["orientation", "encounter", "contribution", "payoff", "continuation"],
  commerce: ["orientation", "identity", "discovery", "payoff", "continuation"],
  journey: ["orientation", "threshold", "discovery", "transformation", "continuation"],
  identity: ["orientation", "identity", "reflection", "payoff", "continuation"],
  story: ["orientation", "hook", "encounter", "transformation", "payoff", "continuation"],
  ritual: ["orientation", "threshold", "encounter", "reflection", "payoff", "continuation"],
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const first = (values?: readonly unknown[]) => clean(values?.[0]);

/**
 * Runtime boundary for semantic collections. Several contract fields are
 * typed as strings, but older/migrating callers can still surface undefined
 * array entries at runtime. Realization must not crash the entire compiler
 * because an optional semantic slot is absent.
 */
function unique(values: readonly unknown[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function values(premise: CognitivePremise | undefined, role: CognitivePremiseRole): string[] {
  return unique(
    premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function evidenceFor(
  premise: CognitivePremise | undefined,
  roles: CognitivePremiseRole[],
  extra: CognitiveEvidence[],
): CognitiveEvidence[] {
  return [
    ...(premise?.slots
      .filter((slot) => roles.includes(slot.role))
      .flatMap((slot) => slot.evidence) ?? []),
    ...extra,
  ].slice(0, 8);
}

type Inputs = {
  subject: string;
  outcome: string;
  purpose: string;
  why: string;
  interaction: string;
  content: string;
  discovery: string;
  progression: string;
  dynamic: string;
  future: string;
  reward: string;
  memory: string;
  social: string;
  place: string;
  temporal: string;
  transformation: string;
};

function inputs(plan: CognitiveExperiencePlan, premise?: CognitivePremise): Inputs {
  const transformation = values(premise, "transformation");
  return {
    subject: values(premise, "subject")[0] || clean(plan.centralSubject),
    outcome: values(premise, "outcome")[0] || clean(plan.purpose),
    purpose: clean(plan.purpose),
    why: first(plan.whyInteract),
    interaction: first(plan.interactionModel),
    content: first(plan.contentModel),
    discovery: first(plan.discoveryModel),
    progression: first(plan.progressionModel),
    dynamic: first(plan.dynamicBehavior),
    future: first(plan.futureEvolution),
    reward: first(plan.rewardModel),
    memory: first(plan.memoryModel),
    social: values(premise, "social")[0],
    place: values(premise, "place")[0],
    temporal: values(premise, "temporal")[0],
    transformation: transformation.length >= 2
      ? `${transformation[0]} → ${transformation[1]}`
      : first(transformation),
  };
}

function state(
  intent: string,
  action: string,
  before: string,
  after: string,
): Omit<CognitiveBeatDirective, "kind" | "subject" | "relationalFocus" | "evidence" | "confidence"> {
  return {
    intent,
    action,
    stateBefore: before,
    stateAfter: after,
  };
}

function semantics(
  direction: ExperienceHypothesisKind,
  kind: CognitiveBeatKind,
  x: Inputs,
): ReturnType<typeof state> {
  const subject = x.subject || "the subject";

  const generic: Record<string, ReturnType<typeof state>> = {
    orientation: state("establish the subject and current situation", x.why || x.interaction || "enter the experience", "only prompt context is available", "the subject and situation are clear"),
    hook: state("create a reason to continue", x.why || x.interaction || "engage with the subject", "the subject is understood but participation has not begun", "the participant has a reason to continue"),
    encounter: state("introduce the next concrete relationship or condition", x.interaction || x.content || "encounter the next supported condition", "the experience has been established", "a new relationship changes what can happen next"),
    transformation: state("make accumulated interaction produce meaningful change", x.transformation || x.outcome || "carry the interaction into a changed state", "experience has accumulated", "the subject or its meaning has changed"),
    payoff: state("resolve the experience into the intended outcome", x.outcome || x.purpose || x.why || "resolve the current experience", "the experience has reached its decisive point", "the intended experiential result is available"),
    continuation: state("preserve continuity into the next interaction", x.future || x.dynamic || "continue from the current state", "the current experience state is established", "the current state remains available to future interaction"),
  };

  switch (direction) {
    case "memory":
      if (kind === "orientation") return state("establish the subject as a continuity anchor", x.memory || "place present evidence beside remembered context", "only the present encounter is available", "the subject is recognized as carrying history");
      if (kind === "origin") return state("surface available historical source without inventing missing history", x.memory || "surface available historical evidence", "history is implied or partially known", "available history is connected to the present");
      if (kind === "encounter") return state("bring a concrete remembered relationship into the present", x.social || x.interaction || "encounter the next available piece of history", "history is contextual", "a concrete relationship is present");
      if (kind === "reflection") return state("interpret what preserved evidence means now", x.memory || x.outcome || "connect preserved evidence to present meaning", "preserved evidence has been encountered", "continuing meaning is understood");
      break;
    case "utility":
      if (kind === "need") return state("identify the immediate useful outcome", x.outcome || x.why || "identify the current need", "the need is unresolved", "the useful target is explicit");
      if (kind === "instruction") return state("supply only information required for the next useful move", x.content || "provide the next relevant knowledge", "the target is known but not actionable", "actionable guidance is available");
      if (kind === "action") return state("convert guidance into an observable action", x.interaction || "perform the next useful action", "guidance is available", "an observable result exists");
      if (kind === "feedback") return state("use the observed result to determine the next state", x.dynamic || "evaluate the result before proceeding", "an action has produced a result", "the next decision is informed by evidence");
      break;
    case "game":
      if (kind === "hook") return state("establish the challenge and reason to participate", x.why || x.interaction || "enter the challenge", "the challenge has not begun", "the participant understands participation");
      if (kind === "challenge") return state("present a meaningful obstacle", x.progression || "resolve the next challenge condition", "the challenge is active", "a concrete problem is available to solve");
      if (kind === "discovery") return state("reward exploration with meaningful information", x.discovery || x.content || "inspect the next available clue", "information is incomplete", "new information affects play");
      if (kind === "escalation") return state("increase consequence based on accumulated play", x.dynamic || x.progression || "apply the previous result to the next challenge", "the participant has accumulated state", "the next challenge reflects accumulated state");
      break;
    case "discovery":
      if (kind === "threshold") return state("move beyond the obvious surface", x.interaction || x.why || "cross into the discoverable layer", "only the surface is available", "hidden context can be encountered");
      if (kind === "reveal" || kind === "discovery") return state(kind === "reveal" ? "expose supported hidden information" : "connect revealed detail to larger meaning", x.discovery || x.content || "reveal the next supported relationship", "the relationship is not yet visible", kind === "reveal" ? "a hidden relationship is visible" : "the discovery has meaning");
      break;
    case "social":
      if (kind === "orientation") return state("establish shared context", x.social || x.interaction || "enter the shared experience", "participants are uncoordinated", "participants share a point of attention");
      if (kind === "encounter") return state("bring participants into relationship with the subject", x.social || x.interaction || "respond to the shared subject together", "shared context exists", "participants can affect the shared experience");
      if (kind === "contribution") return state("make participation alter shared state", x.interaction || x.outcome || "add a contribution others can encounter", "the shared state already exists", "the shared state contains a new contribution");
      break;
    case "commerce":
      if (kind === "orientation") return state("give commercial interaction an experiential reason to begin", x.why || x.interaction || "enter the relationship around the subject", "transaction context exists", "engagement has value beyond transaction mechanics");
      if (kind === "identity") return state("connect the subject with participant identity and meaning", x.content || x.interaction || "recognize identity carried by the subject", "the relationship is transactional", "the subject participates in an evolving identity relationship");
      if (kind === "discovery") return state("reveal value that follows naturally from the experience", x.discovery || x.content || "discover relevant value beyond the transaction", "transactional value is known", "additional experiential value is recognized");
      break;
    case "journey":
      if (kind === "orientation") return state("establish the journey starting state", x.place || x.interaction || "recognize the current starting point", "the journey is beginning", "starting point and direction are clear");
      if (kind === "threshold") return state("move from known state into the next stage", x.interaction || x.why || "cross into the next stage", "the starting state is known", "the participant has entered a new stage");
      if (kind === "discovery") return state("derive meaning from what the journey exposes", x.discovery || x.content || "discover what the current stage reveals", "the participant has moved into a new stage", "a new relationship or place is understood");
      break;
    case "identity":
      if (kind === "orientation") return state("establish the subject as a marker of identity", x.content || x.why || "notice what the subject represents", "the subject is primarily observed", "identity significance is visible");
      if (kind === "identity") return state("make identity relationship explicit through evidence and context", x.content || x.social || "connect the subject with associated identity", "identity meaning is implicit", "identity meaning is explicit enough to engage");
      if (kind === "reflection") return state("relate identity meaning back to the participant", x.outcome || x.memory || "reflect on what the identity relationship means", "identity meaning is recognized", "the participant has a personal interpretation");
      break;
    case "ritual":
      if (kind === "orientation") return state("establish meaningful repeated context", x.why || x.interaction || "enter the meaningful context", "the participant is outside the ritual state", "the ritual context is recognized");
      if (kind === "threshold") return state("mark transition into intentional participation", x.interaction || "perform the entry action", "participation has not begun", "intentional participation has begun");
      if (kind === "encounter") return state("connect participant with subject through ritual action", x.interaction || x.content || "perform the central ritual interaction", "intentional participation is established", "the ritual relationship is enacted");
      if (kind === "reflection") return state("make the meaning of the repeated action explicit", x.memory || x.outcome || "recognize what the ritual action means", "the ritual has been enacted", "the participant understands its meaning");
      break;
  }

  return generic[kind] ?? state(
    "advance the experience through the selected cognitive direction",
    x.interaction || x.outcome || "continue from the current state",
    "the current state is established",
    "the next experiential state is available",
  );
}

export function realizeCognitiveExperience(args: {
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  evidence?: CognitiveEvidence[];
  hypothesisEvidence?: CognitiveEvidence[];
}): CognitiveExperienceRealization {
  const { plan, premise, evidence = [], hypothesisEvidence = [] } = args;
  const direction = plan.direction ?? "story";
  const x = inputs(plan, premise);
  const kinds = STRUCTURES[direction];
  const conservedRoles = unique((premise?.slots ?? []).map((slot) => slot.role));

  const directives = kinds.map((kind) => {
    const roleSet = new Set<CognitivePremiseRole>(["subject"]);
    if (["origin", "reflection"].includes(kind)) roleSet.add("temporal");
    if (["encounter", "contribution"].includes(kind)) roleSet.add("participants");
    if (["discovery", "reveal"].includes(kind)) roleSet.add("artifact");
    if (kind === "threshold") roleSet.add("medium");
    if (kind === "transformation") roleSet.add("transformation");
    if (kind === "payoff") roleSet.add("outcome");

    const directiveEvidence = evidenceFor(premise, [...roleSet], [
      ...evidence,
      ...hypothesisEvidence,
    ]);
    const semantic = semantics(direction, kind, x);

    return {
      kind,
      ...semantic,
      subject: x.subject,
      relationalFocus: unique([
        x.social,
        x.place,
        x.temporal,
        x.memory,
        x.discovery,
        x.progression,
      ]),
      evidence: directiveEvidence,
      confidence: directiveEvidence.length
        ? Number(Math.min(0.98, Math.max(0.72, ...directiveEvidence.map((item) => item.confidence))).toFixed(3))
        : 0.72,
    } satisfies CognitiveBeatDirective;
  });

  return {
    direction,
    directives,
    semanticArc: directives.map((directive) => `${directive.intent} → ${directive.stateAfter}`),
    conservedRoles,
    confidence: directives.length
      ? Number((directives.reduce((sum, directive) => sum + directive.confidence, 0) / directives.length).toFixed(3))
      : 0.72,
  };
}
