import type { CognitiveExperiencePlan, StoryBeat, StoryBeatKind } from "@qre/contracts";

/**
 * FINAL REALIZATION BODYGUARD
 *
 * Cognition may contain abstract directives such as "make X matter" or
 * "adapt to accumulated history". Those are useful internally, but they are
 * never allowed to become authored story prose.
 *
 * This guard is deliberately downstream of the universal compiler. It does
 * not choose structure, invent domains, or replace the cognitive brain. It
 * only rejects semantic-control language that escaped into presentation and
 * restores a concrete beat-level expression when necessary.
 */

const ABSTRACT = [
  /make .* matter(?: through| by| with)?[^.!?]*/gi,
  /make .* meaningful(?: through| by| with)?[^.!?]*/gi,
  /adapt to accumulated[^.!?]*/gi,
  /adapt to .* history[^.!?]*/gi,
  /allow participants to[^.!?]*/gi,
  /let participants[^.!?]*/gi,
  /enter living memory[^.!?]*/gi,
  /affect shared state[^.!?]*/gi,
  /change what can happen next[^.!?]*/gi,
  /determine what happens next[^.!?]*/gi,
  /carry .* into the present[^.!?]*/gi,
  /recognize what .* means[^.!?]*/gi,
  /create a reason to continue[^.!?]*/gi,
  /the intended experiential result[^.!?]*/gi,
];

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: string): string => sentence(value).toLowerCase();
const cap = (value: string): string => {
  const text = sentence(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "The subject";
};

function stripAbstract(text: string): string {
  let result = clean(text);
  for (const pattern of ABSTRACT) {
    result = result.replace(pattern, " ");
  }
  return clean(result.replace(/\s+([,.])/g, "$1"));
}

function concreteFallback(beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subject = cap(plan?.centralSubject || beat.entities?.[0] || "the subject");
  switch (beat.kind) {
    case "orientation": return `${subject} enters the situation`;
    case "hook": return `${subject} encounters the first concrete turn`;
    case "threshold": return `${subject} crosses into the next state`;
    case "origin": return `${subject} brings an available detail into the present`;
    case "encounter": return `${subject} encounters a new concrete condition`;
    case "discovery": return `${subject} finds a detail that changes the situation`;
    case "reveal": return `${subject} sees what was hidden`;
    case "action": return `${subject} takes the next concrete action`;
    case "feedback": return `${subject} sees the result of that action`;
    case "contribution": return `${subject} adds something that changes what is available next`;
    case "escalation": return `${subject} goes further, pushing the current condition beyond what came before`;
    case "transformation": return `${subject} is visibly different because of what happened`;
    case "reflection": return `${subject} recognizes the consequence of what happened`;
    case "milestone": return `${subject} reaches a new state`;
    case "unlock": return `${subject} unlocks what comes next`;
    case "earned_access": return `${subject} earns access to what comes next`;
    case "payoff": return `${subject} reaches the result created by what happened before`;
    case "next_step": return `${subject} takes the next step from the current state`;
    case "continuation": return `${subject} carries the current state forward`;
    default: return `${subject} continues from the current state`;
  }
}

function stillAbstract(text: string): boolean {
  return ABSTRACT.some((pattern) => pattern.test(text));
}

/** Remove escaped semantic-control prose while preserving concrete details. */
export function guardCognitiveBeatText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const original = sentence(beat.text);
  const stripped = stripAbstract(original);

  // If the escaped directive was the whole sentence, replace it with an
  // observable operation rather than returning empty prose.
  if (!stripped || stillAbstract(stripped)) {
    return `${concreteFallback(beat, plan)}.`;
  }

  // Escalation must be observable. A surviving abstract-looking escalation
  // should still contain an unmistakable state movement.
  if (
    beat.kind === "escalation" &&
    !/\b(?:goes? further|further than before|excessive|ordinary|more|another|again)\b/i.test(stripped)
  ) {
    return `${stripped}. ${concreteFallback(beat, plan)}.`;
  }

  return `${stripped}.`;
}

export function guardCognitiveStory(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  return beats.map((beat) => ({
    ...beat,
    text: guardCognitiveBeatText(beat, plan),
  }));
}
