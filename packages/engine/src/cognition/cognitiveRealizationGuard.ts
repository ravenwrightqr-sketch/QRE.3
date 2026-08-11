import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import {
  composeCognitiveTrajectory,
  type CognitiveEventPressure,
} from "../experience/cognitiveTrajectory.js";
import type { ExperienceMechanic } from "../experience/cognitiveMechanics.js";

/**
 * FINAL REALIZATION BODYGUARD
 *
 * Cognitive plan language is useful internally but is not presentation copy.
 * This guard removes abstract compiler prose and enforces the stronger rule:
 *
 *   mechanic -> causal beat -> observable event
 *
 * A mechanic that exists only in metadata is considered unrealized. The guard
 * therefore conserves prompt evidence, binds active mechanics to trajectory
 * beats, and adds a concrete observable clause when the prose has not already
 * expressed the event. It does not select a domain, genre, template, or new
 * story structure.
 */

const ABSTRACT = [
  /make .* matter(?: through| by| with)?[^.!?]*/i,
  /make .* meaningful(?: through| by| with)?[^.!?]*/i,
  /adapt to accumulated[^.!?]*/i,
  /adapt to .* history[^.!?]*/i,
  /allow participants to[^.!?]*/i,
  /let participants[^.!?]*/i,
  /enter living memory[^.!?]*/i,
  /affect shared state[^.!?]*/i,
  /change what can happen next[^.!?]*/i,
  /determine what happens next[^.!?]*/i,
  /carry .* into the present[^.!?]*/i,
  /brings an available detail into the present/i,
  /place present evidence beside available prior context/i,
  /carries (?:a )?past into the present/i,
  /recognize what .* means[^.!?]*/i,
  /create a reason to continue[^.!?]*/i,
  /the intended experiential result[^.!?]*/i,
  /gets increasingly over the top/i,
  /new memories can change what later visitors discover/i,
];

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};

function stripAbstract(text: string): string {
  let result = clean(text);
  for (const pattern of ABSTRACT) result = result.replace(pattern, " ");
  return clean(result.replace(/\s+([,.])/g, "$1"));
}

function concreteFallback(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subject = cap(plan?.centralSubject || beat.entities?.[0] || "the subject");
  switch (beat.kind) {
    case "orientation": return `${subject} enters the situation`;
    case "hook": return `${subject} encounters the first concrete turn`;
    case "threshold": return `${subject} crosses into the next state`;
    case "origin": return `${subject} starts with a concrete detail from before this moment`;
    case "encounter": return `${subject} encounters a new concrete condition`;
    case "discovery": return `${subject} finds a detail that changes the situation`;
    case "reveal": return `${subject} sees what was hidden`;
    case "action": return `${subject} takes the next concrete action`;
    case "feedback": return `${subject} sees the result of that action`;
    case "contribution": return `${subject} adds something that changes what is available next`;
    case "escalation": return `${subject} goes further, forcing the next state beyond what came before`;
    case "transformation": return `${subject} is visibly different because of what happened`;
    case "reflection": return `${subject} responds to the consequence of what happened`;
    case "milestone": return `${subject} reaches a new state`;
    case "unlock": return `${subject} unlocks what comes next`;
    case "earned_access": return `${subject} earns access to what comes next`;
    case "payoff": return `${subject} reaches the result created by what happened before`;
    case "next_step": return `${subject} takes the next step from the current state`;
    case "continuation": return `${subject} leaves something concrete available for the next interaction`;
    default: return `${subject} continues from the current state`;
  }
}

function stillAbstract(text: string): boolean {
  return ABSTRACT.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function pressuresFor(beat: StoryBeat, plan?: CognitiveExperiencePlan): CognitiveEventPressure[] {
  return composeCognitiveTrajectory({ plan }).eventPressure.filter((pressure) => pressure.beat === beat.kind);
}

function conservedEvidence(plan: CognitiveExperiencePlan | undefined, patterns: RegExp[]): string[] {
  if (!plan) return [];
  const details = [
    ...(plan.premise?.slots.flatMap((slot) => slot.evidence.filter((item) => item.source === "prompt").map((item) => item.detail)) ?? []),
    ...(plan.realization?.directives.flatMap((directive) => directive.evidence.filter((item) => item.source === "prompt").map((item) => item.detail)) ?? []),
    ...(plan.premise?.slots.filter((slot) => slot.evidence.some((item) => item.source === "prompt")).flatMap((slot) => slot.values) ?? []),
  ];
  return details
    .map(sentence)
    .filter(Boolean)
    .filter((value, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index)
    .filter((value) => patterns.some((pattern) => pattern.test(value)));
}

const THREAT_WORD = /\b(threat|risk|danger|menace|peril|hazard)\b/i;
const DANGER_WORD = /\b(dangerous|deadly|hazardous|risky|perilous|threatening)\b/i;
const UNCERTAINTY_WORD = /\b(uncertain|unknown|unresolved|hidden|unclear|unseen|mysterious|unpredictable)\b/i;

function suspenseEvidenceExpression(plan?: CognitiveExperiencePlan): string | undefined {
  const evidence = conservedEvidence(plan, [THREAT_WORD, DANGER_WORD, UNCERTAINTY_WORD]);
  if (!evidence.length) return undefined;
  const threat = evidence.find((value) => THREAT_WORD.test(value));
  const danger = evidence.find((value) => DANGER_WORD.test(value));
  const uncertainty = evidence.find((value) => UNCERTAINTY_WORD.test(value));
  if (threat && danger) return "The threat remains dangerous while its source stays uncertain.";
  if (threat && uncertainty) return "The threat remains present while its source stays uncertain.";
  if (danger) return "The dangerous condition remains unresolved, making the next move harder to read.";
  if (uncertainty) return "The uncertainty remains active, keeping the next move unresolved.";
  return undefined;
}

const OBSERVABLE_MARKERS: Record<ExperienceMechanic, RegExp> = {
  anticipation: /\b(wait|held|reach|threshold|next step|approach)\b/i,
  uncertainty: /\b(unresolved|unknown|uncertain|hidden|out of sight|unseen)\b/i,
  suspense: /\b(threat|danger|unresolved|unknown|uncertain)\b/i,
  discovery: /\b(find|finds|found|discovers?|uncovers?|new detail|appears)\b/i,
  surprise: /\b(changes? the next|different because|unexpected|turns? out|surprise)\b/i,
  reversal: /\b(reverses?|turns?|instead|against|opposite|changes course)\b/i,
  participation: /\b(acts?|takes|adds|moves?|chooses?|does)\b/i,
  agency: /\b(chooses?|choice|selects?|decides?|next move)\b/i,
  consequence: /\b(result|response|changes?|because|follows)\b/i,
  competition: /\b(challenge|score|race|wins?|loses?|standing)\b/i,
  mastery: /\b(clears?|masters?|harder|level|challenge)\b/i,
  contribution: /\b(adds?|added|contribution|remains|piece)\b/i,
  authorship: /\b(creates?|created|contribution|becomes? part)\b/i,
  reciprocity: /\b(response|responds?|receives?|returns?)\b/i,
  accumulation: /\b(accumulates?|builds?|grows?|remains alongside|larger)\b/i,
  momentum: /\b(pushes?|next step|continues?|moves? into)\b/i,
  escalation: /\b(another|again|more|larger|bigger|new layer|goes further|escalat)\b/i,
  transformation: /\b(becomes?|changes?|different|after-state|visibly)\b/i,
  contrast: /\b(before|after|different|baseline|contrasts?)\b/i,
  reveal: /\b(hidden|visible|reveals?|revealed|appears?|uncovered)\b/i,
  memory: /\b(before|past|remember|detail from before|returns?)\b/i,
  ritual: /\b(repeats?|again|ritual|marks?)\b/i,
  continuation: /\b(remains|available|returns?|next|later|continues?)\b/i,
  adaptation: /\b(changes? the next|responds?|adjusts?|because|next move)\b/i,
  pampering: /\b(treatment|pamper|care|receives?|groom)\b/i,
  indulgence: /\b(extravagant|lavish|luxur|indulg|more than)\b/i,
  excess: /\b(excess|more|larger|bigger|over the top|another layer)\b/i,
  spectacle: /\b(spectacle|visible|larger|event|unfolds?)\b/i,
  delight: /\b(delight|pleasing|enjoys?|pleasant|unexpectedly)\b/i,
  euphoria: /\b(euphoria|triumph|success|intense|celebrat)\b/i,
  celebration: /\b(celebrat|milestone|marked|cheered|honored)\b/i,
  prestige: /\b(exclusive|reserved|distinguished|marked)\b/i,
  novelty: /\b(new|novel|appears?|unfamiliar)\b/i,
  curation: /\b(selects?|arranges?|curates?|chooses?)\b/i,
  scarcity: /\b(limited|only|rare|scarce|choice)\b/i,
  recognition: /\b(recognized|recognized for|honored|credited|marked)\b/i,
  ownership: /\b(keep|owns?|belongs|take home|artifact)\b/i,
  legacy: /\b(trace|record|remains|later|legacy|kept)\b/i,
  resonance: /\b(returns?|echo|earlier|remains|resonat)\b/i,
  intimacy: /\b(direct exchange|close|private|one-on-one|speaks?)\b/i,
  catharsis: /\b(releases?|breaks?|relief|changed emotional|catharsis)\b/i,
  relief: /\b(relief|lifts?|eases?|pressure|danger.*ends?)\b/i,
  wonder: /\b(new|possible|wonder|discovers?|encounters?)\b/i,
  awe: /\b(scale|larger|vast|awe|spectacular)\b/i,
  embodiment: /\b(physically|takes?|moves?|touches?|performs?)\b/i,
  immersion: /\b(enters?|surrounding|inside|fully|crosses?)\b/i,
};

function observableClause(
  mechanic: ExperienceMechanic,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subject = cap(plan?.centralSubject || beat.entities?.[0] || "the subject");

  if (mechanic === "suspense" || mechanic === "uncertainty") {
    return suspenseEvidenceExpression(plan) ?? "The crucial detail stays unresolved, so the next move cannot yet be predicted.";
  }

  switch (mechanic) {
    case "anticipation": return `${subject} reaches a threshold where the next step is deliberately held just out of reach.`;
    case "discovery": return `${subject} finds a new concrete detail that was not visible before.`;
    case "surprise": return `${subject} encounters something unexpected, and it changes the next available move.`;
    case "reversal": return `The situation turns against the expectation established for ${subject}.`;
    case "participation": return `${subject} takes a concrete action that changes the experience.`;
    case "agency": return `${subject} chooses the next move, and the experience follows that choice.`;
    case "consequence": return `The result of ${subject}'s previous move appears and changes the current state.`;
    case "competition": return `${subject} faces a measurable challenge, and the result changes their standing.`;
    case "mastery": return `${subject} clears the challenge and reaches a harder level.`;
    case "contribution": return `${subject} adds a concrete piece, and that addition remains in the experience.`;
    case "authorship": return `${subject}'s contribution becomes part of the resulting experience.`;
    case "reciprocity": return `${subject} acts and receives a concrete response.`;
    case "accumulation": return `The new piece remains alongside what came before, making the result larger.`;
    case "momentum": return `What just happened pushes ${subject} into the next step.`;
    case "escalation": return `Another layer is added, forcing the current state beyond what came before.`;
    case "transformation": return `${subject} ends this beat in a visibly different state because of what happened.`;
    case "contrast": return `The after-state is visibly different from the baseline that came before.`;
    case "reveal": return `A hidden detail becomes visible to ${subject}.`;
    case "memory": return `A concrete detail from before appears now and changes ${subject}'s response.`;
    case "ritual": return `${subject} repeats the concrete act that marks this experience.`;
    case "continuation": return `Something created here remains available when the experience continues.`;
    case "adaptation": return `What just happened changes ${subject}'s next move.`;
    case "pampering": return `${subject} receives another concrete treatment that changes their condition.`;
    case "indulgence": return `${subject} receives a more extravagant treatment than the one before.`;
    case "excess": return `The next layer is deliberately more excessive than the previous one.`;
    case "spectacle": return `A larger visible event unfolds around ${subject}.`;
    case "delight": return `${subject} gets an unexpectedly pleasing result.`;
    case "euphoria": return `${subject}'s success triggers an even more intense payoff.`;
    case "celebration": return `${subject} reaches a visible milestone that is celebrated.`;
    case "prestige": return `The result is marked as exclusive to ${subject}.`;
    case "novelty": return `A new element appears that was not present before.`;
    case "curation": return `${subject} selects and arranges the elements that remain.`;
    case "scarcity": return `Only a limited option remains available, forcing ${subject} to choose.`;
    case "recognition": return `${subject} is visibly recognized for what they accomplished.`;
    case "ownership": return `${subject} leaves with the resulting artifact as something they can keep.`;
    case "legacy": return `A concrete trace of this moment remains for later participants.`;
    case "resonance": return `An earlier moment returns in a concrete detail that affects this one.`;
    case "intimacy": return `The interaction narrows to a direct exchange with ${subject}.`;
    case "catharsis": return `The pressure breaks, leaving ${subject} in a changed emotional state.`;
    case "relief": return `The pressure lifts, changing what ${subject} can do next.`;
    case "wonder": return `${subject} encounters something new enough to change what seemed possible.`;
    case "awe": return `The scale of what appears around ${subject} becomes visibly greater.`;
    case "embodiment": return `${subject} physically performs the next action.`;
    case "immersion": return `${subject} crosses fully into the new situation, with the surrounding conditions now acting on them.`;
    default: return `${subject} produces an observable change associated with ${mechanic}.`;
  }
}

function pressureExpression(beat: StoryBeat, plan: CognitiveExperiencePlan | undefined, text: string): string | undefined {
  const lower = text.toLowerCase();
  const pressures = pressuresFor(beat, plan);
  if (!pressures.length) return undefined;

  for (const pressure of pressures) {
    const marker = OBSERVABLE_MARKERS[pressure.mechanic];
    if (!marker || marker.test(lower)) continue;
    return observableClause(pressure.mechanic, beat, plan);
  }

  return undefined;
}

export function guardCognitiveBeatText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const original = sentence(beat.text);
  let stripped = stripAbstract(original);
  if (!stripped || stillAbstract(stripped)) stripped = concreteFallback(beat, plan);
  const pressure = pressureExpression(beat, plan, stripped);
  if (pressure) stripped = `${sentence(stripped)} ${pressure}`;

  if (
    beat.kind === "escalation" &&
    !/\b(?:another|again|more|larger|bigger|adds|added|new layer|changes the current|goes further)\b/i.test(stripped)
  ) {
    stripped = `${sentence(stripped)} Another layer is added, forcing the next state beyond what came before.`;
  }

  return `${sentence(stripped)}.`;
}

/**
 * Final invariant: every active mechanic with an event-pressure binding must
 * leave observable evidence in at least one beat. This is deliberately checked
 * after beat-level cleanup so metadata cannot satisfy the invariant by itself.
 */
export function guardCognitiveStory(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  const guarded = beats.map((beat) => ({ ...beat, text: guardCognitiveBeatText(beat, plan) }));
  const trajectory = composeCognitiveTrajectory({ plan });
  const pressures = trajectory.eventPressure;
  const realized = new Set<ExperienceMechanic>();

  for (const beat of guarded) {
    for (const pressure of pressures.filter((candidate) => candidate.beat === beat.kind)) {
      const marker = OBSERVABLE_MARKERS[pressure.mechanic];
      if (marker?.test(beat.text)) realized.add(pressure.mechanic);
    }
  }

  for (const signal of trajectory.mechanics.filter((candidate) => candidate.confidence >= 0.7)) {
    if (realized.has(signal.mechanic)) continue;

    const pressure = pressures.find((candidate) => candidate.mechanic === signal.mechanic);
    if (!pressure) continue;

    const index = guarded.findIndex((beat) => beat.kind === pressure.beat);
    if (index < 0) continue;

    const beat = guarded[index];
    guarded[index] = {
      ...beat,
      text: `${sentence(beat.text)} ${observableClause(signal.mechanic, beat, plan)}`,
    };
    realized.add(signal.mechanic);
  }

  return guarded;
}
