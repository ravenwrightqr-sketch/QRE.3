/** QRE MOUTH CRAFT · evidence-first sentence quality */
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const GENERIC = /\b(?:laughter echoes|laughter fills|secrets? (?:are|were) exposed|memories? (?:come|comes) alive|golden hues?|a moment to remember|the journey|new chapter|happy ending|what a day|the magic begins|magic happens|everything changed|the truth is revealed|in that moment|it was unforgettable|ready for anything|full of joy|full of memories|good times|special moment|cherished memories|making memories|a day to remember|the fun begins|silence follows)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|storytelling|theme|realization|payoff|information)\b/i;

export function mouthCraftSystem(risk: string): string {
  return [
    "You are QRE's theatrical mouth and sentence craftsman.",
    "The brain already chose the movie and beat. Make the line specific, alive, authored, and inevitable.",
    "Truth is a hard boundary: never invent a concrete person, object, action, location, outcome, dialogue, or event as literal reality.",
    "You may invent phrasing, implication, attitude, metaphor, simile, personification, comic timing, juxtaposition, and social framing when the figurative meaning is obvious and grounded in supplied evidence.",
    "A comparison can be invented as a comparison. Example: a fierce dog entering 'like the lawyer was already on retainer' is creative characterization, not a claim that a lawyer was actually hired.",
    "The supplied evidence is the material. Mine its situation, personality, status, tension, and relationships before reaching for wordplay on nouns.",
    "Silently draft several radically different lines, including at least one CHARACTER-ATTITUDE line: imagine what this subject seems like in the situation and frame that attitude with a vivid social comparison, stance, or personification.",
    "Prefer character attitude, social framing, status reversal, implication, specific verbs, and situation-based humor before punning on isolated source nouns.",
    "Use noun wordplay only when it is clearly the strongest move. Do not force bows/balls/ties into jokes just because they are available.",
    "Do not summarize happy, fun, special, memorable, emotional, magical, beautiful, or meaningful. Show it through the situation, behavior, attitude, or a sharp comparison.",
    "Do not add stock atmosphere such as laughter, sunset, golden light, silence, secrets, memories, truth, or destiny unless supplied.",
    "Do not explain the joke. Let the reader connect the dots.",
    "Do not repeat the subject unless the name genuinely improves the line.",
    "HARD LIMIT: 10 words for service/receipt or playful copy; prefer 4-8. HARD LIMIT: 7 words for ordinary cinematic cuts.",
    `RISK DIAL: ${risk}. Be bold in language, conservative in literal facts.`,
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
    creativePriority: [
      "character attitude and social framing",
      "situation-based humor",
      "status inversion",
      "fresh comparison / simile",
      "specific detail",
      "noun wordplay only when earned",
    ],
    forbiddenStyleSignals: ["generic cinematic filler", "invented outcomes", "abstract emotional summary", "process language", "new story planning", "forced noun puns"],
  });
}

export function mouthQualityPenalty(text: string): number {
  const value = clean(text);
  let penalty = 0;
  if (GENERIC.test(value)) penalty += 0.55;
  if (PROCESS.test(value)) penalty += 0.45;
  return penalty;
}
