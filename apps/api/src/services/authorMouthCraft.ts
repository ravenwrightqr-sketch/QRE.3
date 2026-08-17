/**
 * QRE MOUTH CRAFT · CANONICAL
 *
 * The Mouth is a realization layer, not a planning layer.
 * It receives an approved Beat Graph plus source evidence and turns that
 * selected meaning into short viewer-facing language.
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const GENERIC = /\b(?:laughter echoes|laughter fills|secrets? (?:are|were) exposed|memories? (?:come|comes) alive|golden hues?|a moment to remember|the journey|new chapter|happy ending|what a day|the magic begins|magic happens|everything changed|the truth is revealed|in that moment|it was unforgettable|ready for anything|full of joy|full of memories|good times|special moment|cherished memories|making memories|a day to remember|the fun begins|silence follows|the room hums|what lies ahead|waiting to be told|speaks volumes|like a movie|like a scene|cinematic|slow motion|soft focus|wide shot|close-up|long shot|under the moonlight|fading light|poodle power|bathhouse|battle|mere formality|turns glory|victory in grooming|keyword collage|receipt fragment)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|storytelling|theme|realization|payoff|information|planning|planner|authoring|writing process)\b/i;
const CONCRETE_ACTION = /\b(?:grabs?|grabbed|holds?|held|wears?|wearing|dances?|dancing|ties?|tied|places?|placed|puts?|put|wraps?|wrapped|walks?|walked|runs?|ran|jumps?|jumped|sits?|sat|stands?|stood|throws?|threw|breaks?|broke|catches?|caught|laughs?|laughed|cries?|cried|wags?|wagged|chews?|chewed|bites?|bit|licks?|licked|cringes?|cringed|stares?|stared|trembles?|trembled)\b/i;
const BODY_OR_REACTION = /\b(?:tail|tails|eye|eyes|ear|ears|mouth|tongue|paw|paws|head|heart|face|smile|smiles|cringe|cringes|fury|tears|wags?|winking|blinks?|blush(?:es|ed)?|shivers?|trembles?|gasps?|stares?)\b/i;
const STATUS_METAPHOR = /\b(?:lawyer|ceo|boss|diva|celebrity|negotiator|negotiation|case|trial|court|verdict|crime|criminal|suspect|evidence|trophy|queen|king|royalty|hostage|rebel|rebellion|legend|star|promotion|resignation|contract|deal|terms|victory|undefeated|upper hand|in charge|calling the shots|made the rules)\b/i;
const COLLAGE = /\b[^.!?]{1,45},\s*[^.!?]{1,45}(?:,\s*[^.!?]{1,45})+\b/;
const LABEL = /^(?:the contrast|the unexpected|the transformation|the mystery|the payoff|the reframe|the reveal|the twist|the journey|the answer|the joke|the punchline)$/i;

function sourceTerms(input: { facts: string[]; moments: string[]; memory: string[] }): Set<string> {
  const text = [...input.facts, ...input.moments, ...input.memory].join(" ");
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 3),
  );
}

function overlap(text: string, terms: Set<string>): number {
  const words = new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 3),
  );
  if (!words.size || !terms.size) return 0;

  let hits = 0;
  for (const word of words) {
    if (terms.has(word)) hits += 1;
  }
  return hits / words.size;
}

function normalizeTokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 3),
  );
}

function similarity(a: string, b: string): number {
  const left = normalizeTokens(a);
  const right = normalizeTokens(b);
  if (!left.size || !right.size) return 0;

  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }

  return shared / Math.max(1, Math.min(left.size, right.size));
}

function deriveBeatJob(beat: Record<string, unknown>): string {
  const attention = clean(beat.attentionFunction).toLowerCase();
  switch (attention) {
    case "hook":
      return "establish the sharpest specific tension or character detail";
    case "question":
      return "preserve an earned unresolved want without asking the viewer literally";
    case "turn":
    case "reframe":
      return "change the meaning of something already established";
    case "escalation":
      return "increase consequence, pressure, status tension, or uncertainty";
    case "callback":
      return "reuse an earlier supplied detail with changed meaning";
    case "payoff":
      return "land the meaning the earlier beats earned";
    case "release":
      return "let pressure resolve without summarizing the experience";
    default:
      return "express the selected beat as a concrete, character-specific shift";
  }
}

function groundingAnchors(
  beat: Record<string, unknown>,
  evidence: { facts: string[]; moments: string[]; memory: string[] },
): string[] {
  const labels = [
    ...(Array.isArray(beat.setsUp) ? beat.setsUp.map(clean) : []),
    ...(Array.isArray(beat.paysOff) ? beat.paysOff.map(clean) : []),
  ].filter(Boolean);

  const allEvidence = [
    ...evidence.moments,
    ...evidence.facts,
    ...evidence.memory,
  ].map(clean).filter(Boolean);

  const ranked = allEvidence
    .map((fact) => ({
      fact,
      score: labels.reduce(
        (best, label) => Math.max(best, similarity(fact, label)),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.fact);

  return [...new Set([...labels, ...ranked])].slice(0, 8);
}

function groundBeatForMouth(
  beat: Record<string, unknown>,
  evidence: { facts: string[]; moments: string[]; memory: string[] },
): Record<string, unknown> {
  const rawChange = clean(beat.change);
  if (!rawChange) return beat;

  const anchors = groundingAnchors(beat, evidence);
  const source = sourceTerms(evidence);
  const directSourceOverlap = overlap(rawChange, source);
  const restatesAnchor = anchors.some(
    (anchor) => similarity(rawChange, anchor) >= 0.82,
  );

  return {
    ...beat,
    sourceAnchors: anchors,
    beatJob: deriveBeatJob(beat),
    noRawBeatRestatement: true,
    sourceGrounding: {
      directSourceOverlap: Number(directSourceOverlap.toFixed(3)),
      restatesAnchor,
    },
    realizationDirective:
      restatesAnchor || directSourceOverlap >= 0.8
        ? "Do not reuse the planner change as the sentence skeleton; change its meaning through character, relationship, status, or consequence."
        : "Use the planner change as intent, then realize it in fresh natural language.",
  };
}

export function mouthCraftSystem(risk: string): string {
  return [
    "You are QRE's theatrical mouth and sentence craftsman.",
    "The brain already chose the movie and Beat Graph. Your job is realization, not planning.",
    "Truth is a hard boundary: never invent a concrete person, object, action, location, outcome, dialogue, reaction, body movement, sound, or event.",
    "The upstream beat is a narrative hypothesis, not source evidence. Preserve its meaning but do not copy its wording as if it were the finished line.",
    "The supplied evidence is the material. Mine it. Do not replace it with generic atmosphere.",
    "Character interpretation is allowed when it is recoverable from supplied traits, contradictions, relationships, objects, or status posture.",
    "Status language, metaphor, personification, double meaning, understatement, reversal, recontextualization, implication, callback, and character-specific absurdity are allowed as interpretation, not as literal new events.",
    "A metaphorical frame is never permission to introduce the literal event implied by the frame.",
    "NATURAL LANGUAGE RULE: write a line a sharp human writer would actually say. Do not concatenate source keywords into a fragment.",
    "Avoid comma-stacked noun lists, adjective lists, fake slogans, headline fragments, and colon-separated keyword piles.",
    "Prefer one clean grammatical thought. A deliberate fragment is allowed only when it has clear meaning and rhythm.",
    "Every line must execute its assigned Beat Graph job. Never summarize the sequence or repeat beat metadata.",
    "For turn, reframe, callback, and payoff beats, create a genuine relationship between at least two supplied signals when the source supports that collision.",
    "For a hook, one sharp supplied detail can carry the line when it establishes character tension.",
    "Do not merely paraphrase the planner change. The Mouth's value is changing the meaning, pressure, status, or emotional reading of supplied reality.",
    "Do not use generic praise such as fabulous, amazing, perfect, powerful, magical, special, memorable, journey, transformation, or cinematic unless the exact supplied source makes the word materially meaningful.",
    "Do not add atmosphere, setting, body reactions, or sensory details unless supplied.",
    "Do not explain the joke, emotion, theme, or meaning. Let the interpretation carry itself.",
    "Do not repeat the subject name unless it genuinely improves the line.",
    "HARD LIMIT: 7 words. Prefer 3-7 words.",
    `RISK DIAL: ${risk}. Be bold in language, conservative in facts.`,
    "Silently draft several radically different realizations and choose the strongest one. Never output alternatives.",
    "The result should feel discovered, not generated from a receipt template.",
    "Return JSON exactly: {\"texts\":[\"line 1\",\"line 2\",...] }.",
    "Return exactly one line for each approved beat, in order.",
    "NEVER re-plan the movie, create new beats, summarize the sequence, or output a premise.",
  ].join("\n");
}

export function mouthCraftUser(input: {
  prompt: string;
  lens?: string;
  subject?: string;
  subjectTruth?: unknown;
  facts: string[];
  moments: string[];
  memory: string[];
  trajectory: string[];
  beats: unknown[];
}): string {
  const evidence = {
    facts: input.facts,
    moments: input.moments,
    memory: input.memory,
  };

  const beats = Array.isArray(input.beats)
    ? input.beats.map((beat) =>
        beat && typeof beat === "object"
          ? groundBeatForMouth(beat as Record<string, unknown>, evidence)
          : beat,
      )
    : [];

  return JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    subjectTruth: input.subjectTruth ?? null,
    SUPPLIED_EVIDENCE: evidence,
    APPROVED_BEATS: beats,
    MOUTH_QUALITY_CONTRACT: {
      maxWords: 7,
      naturalLanguage: true,
      noRawBeatRestatement: true,
      avoidKeywordCollage: true,
      avoidCommaStacking: true,
      avoidHeadlineFragments: true,
      requireBeatExecution: true,
      requireGroundedConcreteLanguage: true,
      preferMultiSignalCollisionForTurns: true,
      preferChangedMeaningOverParaphrase: true,
    },
    forbiddenStyleSignals: [
      "generic cinematic filler",
      "invented outcomes",
      "invented concrete details",
      "unsupported body reactions",
      "abstract emotional summary",
      "process language",
      "new story planning",
      "trailer narration",
      "film-direction language",
      "literalized metaphorical frame",
      "keyword collage",
      "headline fragment",
      "planner paraphrase",
      "fact receipt",
    ],
  });
}

export function mouthQualityPenalty(text: string): number {
  const value = clean(text);
  let penalty = 0;
  if (GENERIC.test(value)) penalty += 0.65;
  if (PROCESS.test(value)) penalty += 0.45;
  if (COLLAGE.test(value)) penalty += 0.3;
  if (LABEL.test(value)) penalty += 0.3;
  if (BODY_OR_REACTION.test(value)) penalty += 0.15;
  if (value.split(/\s+/).filter(Boolean).length > 7) penalty += 0.25;
  if (CONCRETE_ACTION.test(value) && !STATUS_METAPHOR.test(value)) penalty += 0.05;
  return penalty;
}
