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
 * Cognition selects the direction and constructs the conserved premise.
 * This layer turns those decisions into operation-level semantics that the
 * universal compiler can render. It deliberately contains no presentation
 * copy, domain templates, or runtime objects.
 */

const structures: Record<ExperienceHypothesisKind, CognitiveBeatKind[]> = {
  memory: [
    "orientation",
    "origin",
    "encounter",
    "reflection",
    "payoff",
    "continuation",
  ],
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

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function first(values: string[] | undefined): string {
  return clean(values?.[0] ?? "");
}

function premiseValues(
  premise: CognitivePremise | undefined,
  role: CognitivePremiseRole,
): string[] {
  return unique(
    premise?.slots
      .filter((slot) => slot.role === role)
      .flatMap((slot) => slot.values) ?? [],
  );
}

function premiseEvidence(
  premise: CognitivePremise | undefined,
  roles: CognitivePremiseRole[],
): CognitiveEvidence[] {
  return premise?.slots
    .filter((slot) => roles.includes(slot.role))
    .flatMap((slot) => slot.evidence)
    .slice(0, 6) ?? [];
}

function directionStructure(
  direction: ExperienceHypothesisKind,
  plan: CognitiveExperiencePlan,
): CognitiveBeatKind[] {
  const declared = plan.storyStructure
    .map((value) => clean(value).toLowerCase())
    .filter((value): value is CognitiveBeatKind =>
      structures[direction].includes(value as CognitiveBeatKind),
    );

  if (declared.length >= 2) {
    const canonical = structures[direction];
    const ordered = canonical.filter((kind) => declared.includes(kind));
    return ordered.length >= 2 ? ordered : canonical;
  }

  return structures[direction];
}

function semanticInputs(
  plan: CognitiveExperiencePlan,
  premise: CognitivePremise | undefined,
): {
  subject: string;
  outcome: string;
  why: string;
  interaction: string;
  content: string;
  discovery: string;
  progression: string;
  dynamic: string;
  future: string;
  reward: string;
  social: string;
  memory: string;
  place: string;
  temporal: string;
  transformation: string;
} {
  const transformations = premiseValues(premise, "transformation");

  return {
    subject: first(premiseValues(premise, "subject")) || clean(plan.centralSubject),
    outcome: first(premiseValues(premise, "outcome")) || clean(plan.purpose),
    why: first(plan.whyInteract),
    interaction: first(plan.interactionModel),
    content: first(plan.contentModel),
    discovery: first(plan.discoveryModel),
    progression: first(plan.progressionModel),
    dynamic: first(plan.dynamicBehavior),
    future: first(plan.futureEvolution),
    reward: first(plan.rewardModel),
    social: first(premiseValues(premise, "social")),
    memory: first(plan.memoryModel),
    place: first(premiseValues(premise, "place")),
    temporal: first(premiseValues(premise, "temporal")),
    transformation: transformations.length >= 2
      ? `${transformations[0]} → ${transformations[1]}`
      : first(transformations),
  };
}

function operationSemantics(
  direction: ExperienceHypothesisKind,
  kind: CognitiveBeatKind,
  input: ReturnType<typeof semanticInputs>,
): Pick<CognitiveBeatDirective, "intent" | "action" | "stateBefore" | "stateAfter"> {
  const subject = input.subject || "the subject";

  switch (direction) {
    case "memory":
      switch (kind) {
        case "orientation":
          return {
            intent: "establish the present subject as a continuity anchor",
            action: input.memory || "place present evidence beside remembered context",
            stateBefore: "the participant has only the present encounter",
            stateAfter: "the participant recognizes that the subject carries history",
          };
        case "origin":
          return {
            intent: "surface the source of continuity without inventing missing history",
            action: input.memory || "surface available historical evidence",
            stateBefore: "history is implied or partially known",
            stateAfter: "available history is connected to the present subject",
          };
        case "encounter":
          return {
            intent: "bring a person, artifact, event, or remembered detail into the present",
            action: input.social || input.interaction || "encounter the next available piece of history",
            stateBefore: "history is contextual rather than immediate",
            stateAfter: "a concrete relationship becomes present to the participant",
          };
        case "reflection":
          return {
            intent: "interpret what the preserved relationship means now",
            action: input.memory || input.outcome || "connect the preserved evidence to present meaning",
            stateBefore: "the participant has encountered preserved evidence",
            stateAfter: "the participant understands a continuing meaning",
          };
        case "payoff":
          return {
            intent: "convert accumulated history into present meaning",
            action: input.outcome || input.why || "carry the preserved relationship forward",
            stateBefore: "past and present are connected",
            stateAfter: "the subject has meaningful continuity beyond the first encounter",
          };
        default:
          return continuation(input, "allow future memory or history to extend the experience");
      }

    case "utility":
      switch (kind) {
        case "need":
          return {
            intent: "identify the immediate useful outcome",
            action: input.outcome || input.why || "identify the current need",
            stateBefore: "the user has an unresolved need",
            stateAfter: "the useful target is explicit",
          };
        case "instruction":
          return {
            intent: "supply only the information required for the next useful move",
            action: input.content || "provide the next relevant knowledge",
            stateBefore: "the useful target is known but not yet actionable",
            stateAfter: "the user has actionable guidance",
          };
        case "action":
          return {
            intent: "convert guidance into an observable action",
            action: input.interaction || "perform the next useful action",
            stateBefore: "guidance is available",
            stateAfter: "the user has produced a result that can be evaluated",
          };
        case "feedback":
          return {
            intent: "use the observed result to determine the next state",
            action: input.dynamic || "evaluate the result before proceeding",
            stateBefore: "an action has produced an outcome",
            stateAfter: "the next decision is informed by the result",
          };
        default:
          return continuation(input, input.progression || input.future || "continue from the user's current state");
      }

    case "game":
      switch (kind) {
        case "hook":
          return {
            intent: "establish the challenge and reason to participate",
            action: input.why || input.interaction || "enter the challenge",
            stateBefore: "the participant has not yet committed to the challenge",
            stateAfter: "the participant understands what participation means",
          };
        case "challenge":
          return {
            intent: "present a meaningful obstacle that can be acted upon",
            action: input.progression || "resolve the next challenge condition",
            stateBefore: "the challenge is active",
            stateAfter: "the participant has a concrete problem to solve",
          };
        case "discovery":
          return {
            intent: "reward successful exploration with a meaningful discovery",
            action: input.discovery || input.content || "inspect the next available clue",
            stateBefore: "the participant has incomplete information",
            stateAfter: "the participant has new information that affects play",
          };
        case "escalation":
          return {
            intent: "increase consequence or difficulty based on accumulated play",
            action: input.dynamic || input.progression || "apply the result of the previous action to the next challenge",
            stateBefore: "the participant has learned or accomplished something",
            stateAfter: "the next challenge reflects accumulated state",
          };
        default:
          return {
            intent: "deliver an earned result",
            action: input.reward || input.outcome || "resolve the challenge into a meaningful payoff",
            stateBefore: "the challenge has been completed",
            stateAfter: "the participant receives the result of participation",
          };
      }

    case "discovery":
      switch (kind) {
        case "threshold":
          return {
            intent: "move the participant beyond the obvious surface",
            action: input.interaction || input.why || "cross into the discoverable layer",
            stateBefore: "only the surface is available",
            stateAfter: "the participant is positioned to discover hidden context",
          };
        case "reveal":
          return {
            intent: "expose information supported by the available evidence",
            action: input.discovery || input.content || "reveal the next supported relationship",
            stateBefore: "the relevant relationship is not yet visible",
            stateAfter: "a previously hidden relationship is visible",
          };
        case "discovery":
          return {
            intent: "connect the revealed detail to a larger meaning",
            action: input.discovery || input.outcome || "interpret the revealed relationship",
            stateBefore: "a detail has been revealed",
            stateAfter: "the participant understands why the discovery matters",
          };
        case "payoff":
          return {
            intent: "make the discovery consequential rather than merely informational",
            action: input.outcome || input.why || "carry the discovery into the experience state",
            stateBefore: "the participant understands the new relationship",
            stateAfter: "the discovery changes the participant's understanding",
          };
        default:
          return continuation(input, input.future || "leave another supported layer available for later interaction");
      }

    case "social":
      switch (kind) {
        case "orientation":
          return {
            intent: "establish shared context among participants",
            action: input.social || input.interaction || "enter the shared experience",
            stateBefore: "participants are separate or uncoordinated",
            stateAfter: "participants have a shared point of attention",
          };
        case "encounter":
          return {
            intent: "bring participants into a relationship with the subject and one another",
            action: input.social || input.interaction || "respond to the shared subject together",
            stateBefore: "shared context exists without contribution",
            stateAfter: "participants can affect one another's experience",
          };
        case "contribution":
          return {
            intent: "make participation alter the shared state",
            action: input.interaction || input.outcome || "add a contribution that others can encounter",
            stateBefore: "the shared experience has an existing state",
            stateAfter: "the shared state contains a new participant contribution",
          };
        case "payoff":
          return {
            intent: "create value from collective participation",
            action: input.outcome || input.social || "make the shared result meaningful",
            stateBefore: "participants have affected the shared state",
            stateAfter: "the group has a result worth carrying forward",
          };
        default:
          return continuation(input, input.future || "allow later participants to extend the shared state");
      }

    case "commerce":
      switch (kind) {
        case "orientation":
          return {
            intent: "give the commercial interaction an experiential reason to begin",
            action: input.why || input.interaction || "enter the relationship around the subject",
            stateBefore: "the participant sees a transaction or product context",
            stateAfter: "the participant has a reason to engage beyond transaction mechanics",
          };
        case "identity":
          return {
            intent: "connect the subject with participant identity and meaning",
            action: input.content || input.interaction || "recognize the identity carried by the subject",
            stateBefore: "the relationship is primarily transactional",
            stateAfter: "the subject participates in an evolving identity relationship",
          };
        case "discovery":
          return {
            intent: "reveal value that follows naturally from the experience",
            action: input.discovery || input.content || "discover relevant value beyond the transaction",
            stateBefore: "the participant knows the transactional value",
            stateAfter: "the participant recognizes additional experiential value",
          };
        case "payoff":
          return {
            intent: "turn the experience into a meaningful reason for return",
            action: input.reward || input.outcome || "receive the value earned by participation",
            stateBefore: "experiential value has been established",
            stateAfter: "the relationship has a reason to continue",
          };
        default:
          return continuation(input, input.future || "let future interactions deepen the relationship");
      }

    case "journey":
      switch (kind) {
        case "orientation":
          return {
            intent: "establish the journey's starting state",
            action: input.place || input.interaction || "recognize the current starting point",
            stateBefore: "the participant is at the beginning of the journey",
            stateAfter: "the starting point and direction are clear",
          };
        case "threshold":
          return {
            intent: "move from the known starting state into the next part of the journey",
            action: input.interaction || input.why || "cross into the next stage",
            stateBefore: "the starting state is known",
            stateAfter: "the participant has entered a new stage",
          };
        case "discovery":
          return {
            intent: "derive meaning from what the journey exposes",
            action: input.discovery || input.content || "discover what the current stage reveals",
            stateBefore: "the participant has moved into a new stage",
            stateAfter: "the participant understands a new relationship or place",
          };
        case "transformation":
          return {
            intent: "make the accumulated journey produce an observable change in meaning or state",
            action: input.transformation || input.outcome || "compare the current state with the starting state",
            stateBefore: "the participant has accumulated journey context",
            stateAfter: "the journey has changed the meaning or state of the subject",
          };
        default:
          return continuation(input, input.future || "continue the journey as new places or moments become available");
      }

    case "identity":
      switch (kind) {
        case "orientation":
          return {
            intent: "establish the subject as a marker of identity",
            action: input.content || input.why || "notice what the subject represents",
            stateBefore: "the subject is primarily an observed object",
            stateAfter: "the participant sees identity significance around the subject",
          };
        case "identity":
          return {
            intent: "make the identity relationship explicit through evidence and context",
            action: input.content || input.social || "connect the subject with its associated identity",
            stateBefore: "identity significance is implicit",
            stateAfter: "identity meaning is explicit enough to engage with",
          };
        case "reflection":
          return {
            intent: "relate the subject's identity meaning back to the participant",
            action: input.outcome || input.memory || "reflect on what the identity relationship means",
            stateBefore: "the participant recognizes the subject's identity meaning",
            stateAfter: "the participant has a personal interpretation of that meaning",
          };
        default:
          return continuation(input, input.future || "allow identity meaning to deepen with later interaction");
      }

    case "ritual":
      switch (kind) {
        case "orientation":
          return {
            intent: "establish the repeated or meaningful context for participation",
            action: input.why || input.interaction || "enter the meaningful context",
            stateBefore: "the participant is outside the ritual state",
            stateAfter: "the participant recognizes the ritual context",
          };
        case "threshold":
          return {
            intent: "mark the transition into intentional participation",
            action: input.interaction || "perform the entry action",
            stateBefore: "participation has not yet begun",
            stateAfter: "the participant has crossed into intentional participation",
          };
        case "encounter":
          return {
            intent: "connect the participant with the subject through the ritual action",
            action: input.interaction || input.content || "perform the central ritual interaction",
            stateBefore: "intentional participation is established",
            stateAfter: "the ritual relationship is enacted",
          };
        case "reflection":
          return {
            intent: "make the meaning of the repeated action explicit",
            action: input.memory || input.outcome || "recognize what the ritual action means",
            stateBefore: "the ritual has been enacted",
            stateAfter: "the participant has a conscious interpretation of the ritual",
          };
        default:
          return continuation(input, input.future || "allow the ritual to be repeated or extended over time");
      }

    default:
      switch (kind) {
        case "orientation":
          return {
            intent: "establish the subject and current situation",
            action: input.why || input.interaction || "enter the experience",
            stateBefore: "the participant has only the prompt context",
            stateAfter: "the subject and experiential situation are clear",
          };
        case "hook":
          return {
            intent: "create a reason to continue",
            action: input.why || input.interaction || "engage with the subject",
            stateBefore: "the subject is understood but participation has not begun",
            stateAfter: "the participant has a reason to continue",
          };
        case "encounter":
          return {
            intent: "introduce the next concrete relationship or condition",
            action: input.interaction || input.content || "encounter the next supported condition",
            stateBefore: "the experience has been established",
            stateAfter: "a new relationship changes what can happen next",
          };
        case "transformation":
          return {
            intent: "make the accumulated interaction produce a meaningful change",
            action: input.transformation || input.outcome || "carry the interaction into a changed state",
            stateBefore: "the participant has accumulated experience",
            stateAfter: "the subject or its meaning has changed",
          };
        case "payoff":
          return {
            intent: "resolve the experience into the intended outcome",
            action: input.outcome || input.purpose || input.why || "resolve the current experience",
            stateBefore: "the experience has reached its decisive point",
            stateAfter: "the intended experiential result is available",
          };
        default:
          return continuation(input, input.future || input.dynamic || "leave the experience open to supported continuation");
      }
  }
}

function continuation(
  input: ReturnType<typeof semanticInputs>,
  action: string,
): Pick<CognitiveBeatDirective, "intent" | "action" | "stateBefore" | "stateAfter"> {
  return {
    intent: "preserve continuity into the next interaction",
    action: action || input.future || input.dynamic || "continue from the current state",
    stateBefore: "the current experience state is established",
    stateAfter: "the current state remains available to future interaction",
  };
}

export function realizeCognitiveExperience(args: {
  plan: CognitiveExperiencePlan;
  premise?: CognitivePremise;
  evidence?: CognitiveEvidence[];
  hypothesisEvidence?: CognitiveEvidence[];
}): CognitiveExperienceRealization {
  const { plan, premise, evidence = [], hypothesisEvidence = [] } = args;
  const direction = plan.direction ?? "story";
  const input = semanticInputs(plan, premise);
  const kinds = directionStructure(direction, plan);
  const premiseRoles = unique(
    (premise?.slots ?? []).map((slot) => slot.role),
  ) as CognitivePremiseRole[];

  const directives = kinds.map((kind) => {
    const semantics = operationSemantics(direction, kind, input);
    const roles = new Set<CognitivePremiseRole>(["subject"]);

    if (kind === "origin" || kind === "reflection") roles.add("temporal");
    if (kind === "encounter" || kind === "contribution") roles.add("participants");
    if (kind === "discovery" || kind === "reveal") roles.add("artifact");
    if (kind === "threshold") roles.add("medium");
    if (kind === "transformation") roles.add("transformation");
    if (kind === "payoff") roles.add("outcome");
    if (kind === "continuation") roles.add("temporal");

    const roleEvidence = premiseEvidence(premise, [...roles]);
    const directiveEvidence = [
      ...roleEvidence,
      ...evidence,
      ...hypothesisEvidence,
    ].slice(0, 8);

    return {
      kind,
      ...semantics,
      subject: input.subject,
      relationalFocus: unique([
        input.social,
        input.place,
        input.temporal,
        input.memory,
        input.discovery,
        input.progression,
      ]),
      evidence: directiveEvidence,
      confidence: directiveEvidence.length
        ? Math.min(
            0.98,
            Math.max(
              0.72,
              ...directiveEvidence.map((item) => item.confidence),
            ),
          )
        : 0.72,
    } satisfies CognitiveBeatDirective;
  });

  return {
    direction,
    directives,
    semanticArc: directives.map(
      (directive) => `${directive.intent} → ${directive.stateAfter}`,
    ),
    conservedRoles: premiseRoles,
    confidence: directives.length
      ? Number(
          (
            directives.reduce((sum, directive) => sum + directive.confidence, 0) /
            directives.length
          ).toFixed(3),
        )
      : 0.72,
  };
}
