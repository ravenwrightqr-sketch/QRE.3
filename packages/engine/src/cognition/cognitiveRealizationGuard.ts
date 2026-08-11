import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { composeCognitiveTrajectory, type CognitiveEventPressure } from "../experience/cognitiveTrajectory.js";

/**
 * FINAL REALIZATION BODYGUARD
 *
 * Cognitive plan language is useful internally but is not presentation copy.
 * This guard removes abstract compiler prose and, when necessary, derives a
 * concrete observable clause from the trajectory's event pressure. It does not
 * select a domain, genre, template, or new story structure.
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
  return details.map(sentence).filter(Boolean).filter((value, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index).filter((value) => patterns.some((pattern) => pattern.test(value)));
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

function pressureExpression(beat: StoryBeat, plan: CognitiveExperiencePlan | undefined, text: string): string | undefined {
  const lower = text.toLowerCase();
  const pressures = pressuresFor(beat, plan);
  if (!pressures.length) return undefined;
  const has = (pattern: RegExp) => pattern.test(lower);

  for (const pressure of pressures) {
    switch (pressure.mechanic) {
      case "escalation":
      case "excess":
      case "indulgence":
      case "pampering":
      case "spectacle":
      case "awe":
      case "euphoria":
        if ((beat.kind === "escalation" || beat.kind === "encounter") && !has(/another|again|goes further|more|larger|bigger|lavish|luxur|extravag|excess/)) return "Another layer is added, making the current state more elaborate than the one before it.";
        break;
      case "memory":
      case "legacy":
      case "resonance":
        if (["origin", "reflection", "encounter"].includes(beat.kind) && !has(/photo|image|video|detail|note|record|trace|artifact|message|memory|remembered/)) return "A concrete detail from before appears here and changes what happens now.";
        break;
      case "adaptation":
        if (["feedback", "next_step"].includes(beat.kind) && !has(/because|respond|response|changes|adjust|instead|now/)) return "What just happened changes the next move.";
        break;
      case "accumulation":
      case "contribution":
      case "authorship":
        if (["contribution", "milestone", "feedback"].includes(beat.kind) && !has(/adds|added|joins|keeps|now contains|another|contribution|created/)) return "The new addition stays in the experience and changes what is available next.";
        break;
      case "suspense":
      case "uncertainty":
        if (["threshold", "encounter", "reveal"].includes(beat.kind)) {
          const evidenceExpression = suspenseEvidenceExpression(plan);
          if (evidenceExpression && (!has(/hidden|out of sight|unseen|unknown|withheld|not yet|still/) || !has(THREAT_WORD) || !has(DANGER_WORD))) return evidenceExpression;
          if (!has(/hidden|out of sight|unseen|unknown|withheld|not yet|still/)) return "The crucial detail stays just out of sight, leaving the next move unresolved.";
        }
        break;
      case "discovery":
      case "novelty":
      case "wonder":
        if (["discovery", "reveal"].includes(beat.kind) && !has(/finds|find|reveals|appears|opens|shows|uncovers|new/)) return "A new concrete detail appears and changes what can happen next.";
        break;
      case "transformation":
      case "contrast":
        if (beat.kind === "transformation" && !has(/becomes|changes|now|different|after/)) return "The after-state is visibly different from the state that entered this sequence.";
        break;
      case "participation":
      case "agency":
      case "embodiment":
        if (beat.kind === "action" && !has(/choose|chooses|takes|does|adds|moves|acts/)) return "The participant makes a concrete move, and the situation responds.";
        break;
      case "consequence":
      case "reciprocity":
        if (beat.kind === "feedback" && !has(/result|respond|changes|because|follows/)) return "The result of the previous move appears and changes the next condition.";
        break;
      case "ownership":
        if (["milestone", "payoff"].includes(beat.kind) && !has(/mine|own|belongs|keep|claim|take home|possess/)) return "The result is now identified as something the participant can keep.";
        break;
      case "continuation":
        if (beat.kind === "continuation" && !has(/saved|kept|remains|next|return|later|again/)) return "Something from this moment remains available for whoever returns next.";
        break;
      default:
        break;
    }
  }
  return undefined;
}

export function guardCognitiveBeatText(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const original = sentence(beat.text);
  let stripped = stripAbstract(original);
  if (!stripped || stillAbstract(stripped)) stripped = concreteFallback(beat, plan);
  const pressure = pressureExpression(beat, plan, stripped);
  if (pressure) stripped = `${sentence(stripped)} ${pressure}`;
  if (beat.kind === "escalation" && !/\b(?:another|again|more|larger|bigger|adds|added|new layer|changes the current|goes further)\b/i.test(stripped)) stripped = `${sentence(stripped)} Another layer is added, forcing the next state beyond what came before.`;
  return `${sentence(stripped)}.`;
}

export function guardCognitiveStory(beats: StoryBeat[], plan?: CognitiveExperiencePlan): StoryBeat[] {
  return beats.map((beat) => ({ ...beat, text: guardCognitiveBeatText(beat, plan) }));
}
