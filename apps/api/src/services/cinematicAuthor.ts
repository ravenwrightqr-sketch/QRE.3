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
  subject?: string;
  timeOfDay?: "dawn" | "morning" | "afternoon" | "evening" | "night" | "unknown";
  place?: string;
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
  championAngle: string;
  tension: string;
  movement: string;
  payoff: string;
  antiRepeat: string;
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
  "callback", "tender_turn", "comic_turn", "mystery_turn", "transformation", "afterglow",
  "voice", "signature",
];

const GENERIC_PATTERNS = [
  /picture-perfect/i, /luxury grooming/i, /unforgettable experience/i, /beautiful transformation/i,
  /magical moment/i, /amazing transformation/i, /the experience unfolds/i, /the final reveal/i,
  /incredible journey/i, /still here/i, /something changes/i, /then it shifts/i, /see you next time/i,
  /quick zoom/i, /camera pulls back/i, /final shot/i, /eyes? (?:widen|sparkle)/i,
];

const META_PATTERN = /\b(ai|qre|prompt|compiler|cognition|metadata|model|writing process|instruction)\b/i;

function enabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function fastMode(): boolean {
  return process.env.QRE_AUTHOR_FAST === "true";
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

function rawDebug(label: string, text: string): void {
  if (process.env.QRE_AUTHOR_DEBUG_RAW !== "true") return;
  console.log(`\n--- QRE RAW MODEL OUTPUT · ${label} ---\n${text}\n--- END RAW MODEL OUTPUT ---\n`);
}

function genericHits(text: string): number {
  return GENERIC_PATTERNS.filter((pattern) => pattern.test(text)).length;
}

function inferIntent(input: CinematicAuthorInput): CreativeIntent {
  const value = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  const has = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(value));
  if (has(/\bservice|client|customer|groom|grooming|clean|cleaning|repair|barber|salon|plumber|mechanic|tattoo|restaurant\b/)) return "service";
  if (has(/\bpromo|promotion|commercial|advert|marketing|sell|selling|business|brand\b/)) return "promotion";
  if (has(/\bcreator|influencer|youtube|tiktok|reels|shorts|personal brand\b/)) return "creator";
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
  if (intent === "service") return evidence ? "service" : "concept";
  if (intent === "memory" || intent === "event") return evidence ? "living_memory" : "concept";
  if (intent === "creator" || intent === "social" || intent === "artist" || intent === "person") return evidence ? "grounded" : "voice_first";
  if (intent === "artifact") return evidence ? "grounded" : "concept";
  return evidence ? "grounded" : "concept";
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

function buildWorld(input: CinematicAuthorInput, intent: CreativeIntent): WorldState {
  const details = uniq([...input.facts, ...input.sourceMoments, ...(input.memoryContext ?? []), ...(input.subject ? [input.subject] : []), ...(input.place ? [input.place] : [])], 80);
  const combined = [...details, input.prompt].join(" ");
  const mode = inferMode(input, intent);
  const timeOfDay = inferTimeOfDay(combined);
  const hardConstraints = [
    ...(input.subject ? [`subject=${clean(input.subject)}; center the experience on this subject without repeating its name every beat`] : []),
    ...(input.place ? [`place=${clean(input.place)}; do not relocate`] : []),
    ...(timeOfDay !== "unknown" ? [`time_of_day=${timeOfDay}; do not contradict explicit time`] : []),
    ...(mode !== "concept" ? ["FACTUAL REALITY: do not invent gender, pronouns, people, relationships, locations, actions, outcomes, timestamps, weather, or physical events not supplied by the source"] : []),
  ];
  const all = combined.toLowerCase();
  const affordances: string[] = [];
  if (intent === "service") affordances.push("character attitude, ritual, tiny conflict, before/after, playful status shift, human detail");
  if (intent === "memory" || intent === "event") affordances.push("presence, recurrence, shared meaning, emotional residue, callback, after-image");
  if (intent === "person" || intent === "creator") affordances.push("voice, contradiction, desire, habit, private truth, point of view");
  if (/\bhome|house|room|kitchen|bathroom\b/.test(all)) affordances.push("traces of the person, before/after contrast, objects with meaning");
  if (/\brave|festival|party|concert|music|bass\b/.test(all)) affordances.push("energy, group behavior, escalation, sensory rhythm, aftermath");
  if (/\bwedding|couple|bride|groom\b/.test(all)) affordances.push("relationship, anticipation, social energy, private moment, transformation");
  if (/\btravel|trip|road|airport|hotel|adventure\b/.test(all)) affordances.push("expectation, discovery, mishap, place through the character, memory marker");
  return { mode, subject: input.subject, timeOfDay, place: input.place, suppliedDetails: details, creativeAffordances: [...new Set(affordances)].slice(0, 12), hardConstraints };
}

function fallbackDirection(input: CinematicAuthorInput, intent: CreativeIntent, world: WorldState): CreativeDirection {
  const beatCount = world.mode === "living_memory" ? 4 : 5;
  return {
    intent, mode: world.mode,
    attentionGoal: "chain attention: each cut creates a question, pressure, surprise, or desire for the next cut",
    emotionalEngine: input.lens || "character point of view, contrast, curiosity",
    strongestDetail: input.facts[0] || input.sourceMoments[0] || "the most distinctive supplied detail",
    hiddenPremise: "Find the latent movie inside the character and the supplied reality; do not substitute generic plot or invented events.",
    championAngle: "character-first interpretation of the supplied world",
    tension: "what the character wants, resists, reveals, or turns into a game",
    movement: "attention → complication → turn → consequence",
    payoff: "a character-specific payoff earned by the supplied material",
    antiRepeat: "avoid generic cinematic language and any motif already exhausted in the history",
    sequenceShape: beatCount === 4 ? ["hook", "pressure", "turn", "payoff"] : ["hook", "pressure", "escalation", "turn", "payoff"],
    beatRhythm: beatCount === 4 ? ["jolt", "jolt", "turn", "payoff"] : ["jolt", "jolt", "jolt", "turn", "payoff"],
    beatCount,
    endingMove: "land on what this reveals about the character, not a generic farewell",
    targetDensity: "compact",
    selectedOperators: ["contrast", "micro_reveal", "comic_turn", "reversal", "callback", "signature"],
    creativeAffordances: world.creativeAffordances,
    hardConstraints: world.hardConstraints,
  };
}

async function planDirection(input: CinematicAuthorInput, fallback: CreativeDirection, world: WorldState): Promise<CreativeDirection> {
  if (!enabled()) return fallback;
  try {
    const result = await localModelGenerate([
      { role: "system", content: [
        "You are QRE's senior creative director. PLAN THE MOVIE; do not draft scenes.",
        "The character/subject is the center of gravity. The input is the world they experience, not the protagonist.",
        "Privately generate multiple genuinely different story angles, then attack them and choose ONE champion. Different angles must change what the sequence is about, not merely change wording.",
        "Look for contradiction, personality, desire, resistance, status inversion, recurring history, emotional weight, absurdity, tenderness, mystery, escalation, ritual, or an unexpected meaning supported by evidence.",
        "A boring job is valid material. Make the person's perspective interesting without fabricating events.",
        "HARD FACT RULE: if the source does not establish gender/pronouns, do not choose them. Never invent an owner, groomer, customer, action, relationship, location, result, or physical event.",
        "Do not confuse strongest fact with strongest creative opportunity. A fact like 'is a poodle' may be true but is not automatically interesting.",
        "The champion must include ANGLE, TENSION, MOVEMENT, PAYOFF, and ANTI-REPEAT.",
        "The sequence must feel like one movie, not a pile of individually clever lines.",
        "Return strict JSON only with the requested planning fields.",
      ].join(" ") },
      { role: "user", content: JSON.stringify({
        prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "",
        facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24),
        memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30),
        trajectory: uniq(input.trajectory ?? [], 20), world, fallback,
        output: "intent, mode, attentionGoal, emotionalEngine, strongestDetail, hiddenPremise, championAngle, tension, movement, payoff, antiRepeat, sequenceShape, beatRhythm, beatCount, endingMove, targetDensity, selectedOperators",
      }) },
    ], "json");
    rawDebug("PLAN", result.text);
    const parsed = parseJson<Partial<CreativeDirection>>(result.text);
    if (!parsed?.championAngle || !parsed?.attentionGoal || !parsed?.sequenceShape?.length) return fallback;
    const beatCount = world.mode === "living_memory" ? 4 : Math.max(4, Math.min(6, Number(parsed.beatCount) || fallback.beatCount));
    return {
      ...fallback, ...parsed, mode: world.mode, beatCount,
      sequenceShape: parsed.sequenceShape.map(clean).filter(Boolean).slice(0, 6),
      beatRhythm: Array.isArray(parsed.beatRhythm) && parsed.beatRhythm.length ? parsed.beatRhythm.map(clean).filter(Boolean).slice(0, 6) : fallback.beatRhythm,
      selectedOperators: Array.isArray(parsed.selectedOperators) ? parsed.selectedOperators.filter((v) => OPERATORS.includes(String(v))).slice(0, 7) : fallback.selectedOperators,
      creativeAffordances: world.creativeAffordances, hardConstraints: world.hardConstraints,
    };
  } catch { return fallback; }
}

function promptEcho(text: string, prompt: string): boolean {
  const a = clean(text).toLowerCase();
  const b = clean(prompt).toLowerCase();
  return a === b || (a.length > 30 && b.includes(a));
}

function unsupportedPronoun(text: string, input: CinematicAuthorInput): boolean {
  if (input.facts.concat(input.sourceMoments).join(" ").match(/\b(he|him|his|she|her|hers|they|them|their)\b/i)) return false;
  return /\b(he|him|his|she|her|hers)\b/i.test(text);
}

function forbiddenRealityTerms(world: WorldState): RegExp[] {
  if (world.timeOfDay === "night") return [/\bsunrise\b/i, /\bdawn\b/i, /\bdaylight\b/i, /\bmorning\b/i, /\bgolden hour\b/i, /\bsunlight\b/i];
  if (world.timeOfDay === "morning" || world.timeOfDay === "dawn") return [/\bmidnight\b/i, /\b2\s*am\b/i, /\b3\s*am\b/i, /\b4\s*am\b/i];
  if (world.timeOfDay === "afternoon") return [/\bmidnight\b/i, /\bdawn\b/i, /\bsunrise\b/i];
  return [];
}

function finalize(raw: AuthoredScene[], world: WorldState, input: CinematicAuthorInput): AuthoredScene[] {
  const out: AuthoredScene[] = [];
  for (const scene of raw) {
    const text = clean(scene?.text).replace(/^(?:hook|jolt|turn|payoff|afterglow|movement|discovery)\s*[:|-]\s*/i, "");
    if (!text || META_PATTERN.test(text) || promptEcho(text, input.prompt)) continue;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 20 || genericHits(text) > 0 || unsupportedPronoun(text, input)) continue;
    if (forbiddenRealityTerms(world).some((pattern) => pattern.test(text))) continue;
    out.push({ ...scene, text });
  }
  return out.slice(0, 6).map((scene, index, all) => ({
    ...scene,
    kind: scene.kind || ["hook", "movement", "discovery", "turn", "payoff", "afterglow"][Math.min(index, 5)],
    durationHintMs: scene.durationHintMs ?? Math.max(700, Math.min(2200, 700 + scene.text.split(/\s+/).length * 90)),
    transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "flash" : "fade"),
  }));
}

function fitBeatCount(scenes: AuthoredScene[], target: number): AuthoredScene[] {
  if (scenes.length <= target) return scenes;
  if (target >= 6) return scenes.slice(0, target);
  // Preserve the first and final beats, then favor distinct cuts over wordier cuts.
  const ranked = scenes.map((scene, index) => ({ scene, index, generic: genericHits(scene.text), words: scene.text.split(/\s+/).length }));
  const keep = ranked.sort((a, b) => {
    const anchor = (x: typeof a) => x.index === 0 || x.index === scenes.length - 1 ? -1 : 0;
    return anchor(a) - anchor(b) || a.generic - b.generic || a.index - b.index;
  }).slice(0, target).sort((a, b) => a.index - b.index).map((x) => x.scene);
  return keep;
}

function localGate(scenes: AuthoredScene[], world: WorldState, input: CinematicAuthorInput): boolean {
  if (scenes.length < 3 || scenes.length > 6) return false;
  const seen = new Set<string>();
  for (const scene of scenes) {
    if (genericHits(scene.text) > 0 || unsupportedPronoun(scene.text, input)) return false;
    if (forbiddenRealityTerms(world).some((p) => p.test(scene.text))) return false;
    const key = scene.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

async function draft(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState): Promise<AuthoredScene[]> {
  const max = Math.max(4, Math.min(6, direction.beatCount || 5));
  const modeInstruction = world.mode === "concept"
    ? "CONCEPT: invention is allowed at the imagery/story level, but do not make real-world factual claims."
    : "GROUNDED: the supplied world is reality. Transform it creatively, but invent no concrete event, person, relationship, action, outcome, gender, pronoun, place, timestamp, or physical detail.";
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's elite rapid-attention author.",
      `Write EXACTLY ${max} viewer-facing beats in one coherent sequence.`,
      "This is NOT a novel. It is a living-memory attention loop: GRAB → DEVELOP → GRAB → DEVELOP → TURN → PAYOFF.",
      "Each beat must make the next cut desirable through curiosity, tension, attitude, contrast, surprise, character, consequence, or an earned reveal.",
      "The character/subject is the center of gravity. The input is what happens around them or what they encounter.",
      "Do NOT repeat the subject's name mechanically. Character presence can come through pronouns only when established, attitude, decisions, reactions, implications, callbacks, and consequences.",
      "A 2-word beat can be excellent. A 12-word beat can be excellent. Length follows the dramatic job; do not force a minimum or maximum style.",
      "Do not write empty fragments merely to be short. Do not write padded prose merely to sound cinematic.",
      "Do not write camera directions, zooms, final shots, or screenplay production instructions.",
      "Do not invent facts. If gender/pronouns are not supplied, stay neutral. If an action is not supplied, do not pretend it happened.",
      "Do not turn the source into a chronological receipt. Discover the character's relationship to the material.",
      "The champion angle is ONE movie. Every beat must belong to that same angle. Do not jump between alternate premises.",
      "The ending must pay off the character/angle. Never use a generic goodbye or meaningless final observation.",
      "Avoid generic AI language and decorative description. Prefer specific attitude and high information density.",
      modeInstruction,
      `CHAMPION ANGLE: ${direction.championAngle}`,
      `TENSION: ${direction.tension}`,
      `MOVEMENT: ${direction.movement}`,
      `PAYOFF: ${direction.payoff}`,
      `ANTI-REPEAT: ${direction.antiRepeat}`,
      `ATTENTION GOAL: ${direction.attentionGoal}`,
      `EMOTIONAL ENGINE: ${direction.emotionalEngine}`,
      `RHYTHM: ${direction.beatRhythm.join(" → ")}`,
      `SEQUENCE SHAPE: ${direction.sequenceShape.join(" → ")}`,
      `KNOWN WORLD: ${JSON.stringify(world)}`,
      "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({
      prompt: input.prompt, lens: input.lens ?? "", subject: input.subject ?? "", place: input.place ?? "",
      facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24),
      memoryContext: uniq(input.memoryContext ?? [], 20), creativeLearningContext: uniq(input.creativeLearningContext ?? [], 30), trajectory: uniq(input.trajectory ?? [], 20),
    }) },
  ], "json");
  rawDebug("DRAFT", result.text);
  const parsed = parseJson<SceneDraft>(result.text);
  return finalize(Array.isArray(parsed?.scenes) ? parsed.scenes : [], world, input);
}

async function critique(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState, scenes: AuthoredScene[]): Promise<Critique | null> {
  try {
    const result = await localModelGenerate([
      { role: "system", content: [
        "You are QRE's ruthless editor. Judge this as a rapid attention film, not prose.",
        "Check character gravity, next-cut pressure, coherent champion angle, payoff, novelty, repetition, generic language, and factual integrity.",
        "Flag invented gender/pronouns, people, actions, relationships, locations, outcomes, timestamps, or physical events.",
        "Flag paragraph chopping and any ending that merely says goodbye or restates an observation.",
        "Return strict JSON with score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, genericLanguage, weakTransitions.",
      ].join(" ") },
      { role: "user", content: JSON.stringify({ prompt: input.prompt, direction, world, facts: input.facts, sourceMoments: input.sourceMoments, memoryContext: input.memoryContext ?? [], creativeLearningContext: input.creativeLearningContext ?? [], scenes }) },
    ], "json");
    rawDebug("CRITIQUE", result.text);
    return parseJson<Critique>(result.text);
  } catch { return null; }
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];
  const intent = inferIntent(input);
  const world = buildWorld(input, intent);
  const fallback = fallbackDirection(input, intent, world);
  const direction = await planDirection(input, fallback, world);

  // Fast mode is intentionally one plan + one real draft. This is the development loop, not production repair.
  if (fastMode()) {
    return fitBeatCount(draft(input, direction, world).then((x) => x) as unknown as AuthoredScene[], direction.beatCount);
  }

  let scenes: AuthoredScene[] = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = fitBeatCount(await draft(input, direction, world), direction.beatCount);
    if (candidate.length === direction.beatCount && localGate(candidate, world, input)) { scenes = candidate; break; }
    if (candidate.length > scenes.length) scenes = candidate;
  }
  if (scenes.length < 3) return scenes;

  const critiqueResult = await critique(input, direction, world, scenes);
  if (critiqueResult && (critiqueResult.score < 8 || critiqueResult.problems?.length || critiqueResult.repeats?.length || critiqueResult.unsupportedDetails?.length || critiqueResult.weakScenes?.length || critiqueResult.genericLanguage?.length || critiqueResult.weakTransitions?.length)) {
    // Production repair remains available; fast development mode deliberately skips it.
    const repaired = await draft(input, direction, world);
    const repairedSized = fitBeatCount(repaired, direction.beatCount);
    if (repairedSized.length >= 3) scenes = repairedSized;
  }
  return scenes;
}
