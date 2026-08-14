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

type CreativeDirection = {
  intent: "memory" | "promotion" | "event" | "personal" | "artifact" | "unknown";
  attentionGoal: string;
  emotionalEngine: string;
  strongestDetail: string;
  sequenceShape: string[];
  endingMove: string;
  targetDensity: "compact" | "standard" | "deep" | "expansive";
  avoid: string[];
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
};

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
  try { return JSON.parse(cleaned) as T; } catch { return null; }
}

function isInstructionOnly(text: string): boolean {
  const normalized = cleanText(text).toLowerCase();
  return /^(create|make|write|build|generate|turn|produce|give|tell|show)\b/.test(normalized)
    || /\b(create|make|write|generate)\s+(a|an|the)?\s*(video|story|experience|memory|movie)\b/.test(normalized);
}

function containsMetaLanguage(text: string): boolean {
  return /\b(ai|qre|prompt|compiler|cognition|metadata|model|generated|experience compiler|lens|instruction)\b/i.test(text);
}

function inferDirection(input: CinematicAuthorInput): CreativeDirection {
  const combined = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  const memory = /\b(memory|remember|wedding|anniversary|trip|rave|concert|family|grandma|childhood|vacation|pet)\b/.test(combined);
  const promotion = /\b(create|make|build|generate|produce|write|turn)\b/.test(combined)
    && /\b(video|ad|commercial|promo|promotion|marketing|business|brand|grooming|restaurant|salon|service|dispensary|realtor|real estate)\b/.test(combined);
  const event = /\b(wedding|party|event|birthday|festival|ceremony|reunion)\b/.test(combined);

  if (promotion) {
    return {
      intent: "promotion",
      attentionGoal: "earn attention immediately, create a memorable transformation, and end with a clean desire or CTA-ready feeling",
      emotionalEngine: input.lens || "funny, vivid, unexpected",
      strongestDetail: input.facts[0] || input.sourceMoments[0] || "the most distinctive service detail",
      sequenceShape: ["hook", "movement", "surprise", "transformation", "payoff"],
      endingMove: "land on the strongest memorable image or feeling without making unsupported business claims",
      targetDensity: "compact",
      avoid: ["generic ad copy", "feature lists", "sales slogans", "invented business claims", "long exposition"],
    };
  }

  if (memory || event) {
    return {
      intent: event ? "event" : "memory",
      attentionGoal: "make the viewer feel present, then deepen meaning through a few specific turns",
      emotionalEngine: input.lens || "nostalgia, intimacy, surprise",
      strongestDetail: input.facts[0] || input.sourceMoments[0] || "the smallest detail that makes the memory specific",
      sequenceShape: input.trajectory?.length ? input.trajectory : ["arrival", "detail", "movement", "realization", "afterglow"],
      endingMove: "leave the viewer with a detail or realization that means more after the sequence than before it",
      targetDensity: (input.sourceMoments.length + (input.memoryContext?.length ?? 0)) > 12 ? "expansive" : "deep",
      avoid: ["generic nostalgia", "fake scenery", "over-explaining emotion", "invented events", "repeating the same point"],
    };
  }

  return {
    intent: "personal",
    attentionGoal: "turn ordinary material into an experience with movement and a satisfying final turn",
    emotionalEngine: input.lens || "contrast, curiosity, personality",
    strongestDetail: input.facts[0] || input.sourceMoments[0] || "the most unusual supplied detail",
    sequenceShape: input.trajectory?.length ? input.trajectory : ["hook", "movement", "discovery", "change", "payoff"],
    endingMove: "earn a final line that changes how the viewer sees the opening",
    targetDensity: "standard",
    avoid: ["generic setup", "report-like prose", "instruction echo", "repetition", "filler"],
  };
}

async function planDirection(input: CinematicAuthorInput, fallback: CreativeDirection): Promise<CreativeDirection> {
  if (!enabled()) return fallback;
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's senior creative director.",
        "Plan a cinematic experience before the writer drafts it.",
        "Do not write the scenes yet.",
        "The user prompt is an instruction or creative brief, not viewer-facing dialogue.",
        "Separate world truth from creative interpretation.",
        "Concrete facts, people, places, dates, objects, actions, and outcomes must come from supplied evidence unless the mode is promotional concept mode.",
        "In promotional concept mode, fictionalized scene actions may be invented to make the service compelling, but never invent real business claims, prices, reviews, awards, certifications, guarantees, locations, or named customers.",
        "Choose a sequence shape that makes the material move. Do not force a fixed scene count.",
        "The world may be tiny or enormous. Choose traversal density from the amount and importance of available material.",
        "Return strict JSON: intent, attentionGoal, emotionalEngine, strongestDetail, sequenceShape, endingMove, targetDensity, avoid.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt,
        lens: input.lens ?? "neutral",
        subject: input.subject ?? "",
        place: input.place ?? "",
        trajectory: input.trajectory ?? [],
        sourceMoments: unique(input.sourceMoments, 24),
        facts: unique(input.facts, 40),
        memoryContext: unique(input.memoryContext ?? [], 20),
        learnedCreativePreferences: unique(input.creativeLearningContext ?? [], 20),
        fallback,
      }),
    },
  ], "json");
  const parsed = parseJson<CreativeDirection>(result.text);
  if (!parsed?.sequenceShape?.length || !parsed?.attentionGoal) return fallback;
  return { ...fallback, ...parsed, sequenceShape: parsed.sequenceShape.slice(0, 10), avoid: Array.isArray(parsed.avoid) ? parsed.avoid.slice(0, 12) : fallback.avoid };
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
    if (words.length <= 18) {
      out.push({ ...scene, text: unit });
      continue;
    }
    // Never make the player rescue a paragraph: keep only a clean front half and let the next beat carry the story.
    const short = unit.split(/\s+/).slice(0, 18).join(" ").replace(/[,:;—-]+$/, "").trim();
    if (short) out.push({ ...scene, text: short });
  }
  return out;
}

function finalizeScenes(scenes: AuthoredScene[]): AuthoredScene[] {
  const expanded = scenes.flatMap(normalizeSceneUnits).filter((scene) => !isInstructionOnly(scene.text) && !containsMetaLanguage(scene.text));
  return expanded.slice(0, 20).map((scene, index, all) => {
    const words = scene.text.split(/\s+/).length;
    const durationHintMs = scene.durationHintMs ?? Math.max(1500, Math.min(5600, 1100 + words * 150));
    return {
      ...scene,
      text: cleanText(scene.text),
      kind: scene.kind || ["hook", "setup", "movement", "discovery", "escalation", "transformation", "realization", "payoff"][Math.min(index, 7)],
      durationHintMs,
      transitionHint: scene.transitionHint ?? (index === 0 ? "none" : index === all.length - 1 ? "cinematic" : "fade"),
    };
  });
}

async function draftSequence(input: CinematicAuthorInput, direction: CreativeDirection): Promise<AuthoredScene[]> {
  const { min, max } = targetSceneCount(direction, input);
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's elite cinematic sequence author.",
        "Write the experience as separate viewer-facing scene messages that play sequentially like a miniature film.",
        `Create between ${min} and ${max} scenes, then stop when the story has earned its ending.`,
        "IMPORTANT QRE RULE: one scene equals one short thought. Short describes each scene, not the total experience.",
        "Typical scene text is one striking line or 1–2 short sentences. Prefer 5–18 words. Rarely exceed 28 words.",
        "Every scene must change the viewer's state: reveal, movement, anticipation, contrast, escalation, transformation, realization, payoff, or afterglow.",
        "Do not pack several independent facts into one scene when they can become separate beats.",
        "Do not repeat the same subject-led sentence opening in consecutive scenes.",
        "Do not summarize the entire experience in scene one.",
        "Do not put the original authoring instruction into any scene.",
        "Do not mention QRE, AI, prompts, compilers, cognition, metadata, models, or the writing process.",
        direction.intent === "promotion"
          ? "PROMOTIONAL MODE: invent a memorable fictionalized mini-story around the service. Never invent real business claims. Make it attention-grabbing without sounding like a generic ad."
          : "GROUNDED MODE: preserve supplied factual reality. Invent language and interpretation, not concrete factual events.",
        "Use metaphor, personification, contrast, understatement, escalation, callbacks, reversals, and implication when they genuinely fit.",
        "Avoid generic filler such as beautiful, magical, unforgettable, cinematic, amazing, incredible, or epic unless the specific supplied material earns it.",
        "Do not explain the joke, emotion, metaphor, or ending.",
        `SEQUENCE SHAPE: ${direction.sequenceShape.join(" → ")}`,
        `EMOTIONAL ENGINE: ${direction.emotionalEngine}`,
        `ATTENTION GOAL: ${direction.attentionGoal}`,
        `ENDING MOVE: ${direction.endingMove}`,
        `STRONGEST DETAIL: ${direction.strongestDetail}`,
        `AVOID: ${direction.avoid.join(", ")}`,
        "Return strict JSON only: {\"scenes\":[{\"text\":\"...\",\"kind\":\"hook|setup|movement|discovery|escalation|transformation|realization|payoff|afterglow\",\"durationHintMs\":number,\"transitionHint\":\"none|fade|slide|zoom|cinematic|flash\",\"audioMood\":\"...\",\"visualHint\":\"...\"}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: input.prompt,
        subject: input.subject ?? "",
        place: input.place ?? "",
        facts: unique(input.facts, 40),
        sourceMoments: unique(input.sourceMoments, 24),
        memoryContext: unique(input.memoryContext ?? [], 20),
        learnedCreativePreferences: unique(input.creativeLearningContext ?? [], 20),
      }),
    },
  ], "json");

  const parsed = parseJson<SceneDraft>(result.text);
  const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalizeScenes(scenes.map((scene) => ({
    text: cleanText(scene?.text),
    kind: cleanText(scene?.kind) || "movement",
    durationHintMs: typeof scene?.durationHintMs === "number" ? scene.durationHintMs : undefined,
    transitionHint: cleanText(scene?.transitionHint) as AuthoredScene["transitionHint"],
    audioMood: cleanText(scene?.audioMood) || undefined,
    visualHint: cleanText(scene?.visualHint) || undefined,
  }))).slice(0, max);
}

async function critiqueSequence(input: CinematicAuthorInput, direction: CreativeDirection, scenes: AuthoredScene[]): Promise<SceneCritique | null> {
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's ruthless cinematic editor.",
        "Do not rewrite the scenes. Diagnose them.",
        "Check for instruction leakage, metadata leakage, unsupported concrete details in grounded mode, generic/cliche language, repeated openings, repeated ideas, weak pacing, missing turn, premature payoff, weak ending, and scenes too long to read as a cinematic slide.",
        "A strong sequence moves. If adjacent scenes only restate each other, flag them.",
        "A strong ending should feel earned from the material, not tacked on.",
        "Check the one-short-thought-per-scene rule explicitly.",
        "Return strict JSON: score, problems, repeats, instructionLeaks, unsupportedDetails, weakScenes, revision.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify({ direction, prompt: input.prompt, facts: unique(input.facts, 40), sourceMoments: unique(input.sourceMoments, 24), scenes }) },
  ], "json");
  return parseJson<SceneCritique>(result.text);
}

async function reviseSequence(input: CinematicAuthorInput, direction: CreativeDirection, scenes: AuthoredScene[], critique: SceneCritique): Promise<AuthoredScene[]> {
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's elite revision editor.",
        "Rewrite only as needed to make the sequence substantially stronger.",
        "Preserve supported facts and strong existing lines.",
        "Delete unsupported concrete details rather than replacing them with other invented details in grounded mode.",
        "Fix repeated openings and repeated ideas.",
        "Break overlong prose into short screen-ready beats.",
        "Keep one thought per scene. Never create a paragraph scene.",
        "Strengthen trajectory and make the final scene earn its place.",
        "Do not explain jokes, emotions, metaphors, or the ending.",
        "Return strict JSON with the same scene shape as the drafting call.",
      ].join(" "),
    },
    { role: "user", content: JSON.stringify({ direction, prompt: input.prompt, facts: unique(input.facts, 40), sourceMoments: unique(input.sourceMoments, 24), scenes, critique }) },
  ], "json");
  const parsed = parseJson<SceneDraft>(result.text);
  const revised = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return finalizeScenes(revised.map((scene) => ({
    text: cleanText(scene?.text),
    kind: cleanText(scene?.kind) || "movement",
    durationHintMs: typeof scene?.durationHintMs === "number" ? scene.durationHintMs : undefined,
    transitionHint: cleanText(scene?.transitionHint) as AuthoredScene["transitionHint"],
    audioMood: cleanText(scene?.audioMood) || undefined,
    visualHint: cleanText(scene?.visualHint) || undefined,
  })));
}

export async function authorCinematicSequence(input: CinematicAuthorInput): Promise<AuthoredScene[]> {
  if (!enabled()) return [];

  const fallback = inferDirection(input);
  const direction = await planDirection(input, fallback);
  let scenes = await draftSequence(input, direction);
  if (scenes.length < 3) return [];

  const critique = await critiqueSequence(input, direction, scenes);
  if (critique && (critique.score < 8 || critique.problems.length || critique.repeats.length || critique.instructionLeaks.length || critique.unsupportedDetails.length || critique.weakScenes.length)) {
    const revised = await reviseSequence(input, direction, scenes, critique);
    if (revised.length >= 3) scenes = revised;
  }

  return scenes;
}
