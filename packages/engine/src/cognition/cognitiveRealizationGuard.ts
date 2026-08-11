import type { CognitiveExperiencePlan, StoryBeat, StoryBeatKind } from "@qre/contracts";
import { inferExperienceMechanics, mechanicBrief } from "../experience/cognitiveMechanics.js";

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
 *
 * Mechanical forces are also given a final expressive pressure here. This is
 * not a domain template: suspense becomes withheld/hidden/out-of-reach,
 * excess becomes further-than-before, agency becomes choice, and ownership
 * becomes possession. The language describes observable experience rather than
 * explaining why the experience matters.
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
  /recognize what .* means[^.!?]*/i,
  /create a reason to continue[^.!?]*/i,
  /the intended experiential result[^.!?]*/i,
  /gets increasingly over the top/i,
  /environment, interaction, and new memories can change what later visitors discover/i,
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
  return ABSTRACT.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function activeMechanics(plan?: CognitiveExperiencePlan): Set<string> {
  return new Set(
    mechanicBrief(
      inferExperienceMechanics({
        plan,
        premise: plan?.premise,
      }),
    ),
  );
}

function mechanicExpression(
  beat: StoryBeat,
  plan: CognitiveExperiencePlan | undefined,
  text: string,
): string | undefined {
  const mechanics = activeMechanics(plan);
  const lower = text.toLowerCase();

  if (mechanics.has("suspense") || mechanics.has("uncertainty")) {
    if (beat.kind === "threshold" && !/out of reach|withheld|hidden/.test(lower)) {
      return "The threat stays out of reach.";
    }
    if (beat.kind === "encounter" && !/out of reach|withheld|hidden/.test(lower)) {
      return "Something remains just beyond sight.";
    }
    if (beat.kind === "reveal" && !/out of reach|withheld|hidden/.test(lower)) {
      return "The crucial detail is still hidden.";
    }
  }

  if (mechanics.has("excess") || mechanics.has("escalation")) {
    if (beat.kind === "escalation" && !/goes further|excessive|ordinary|more|another|again/.test(lower)) {
      return "It goes further than before.";
    }
    if (beat.kind === "encounter" && mechanics.has("excess") && !/luxur|extravag|lavish|opulent|excessive/.test(lower)) {
      return "The next detail is more extravagant than necessary.";
    }
  }

  if (mechanics.has("agency")) {
    if (beat.kind === "action" && !/choose|choice|chosen|select|decide/.test(lower)) {
      return "The participant chooses the move.";
    }
    if (beat.kind === "feedback" && !/respond|response|choice|chosen/.test(lower)) {
      return "The experience responds to that choice.";
    }
  }

  if (mechanics.has("ownership")) {
    if ((beat.kind === "milestone" || beat.kind === "payoff") && !/mine|own|belongs|keep|claim|take home|possess/.test(lower)) {
      return "The participant can keep what was earned.";
    }
  }

  return undefined;
}

/** Remove escaped semantic-control prose while preserving concrete details. */
export function guardCognitiveBeatText(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const original = sentence(beat.text);
  let stripped = stripAbstract(original);

  // If the escaped directive was the whole sentence, replace it with an
  // observable operation rather than returning empty prose.
  if (!stripped || stillAbstract(stripped)) {
    stripped = concreteFallback(beat, plan);
  }

  // Escaped cognitive directives can contain useful structure but not useful
  // presentation language. Replace the directive itself with an experiential
  // expression instead of allowing it to survive verbatim.
  const pressure = mechanicExpression(beat, plan, stripped);
  if (pressure) {
    stripped = `${sentence(stripped)} ${pressure}`;
  }

  // Escalation must be observable. A surviving abstract-looking escalation
  // should still contain an unmistakable state movement.
  if (
    beat.kind === "escalation" &&
    !/\b(?:goes? further|further than before|excessive|ordinary|more|another|again)\b/i.test(stripped)
  ) {
    stripped = `${sentence(stripped)} ${concreteFallback(beat, plan)}`;
  }

  return `${sentence(stripped)}.`;
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
