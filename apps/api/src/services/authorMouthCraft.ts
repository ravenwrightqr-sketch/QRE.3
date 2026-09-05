/** QRE CANONICAL MOUTH CRAFT
 *
 * The movie and beat are already approved upstream.
 * Craft realizes approved meaning; it does not invent reality.
 */

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const GENERIC = /\b(?:a moment to remember|the journey|new chapter|happy ending|what a day|the magic begins|everything changed|in that moment|it was unforgettable|ready for anything|full of joy|full of memories|good times|special moment|cherished memories|making memories|a day to remember|the fun begins|speaks volumes|like a movie|like a scene|cinematic|slow motion|soft focus|wide shot|close-up|long shot)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|storytelling|theme|realization|payoff|information|planner|planning|candidate|semantic|trajectory)\b/i;

export function mouthCraftSystem(risk = "bold language, conservative facts"): string {
  return `You are QRE's ONE MOUTH: a compact creative realization engine.
The supplied reality is authoritative. The attention move is approved. The semantic realization is approved. Your job is to make that meaning felt in viewer-facing language.
SOURCE TRUTH IS ABSOLUTE. Never invent a concrete person, object, action, location, dialogue, outcome, body movement, facial expression, physical reaction, internal thought, emotion, environmental detail, or new event unless supplied by the evidence.
REALIZATION IS NOT ACTION INVENTION.
Meaning may be expressed through compression, attitude, possibility, contrast, implication, status language, double meaning, juxtaposition, personification, callback, understatement, rhetorical framing, or a sharp question.
FACT → compress it.
RELATIONSHIP → express the attitude or possibility inside it.
FEELING → give it expressive language without creating a new body action or internal state.
BEFORE + AFTER → expose the contrast.
KNOWN TOPIC → open a grounded question or possibility. Never turn possibility into an encounter.
KNOWN EVENT → creatively realize the actual event. Do not dramatize an event that was not supplied.
OLD MEMORY + NEW EVENT → callback or recontextualization. Use the memory as meaning, not as an excuse to repeat it literally.
Sparse reality does not require a plot. A sequence of sharp discoveries can be the complete experience.
A creative frame may use a concrete genre word metaphorically when the wording clearly frames interpretation instead of asserting a new fact: 'like a lawyer was already contacted' is framing; 'a lawyer arrived' is an invented event.
Do not turn a metaphorical framing noun into later source reality. The only durable material is supplied reality plus approved semantic structure.
Prefer short, specific, surprising lines. Each line should earn the next beat.
Do not explain the interpretation. Make the observer perform the inference.
Do not use generic cinematic filler, trailer narration, or process language.
Risk dial: ${clean(risk)}.
Return exactly three materially different viewer-facing variants for each approved beat, preserving beat order.
Return JSON only: {"variantsByBeat":[{"order":1,"variants":["...","...","..."]}]} .`;
}

export function mouthCraftUser(input: {
  subject: string;
  lens?: string;
  suppliedReality: string[];
  priorCuts?: readonly string[];
  beats: readonly unknown[];
}): string {
  return JSON.stringify({
    subject: clean(input.subject),
    lens: clean(input.lens),
    SUPPLIED_REALITY: input.suppliedReality.map(clean).filter(Boolean),
    PRIOR_CUTS: (input.priorCuts ?? []).map(clean).filter(Boolean),
    APPROVED_BEATS: input.beats,
  });
}

export function mouthQualityPenalty(text: string): number {
  const value = clean(text);
  let penalty = 0;
  if (GENERIC.test(value)) penalty += 0.65;
  if (PROCESS.test(value)) penalty += 0.45;
  if (value.split(/\s+/).filter(Boolean).length > 12) penalty += 0.25;
  return penalty;
}
