/** QRE MOUTH CRAFT · evidence-first sentence quality */
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const GENERIC = /\b(?:laughter echoes|laughter fills|secrets? (?:are|were) exposed|memories? (?:come|comes) alive|golden hues?|a moment to remember|the journey|new chapter|happy ending|what a day|the magic begins|magic happens|everything changed|the truth is revealed|in that moment|it was unforgettable|ready for anything|full of joy|full of memories|good times|special moment|cherished memories|making memories|a day to remember|the fun begins|silence follows|the room hums|what lies ahead|waiting to be told|speaks volumes|like a movie|like a scene|cinematic|slow motion|soft focus|wide shot|close-up|long shot|under the moonlight|fading light)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|storytelling|theme|realization|payoff|information)\b/i;

export function mouthCraftSystem(risk: string): string {
  return [
    "You are QRE's theatrical mouth and sentence craftsman.",
    "The brain already chose the movie and beat. Make the line specific, alive, authored, and inevitable.",
    "Truth is a hard boundary: never invent a concrete person, object, action, location, outcome, dialogue, or event.",
    "You may invent phrasing, implication, attitude, metaphor, personification, comic timing, juxtaposition, and fresh relationships between supplied details.",
    "The supplied evidence is the material. Mine it. Do not replace it with generic atmosphere.",
    "NEVER turn 'cinematic' into permission to invent lighting, weather, rooms, shadows, sounds, crowds, body reactions, props, camera directions, or off-screen events.",
    "NEVER write trailer narration, poetic atmosphere, or film-direction language. This is a tiny human moment, not a movie trailer.",
    "A concrete noun or physical action must be supported by the supplied evidence or approvedEvidence. When in doubt, cut it.",
    "Silently draft several radically different lines, then choose the strongest.",
    "Prefer collisions between supplied details, status reversals, callbacks, double meanings, specific verbs, and concrete nouns.",
    "Prefer implication over explanation. Let a small line change the social or emotional reading.",
    "Do not summarize happy, fun, special, memorable, emotional, magical, beautiful, or meaningful. Show it through the supplied material.",
    "Do not add stock atmosphere such as laughter, sunset, golden light, silence, secrets, destiny, music, moonlight, shadows, suspense, or tears unless supplied.",
    "Do not explain the joke. Let the reader connect the dots.",
    "Do not repeat the subject unless the name genuinely improves the line.",
    "HARD LIMIT: 7 words. Prefer 3-7 words.",
    `RISK DIAL: ${risk}. Be bold in language, conservative in facts.`,
    "The beat must feel like a frame of a movie, not a description of a movie.",
    "If the source is boring, find the sharpest relationship inside it. Do not manufacture spectacle.",
    "Return JSON exactly: {\"texts\":[\"line 1\",\"line 2\",...]}.",
    "Return exactly one line for each approved beat, in order.",
    "NEVER re-plan the movie, create new beats, summarize the sequence, or output a premise. Realize only the approved beats you receive.",
  ].join("\n");
}

export function mouthCraftUser(input: { prompt: string; lens?: string; subject?: string; subjectTruth?: unknown; facts: string[]; moments: string[]; memory: string[]; trajectory: string[]; beats: unknown[] }): string {
  return JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    subjectTruth: input.subjectTruth ?? null,
    SUPPLIED_EVIDENCE: { facts: input.facts, moments: input.moments, memory: input.memory, trajectory: input.trajectory },
    APPROVED_BEATS: input.beats,
    forbiddenStyleSignals: ["generic cinematic filler", "invented outcomes", "invented concrete details", "abstract emotional summary", "process language", "new story planning", "trailer narration", "film-direction language"],
  });
}

export function mouthQualityPenalty(text: string): number {
  const value = clean(text);
  let penalty = 0;
  if (GENERIC.test(value)) penalty += 0.65;
  if (PROCESS.test(value)) penalty += 0.45;
  if (value.split(/\s+/).length > 7) penalty += 0.25;
  return penalty;
}
