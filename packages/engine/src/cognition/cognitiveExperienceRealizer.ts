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
import { deriveAttentionPressure, attentionSummary } from "./attentionPressure.js";

/**
 * SEMANTIC REALIZATION + CREATIVE PRESSURE
 *
 * Cognition selects meaning. This layer turns that meaning into operation
 * semantics. Created details are explicitly provenance-tagged and remain
 * distinguishable from prompt evidence.
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

const clean = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const first = (values?: readonly unknown[]) => clean(values?.[0]);
const unique = (values: readonly unknown[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function values(premise: CognitivePremise | undefined, role: CognitivePremiseRole): string[] {
  return unique(premise?.slots.filter((slot) => slot.role === role).flatMap((slot) => slot.values) ?? []);
}

function evidenceFor(premise: CognitivePremise | undefined, roles: CognitivePremiseRole[], extra: CognitiveEvidence[]): CognitiveEvidence[] {
  return [
    ...(premise?.slots.filter((slot) => roles.includes(slot.role)).flatMap((slot) => slot.evidence) ?? []),
    ...extra,
  ].slice(0, 8);
}

type Inputs = {
  subject: string;
  outcome: string;
  why: string;
  interaction: string;
  content: string;
  discovery: string;
  progression: string;
  dynamic: string;
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
    why: first(plan.whyInteract),
    interaction: first(plan.interactionModel),
    content: first(plan.contentModel),
    discovery: first(plan.discoveryModel),
    progression: first(plan.progressionModel),
    dynamic: first(plan.dynamicBehavior),
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

function semantics(direction: ExperienceHypothesisKind, kind: CognitiveBeatKind, x: Inputs): ReturnType<typeof state> {
  const generic: Record<string, ReturnType<typeof state>> = {
    orientation: state("establish the subject and current situation", "enter the observed situation", "the situation has not been entered", "the subject and situation are established"),
    hook: state("create a reason to continue", "encounter the first active turn", "the situation is static", "something now demands attention"),
    encounter: state("introduce the next concrete condition", "encounter the next supported condition", "the current state is established", "a new condition changes what can happen next"),
    escalation: state("increase the active condition", "go further than before", "the current state is established", "the situation has intensified"),
    transformation: state("make accumulated interaction produce observable change", "carry the preceding state into a changed condition", "the preceding state is established", "the subject or situation is visibly different"),
    payoff: state("resolve the experience into its earned result", "reach the result produced by what happened before", "the decisive state has not resolved", "the result is available"),
    continuation: state("preserve continuity into another interaction", "carry the current state forward", "the current experience has resolved", "the current state remains available"),
  };

  switch (direction) {
    case "memory":
      if (kind === "orientation") return state("establish continuity", "place present evidence beside available prior context", "only the present is visible", "continuity is established");
      if (kind === "origin") return state("surface available history without inventing missing history", "bring an available historical detail into the present", "the prior context is not foregrounded", "available history is connected to now");
      if (kind === "encounter") return state("bring a remembered relationship into the present", "encounter a concrete remembered detail", "history is contextual", "a remembered relationship is active");
      if (kind === "reflection") return state("connect preserved evidence to the present", "recognize the consequence of what was preserved", "the remembered detail has been encountered", "its present consequence is visible");
      break;
    case "utility":
      if (kind === "need") return state("identify the useful target", "identify the immediate target", "the target is unclear", "the useful target is explicit");
      if (kind === "instruction") return state("supply the next useful move", "make the next required action available", "the target is known but not actionable", "the next action is available");
      if (kind === "action") return state("convert guidance into action", "perform the next useful action", "guidance is available", "an observable result exists");
      if (kind === "feedback") return state("use the result as evidence", "observe the result before choosing again", "an action has occurred", "the next decision is informed");
      break;
    case "game":
      if (kind === "hook") return state("establish the challenge", "enter the challenge", "the challenge has not begun", "participation has begun");
      if (kind === "challenge") return state("present a meaningful obstacle", "face the next challenge condition", "the challenge is active", "a concrete problem requires response");
      if (kind === "discovery") return state("reward exploration with information", "inspect the next available clue or condition", "information is incomplete", "new information changes the available choices");
      if (kind === "escalation") return state("increase consequence from accumulated play", "apply the previous result to a harder or stranger next condition", "state has accumulated", "the next condition carries more consequence");
      break;
    case "discovery":
      if (kind === "threshold") return state("move beyond the obvious surface", "cross into the discoverable layer", "only the surface is available", "hidden context can be encountered");
      if (kind === "reveal") return state("expose supported hidden information", "bring a concealed detail into view", "the detail is withheld", "the detail is visible");
      if (kind === "discovery") return state("connect discovered detail to the situation", "follow the newly visible relationship", "the detail is visible but disconnected", "the discovery changes interpretation");
      break;
    case "social":
      if (kind === "orientation") return state("establish shared context", "bring participants to the same point of attention", "participants are separate", "a shared context exists");
      if (kind === "encounter") return state("bring participants into relationship", "let participants encounter the subject together", "shared context exists", "participants can affect shared state");
      if (kind === "contribution") return state("make participation alter shared state", "add a contribution others can encounter", "shared state exists", "the shared state now contains the contribution");
      break;
    case "commerce":
      if (kind === "orientation") return state("give commercial interaction an experiential reason to begin", "enter the relationship around the subject", "transaction context exists", "engagement has begun");
      if (kind === "identity") return state("connect subject and participant identity", "make the subject's identity-bearing detail visible", "identity is implicit", "identity is explicit");
      if (kind === "discovery") return state("reveal value beyond the transaction", "encounter the relevant additional value", "transactional value is known", "additional value is visible");
      break;
    case "journey":
      if (kind === "orientation") return state("establish the starting state", "recognize the current starting point", "the journey is beginning", "starting point is clear");
      if (kind === "threshold") return state("move into the next stage", "cross into the next stage", "the starting state is known", "a new stage is active");
      if (kind === "discovery") return state("derive new information from movement", "discover what the current stage exposes", "the new stage is active", "a new relationship is understood");
      break;
    case "identity":
      if (kind === "orientation") return state("establish identity-bearing context", "notice what the subject represents", "the subject is observed", "identity context is visible");
      if (kind === "identity") return state("make identity relationship explicit", "connect the subject with its supplied identity context", "identity is implicit", "identity is explicit");
      if (kind === "reflection") return state("relate identity back to the participant", "recognize the personal consequence", "identity is recognized", "the participant has a personal interpretation");
      break;
    case "ritual":
      if (kind === "orientation") return state("establish repeated context", "enter the meaningful context", "participation has not begun", "the ritual context is recognized");
      if (kind === "threshold") return state("mark intentional participation", "perform the entry action", "participation has not begun", "intentional participation has begun");
      if (kind === "encounter") return state("enact the central ritual relationship", "perform the central ritual interaction", "intentional participation is established", "the ritual relationship is enacted");
      if (kind === "reflection") return state("connect repeated action to present consequence", "recognize what the ritual action changed", "the ritual has been enacted", "its consequence is visible");
      break;
  }

  return generic[kind] ?? state("advance the selected cognitive direction", "continue from the current state", "the current state is established", "the next experiential state is available");
}

function attentionDirective(
  direction: ExperienceHypothesisKind,
  kind: CognitiveBeatKind,
  premise: CognitivePremise | undefined,
  evidence: CognitiveEvidence[],
): Partial<CognitiveBeatDirective> | undefined {
  const pressure = deriveAttentionPressure(premise, direction);
  const anchor = pressure[0];
  if (!anchor) return undefined;

  const secondary = pressure[1];
  const relation = secondary ? ` and its relationship to ${secondary.value}` : "";
  const summary = attentionSummary(pressure);
  const creativeEvidence: CognitiveEvidence = {
    source: "creative_realization",
    detail: `evidence-driven attention pressure for ${kind}: ${summary}`,
    confidence: Number(Math.min(0.94, Math.max(0.78, anchor.score)).toFixed(3)),
  };

  const withEvidence = (action: string, stateAfter: string): Partial<CognitiveBeatDirective> => ({
    action,
    stateAfter,
    evidence: [...evidence, ...anchor.evidence, creativeEvidence].slice(0, 8),
    confidence: creativeEvidence.confidence,
  });

  if (["hook", "threshold", "encounter", "reveal", "discovery"].includes(kind)) {
    return withEvidence(
      `notice what is distinctive about ${anchor.value}${relation}`,
      `the concrete detail ${anchor.value} now carries attention and changes what is worth noticing next`,
    );
  }

  if (["escalation", "transformation"].includes(kind)) {
    return withEvidence(
      `follow what ${anchor.value} changes${relation}`,
      `the significance of ${anchor.value} increases through its observed relationship to the next state`,
    );
  }

  if (kind === "payoff") {
    return withEvidence(
      `resolve what ${anchor.value} has made matter${relation}`,
      `the experience pays off through the consequence of ${anchor.value}`,
    );
  }

  if (kind === "continuation" || kind === "next_step" || kind === "feedback") {
    return withEvidence(
      `carry ${anchor.value} forward${relation}`,
      `the next interaction retains the significance of ${anchor.value}`,
    );
  }

  return undefined;
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
    if (kind === "escalation") roleSet.add("constraint");

    const directiveEvidence = evidenceFor(premise, [...roleSet], [...evidence, ...hypothesisEvidence]);
    const semantic = semantics(direction, kind, x);
    const attention = attentionDirective(direction, kind, premise, directiveEvidence);

    return {
      kind,
      ...semantic,
      ...attention,
      subject: x.subject,
      relationalFocus: unique([x.social, x.place, x.temporal, x.memory, x.discovery, x.progression]),
      evidence: attention?.evidence ?? directiveEvidence,
      confidence: attention?.confidence ?? (
        directiveEvidence.length
          ? Number(Math.min(0.98, Math.max(0.72, ...directiveEvidence.map((item) => item.confidence))).toFixed(3))
          : 0.72
      ),
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
