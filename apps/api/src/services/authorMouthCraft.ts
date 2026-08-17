/** QRE MOUTH CRAFT · evidence-first sentence quality */
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const GENERIC = /\b(?:laughter echoes|laughter fills|secrets? (?:are|were) exposed|memories? (?:come|comes) alive|golden hues?|a moment to remember|the journey|new chapter|happy ending|what a day|the magic begins|magic happens|everything changed|the truth is revealed|in that moment|it was unforgettable|ready for anything|full of joy|full of memories|good times|special moment|cherished memories|making memories|a day to remember|the fun begins|silence follows|the room hums|what lies ahead|waiting to be told|speaks volumes|like a movie|like a scene|cinematic|slow motion|soft focus|wide shot|close-up|long shot|under the moonlight|fading light|poodle power|bathhouse|battle|mere formality|turns glory|victory in grooming)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|storytelling|theme|realization|payoff|information|planning|planner)\b/i;
const CONCRETE_ACTION = /\b(?:grabs?|grabbed|holds?|held|wears?|wearing|dances?|dancing|ties?|tied|places?|placed|puts?|put|wraps?|wrapped|walks?|walked|runs?|ran|jumps?|jumped|sits?|sat|stands?|stood|throws?|threw|breaks?|broke|catches?|caught|laughs?|laughed|cries?|cried|wags?|wagged|chews?|chewed|bites?|bit|licks?|licked|cringes?|cringed|stares?|stared|trembles?|trembled)\b/i;
const BODY_OR_REACTION = /\b(?:tail|tails|eye|eyes|ear|ears|mouth|tongue|paw|paws|head|heart|face|smile|smiles|cringe|cringes|fury|tears|wags?|winking|blinks?|blush(?:es|ed)?|shivers?|trembles?|gasps?|stares?)\b/i;
const STATUS_METAPHOR = /\b(?:lawyer|ceo|boss|diva|celebrity|negotiator|negotiation|case|trial|court|verdict|crime|criminal|suspect|evidence|trophy|queen|king|royalty|hostage|rebel|rebellion|legend|star|promotion|resignation|contract|deal|terms|victory|undefeated|upper hand|in charge|calling the shots|made the rules)\b/i;
const COLLAGE = /\b[^.!?]{1,45},\s*[^.!?]{1,45}(?:,\s*[^.!?]{1,45})+\b/;

function sourceTerms(input: { facts: string[]; moments: string[]; memory: string[] }): Set<string> {
  const text = [...input.facts, ...input.moments, ...input.memory].join(" ");
  return new Set(text.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3));
}

function overlap(text: string, terms: Set<string>): number {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3));
  if (!words.size || !terms.size) return 0;
  let hits = 0;
  for (const word of words) if (terms.has(word)) hits += 1;
  return hits / words.size;
}

function groundBeatForMouth(
  beat: Record<string, unknown>,
  evidence: { facts: string[]; moments: string[]; memory: string[] },
): Record<string, unknown> {
  const rawChange = clean(beat.change ?? "");
  const allEvidence = [...evidence.moments, ...evidence.facts, ...evidence.memory].map(clean).filter(Boolean);
  const source = sourceTerms(evidence);

  if (!rawChange || !allEvidence.length) return beat;

  if (CONCRETE_ACTION.test(rawChange)) {
    const candidate = allEvidence
      .map((fact) => ({ fact, score: overlap(rawChange, new Set(fact.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3))) }))
      .sort((a, b) => b.score - a.score)[0];

    const groundedRatio = overlap(rawChange, source);
    if (groundedRatio < 0.45 && candidate?.fact) {
      return {
        ...beat,
        change: candidate.fact,
        frontier: clean(beat.frontier ?? beat.nextNeed ?? ""),
        next: clean(beat.nextNeed ?? ""),
        necessity: clean(beat.necessity ?? "") || "The supplied action changes how the subject is read.",
        groundingRepair: true,
      };
    }
  }

  return beat;
}

export function mouthCraftSystem(risk: string): string {
  return [
    "You are QRE's theatrical mouth and sentence craftsman.",
    "The brain already chose the movie and Beat Graph. Your job is realization, not planning.",
    "Truth is a hard boundary: never invent a concrete person, object, action, location, outcome, dialogue, reaction, body movement, sound, or event.",
    "The upstream beat is a narrative hypothesis. Never treat its invented concrete wording as source evidence.",
    "You may invent phrasing, implication, attitude, metaphor, personification, comic timing, juxtaposition, and fresh relationships between supplied details.",
    "Character interpretation is allowed. Supplied nervous + fierce can become guarded, defiant, lawyer-like, boss-like, diva-like, or similarly status-coded language when used metaphorically. Those are interpretations, not literal events.",
    "The supplied evidence is the material. Mine it. Do not replace it with generic atmosphere.",
    "NEVER turn cinematic into permission to invent lighting, weather, rooms, shadows, sounds, crowds, body reactions, props, camera directions, or off-screen events.",
    "NEVER write trailer narration, poetic atmosphere, or film-direction language. This is a tiny human moment, not a movie trailer.",
    "A concrete noun or physical action must be supported by supplied evidence. A metaphorical status noun may be used when it expresses a grounded contradiction or relationship and is clearly nonliteral.",
    "NATURAL LANGUAGE RULE: write a line a sharp human writer would actually say. Do not concatenate source keywords into a fragment.",
    "Avoid comma-stacked noun lists, adjective lists, fake slogans, headline fragments, and colon-separated keyword piles.",
    "Prefer one clean grammatical thought. A deliberate fragment is allowed only when it has obvious meaning and rhythm, such as 'Peace, temporarily.'",
    "Every line must execute its assigned beat. Never summarize the sequence or restate the beat metadata.",
    "For a turn/reframe/callback/payoff, connect at least two supplied signals whenever the source supports that collision.",
    "For a hook, one sharp supplied detail is enough when it creates immediate character specificity.",
    "Prefer collisions between supplied details, status reversals, callbacks, double meanings, specific verbs, and concrete nouns.",
    "Prefer implication over explanation. Let a small line change the social or emotional reading.",
    "Do not summarize happy, fun, special, memorable, emotional, magical, beautiful, or meaningful. Show it through supplied material.",
    "Do not add stock atmosphere such as laughter, sunset, golden light, silence, secrets, destiny, music, moonlight, shadows, suspense, or tears unless supplied.",
    "Do not explain the joke. Let the reader connect the dots.",
    "Do not repeat the subject unless the name genuinely improves the line.",
    "Do not use generic praise such as 'fabulous', 'amazing', 'perfect', or 'powerful' as a substitute for character-specific writing unless the supplied source itself makes that word materially meaningful.",
    "HARD LIMIT: 7 words. Prefer 3-7 words.",
    `RISK DIAL: ${risk}. Be bold in language, conservative in facts.`,
    "The beat must feel like a frame of a movie, not a description of a movie.",
    "If the source is boring, find the sharpest relationship inside it. Do not manufacture spectacle.",
    "Silently draft several radically different realizations and choose the strongest one. Do not output the alternatives.",
    "Return JSON exactly: {\"texts\":[\"line 1\",\"line 2\",...] }.",
    "Return exactly one line for each approved beat, in order.",
    "NEVER re-plan the movie, create new beats, summarize the sequence, or output a premise. Realize only the approved beats you receive.",
  ].join("\n");
}

export function mouthCraftUser(input: { prompt: string; lens?: string; subject?: string; subjectTruth?: unknown; facts: string[]; moments: string[]; memory: string[]; trajectory: string[]; beats: unknown[] }): string {
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

  const allEvidence = [...input.facts, ...input.moments, ...input.memory].join(" ").toLowerCase();
  const characterRead =
    /\bnervous\b/.test(allEvidence) && /\bfierce\b/.test(allEvidence)
      ? "guarded but defiant; resists looking powerless"
      : /\bmissing\b|\blost\b|\bvanished\b/.test(allEvidence) && /\bpacked\b|\bmoved\b|\bfinished\b/.test(allEvidence)
        ? "apparently complete while carrying an unresolved absence"
        : /\bold\b|\bvintage\b|\binherited\b/.test(allEvidence)
          ? "a custodian of continuity; small details carry identity"
          : "derive character attitude from the strongest supplied contradiction";

  const framePermission = STATUS_METAPHOR.test(allEvidence)
    ? "Status metaphors and double meanings are especially valuable when grounded in the supplied relationship."
    : "Use status metaphor only when it emerges naturally from supplied traits or relationships.";

  return JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    subjectTruth: input.subjectTruth ?? null,
    SUPPLIED_EVIDENCE: evidence,
    PRIVATE_CHARACTER_READ: characterRead,
    FRAME_PERMISSION: framePermission,
    APPROVED_BEATS: beats,
    MOUTH_QUALITY_CONTRACT: {
      maxWords: 7,
      naturalLanguage: true,
      avoidKeywordCollage: true,
      avoidCommaStacking: true,
      avoidHeadlineFragments: true,
      requireBeatExecution: true,
      requireGroundedConcreteLanguage: true,
      preferMultiSignalCollisionForTurns: true,
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
    ],
  });
}

export function mouthQualityPenalty(text: string): number {
  const value = clean(text);
  let penalty = 0;
  if (GENERIC.test(value)) penalty += 0.65;
  if (PROCESS.test(value)) penalty += 0.45;
  if (COLLAGE.test(value)) penalty += 0.3;
  if (BODY_OR_REACTION.test(value)) penalty += 0.15;
  if (value.split(/\s+/).filter(Boolean).length > 7) penalty += 0.25;
  return penalty;
}
