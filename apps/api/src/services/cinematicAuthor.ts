import { localModelGenerate } from "./localModelRuntime.js";

export type CinematicAuthorInput = {
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  sourceMoments: string[];
  facts: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  trajectory?: string[];
};

export type AuthoredScene = {
  text: string;
  kind?: string;
  durationHintMs?: number;
  transitionHint?: "none" | "fade" | "slide" | "zoom" | "cinematic" | "flash";
  audioMood?: string;
  visualHint?: string;
};

type CreativeIntent =
  | "memory" | "promotion" | "service" | "creator" | "social" | "artist"
  | "person" | "event" | "artifact" | "story" | "unknown";

type AuthorMode = "concept" | "grounded" | "living_memory" | "service" | "voice_first";

type WorldState = {
  mode: AuthorMode;
  timeOfDay?: "dawn" | "morning" | "afternoon" | "evening" | "night" | "unknown";
  date?: string;
  time?: string;
  place?: string;
  season?: "spring" | "summer" | "autumn" | "winter" | "unknown";
  suppliedDetails: string[];
  creativeAffordances: string[];
  hardConstraints: string[];
};

type CreativeDirection = {
  intent: CreativeIntent;
  mode: AuthorMode;
  attentionGoal: string;
  emotionalEngine: string;
  strongestDetail: string;
  hiddenPremise: string;
  sequenceShape: string[];
  beatRhythm: string[];
  beatCount: number;
  endingMove: string;
  targetDensity: "compact" | "standard" | "deep" | "expansive";
  selectedOperators: string[];
  creativeAffordances: string[];
  hardConstraints: string[];
};

type SceneDraft = { scenes: AuthoredScene[] };
type Critique = {
  score: number;
  problems: string[];
  repeats: string[];
  instructionLeaks: string[];
  unsupportedDetails: string[];
  weakScenes: number[];
  genericLanguage?: string[];
  weakTransitions?: string[];
};

const OPERATORS = [
  "sensory_hook", "physical_move", "personification", "understatement", "contrast",
  "micro_reveal", "reversal", "escalation", "status_inversion", "zoom_into_detail",
  "callback", "tender_turn", "comic_turn", "mystery_turn", "transformation",
  "afterglow", "voice", "signature",
];

const GENERIC_PATTERNS = [
  /picture-perfect/i, /luxury grooming/i, /unforgettable experience/i,
  /beautiful transformation/i, /magical moment/i, /amazing transformation/i,
  /as we move/i, /a transformation begins/i, /the experience unfolds/i,
  /the final reveal/i, /level up/i, /incredible journey/i,
  /still here/i, /something changes/i, /then it shifts/i, /see you next time/i,
];

const META_PATTERN = /\b(ai|qre|prompt|compiler|cognition|metadata|model|writing process|instruction)\b/i;

function enabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniq(values: unknown[], limit: number): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, limit);
}

function parseJson<T>(text: string): T | null {
  const cleaned = String(text ?? "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned) as T; } catch { return null; }
}

function genericHits(text: string): number {
  return GENERIC_PATTERNS.filter((pattern) => pattern.test(text)).length;
}

function inferIntent(input: CinematicAuthorInput): CreativeIntent {
  const value = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  const has = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(value));
  if (has(/\bservice|client|customer|groom|grooming|clean|cleaning|repair|repaired|barber|salon|plumber|mechanic|tattoo|restaurant\b/)) return "service";
  if (has(/\bpromo|promotion|commercial|advert|marketing|sell|selling|business|brand\b/)) return "promotion";
  if (has(/\bcreator|content creator|influencer|youtube|tiktok|reels|shorts|personal brand\b/)) return "creator";
  if (has(/\bsocial|instagram|facebook|threads|post|caption|feed|followers\b/)) return "social";
  if (has(/\bartist|artwork|painting|sculpture|musician|music|song|album|photographer|illustrator|designer|gallery|studio\b/)) return "artist";
  if (has(/\babout me|about myself|my life|my story|my identity|portrait|bio\b/)) return "person";
  if (has(/\bwedding|anniversary|honeymoon|memorial|birthday|family memory|remember|memory\b/)) return "memory";
  if (has(/\bevent|party|festival|ceremony|reunion|conference|opening|show\b/)) return "event";
  if (has(/\bartifact|object|piece|plaque|keychain|sticker|tag|installation|physical art|qr art\b/)) return "artifact";
  if (has(/\bstory|tale|scene|movie|film|fiction|horror|romance\b/)) return "story";
  return "unknown";
}

function inferMode(input: CinematicAuthorInput, intent: CreativeIntent): AuthorMode {
  const evidence = input.facts.length + input.sourceMoments.length + (input.memoryContext?.length ?? 0);
  if (intent === "service") return evidence > 0 ? "service" : "concept";
  if (intent === "memory" || intent === "event") return evidence > 0 ? "living_memory" : "concept";
  if (intent === "creator" || intent === "social" || intent === "artist" || intent === "person") return evidence > 0 ? "grounded" : "voice_first";
  if (intent === "artifact") return evidence > 0 ? "grounded" : "concept";
  return evidence > 0 ? "grounded" : "concept";
}

function inferTimeOfDay(text: string): WorldState["timeOfDay"] {
  const value = text.toLowerCase();
  if (/\b(12|1|2|3|4|5)\s*(am|a\.m\.)\b/.test(value)) return "night";
  if (/\b(6|7|8|9|10|11)\s*(am|a\.m\.)\b/.test(value)) return "morning";
  if (/\b(12|1|2|3|4|5)\s*(pm|p\.m\.)\b/.test(value)) return "afternoon";
  if (/\b(6|7|8|9|10|11)\s*(pm|p\.m\.)\b/.test(value)) return "night";
  if (/\bdawn|sunrise\b/.test(value)) return "dawn";
  if (/\bevening|sunset|dusk\b/.test(value)) return "evening";
  return "unknown";
}

function inferSeason(text: string): WorldState["season"] {
  const value = text.toLowerCase();
  if (/\bjan(?:uary)?|feb(?:ruary)?|dec(?:ember)?\b/.test(value)) return "winter";
  if (/\bmar(?:ch)?|apr(?:il)?|may\b/.test(value)) return "spring";
  if (/\bjun(?:e)?|jul(?:y)?|aug(?:ust)?\b/.test(value)) return "summer";
  if (/\bsep(?:tember)?|oct(?:ober)?|nov(?:ember)?\b/.test(value)) return "autumn";
  return "unknown";
}

function deriveAffordances(input: CinematicAuthorInput, state: WorldState, intent: CreativeIntent): string[] {
  const all = [...state.suppliedDetails, input.prompt, input.lens ?? "", input.place ?? ""].join(" ").toLowerCase();
  const affordances: string[] = [];
  if (state.timeOfDay === "night") affordances.push("night air, darkness, reflected light, shoreline lights, quieter surroundings");
  if (state.timeOfDay === "morning" || state.timeOfDay === "dawn") affordances.push("early light, waking atmosphere, first movement, fresh start");
  if (state.timeOfDay === "afternoon") affordances.push("bright light, active surroundings, visible detail, heat");
  if (state.timeOfDay === "evening") affordances.push("fading light, shadows, transition, lights coming on");
  if (/\bbeach|shore|ocean|sea|coast|water\b/.test(all)) affordances.push("tide, shoreline, water reflection, wind, horizon, distance, sound of water");
  if (/\bhome|house|room|kitchen|bathroom|living room\b/.test(all)) affordances.push("rooms as characters, traces of activity, objects out of place, before/after contrast");
  if (intent === "service") affordances.push("client personality, ritual, small detail, before/after, playful status shift");
  if (intent === "memory" || intent === "event") affordances.push("presence, recurrence, meaningful detail, shared meaning, after-image");
  if (intent === "creator" || intent === "social") affordances.push("voice, contradiction, obsession, point of view, audience tension, pattern break");
  if (intent === "artist") affordances.push("material, texture, signature, visual language, point of view, implied world");
  if (intent === "person") affordances.push("habit, contradiction, desire, private detail, relationship, small truth");
  if (intent === "artifact") affordances.push("surface detail, touch, ownership, mystery, portal, hidden meaning");
  return [...new Set(affordances)].slice(0, 12);
}

function buildWorldState(input: CinematicAuthorInput, intent: CreativeIntent): WorldState {
  const details = uniq([...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), input.subject ?? "", input.place ?? ""], 60);
  const combined = [...details, input.prompt].join(" ");
  const mode = inferMode(input, intent);
  const timeOfDay = inferTimeOfDay(combined);
  const season = inferSeason(combined);
  const hardConstraints: string[] = [];
  if (timeOfDay !== "unknown") hardConstraints.push(`time_of_day=${timeOfDay}; this is a hard visual constraint`);
  if (season !== "unknown") hardConstraints.push(`season=${season}; this is a hard constraint`);
  if (input.place) hardConstraints.push(`place=${clean(input.place)}; do not relocate`);
  if (input.subject) hardConstraints.push(`subject=${clean(input.subject)}; the subject is the star; do not replace identity`);
  if (mode !== "concept") hardConstraints.push("do not invent concrete events, people, dates, locations, achievements, outcomes, or physical actions as facts");
  const world: WorldState = {
    mode,
    timeOfDay,
    season,
    date: details.find((item) => /\b20\d{2}\b/.test(item)),
    time: details.find((item) => /\b\d{1,2}:\d{2}\s*(?:am|pm|a\.m\.|p\.m\.)\b/i.test(item)),
    place: input.place || details.find((item) => /\b(?:CA|California|NY|New York|Beach|Shore|Street|Ave|Road|Hotel|Gallery|Studio)\b/i.test(item)),
    suppliedDetails: details,
    creativeAffordances: [],
    hardConstraints,
  };
  world.creativeAffordances = deriveAffordances(input, world, intent);
  return world;
}

function fallbackDirection(input: CinematicAuthorInput, intent: CreativeIntent, world: WorldState): CreativeDirection {
  const selectedOperators = intent === "service"
    ? ["sensory_hook", "personification", "status_inversion", "comic_turn", "micro_reveal", "transformation", "afterglow"]
    : intent === "creator" || intent === "social" || intent === "artist"
      ? ["sensory_hook", "voice", "zoom_into_detail", "micro_reveal", "contrast", "signature", "afterglow"]
      : intent === "memory" || intent === "event"
        ? ["sensory_hook", "zoom_into_detail", "micro_reveal", "callback", "tender_turn", "reversal", "afterglow"]
        : intent === "artifact"
          ? ["sensory_hook", "zoom_into_detail", "personification", "micro_reveal", "mystery_turn", "afterglow"]
          : ["sensory_hook", "physical_move", "micro_reveal", "contrast", "reversal", "transformation", "afterglow"];
  const beatCount = world.mode === "living_memory" ? 4 : 5;
  const beatRhythm = beatCount === 4 ? ["jolt", "jolt", "turn", "payoff"] : ["jolt", "jolt", "jolt", "turn", "payoff"];
  return {
    intent,
    mode: world.mode,
    attentionGoal: "make the viewer want the next cut, not merely understand the previous sentence",
    emotionalEngine: input.lens || (intent === "service" ? "personality, contrast, transformation" : "curiosity, personality, contrast"),
    strongestDetail: input.facts[0] || input.sourceMoments[0] || "the prompt's most distinctive idea",
    hiddenPremise: "Find the latent movie already present in the real material: a relationship, tension, contradiction, game, mystery, transformation, or recurring character trait.",
    sequenceShape: ["jolt", "jolt", "turn", "payoff"],
    beatRhythm,
    beatCount,
    endingMove: "finish on an earned payoff, reversal, callback, transformation, realization, or after-image",
    targetDensity: world.mode === "living_memory" || intent === "person" ? "deep" : "compact",
    selectedOperators,
    creativeAffordances: world.creativeAffordances,
    hardConstraints: world.hardConstraints,
  };
}

async function planDirection(input: CinematicAuthorInput, fallback: CreativeDirection, world: WorldState): Promise<CreativeDirection> {
  if (!enabled()) return fallback;
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's senior creative director and cognitive planner.",
          "Do not draft prose or scenes. Design the movie before the mouth speaks.",
          "The subject/object/place is the STAR. Find what is uniquely watchable about THIS thing in THIS world.",
          "CREATIVE COMPETITION IS REQUIRED: privately generate several genuinely different interpretations before selecting one champion. They must differ in what the memory means, not merely in wording.",
          "Compete across character comedy, contradiction, status inversion, tenderness, ritual, identity, mystery, escalation, understatement, transformation, sensory immersion, and unexpected callback where evidence supports them.",
          "ATTACK THE CANDIDATES: reject anything generic, already overused in memoryContext/creativeLearningContext, unsupported by evidence, visually weak, predictable, explanatory, or too thin to justify the requested cuts.",
          "The champion must identify an actual creative problem: ANGLE, CONTRADICTION/TENSION, MOVEMENT, PAYOFF, and WHAT NOT TO REPEAT.",
          "If prior chapters exist, treat their used motifs and jokes as creative history. Prefer evolution, subversion, or a new facet over replaying the same joke.",
          "Hunt contradictions, callbacks, recurring traits, status inversions, small details with large meaning, and unresolved tension.",
          "The output is a FAST-CUT sequence: each beat is a separate screen-sized thought, like a film cut or musical beat.",
          "A beat is not defined by having an action verb. A fact, image, recognition, interruption, reversal, or tiny line can be a beat if it changes the next cut.",
          "Do not force a fixed five-part template. Choose 4–6 beats based on material density and attention potential.",
          "Reality is hard outside concept mode. Time and place are authoritative. Never contradict them.",
          "Sparse inputs must remain sparse in factual claims. Do not fabricate biography. Use point of view, tension, object personality, or concept-level invention where appropriate.",
          "Return strict JSON: intent, mode, attentionGoal, emotionalEngine, strongestDetail, hiddenPremise, sequenceShape, beatRhythm, beatCount, endingMove, targetDensity, selectedOperators.",
          "Pack the champion's ANGLE, CONTRADICTION, MOVEMENT, PAYOFF, and anti-repeat decision into hiddenPremise/attentionGoal/emotionalEngine/sequenceShape/endingMove. Do not output candidate prose.",
          `OPERATORS: ${OPERATORS.join(", ")}`,
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "",
          facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24),
          memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30),
          trajectory: uniq(input.trajectory ?? [], 20), world, fallback,
        }),
      },
    ], "json");
    const parsed = parseJson<Partial<CreativeDirection>>(result.text);
    if (!parsed?.sequenceShape?.length || !parsed.attentionGoal) return fallback;
    const operators = Array.isArray(parsed.selectedOperators)
      ? parsed.selectedOperators.filter((value) => OPERATORS.includes(String(value))).slice(0, 7) : [];
    const beatCount = Math.max(4, Math.min(6, Number(parsed.beatCount) || fallback.beatCount));
    const beatRhythm = Array.isArray(parsed.beatRhythm) && parsed.beatRhythm.length
      ? parsed.beatRhythm.map(clean).filter(Boolean).slice(0, 6) : fallback.beatRhythm;
    return {
      ...fallback, ...parsed, mode: world.mode, beatCount, beatRhythm,
      sequenceShape: parsed.sequenceShape.map(clean).filter(Boolean).slice(0, 6),
      selectedOperators: operators.length ? operators : fallback.selectedOperators,
      creativeAffordances: world.creativeAffordances, hardConstraints: world.hardConstraints,
    };
  } catch { return fallback; }
}

function promptEcho(text: string, prompt: string): boolean {
  const a = clean(text).toLowerCase(); const b = clean(prompt).toLowerCase();
  return a === b || (a.length > 30 && b.includes(a));
}

function forbiddenRealityTerms(world: WorldState): RegExp[] {
  if (world.timeOfDay === "night") return [
    /\bsunrise\b/i, /\bdawn\b/i, /\bdaylight\b/i, /\bmorning\b/i, /\bgolden hour\b/i,
    /\bsun (?:rises|rose|is up|hangs|shines|shining)\b/i, /\bsunlight\b/i,
  ];
  if (world.timeOfDay === "morning" || world.timeOfDay === "dawn") return [/\bmidnight\b/i, /\b2\s*am\b/i, /\b3\s*am\b/i, /\b4\s*am\b/i];
  if (world.timeOfDay === "afternoon") return [/\bmidnight\b/i, /\bdawn\b/i, /\bsunrise\b/i];
  return [];
}

function finalize(raw: AuthoredScene[], world: WorldState): AuthoredScene[] {
  const out: AuthoredScene[] = [];
  for (const scene of raw) {
    const text = clean(scene?.text).replace(/^(?:hook|jolt|turn|payoff|afterglow|movement|discovery)\s*[:|-]\s*/i, "");
    if (!text) continue;
    const words = text.split(/\s+/).filter(Boolean);
    const short = words.length <= 18 ? text : words.slice(0, 18).join(" ").replace(/[,:;—-]+$/g, "");
    if (short && !META_PATTERN.test(short)) out.push({ ...scene, text: short });
  }
  const fast = out.slice(0, 6);
  return fast.map((scene, index, all) => ({
    ...scene,
    kind: scene.kind || ["hook", "movement", "discovery", "turn", "payoff", "afterglow"][Math.min(index, 5)],
    durationHintMs: scene.durationHintMs ?? Math.max(700, Math.min(2200, 700 + scene.text.split(/\s+/).length * 95)),
    transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "flash" : "fade"),
  }));
}

function fitBeatCount(scenes: AuthoredScene[], target: number): AuthoredScene[] {
  if (scenes.length <= target) return scenes;
  if (target >= 6) return scenes.slice(0, target);
  const ranked = scenes.map((scene, index) => ({ scene, index, generic: genericHits(scene.text), words: scene.text.split(/\s+/).length }));
  const keep = ranked
    .sort((a, b) => (a.generic - b.generic) || (a.index === 0 ? -1 : b.index === 0 ? 1 : a.index - b.index))
    .slice(0, target)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.scene);
  return keep;
}

function localGate(scenes: AuthoredScene[], world: WorldState): boolean {
  if (scenes.length < 3 || scenes.length > 6) return false;
  const forbidden = forbiddenRealityTerms(world);
  const seen = new Set<string>();
  for (const scene of scenes) {
    const words = scene.text.split(/\s+/).filter(Boolean);
    if (words.length > 18 || genericHits(scene.text) > 0 || forbidden.some((pattern) => pattern.test(scene.text))) return false;
    const key = scene.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

async function draft(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState): Promise<AuthoredScene[]> {
  const max = Math.max(4, Math.min(6, direction.beatCount || 5));
  const modeInstruction = world.mode === "concept"
    ? "CONCEPT: invent cinematic imagery freely, but never invent factual business claims or real-world assertions."
    : world.mode === "voice_first"
      ? "VOICE-FIRST: build from aspiration, contradiction, desire, obsession, voice and point of view; invent no biography."
      : "GROUNDED: supplied details define reality. Creative language is allowed; invented concrete events are not.";
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's elite cinematic sequence author.",
        `Write EXACTLY ${max} viewer-facing beats.`,
        "THE OBJECT/PERSON/PLACE IS THE STAR. Film it. Do not write an essay about it.",
        "ONE JSON SCENE ITEM = ONE FAST CUT = ONE SCREEN-SIZED THOUGHT.",
        "Prefer 3–12 words. Never exceed 18 words.",
        "A beat can be an image, fact, recognition, interruption, joke, movement, reversal, callback, or payoff. It does NOT need an action verb.",
        "Every adjacent pair must create a reason for the next cut. Do not merely list facts in chronological order.",
        "Compose rhythm, not paragraphs. Think music video / film editing: JOLT → JOLT → TURN → PAYOFF, or a better rhythm justified by the material.",
        "Cuts are fast. Let very short beats be very short.",
        "Use supplied exact timestamps when they matter; never replace an explicit time with a contradictory atmosphere.",
        "Never invent a concrete event, person, location, action, outcome, weather condition, or relationship in grounded/living_memory/service modes.",
        "Never label beats for the viewer. No 'Jolt:', 'Turn:', etc.",
        "No generic filler, no decorative cinematic clichés, no explanation of the joke or emotion.",
        "Do not turn a paragraph into five line breaks. Each beat must have a distinct dramatic job: setup, pressure, reveal, turn, consequence, or payoff.",
        "A static fact is acceptable only when its placement changes what the viewer expects next. Otherwise transform the fact into a relationship, contrast, implication, or consequence.",
        modeInstruction,
        `CHAMPION ANGLE / HIDDEN MOVIE: ${direction.hiddenPremise}`,
        `ATTENTION GOAL: ${direction.attentionGoal}`,
        `EMOTIONAL ENGINE: ${direction.emotionalEngine}`,
        `BEAT RHYTHM: ${direction.beatRhythm.join(" → ")}`,
        `SEQUENCE JOBS: ${direction.sequenceShape.join(" → ")}`,
        `AFFORDANCES: ${world.creativeAffordances.join(" | ")}`,
        `HARD CONSTRAINTS: ${world.hardConstraints.join(" | ")}`,
        `OPERATORS: ${direction.selectedOperators.join(", ")}`,
        `ENDING: ${direction.endingMove}`,
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "",
        facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24),
        memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30),
        trajectory: uniq(input.trajectory ?? [], 20), world,
      }),
    },
  ], "json");
  const parsed = parseJson<SceneDraft>(result.text);
  const raw = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalize(raw.map((scene) => ({ text: clean(scene?.text), kind: clean(scene?.kind) || "movement" }))
    .filter((scene) => scene.text && !META_PATTERN.test(scene.text) && !promptEcho(scene.text, input.prompt)), world).slice(0, max);
}

async function critique(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState, scenes: AuthoredScene[]): Promise<Critique | null> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's ruthless cinematic editor.",
          "Judge this as a FAST-CUT FILM, not prose.",
          "Ask: Is the subject the star? Does each cut earn its place? Does each adjacent beat create forward pull? Is the rhythm alive? Is the payoff earned?",
          "Also judge visuality, specificity, novelty, generic language, repetition, and reality integrity.",
          "A noun or fact can be a valid beat if its placement changes the sequence. Do not demand action verbs.",
          "Detect PARAGRAPH CHOPPING: if the beats are merely chronological fragments of one sentence-shaped summary, flag weakTransitions.",
          "Detect CREATIVE REPETITION: compare against memoryContext and creativeLearningContext and flag an angle/joke/motif that has already been exhausted.",
          "Ask whether the sequence exploits the champion angle rather than merely restating facts.",
          "In grounded/living_memory/service modes, flag concrete events, actions, people, places, times, or outcomes not supported by the source.",
          "Flag any contradiction with explicit time or place. A 9 PM scene cannot contain sunrise, dawn, daylight, morning, golden-hour, or sunlight imagery unless explicitly supplied.",
          "Return strict JSON: score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, genericLanguage, weakTransitions.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({ prompt: input.prompt, direction, world, facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24), memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30), scenes }),
      },
    ], "json");
    return parseJson<Critique>(result.text);
  } catch { return null; }
}

async function repair(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState, scenes: AuthoredScene[], critiqueResult: Critique): Promise<AuthoredScene[]> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's elite fast-cut sequence repair editor.",
          "Repair only weak or unsupported beats. Preserve strong lines and supplied facts.",
          "The subject/object/place remains the star.",
          "One output item is one cut-sized thought. Do not combine beats into paragraphs.",
          "Do not replace an unsupported detail with another invented concrete detail in grounded/living_memory/service modes.",
          "Keep 3–12 words when possible, never above 18.",
          "Respect explicit time and place. If the world says 9 PM, do not add sunrise, dawn, daylight, morning, golden hour, or sunlight.",
          "Remove generic filler such as Still here, Something changes, Then it shifts, and See you next time.",
          "If a static fact is weak, realize the same grounded fact through contrast, implication, character, tension, or consequence. Do not invent a new event.",
          "Do not repeat a previously used joke or motif merely because it is easy. If the old motif is required for continuity, evolve or subvert it.",
          `TARGET BEAT COUNT: ${direction.beatCount}`,
          `WORLD: ${JSON.stringify(world)}`,
          `DIRECTION: ${JSON.stringify(direction)}`,
          `CRITIQUE: ${JSON.stringify(critiqueResult)}`,
          "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({ prompt: input.prompt, facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24), memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30), scenes }),
      },
    ], "json");
    const parsed = parseJson<SceneDraft>(result.text);
    return finalize((Array.isArray(parsed?.scenes) ? parsed.scenes : [])
      .map((scene) => ({ text: clean(scene?.text), kind: clean(scene?.kind) || "movement" })), world).slice(0, 6);
  } catch { return []; }
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];
  const intent = inferIntent(input);
  const worldState = buildWorldState(input, intent);
  const fallback = fallbackDirection(input, intent, worldState);
  const direction = await planDirection(input, fallback, worldState);
  const targetBeats = direction.beatCount;

  // Three independent draft attempts give the author a real chance to escape a bad local generation.
  // We do not blindly accept the first valid JSON payload.
  let scenes: AuthoredScene[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = fitBeatCount(await draft(input, direction, worldState), targetBeats);
    if (candidate.length === targetBeats && localGate(candidate, worldState)) {
      scenes = candidate;
      break;
    }
    if (candidate.length > scenes.length) scenes = candidate;
  }

  // Never collapse a real author result to zero because a later gate became stricter.
  if (scenes.length < 3) {
    const recovery = await repair(input, direction, worldState, scenes, {
      score: 4,
      problems: ["insufficient_candidate_sequence", "recover_without_zeroing_experience"],
      repeats: [], instructionLeaks: [], unsupportedDetails: [], weakScenes: [],
      genericLanguage: [], weakTransitions: [],
    });
    if (recovery.length >= 3) scenes = fitBeatCount(recovery, targetBeats);
  }
  if (scenes.length < 3) return scenes;

  const critiqueResult = await critique(input, direction, worldState, scenes);
  if (critiqueResult && (
    critiqueResult.score < 8 || critiqueResult.problems?.length || critiqueResult.repeats?.length ||
    critiqueResult.instructionLeaks?.length || critiqueResult.unsupportedDetails?.length ||
    critiqueResult.weakScenes?.length || critiqueResult.genericLanguage?.length || critiqueResult.weakTransitions?.length
  )) {
    const repaired = await repair(input, direction, worldState, scenes, critiqueResult);
    if (repaired.length >= 3) {
      const repairedSized = fitBeatCount(repaired, targetBeats);
      if (repairedSized.length >= 3) scenes = repairedSized;
    }
  }

  if (!localGate(scenes, worldState)) {
    const repaired = await repair(input, direction, worldState, scenes, {
      score: 6,
      problems: ["local_quality_or_reality_gate"], repeats: [], instructionLeaks: [], unsupportedDetails: [], weakScenes: [],
      genericLanguage: [], weakTransitions: [],
    });
    if (repaired.length >= 3) {
      const repairedSized = fitBeatCount(repaired, targetBeats);
      if (repairedSized.length >= 3 && localGate(repairedSized, worldState)) scenes = repairedSized;
    }
  }

  return scenes;
}
