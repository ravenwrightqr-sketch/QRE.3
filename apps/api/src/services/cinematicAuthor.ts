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
  | "memory"
  | "promotion"
  | "service"
  | "creator"
  | "social"
  | "artist"
  | "person"
  | "event"
  | "artifact"
  | "story"
  | "unknown";

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
  "sensory_hook",
  "physical_move",
  "personification",
  "understatement",
  "contrast",
  "micro_reveal",
  "reversal",
  "escalation",
  "status_inversion",
  "zoom_into_detail",
  "callback",
  "tender_turn",
  "comic_turn",
  "mystery_turn",
  "transformation",
  "afterglow",
  "voice",
  "signature",
];

const GENERIC_PATTERNS = [
  /picture-perfect/i,
  /luxury grooming/i,
  /unforgettable experience/i,
  /beautiful transformation/i,
  /magical moment/i,
  /amazing transformation/i,
  /as we move/i,
  /a transformation begins/i,
  /the experience unfolds/i,
  /the final reveal/i,
  /level up/i,
  /incredible journey/i,
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
  const cleaned = String(text ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
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
  if (state.timeOfDay === "night") affordances.push("moonlight, reflected light, shoreline lights, night air, darkness, quieter surroundings");
  if (state.timeOfDay === "morning" || state.timeOfDay === "dawn") affordances.push("early light, waking atmosphere, first movement, fresh start");
  if (state.timeOfDay === "afternoon") affordances.push("bright light, active surroundings, heat, visible detail");
  if (state.timeOfDay === "evening") affordances.push("fading light, transition, shadows, lights coming on");
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
  if (timeOfDay !== "unknown") hardConstraints.push(`time_of_day=${timeOfDay}; never contradict this`);
  if (season !== "unknown") hardConstraints.push(`season=${season}; never contradict this`);
  if (input.place) hardConstraints.push(`place=${clean(input.place)}; do not relocate`);
  if (input.subject) hardConstraints.push(`subject=${clean(input.subject)}; do not replace identity`);
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
  return {
    intent,
    mode: world.mode,
    attentionGoal: intent === "service" ? "make the ordinary service feel specific, human, and worth watching" : "make the viewer stop, feel a point of view, and want the next moment",
    emotionalEngine: input.lens || (intent === "service" ? "personality, contrast, transformation" : "curiosity, personality, contrast"),
    strongestDetail: input.facts[0] || input.sourceMoments[0] || "the prompt's most distinctive idea",
    hiddenPremise: "Find the hidden relationship, tension, contradiction, game, mystery, or transformation inside the material.",
    sequenceShape: intent === "memory" || intent === "event" ? ["arrival", "detail", "movement", "revelation", "afterglow"] : ["hook", "movement", "discovery", "turn", "payoff"],
    endingMove: "finish on an earned image, reveal, reversal, transformation, or after-image",
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
          "Do not draft scenes.",
          "Find the hidden premise: relationship, tension, contradiction, game, mystery, transformation, or emotional question.",
          "Use the supplied world state and creative affordances.",
          "Reality is hard outside concept mode. In grounded, living_memory, service, and voice_first modes never turn an inferred possibility into a factual event.",
          "Time is authoritative. If the supplied time is 9 PM, think night and exploit night affordances; never write dawn or sunrise unless explicitly supplied.",
          "Place is authoritative.",
          "Sparse concept/voice_first prompts use aspiration, voice, contradiction, desire, tension, or point of view rather than invented biography.",
          "Use sensory image → movement → reveal → reframe/transformation → payoff.",
          "Return strict JSON: intent, mode, attentionGoal, emotionalEngine, strongestDetail, hiddenPremise, sequenceShape, endingMove, targetDensity, selectedOperators.",
          `OPERATORS: ${OPERATORS.join(", ")}`,
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: input.prompt,
          lens: input.lens ?? "",
          subject: input.subject ?? "",
          place: input.place ?? "",
          facts: uniq(input.facts, 40),
          sourceMoments: uniq(input.sourceMoments, 24),
          memoryContext: uniq(input.memoryContext ?? [], 20),
          creativeLearningContext: uniq(input.creativeLearningContext ?? [], 20),
          world,
          fallback,
        }),
      },
    ], "json");
    const parsed = parseJson<CreativeDirection>(result.text);
    if (!parsed?.sequenceShape?.length || !parsed.attentionGoal) return fallback;
    const operators = Array.isArray(parsed.selectedOperators)
      ? parsed.selectedOperators.filter((value) => OPERATORS.includes(String(value))).slice(0, 7)
      : [];
    return {
      ...fallback,
      ...parsed,
      mode: world.mode,
      selectedOperators: operators.length ? operators : fallback.selectedOperators,
      creativeAffordances: world.creativeAffordances,
      hardConstraints: world.hardConstraints,
    };
  } catch {
    return fallback;
  }
}

function promptEcho(text: string, prompt: string): boolean {
  const a = clean(text).toLowerCase();
  const b = clean(prompt).toLowerCase();
  return a === b || (a.length > 30 && b.includes(a));
}

function finalize(raw: AuthoredScene[]): AuthoredScene[] {
  const out: AuthoredScene[] = [];
  for (const scene of raw) {
    const text = clean(scene?.text);
    if (!text) continue;
    for (const piece of text.split(/(?<=[.!?])\s+(?=[A-Z0-9'"“])/).map(clean).filter(Boolean)) {
      const words = piece.split(/\s+/).filter(Boolean);
      const short = words.length <= 18 ? piece : words.slice(0, 18).join(" ").replace(/[,:;—-]+$/g, "");
      if (short) out.push({ ...scene, text: short });
    }
  }
  return out.slice(0, 20).map((scene, index, all) => ({
    ...scene,
    kind: scene.kind || ["hook", "movement", "discovery", "turn", "payoff", "afterglow"][Math.min(index, 5)],
    durationHintMs: scene.durationHintMs ?? Math.max(1500, Math.min(5000, 1100 + scene.text.split(/\s+/).length * 150)),
    transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "cinematic" : "fade"),
  }));
}

function localGate(scenes: AuthoredScene[]): boolean {
  if (scenes.length < 3) return false;
  return scenes.every((scene) => scene.text.split(/\s+/).length <= 18 && genericHits(scene.text) === 0);
}

async function draft(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState): Promise<AuthoredScene[]> {
  const max = direction.targetDensity === "deep" ? 8 : 6;
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
        `Write 3–${max} short viewer-facing scene messages like a miniature film.`,
        "SHORT IS SWEET PER SCENE. ONE SCENE = ONE THOUGHT = ONE PERCEIVABLE MOMENT.",
        "Prefer 4–14 words; 15–18 only when earned.",
        "Use sensory image → movement → reveal → reframe → payoff.",
        "Every adjacent pair changes the viewer state.",
        "Do not summarize scene one. Do not explain jokes, emotions, metaphors, or endings.",
        "Use attitude; slightly mischievous is welcome.",
        "Avoid generic filler and stock phrasing.",
        modeInstruction,
        `HIDDEN PREMISE: ${direction.hiddenPremise}`,
        `SEQUENCE: ${direction.sequenceShape.join(" → ")}`,
        `AFFORDANCES: ${world.creativeAffordances.join(" | ")}`,
        `CONSTRAINTS: ${world.hardConstraints.join(" | ")}`,
        `OPERATORS: ${direction.selectedOperators.join(", ")}`,
        `ENDING: ${direction.endingMove}`,
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt,
        lens: input.lens ?? "",
        subject: input.subject ?? "",
        place: input.place ?? "",
        facts: uniq(input.facts, 40),
        sourceMoments: uniq(input.sourceMoments, 24),
        memoryContext: uniq(input.memoryContext ?? [], 20),
        creativeLearningContext: uniq(input.creativeLearningContext ?? [], 20),
        world,
      }),
    },
  ], "json");
  const parsed = parseJson<SceneDraft>(result.text);
  const raw = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalize(raw.map((scene) => ({ text: clean(scene?.text), kind: clean(scene?.kind) || "movement" })).filter((scene) => scene.text && !META_PATTERN.test(scene.text) && !promptEcho(scene.text, input.prompt))).slice(0, max);
}

async function critique(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState, scenes: AuthoredScene[]): Promise<Critique | null> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's ruthless cinematic editor.",
          "Judge visuality, movement, specificity, forward pull, novelty, short-screen readability, generic language, transitions, payoff, and reality integrity.",
          "In grounded/living_memory/service modes, flag concrete events, actions, people, places, times, or outcomes not supported by the source.",
          "Derived context is allowed only as creative affordance, not factual event.",
          "Return strict JSON: score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, genericLanguage, weakTransitions.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: input.prompt,
          direction,
          world,
          facts: uniq(input.facts, 40),
          sourceMoments: uniq(input.sourceMoments, 24),
          scenes,
        }),
      },
    ], "json");
    return parseJson<Critique>(result.text);
  } catch {
    return null;
  }
}

async function repair(input: CinematicAuthorInput, direction: CreativeDirection, world: WorldState, scenes: AuthoredScene[], critiqueResult: Critique): Promise<AuthoredScene[]> {
  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's elite scene repair editor.",
          "Repair only weak or unsupported beats.",
          "Preserve strong lines and facts.",
          "In grounded/living_memory/service modes remove unsupported concrete events instead of replacing them with other inventions.",
          "Use creative affordances to make the grounded result more vivid.",
          "Keep 4–14 words per scene when possible.",
          "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff|afterglow\"}]}.",
          `WORLD: ${JSON.stringify(world)}`,
          `CRITIQUE: ${JSON.stringify(critiqueResult)}`,
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({ prompt: input.prompt, direction, facts: uniq(input.facts, 40), sourceMoments: uniq(input.sourceMoments, 24), scenes }),
      },
    ], "json");
    const parsed = parseJson<SceneDraft>(result.text);
    return finalize((Array.isArray(parsed?.scenes) ? parsed.scenes : []).map((scene) => ({ text: clean(scene?.text), kind: clean(scene?.kind) || "movement" }))).slice(0, 20);
  } catch {
    return [];
  }
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];
  const intent = inferIntent(input);
  const worldState = buildWorldState(input, intent);
  const fallback = fallbackDirection(input, intent, worldState);
  const direction = await planDirection(input, fallback, worldState);
  let scenes = await draft(input, direction, worldState);
  if (scenes.length < 3) scenes = await draft(input, direction, worldState);
  if (scenes.length < 3) return [];
  const critiqueResult = await critique(input, direction, worldState, scenes);
  if (critiqueResult && (
    critiqueResult.score < 8
    || critiqueResult.problems?.length
    || critiqueResult.repeats?.length
    || critiqueResult.instructionLeaks?.length
    || critiqueResult.unsupportedDetails?.length
    || critiqueResult.weakScenes?.length
    || critiqueResult.genericLanguage?.length
    || critiqueResult.weakTransitions?.length
  )) {
    const repaired = await repair(input, direction, worldState, scenes, critiqueResult);
    if (repaired.length >= 3) scenes = repaired;
  }
  if (!localGate(scenes)) {
    const repaired = await repair(input, direction, worldState, scenes, {
      score: 7,
      problems: ["local_quality_gate"],
      repeats: [],
      instructionLeaks: [],
      unsupportedDetails: [],
      weakScenes: [],
    });
    if (repaired.length >= 3) scenes = repaired;
  }
  return scenes;
}
