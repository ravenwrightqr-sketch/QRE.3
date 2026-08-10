/**
 * =============================================================================
 * QRE ELOQUENT COGNITIVE EXPERIENCE REALIZER
 * =============================================================================
 *
 * GOAL
 * ----
 * Turn the trajectory's discovered cognitive forces into concrete, energetic
 * experience language without falling back to subject-specific templates.
 *
 * PURPOSE
 * -------
 * This is the final language boundary between:
 *
 *   MEGA COGNITION -> MEGA TRAJECTORY -> CONCRETE EXPERIENCE
 *
 * The layer does not invent facts. It preserves authoritative subjects,
 * directives, premise evidence, prompt evidence, and beat structure while
 * adding expressive grammatical force appropriate to the mechanics cognition
 * actually selected.
 *
 * DESIGN RULES
 * ------------
 * 1. Cognition owns meaning.
 * 2. Trajectory owns causal structure.
 * 3. This layer owns expression only.
 * 4. Mechanics may change the way a beat lands, never the facts it contains.
 * 5. No domain branches. No dog branch. No spa branch. No horror branch.
 * 6. "Feel good" means experiential intensity, not mandatory wholesomeness.
 * 7. Concrete evidence must remain visible all the way to presentation.
 * 8. Raw prompt evidence is a conservation channel, not a template selector.
 *
 * =============================================================================
 */

import type { CognitiveExperiencePlan, StoryBeat } from "@qre/contracts";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";
import { isGenericCompilerProse } from "./premiseRealizer.js";
import { realizePremiseBeatV3 } from "./premiseRealizerV3.js";

type ExpressionMechanic = {
  mechanic: string;
  beatOpeners?: Partial<Record<StoryBeat["kind"], string[]>>;
};

const EXPRESSION_MECHANICS: readonly ExpressionMechanic[] = [
  { mechanic: "anticipation", beatOpeners: { hook: ["The next move is already pulling forward.", "The moment starts leaning toward what comes next."], threshold: ["The waiting ends here."] } },
  { mechanic: "suspense", beatOpeners: { threshold: ["The answer stays just out of reach."], reveal: ["Then the withheld piece comes into view."] } },
  { mechanic: "surprise", beatOpeners: { reveal: ["Then the expectation breaks."], transformation: ["The direction suddenly changes."] } },
  { mechanic: "reversal", beatOpeners: { reveal: ["Then the reading flips."], transformation: ["What looked settled turns another way."] } },
  { mechanic: "agency", beatOpeners: { action: ["Now the participant gets the move."], feedback: ["The choice answers back."], next_step: ["That choice now determines the next move."] } },
  { mechanic: "consequence", beatOpeners: { feedback: ["The action leaves a mark on what happens next."], transformation: ["The earlier move now changes the state."] } },
  { mechanic: "mastery", beatOpeners: { challenge: ["The next move demands more control."], milestone: ["The new capability is now visible."] } },
  { mechanic: "discovery", beatOpeners: { discovery: ["Another layer comes into view."], reveal: ["Something that was hidden is now available to see."] } },
  { mechanic: "spectacle", beatOpeners: { encounter: ["The experience opens wider."], payoff: ["The result arrives at full scale."] } },
  { mechanic: "wonder", beatOpeners: { threshold: ["The ordinary boundary gives way to something stranger."], discovery: ["The next detail rewards a closer look."] } },
  { mechanic: "awe", beatOpeners: { encounter: ["The moment takes on a larger scale."], payoff: ["The result lands with weight."] } },
  { mechanic: "indulgence", beatOpeners: { encounter: ["The experience refuses to stop at ordinary."], transformation: ["Ordinary proportionality is no longer the rule."] } },
  { mechanic: "excess", beatOpeners: { escalation: ["And then it goes further."], payoff: ["The result is allowed to be excessive."] } },
  { mechanic: "euphoria", beatOpeners: { payoff: ["The accumulated momentum finally breaks into payoff."] } },
  { mechanic: "celebration", beatOpeners: { milestone: ["The moment becomes something to celebrate."], payoff: ["The result gets its full celebration."] } },
  { mechanic: "prestige", beatOpeners: { threshold: ["Access becomes part of the experience."], identity: ["The distinction becomes visible."] } },
  { mechanic: "scarcity", beatOpeners: { threshold: ["The window is deliberately narrow."], unlock: ["The limited state opens."] } },
  { mechanic: "curation", beatOpeners: { discovery: ["The selected detail is the one that matters here."], action: ["The experience narrows to the chosen move."] } },
  { mechanic: "ownership", beatOpeners: { identity: ["The experience becomes theirs."], payoff: ["The result now belongs to the participant's story."] } },
  { mechanic: "legacy", beatOpeners: { provenance: ["The origin stays attached to what was made."], continuation: ["What happened here remains available to the next chapter."] } },
  { mechanic: "intimacy", beatOpeners: { encounter: ["The moment narrows to the relationship itself."], reflection: ["The quieter part of the moment comes forward."] } },
  { mechanic: "catharsis", beatOpeners: { payoff: ["The pressure finally has somewhere to go."], transformation: ["The accumulated pressure breaks into change."] } },
  { mechanic: "relief", beatOpeners: { payoff: ["The pressure releases."] } },
  { mechanic: "momentum", beatOpeners: { escalation: ["The previous move gives the next one its speed."], next_step: ["The current state creates the next move."] } },
  { mechanic: "embodiment", beatOpeners: { action: ["The experience becomes something the participant can actually do."], feedback: ["The result can be felt in the interaction."] } },
  { mechanic: "immersion", beatOpeners: { encounter: ["The surrounding experience takes over."], transformation: ["The state changes from inside the experience."] } },
  { mechanic: "recognition", beatOpeners: { milestone: ["The contribution becomes visible."], identity: ["The participant is no longer anonymous inside the moment."] } },
];

const PROMPT_STOP = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "can", "could",
  "create", "creates", "created", "creating", "for", "from", "get", "gets", "give",
  "gives", "given", "has", "have", "how", "i", "if", "in", "into", "is", "it",
  "its", "make", "makes", "making", "me", "my", "of", "on", "or", "our", "people",
  "please", "that", "the", "their", "this", "those", "to", "turn", "up", "was", "we",
  "what", "when", "where", "which", "who", "with", "you", "your", "something", "someone",
  "thing", "experience", "story", "about", "through", "just", "more", "than", "then", "now",
  "will", "keep", "after", "before", "very", "really", "want", "needs", "need", "next",
  "every", "each", "while", "becomes", "become", "becoming", "less", "certain", "genuinely",
  "increasingly", "own", "path", "leave", "rare", "personalized",
]);

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const sentence = (value: string): string => clean(value).replace(/[.!?]+$/, "");
const lower = (value: string): string => clean(value).toLowerCase();

function promptEvidence(prompt: string): string[] {
  const candidates = prompt
    .replace(/[.!?,;:()[\]{}]/g, " ")
    .split(/\s+/)
    .map((value) => value.replace(/^[-'\"]+|[-'\"]+$/g, "").trim())
    .filter(Boolean)
    .filter((value) => value.length >= 4)
    .filter((value) => !PROMPT_STOP.has(lower(value)))
    .filter((value) => !/^[0-9]+$/.test(value));

  return unique(candidates);
}

function activeMechanics(plan?: CognitiveExperiencePlan): string[] {
  if (!plan) return [];

  return unique(
    composeCognitiveTrajectory({ plan })
      .mechanics
      .filter((signal) => signal.confidence >= 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .map((signal) => signal.mechanic),
  );
}

function openerFor(beat: StoryBeat, mechanics: string[]): string | undefined {
  for (const mechanic of mechanics) {
    const entry = EXPRESSION_MECHANICS.find((candidate) => candidate.mechanic === mechanic);
    const options = entry?.beatOpeners?.[beat.kind];
    if (options?.length) return options[beat.order % options.length];
  }
  return undefined;
}

function preserveConcreteSubject(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const subjects = unique([
    beat.directive?.subject,
    ...(plan?.premise?.slots.filter((slot) => slot.role === "subject").flatMap((slot) => slot.values) ?? []),
    plan?.centralSubject,
  ].filter((value): value is string => Boolean(value?.trim())));

  if (!subjects.length) return text;
  const normalized = lower(text);
  const strongest = subjects.sort((a, b) =>
    b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length,
  )[0];
  const missing = strongest.split(/\s+/).filter((token) => token.length > 1 && !normalized.includes(lower(token)));

  return missing.length
    ? `${sentence(text)} ${strongest} remains at the center of this moment.`
    : text;
}

function addMechanicTexture(text: string, beat: StoryBeat, plan?: CognitiveExperiencePlan): string {
  const opener = openerFor(beat, activeMechanics(plan));
  if (!opener || lower(text).includes(lower(opener))) return text;
  return `${opener} ${sentence(text)}`;
}

function removeDeadProse(text: string): string {
  const blocked = [
    /the experience puts into focus/gi,
    /deserves a closer look/gi,
    /gives the story somewhere concrete to begin/gi,
    /the next layer/gi,
    /the operative move is/gi,
  ];

  return sentence(blocked.reduce((current, pattern) => current.replace(pattern, ""), text).replace(/\s{2,}/g, " "));
}

function capPrompt(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function appendPromptEvidence(text: string, beat: StoryBeat, evidence: string[]): string {
  const normalized = lower(text);
  const missing = evidence.filter((value) => !normalized.includes(lower(value)));
  if (!missing.length) return text;

  const details = missing.slice(0, 2);
  const first = details[0];
  const second = details[1];

  switch (beat.kind) {
    case "encounter":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} stay present in the scene.`
        : `${sentence(text)} ${capPrompt(first)} stays present in the scene.`;
    case "discovery":
    case "reveal":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} become part of what is discovered.`
        : `${sentence(text)} ${capPrompt(first)} becomes part of what is discovered.`;
    case "action":
      return second
        ? `${sentence(text)} The action stays grounded in ${first} and ${second}.`
        : `${sentence(text)} The action stays grounded in ${first}.`;
    case "escalation":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} raise the intensity.`
        : `${sentence(text)} ${capPrompt(first)} raises the intensity.`;
    case "transformation":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} mark the change.`
        : `${sentence(text)} ${capPrompt(first)} marks the change.`;
    case "payoff":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} remain attached to the result.`
        : `${sentence(text)} ${capPrompt(first)} remains attached to the result.`;
    case "reflection":
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} remain part of what is remembered.`
        : `${sentence(text)} ${capPrompt(first)} remains part of what is remembered.`;
    default:
      return second
        ? `${sentence(text)} ${capPrompt(first)} and ${second} remain part of the moment.`
        : `${sentence(text)} ${capPrompt(first)} remains part of the moment.`;
  }
}

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
  _prompt?: string,
): string {
  const resolved = plan?.realization?.directives?.length
    ? {
        ...beat,
        directive: plan.realization.directives.find((directive) => directive.kind === beat.kind) ?? beat.directive,
      }
    : beat;

  let realized = realizePremiseBeatV3(resolved, plan);
  realized = addMechanicTexture(realized, resolved, plan);
  realized = preserveConcreteSubject(realized, resolved, plan);
  realized = removeDeadProse(realized);

  if (isGenericCompilerProse(realized)) realized = realizePremiseBeatV3(resolved, plan);
  return `${sentence(realized)}.`;
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
  prompt?: string,
): StoryBeat[] {
  const evidence = promptEvidence(prompt ?? "");
  const output = beats.map((beat) => ({
    ...beat,
    text: elevateStoryBeat(beat, beat.order, plan, prompt),
  }));

  if (!evidence.length) return output;

  const required = Math.min(3, evidence.length);
  let preserved = evidence.filter((value) => output.some((beat) => lower(beat.text).includes(lower(value)))).length;
  if (preserved >= required) return output;

  const preferredKinds: StoryBeat["kind"][] = [
    "encounter", "discovery", "reveal", "action", "escalation", "transformation", "payoff", "reflection",
  ];

  for (const kind of preferredKinds) {
    if (preserved >= required) break;
    const index = output.findIndex((beat) => beat.kind === kind);
    if (index < 0) continue;

    const remainingEvidence = evidence.filter(
      (value) => !output.some((beat) => lower(beat.text).includes(lower(value))),
    );
    if (!remainingEvidence.length) break;

    const before = output[index].text;
    const next = appendPromptEvidence(before, output[index], remainingEvidence);
    if (next === before) continue;

    output[index] = { ...output[index], text: `${sentence(next)}.` };
    const nextPreserved = evidence.filter((value) => output.some((beat) => lower(beat.text).includes(lower(value)))).length;
    if (nextPreserved > preserved) preserved = nextPreserved;
  }

  return output;
}

export { isGenericCompilerProse };
