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

type CreativeDirection = {
  intent: CreativeIntent;
  attentionGoal: string;
  emotionalEngine: string;
  strongestDetail: string;
  sequenceShape: string[];
  endingMove: string;
  targetDensity: "compact" | "standard" | "deep" | "expansive";
  avoid: string[];
  cinematicGrammar: string[];
  selectedOperators: string[];
};

type SceneDraft = { scenes: AuthoredScene[] };

type SceneCritique = {
  score: number;
  problems: string[];
  repeats: string[];
  instructionLeaks: string[];
  unsupportedDetails: string[];
  weakScenes: number[];
  revision: string[];
  genericLanguage?: string[];
  weakTransitions?: string[];
  missingMoves?: string[];
};

const CINEMATIC_GRAMMAR = [
  "WRITE FOR THE SCREEN, NOT THE PAGE.",
  "ONE SCENE = ONE SHORT THOUGHT = ONE PERCEIVABLE MOMENT.",
  "THE SEQUENCE, NOT THE SENTENCE, CARRIES THE STORY.",
  "PREFER AN IMAGE OR ACTION OVER AN EXPLANATION.",
  "PREFER IMPLICATION OVER SUMMARY.",
  "LET THE NEXT SCENE ANSWER A QUESTION CREATED BY THE PREVIOUS SCENE.",
  "CHANGE THE VIEWER'S STATE BETWEEN ADJACENT SCENES.",
  "USE CONCRETE NOUNS, ACTIVE VERBS, AND SPECIFIC DETAILS.",
  "USE METAPHOR OR PERSONIFICATION ONLY WHEN IT SHARPENS THE MOMENT.",
  "END ON THE STRONGEST AFTER-IMAGE, REVERSAL, DISCOVERY, OR PAYOFF YOU CAN EARN.",
];

const CREATIVE_OPERATORS = [
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

function enabled() {
  return process.env.QRE_AI_ENABLED === "true" && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[-*\d.\s]+/, "")
    .trim();
}

function unique(values: unknown[], limit: number): string[] {
  return [...new Set(values.map(cleanText).filter(Boolean))].slice(0, limit);
}

function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function isInstructionOnly(text: string): boolean {
  const normalized = cleanText(text).toLowerCase();
  return /^(create|make|write|build|generate|turn|produce|give|tell|show)\b/.test(normalized)
    || /\b(create|make|write|generate)\s+(a|an|the)?\s*(video|story|experience|memory|movie)\b/.test(normalized);
}

function containsMetaLanguage(text: string): boolean {
  return /\b(ai|qre|prompt|compiler|cognition|metadata|model|generated|experience compiler|lens|instruction)\b/i.test(text);
}

function genericLanguageScore(text: string): number {
  const normalized = text.toLowerCase();
  const genericPatterns = [
    /picture-perfect/,
    /luxury grooming/,
    /unforgettable experience/,
    /beautiful transformation/,
    /magical moment/,
    /amazing transformation/,
    /as we move/,
    /a transformation begins/,
    /the experience unfolds/,
    /in this moment/,
    /you can see/,
    /we see/,
    /the final reveal/,
    /ready to/,
    /level up/,
  ];
  return genericPatterns.reduce((score, pattern) => score + (pattern.test(normalized) ? 1 : 0), 0);
}

function inferDirection(input: CinematicAuthorInput): CreativeDirection {
  const combined = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  const has = (...patterns: RegExp[]) => patterns.some((pattern) => pattern.test(combined));

  const memory = has(
    /\bmemory|remember|years later|again|returned|recurrence|childhood|grandma|family|vacation|trip|rave|concert|pet\b/,
    /\bwedding|anniversary|honeymoon|memorial\b/,
  );
  const service = has(/\bservice|client|customer|groom|grooming|clean|cleaning|repair|repaired|install|installed|barber|salon|plumber|landscap|mechanic|tattoo|restaurant\b/);
  const promotion = has(/\bpromo|promotion|commercial|advert|marketing|sell|selling|brand|business\b/)
    || (/\bcreate|make|build|generate|produce|write|turn\b/.test(combined) && service);
  const creator = has(/\bcreator|create content|youtube|tiktok|reels|shorts|content creator|influencer|personal brand\b/);
  const social = has(/\bsocial|instagram|facebook|threads|post|caption|feed|followers|story post\b/);
  const artist = has(/\bartist|artwork|painting|sculpture|music|musician|song|album|photographer|photography|illustrator|designer|gallery|studio\b/);
  const person = has(/\babout me|about myself|my story|my life|my identity|personal profile|bio|portrait|self\b/);
  const event = has(/\bevent|party|festival|ceremony|reunion|birthday|conference|opening|show\b/);
  const artifact = has(/\bartifact|object|piece|plaque|keychain|sticker|tag|installation|physical art|qr art\b/);
  const story = has(/\bstory|tale|scene|movie|film|short film|fiction\b/);

  const make = (
    intent: CreativeIntent,
    attentionGoal: string,
    emotionalEngine: string,
    sequenceShape: string[],
    endingMove: string,
    targetDensity: CreativeDirection["targetDensity"],
    avoid: string[],
    selectedOperators: string[],
  ): CreativeDirection => ({
    intent,
    attentionGoal,
    emotionalEngine: input.lens || emotionalEngine,
    strongestDetail: input.facts[0] || input.sourceMoments[0] || "the most distinctive supplied detail",
    sequenceShape,
    endingMove,
    targetDensity,
    avoid,
    cinematicGrammar: CINEMATIC_GRAMMAR,
    selectedOperators,
  });

  if (promotion) return make(service ? "service" : "promotion", "earn attention immediately, create a memorable little world, and leave the viewer with a desire to see the next moment", "funny, vivid, unexpected", ["hook", "movement", "micro_reveal", "turn", "transformation", "payoff"], "land on a memorable image, joke, transformation, or desire without turning the sequence into generic advertising copy", "compact", ["generic ad copy", "feature lists", "sales slogans", "invented business claims", "long exposition"], ["sensory_hook", "personification", "comic_turn", "contrast", "micro_reveal", "transformation", "afterglow"]);
  if (service) return make("service", "make an ordinary service encounter feel specific, human, and worth watching", "personality, contrast, transformation", ["arrival", "detail", "physical_move", "turn", "payoff"], "make the completed service feel like a satisfying change, not a report or checklist", "compact", ["checklist prose", "corporate language", "process narration", "feature dumping", "generic praise"], ["sensory_hook", "personification", "understatement", "status_inversion", "comic_turn", "transformation", "afterglow"]);
  if (creator || social || artist) {
    const creativeIntent: CreativeIntent = artist ? "artist" : creator ? "creator" : "social";
    return make(creativeIntent, "make the viewer stop, feel a point of view, and want to see what comes next", "voice, curiosity, contrast, personality", ["hook", "voice", "reveal", "turn", "signature"], "end on a line or image that feels unmistakably like this creator, artist, or voice", "compact", ["generic influencer language", "generic artist statements", "corporate slogans", "over-explaining the point", "copycat voice"], ["sensory_hook", "voice", "zoom_into_detail", "micro_reveal", "contrast", "signature", "afterglow"]);
  if (memory || event) return make(event ? "event" : "memory", "make the viewer feel present, then deepen meaning through a few specific turns", "nostalgia, intimacy, surprise", input.trajectory?.length ? input.trajectory : ["arrival", "detail", "movement", "realization", "afterglow"], "leave the viewer with a detail or realization that means more after the sequence than before it", (input.sourceMoments.length + (input.memoryContext?.length ?? 0)) > 12 ? "expansive" : "deep", ["generic nostalgia", "fake scenery", "over-explaining emotion", "invented events", "repeating the same point"], ["sensory_hook", "zoom_into_detail", "micro_reveal", "callback", "tender_turn", "reversal", "afterglow"]);
  if (person) return make("person", "reveal a distinctive human truth instead of reciting a biography", "personality, intimacy, contradiction", ["glimpse", "detail", "contrast", "reveal", "afterimage"], "end on a detail that makes the person feel larger and more specific", "deep", ["resume language", "biography dumps", "generic inspiration", "empty praise", "list-like facts"], ["sensory_hook", "zoom_into_detail", "contrast", "micro_reveal", "status_inversion", "afterglow"]);
  if (artifact) return make("artifact", "make the physical object feel like it carries a story, identity, or secret worth discovering", "mystery, meaning, personality", ["object", "detail", "meaning", "reveal", "payoff"], "make the object mean more than it seemed to at the beginning", "standard", ["product spec sheets", "catalog copy", "generic luxury language", "feature dumping"], ["sensory_hook", "zoom_into_detail", "personification", "micro_reveal", "mystery_turn", "reveal", "afterglow"]);
  if (story) return make("story", "create curiosity, movement, consequence, and a satisfying final turn", "curiosity, contrast, consequence", input.trajectory?.length ? input.trajectory : ["hook", "movement", "discovery", "change", "payoff"], "earn a final line that changes how the viewer sees the opening", "standard", ["generic setup", "report-like prose", "instruction echo", "repetition", "filler"], ["sensory_hook", "physical_move", "micro_reveal", "reversal", "escalation", "transformation", "afterglow"]);
  return make("unknown", "find the most interesting available angle and make the material move like a miniature film", "contrast, curiosity, personality", input.trajectory?.length ? input.trajectory : ["hook", "movement", "discovery", "change", "payoff"], "earn a final line that changes how the viewer sees the opening", "standard", ["generic setup", "report-like prose", "instruction echo", "repetition", "filler"], ["sensory_hook", "physical_move", "micro_reveal", "contrast", "reversal", "transformation", "afterglow"]);
}

async function planDirection(input: CinematicAuthorInput, fallback: CreativeDirection): Promise<CreativeDirection> {
  if (!enabled()) return fallback;
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's senior creative director.",
      "Plan the experience before the writer drafts it.",
      "Do not write scenes yet.",
      "Identify the creative job: service, promotion, creator, social, artist, person, memory, event, artifact, story, or another intent.",
      "Select 3–7 creative operators from the supplied operator library that fit the material.",
      "The Whiskers benchmark is the positive target grammar: sensory image → physical movement → small reveal → transformation/reframe → payoff. Do not copy its wording; reproduce its underlying mechanics.",
      "Prefer a sequence of short cinematic moments over explanatory prose.",
      "A strong scene should give the viewer something to picture, not tell them what the author intends.",
      "Create narrative pressure by leaving a small question or expectation for the next scene when appropriate.",
      "Grounded material may invent language, metaphor, personification, framing, and emotional interpretation, but not new concrete events, people, places, dates, or outcomes.",
      "Promotional concept mode may invent fictionalized scene actions for attention, but must not invent factual business claims, prices, reviews, awards, certifications, guarantees, locations, or named customers.",
      "Sparse creator/social/artist/person prompts are allowed to use aspiration, voice, tension, desire, contradiction, and point of view as dramatic material. Do not require concrete life events.",
      "Return strict JSON: intent, attentionGoal, emotionalEngine, strongestDetail, sequenceShape, endingMove, targetDensity, avoid, cinematicGrammar, selectedOperators.",
      `OPERATOR LIBRARY: ${CREATIVE_OPERATORS.join(", ")}`,
      `GOLD GRAMMAR: ${CINEMATIC_GRAMMAR.join(" ")}`,
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, lens: input.lens ?? "neutral", subject: input.subject ?? "", place: input.place ?? "", trajectory: input.trajectory ?? [], sourceMoments: unique(input.sourceMoments, 24), facts: unique(input.facts, 40), memoryContext: unique(input.memoryContext ?? [], 20), learnedCreativePreferences: unique(input.creativeLearningContext ?? [], 20), fallback }) },
  ], "json");
  const parsed = parseJson<CreativeDirection>(result.text);
  if (!parsed?.sequenceShape?.length || !parsed?.attentionGoal) return fallback;
  const selectedOperators = Array.isArray(parsed.selectedOperators) ? parsed.selectedOperators.filter((value) => CREATIVE_OPERATORS.includes(String(value))).slice(0, 7) : fallback.selectedOperators;
  return { ...fallback, ...parsed, sequenceShape: parsed.sequenceShape.slice(0, 10), avoid: Array.isArray(parsed.avoid) ? parsed.avoid.slice(0, 12) : fallback.avoid, cinematicGrammar: Array.isArray(parsed.cinematicGrammar) ? parsed.cinematicGrammar.slice(0, 12) : fallback.cinematicGrammar, selectedOperators: selectedOperators.length ? selectedOperators : fallback.selectedOperators };
}

function targetSceneCount(direction: CreativeDirection, input: CinematicAuthorInput): { min: number; max: number } {
  const evidence = input.sourceMoments.length + input.facts.length + (input.memoryContext?.length ?? 0);
  if (direction.targetDensity === "compact") return { min: 3, max: Math.min(9, Math.max(4, Math.ceil(Math.max(evidence, 5) / 2))) };
  if (direction.targetDensity === "deep") return { min: 4, max: Math.min(14, Math.max(6, Math.ceil(Math.max(evidence, 8) / 2))) };
  if (direction.targetDensity === "expansive") return { min: 5, max: Math.min(16, Math.max(8, Math.ceil(Math.max(evidence, 12) / 2))) };
  return { min: 4, max: Math.min(12, Math.max(5, Math.ceil(Math.max(evidence, 6) / 2))) };
}

function normalizeSceneUnits(scene: AuthoredScene): AuthoredScene[] {
  const text = cleanText(scene.text);
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9'"“])/).map(cleanText).filter(Boolean);
  const units = sentences.length > 1 ? sentences : [text];
  const out: AuthoredScene[] = [];
  for (const unit of units) {
    const words = unit.split(/\s+/).filter(Boolean);
    if (words.length <= 18) out.push({ ...scene, text: unit });
    else {
      const short = words.slice(0, 18).join(" ").replace(/[,:;—-]+$/, "").trim();
      if (short) out.push({ ...scene, text: short });
    }
  }
  return out;
}

function finalizeScenes(scenes: AuthoredScene[]): AuthoredScene[] {
  const expanded = scenes.flatMap(normalizeSceneUnits).filter((scene) => !isInstructionOnly(scene.text) && !containsMetaLanguage(scene.text));
  return expanded.slice(0, 20).map((scene, index, all) => {
    const words = scene.text.split(/\s+/).length;
    return {
      ...scene,
      text: cleanText(scene.text),
      kind: scene.kind || ["hook", "setup", "movement", "discovery", "escalation", "transformation", "realization", "payoff"][Math.min(index, 7)],
      durationHintMs: scene.durationHintMs ?? Math.max(1500, Math.min(5600, 1100 + words * 150)),
      transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "cinematic" : "fade"),
    };
  });
}

async function draftSequence(input: CinematicAuthorInput, direction: CreativeDirection): Promise<AuthoredScene[]> {
  const { min, max } = targetSceneCount(direction, input);
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's elite cinematic sequence author.",
      "Write separate viewer-facing scene messages that play sequentially like a miniature film.",
      `Create between ${min} and ${max} scenes, then stop when the sequence has earned its ending.`,
      "SHORT IS SWEET applies to each scene line, not to the total experience.",
      "ONE SCENE = ONE SHORT THOUGHT = ONE PERCEIVABLE MOMENT.",
      "The Whiskers benchmark is your positive target: each scene is compact, visual, specific, slightly alive, and useful to the next scene. A sequence should feel like image → action → reveal → reframe → payoff rather than a report.",
      "Prefer 4–14 words. 15–18 words is acceptable when the line earns it. Avoid 19+ words unless absolutely necessary.",
      "Do not explain what the sequence is doing. Make the line itself the moment.",
      "Every adjacent pair should create movement: new image, physical move, new expectation, reveal, escalation, reversal, or emotional shift.",
      "Use the selected creative operators deliberately.",
      "Do not force every fact into the movie. Choose the strongest details and let the sequence breathe.",
      "For creator/social/artist/person prompts, sparse facts are not a blocker: build drama from supplied voice, aspiration, contradiction, desire, tension, and point of view. Invent no concrete life events.",
      "Do not repeat the same subject-led opening across adjacent scenes.",
      "Do not summarize the whole story in scene one.",
      "Do not mention QRE, AI, prompts, compilers, cognition, metadata, models, or the writing process.",
      direction.intent === "service" || direction.intent === "promotion" ? "ATTENTION MODE: creative framing is allowed. Invent fictionalized micro-actions or comic situations only when clearly not presented as factual claims. Never invent real prices, reviews, awards, certifications, guarantees, customer names, or specific business facts. Prefer a memorable angle over a sales pitch." : "GROUNDED MODE: preserve supplied factual reality. Invent language, framing, metaphor, personification, and interpretation, not concrete factual events.",
      "Avoid generic filler: beautiful, magical, unforgettable, amazing, incredible, cinematic, epic, picture-perfect, luxury, masterpiece, transformative, as we move, a transformation begins, the final reveal.",
      "Do not explain jokes, emotions, metaphors, or the ending. Trust the viewer.",
      `SEQUENCE SHAPE: ${direction.sequenceShape.join(" → ")}`,
      `SELECTED OPERATORS: ${direction.selectedOperators.join(", ")}`,
      `EMOTIONAL ENGINE: ${direction.emotionalEngine}`,
      `ATTENTION GOAL: ${direction.attentionGoal}`,
      `ENDING MOVE: ${direction.endingMove}`,
      `STRONGEST DETAIL: ${direction.strongestDetail}`,
      `AVOID: ${direction.avoid.join(", ")}`,
      "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|setup|movement|discovery|escalation|transformation|realization|payoff|afterglow\",\"durationHintMs\":number,\"transitionHint\":\"none|fade|slide|zoom|cinematic|flash\",\"audioMood\":\"...\",\"visualHint\":\"...\"}]}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, subject: input.subject ?? "", place: input.place ?? "", facts: unique(input.facts, 40), sourceMoments: unique(input.sourceMoments, 24), memoryContext: unique(input.memoryContext ?? [], 20), learnedCreativePreferences: unique(input.creativeLearningContext ?? [], 20) }) },
  ], "json");
  const parsed = parseJson<SceneDraft>(result.text);
  const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalizeScenes(scenes.map((scene) => ({ text: cleanText(scene?.text), kind: cleanText(scene?.kind) || "movement", durationHintMs: typeof scene?.durationHintMs === "number" ? scene.durationHintMs : undefined, transitionHint: cleanText(scene?.transitionHint) as AuthoredScene["transitionHint"], audioMood: cleanText(scene?.audioMood) || undefined, visualHint: cleanText(scene?.visualHint) || undefined }))).slice(0, max);
}

async function draftSparseSequence(input: CinematicAuthorInput, direction: CreativeDirection): Promise<AuthoredScene[]> {
  const sparse = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's sparse-brief creative director.",
      "The prompt is intentionally abstract. Extract its central dramatic tension and produce a tiny creative seed before writing scenes.",
      "Return strict JSON: {\"coreTension\":\"...\",\"viewerQuestion\":\"...\",\"trajectory\":[\"...\",\"...\",\"...\"],\"operators\":[\"...\"]}.",
      "Do not invent concrete biography, events, achievements, locations, dates, customers, reviews, or products.",
      "Abstract states are allowed: ambition, obsession, curiosity, doubt, persistence, rebellion, experimentation, vulnerability, weirdness, desire.",
      `INTENT: ${direction.intent}`,
      `LENS: ${input.lens ?? "neutral"}`,
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, facts: unique(input.facts, 20), sourceMoments: unique(input.sourceMoments, 12), preferences: unique(input.creativeLearningContext ?? [], 12) }) },
  ], "json");

  const seed = parseJson<{ coreTension?: string; viewerQuestion?: string; trajectory?: string[]; operators?: string[] }>(sparse.text);
  const trajectory = Array.isArray(seed?.trajectory) ? seed.trajectory.filter(Boolean).slice(0, 6) : direction.sequenceShape;
  const tension = cleanText(seed?.coreTension) || direction.emotionalEngine;
  const question = cleanText(seed?.viewerQuestion) || direction.attentionGoal;

  const first = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's elite author writing from a sparse creative seed.",
      "Turn the seed into 3–5 short cinematic scenes.",
      "The viewer should feel a character or point of view, not receive advice or an explanation.",
      "Use image → movement → reveal → turn → payoff when it fits.",
      "Prefer 4–14 words per scene.",
      "You may dramatize abstract states but may not invent concrete events.",
      "For social, make something people would actually stop for; do not talk about scrolling or algorithms.",
      "For creator, make the creator's desire/contradiction feel alive; do not write a personal-brand statement.",
      "For artist, make the work feel like a place or force; do not write an artist statement.",
      "Use attitude and slight mischief when the lens allows it.",
      "Return strict JSON: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|discovery|turn|payoff\"}]}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, intent: direction.intent, lens: input.lens ?? "neutral", tension, viewerQuestion: question, trajectory, operators: seed?.operators ?? direction.selectedOperators }) },
  ], "json");

  const parsed = parseJson<SceneDraft>(first.text);
  let scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  if (scenes.length >= 3) return finalizeScenes(scenes.map((scene) => ({ text: cleanText(scene?.text), kind: cleanText(scene?.kind) || "movement" }))).slice(0, 5);

  const retry = await localModelGenerate([
    { role: "system", content: [
      "Write exactly 4 short QRE cinematic scene lines for this abstract prompt.",
      "No explanation. No advice. No social-media jargon. No artist statement. No biography.",
      "Each line must be a different beat and 4–14 words.",
      "Use abstract dramatic material only; do not invent concrete events.",
      "Sequence: hook → movement → turn → payoff.",
      "Return JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|movement|turn|payoff\"}]}.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ prompt: input.prompt, intent: direction.intent, lens: input.lens ?? "neutral", tension, trajectory }) },
  ], "json");
  const retryParsed = parseJson<SceneDraft>(retry.text);
  scenes = Array.isArray(retryParsed?.scenes) ? retryParsed.scenes : [];
  return finalizeScenes(scenes.map((scene) => ({ text: cleanText(scene?.text), kind: cleanText(scene?.kind) || "movement" }))).slice(0, 5);
}

async function critiqueSequence(input: CinematicAuthorInput, direction: CreativeDirection, scenes: AuthoredScene[]): Promise<SceneCritique | null> {
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's ruthless cinematic editor.",
      "Diagnose the sequence, do not rewrite it.",
      "The gold standard is short, visual, screen-ready moments that create forward pull.",
      "For every scene, ask: can I picture this? Does something change? Is it specific? Does it avoid explanation? Would I want the next scene?",
      "Check for instruction leakage, metadata leakage, unsupported concrete details, generic/cliche language, repeated openings, repeated ideas, weak transitions, missing movement, premature payoff, weak ending, and scenes too long to read as a cinematic slide.",
      "For service, creator, social, artist, and promotion work, flag generic marketing/creator-speak.",
      "Return strict JSON: score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, revision, genericLanguage, weakTransitions, missingMoves.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ direction, prompt: input.prompt, facts: unique(input.facts, 40), sourceMoments: unique(input.sourceMoments, 24), scenes }) },
  ], "json");
  return parseJson<SceneCritique>(result.text);
}

async function reviseSequence(input: CinematicAuthorInput, direction: CreativeDirection, scenes: AuthoredScene[], critique: SceneCritique): Promise<AuthoredScene[]> {
  const result = await localModelGenerate([
    { role: "system", content: [
      "You are QRE's elite revision editor.",
      "Rewrite only where needed, but do not protect weak lines out of politeness.",
      "The goal is memorable cinematic moments, not polished marketing prose.",
      "Preserve supported facts and strong existing lines.",
      "Convert explanation into image, action, implication, or punch.",
      "Prefer 4–14 words per scene.",
      "Keep one thought per scene.",
      "Remove generic advertising, influencer, artist-statement, corporate, and AI language.",
      "Strengthen transitions and make the ending earn a callback, reveal, transformation, or after-image.",
      "Do not explain jokes, emotions, metaphors, or the ending.",
      "Return strict JSON with the same scene shape.",
    ].join(" ") },
    { role: "user", content: JSON.stringify({ direction, prompt: input.prompt, facts: unique(input.facts, 40), sourceMoments: unique(input.sourceMoments, 24), scenes, critique }) },
  ], "json");
  const parsed = parseJson<SceneDraft>(result.text);
  const revised = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalizeScenes(revised.map((scene) => ({ text: cleanText(scene?.text), kind: cleanText(scene?.kind) || "movement", durationHintMs: typeof scene?.durationHintMs === "number" ? scene.durationHintMs : undefined, transitionHint: cleanText(scene?.transitionHint) as AuthoredScene["transitionHint"], audioMood: cleanText(scene?.audioMood) || undefined, visualHint: cleanText(scene?.visualHint) || undefined })));
}

function localQualityGate(scenes: AuthoredScene[]): { pass: boolean; score: number; reasons: string[] } {
  if (scenes.length < 3) return { pass: false, score: 0, reasons: ["fewer_than_three_scenes"] };
  const wordCounts = scenes.map((scene) => scene.text.split(/\s+/).filter(Boolean).length);
  const longScenes = wordCounts.filter((count) => count > 18).length;
  const genericHits = scenes.reduce((total, scene) => total + genericLanguageScore(scene.text), 0);
  const duplicateStarts = scenes.slice(1).reduce((total, scene, index) => total + (scene.text.split(/\s+/).slice(0, 2).join(" ").toLowerCase() === scenes[index].text.split(/\s+/).slice(0, 2).join(" ").toLowerCase() ? 1 : 0), 0);
  const score = Math.max(0, 10 - longScenes * 1.2 - genericHits * 1.4 - duplicateStarts * 1.5);
  const reasons: string[] = [];
  if (longScenes) reasons.push(`${longScenes}_long_scenes`);
  if (genericHits) reasons.push(`${genericHits}_generic_language_hits`);
  if (duplicateStarts) reasons.push(`${duplicateStarts}_duplicate_openings`);
  return { pass: score >= 8 && longScenes === 0 && genericHits === 0 && duplicateStarts === 0, score, reasons };
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];
  const fallback = inferDirection(input);
  const direction = await planDirection(input, fallback);
  let scenes = await draftSequence(input, direction);
  if (scenes.length < 3 && ["creator", "social", "artist", "person", "unknown"].includes(direction.intent)) scenes = await draftSparseSequence(input, direction);
  if (scenes.length < 3) return [];
  const firstGate = localQualityGate(scenes);
  const critique = await critiqueSequence(input, direction, scenes);
  const critiqueNeedsRevision = Boolean(critique && (critique.score < 8 || critique.problems.length || critique.repeats.length || critique.instructionLeaks.length || critique.unsupportedDetails.length || critique.weakScenes.length || Boolean(critique.genericLanguage?.length) || Boolean(critique.weakTransitions?.length) || Boolean(critique.missingMoves?.length)));
  if (critiqueNeedsRevision || !firstGate.pass) {
    const revised = await reviseSequence(input, direction, scenes, critique ?? { score: firstGate.score, problems: firstGate.reasons, repeats: [], instructionLeaks: [], unsupportedDetails: [], weakScenes: [], revision: firstGate.reasons });
    if (revised.length >= 3) scenes = revised;
  }
  const finalGate = localQualityGate(scenes);
  if (!finalGate.pass && enabled()) {
    const repaired = await reviseSequence(input, direction, scenes, { score: finalGate.score, problems: finalGate.reasons, repeats: [], instructionLeaks: [], unsupportedDetails: [], weakScenes: [], revision: ["final_local_quality_gate_failed"] });
    if (repaired.length >= 3) scenes = repaired;
  }
  return scenes;
}
