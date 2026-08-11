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
 * Semantic realization boundary.
 *
 * Cognition selects meaning and operation semantics here. This layer may
 * choose a playful, tense, surprising, or memorable trajectory, but it never
 * manufactures a concrete physical event and labels it as observed evidence.
 * Concrete weirdness must come from the prompt, premise, runtime context, or
 * accumulated memory.
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
  story: ["orientation", "hook", "encounter", "escalation", "transformation", "payoff", "continuation"],
  ritual: ["orientation", "threshold", "encounter", "reflection", "payoff", "continuation"],
};

const clean = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const first = (values?: readonly unknown[]): string => clean(values?.[0]);
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

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
  progression: string;
  future: string;
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
    outcome: values(premise, "outcome")[0] || "",
    progression: first(plan.progressionModel),
    future: first(plan.futureEvolution),
    memory: first(plan.memoryModel),
    social: values(premise, "social")[0],
    place: values(premise, "place")[0],
    temporal: values(premise, "temporal")[0],
    transformation: transformation.length >= 2 ? `${transformation[0]} → ${transformation[1]}` : first(transformation),
  };
}

function state(intent: string, action: string, before: string, after: string) {
  return { intent, action, stateBefore: before, stateAfter: after };
}

function semantics(direction: ExperienceHypothesisKind, kind: CognitiveBeatKind, x: Inputs) {
  const generic: Record<string, ReturnType<typeof state>> = {
    orientation: state("establish the supplied subject and situation", "enter the observed situation", "the situation has not been entered", "the subject and situation are established"),
    hook: state("create attention around the supplied evidence", "notice the first active turn", "the situation is static", "attention has a concrete target"),
    need: state("identify the concrete target", "identify the immediate target", "the target is unclear", "the useful target is explicit"),
    threshold: state("move into the next supported stage", "cross into the next stage", "the current stage is known", "the next stage is active"),
    origin: state("connect available history to the present", "bring available history into the present", "prior context is not foregrounded", "available history is connected to now"),
    encounter: state("introduce the next concrete condition", "encounter the next supported condition", "the current state is established", "a new condition is active"),
    challenge: state("present a condition that requires response", "face the next concrete challenge", "the condition is active", "a response is required"),
    discovery: state("reward attention with supplied information", "inspect the next available detail", "information is incomplete", "new information is visible"),
    reveal: state("expose supported information", "bring the supported detail into view", "the detail is withheld", "the detail is visible"),
    instruction: state("make the next useful action available", "make the next required action available", "the target is known but not actionable", "the next action is available"),
    action: state("convert the selected direction into action", "perform the next supported action", "the action has not occurred", "an observable result exists"),
    feedback: state("use the result as evidence", "observe the result before continuing", "an action has occurred", "the next decision is informed"),
    contribution: state("make participation alter the experience", "add a contribution others can encounter", "shared state exists", "the contribution is available"),
    escalation: state("increase expressive pressure from supplied evidence", "go further with what is already present", "the current condition is established", "the condition has intensified"),
    transformation: state("make accumulated interaction produce observable change", "carry the preceding state into a changed condition", "the preceding state is established", "the subject or situation is visibly different"),
    reflection: state("connect preserved evidence to the present", "recognize the consequence of what was preserved", "the remembered detail has been encountered", "its present consequence is visible"),
    provenance: state("preserve origin evidence", "retain the supplied origin", "origin evidence is available", "origin evidence remains attached"),
    identity: state("make identity-bearing evidence visible", "connect the subject with supplied identity context", "identity is implicit", "identity is explicit"),
    milestone: state("mark an observable progression point", "reach the next supported milestone", "the milestone is not reached", "the milestone is reached"),
    unlock: state("open a supported next state", "unlock the next available state", "access is closed", "access is open"),
    earned_access: state("open access earned through prior events", "earn the next state", "access is not earned", "access is earned"),
    payoff: state("resolve the experience into its supported result", "reach the earned result", "the result has not resolved", "the result is available"),
    next_step: state("make continuation actionable", "take the next supported step", "the next step is unclear", "the next step is available"),
    continuation: state("preserve continuity into another interaction", "carry the current state forward", "the current experience has resolved", "the current state remains available"),
  };

  // Direction-specific semantics refine the operation without introducing
  // domain templates. Concrete nouns remain supplied by the premise.
  if (direction === "memory" && kind === "encounter") return state("bring a remembered relationship into the present", "encounter a concrete remembered detail", "history is contextual", "a remembered relationship is active");
  if (direction === "memory" && kind === "payoff") return state("make preserved history available as a present result", "reach the preserved result", "history is available", "the preserved result is present");
  if (direction === "discovery" && kind === "reveal") return state("expose supported hidden information", "bring a concealed supported detail into view", "the detail is withheld", "the detail is visible");
  if (direction === "game" && kind === "challenge") return state("present a meaningful obstacle", "face the next challenge condition", "the challenge is active", "a concrete problem requires response");
  if (direction === "social" && kind === "contribution") return state("make participation alter shared state", "add a contribution others can encounter", "shared state exists", "the shared state contains the contribution");
  if (direction === "journey" && kind === "discovery") return state("derive new information from movement", "discover what the current stage exposes", "the new stage is active", "a new relationship is understood");
  if (direction === "identity" && kind === "reflection") return state("relate identity back to the participant", "recognize the personal consequence", "identity is recognized", "the participant has a personal interpretation");
  if (direction === "ritual" && kind === "encounter") return state("enact the central supplied ritual relationship", "perform the central ritual interaction", "intentional participation is established", "the ritual relationship is enacted");
  if (direction === "commerce" && kind === "discovery") return state("reveal value beyond the transaction", "encounter the relevant supplied value", "transactional value is known", "additional value is visible");

  void x;
  return generic[kind] ?? generic.continuation;
}

export function realizeCognitiveExperience(args: {
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  evidence?: CognitiveEvidence[];
  hypothesisEvidence?: CognitiveEvidence[];
  prompt?: string;
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
    if (kind === "provenance") roleSet.add("artifact");

    const directiveEvidence = evidenceFor(premise, [...roleSet], [...evidence, ...hypothesisEvidence]);
    const semantic = semantics(direction, kind, x);
    const confidence = directiveEvidence.length
      ? Number(Math.min(0.98, Math.max(0.72, ...directiveEvidence.map((item) => item.confidence))).toFixed(3))
      : 0.72;

    return {
      kind,
      ...semantic,
      subject: x.subject,
      relationalFocus: unique([x.social, x.place, x.temporal, x.memory, x.progression]),
      evidence: directiveEvidence,
      confidence,
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
