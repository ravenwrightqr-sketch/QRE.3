import { localModelGenerate } from "./localModelRuntime.js";

export type CreativeSeedKind = "person" | "subject" | "place" | "time" | "moment" | "detail" | "feeling" | "style" | "vibe" | "audience" | "ending" | "media" | "custom";

export type CreativeSeed = {
  id: string;
  label: string;
  kind: CreativeSeedKind;
  options: string[];
  placeholder?: string;
  optional?: boolean;
  multi?: boolean;
};

export type CreativeSeedPlan = {
  mode: "memory" | "service_promo" | "business" | "event" | "personal" | "artifact" | "unknown";
  title: string;
  prompt: string;
  seeds: CreativeSeed[];
  skipLabel: string;
  continueLabel: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

const universalVibes = [
  "funny",
  "romantic",
  "fierce",
  "heartwarming",
  "nostalgic",
  "mysterious",
  "horror",
  "thrilling",
  "dark",
  "demented",
  "playful",
  "dreamlike",
  "chaotic",
  "cinematic",
];

function vibeSeed(): CreativeSeed {
  return {
    id: "vibe",
    label: "What kind of energy?",
    kind: "vibe",
    options: universalVibes,
    placeholder: "Anything goes…",
    optional: true,
    multi: true,
  };
}

function fallbackPlan(prompt: string): CreativeSeedPlan {
  const p = prompt.toLowerCase();
  const promotional = /\b(create|make|build|generate|produce|write|turn)\b/.test(p) && /\b(video|ad|commercial|promo|business|brand|service|groom|restaurant|salon|clean|real estate|property|dispensary)\b/.test(p);
  const memory = /\b(memory|remember|wedding|anniversary|trip|rave|concert|family|grandma|childhood|vacation|pet)\b/.test(p);
  const event = /\b(wedding|party|event|birthday|festival|ceremony|reunion)\b/.test(p);
  const mode: CreativeSeedPlan["mode"] = promotional ? "service_promo" : memory ? "memory" : event ? "event" : /\b(business|restaurant|shop|brand|dispensary|company)\b/.test(p) ? "business" : "personal";

  if (mode === "service_promo") {
    return {
      mode,
      title: "Give it a little life.",
      prompt,
      seeds: [
        { id: "subject", label: "Who or what is the star?", kind: "subject", options: ["a dog", "a person", "a family", "the customer"], placeholder: "Coco", optional: true },
        { id: "moment", label: "What should we see happen?", kind: "moment", options: ["arrival", "the service", "a surprise", "the transformation"], placeholder: "Coco arrives nervous", optional: true },
        { id: "detail", label: "Give it one sticky detail.", kind: "detail", options: ["a blue bow", "a weird moment", "a little chaos", "the thing nobody expects"], placeholder: "blue bow", optional: true },
        vibeSeed(),
        { id: "ending", label: "How should people feel at the end?", kind: "ending", options: ["laughing", "impressed", "wanting to book", "that was cool", "I need this"], optional: true },
      ],
      skipLabel: "JUST MAKE IT",
      continueLabel: "MAKE IT",
    };
  }

  if (mode === "memory" || mode === "event") {
    return {
      mode,
      title: "Add the pieces that matter.",
      prompt,
      seeds: [
        { id: "person", label: "Who matters?", kind: "person", options: ["me", "us", "family", "friends", "everyone"], placeholder: "Who was there?", optional: true },
        { id: "place", label: "Where did this live?", kind: "place", options: ["home", "beach", "restaurant", "venue", "somewhere else"], placeholder: "Name the place", optional: true },
        { id: "moment", label: "What do you remember?", kind: "moment", options: ["the beginning", "the unexpected part", "the part everyone remembers", "what happened after"], placeholder: "Write one moment", optional: true },
        { id: "detail", label: "What's the tiny thing you still remember?", kind: "detail", options: ["a photo", "something someone said", "something ridiculous", "a sound", "a look"], placeholder: "The detail you still see", optional: true },
        vibeSeed(),
      ],
      skipLabel: "JUST MAKE IT",
      continueLabel: "BRING IT TO LIFE",
    };
  }

  return {
    mode,
    title: "Give QRE a few sparks.",
    prompt,
    seeds: [
      { id: "subject", label: "What's at the center?", kind: "subject", options: ["a person", "a place", "a product", "a moment", "the customer"], placeholder: "Name it", optional: true },
      { id: "moment", label: "What's the thing we should watch happen?", kind: "moment", options: ["arrival", "change", "discovery", "surprise", "transformation"], placeholder: "What happens?", optional: true },
      { id: "detail", label: "What's the memorable detail?", kind: "detail", options: ["something visual", "something funny", "something unexpected", "something personal"], placeholder: "Add one detail", optional: true },
      vibeSeed(),
      { id: "ending", label: "Where should it land?", kind: "ending", options: ["reveal", "laugh", "payoff", "transformation", "afterglow", "call to action"], optional: true },
    ],
    skipLabel: "JUST MAKE IT",
    continueLabel: "MAKE IT",
  };
}

function parseJson(text: string): CreativeSeedPlan | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.seeds)) return null;
    const seeds = parsed.seeds.map((seed: any, index: number) => ({
      id: clean(seed?.id) || `seed-${index + 1}`,
      label: clean(seed?.label) || `Idea ${index + 1}`,
      kind: clean(seed?.kind) || "custom",
      options: Array.isArray(seed?.options) ? seed.options.map(clean).filter(Boolean).slice(0, 12) : [],
      placeholder: clean(seed?.placeholder) || undefined,
      optional: seed?.optional !== false,
      multi: seed?.multi === true,
    })).filter((seed: CreativeSeed) => seed.options.length > 0 || seed.placeholder);
    return {
      mode: clean(parsed.mode) as CreativeSeedPlan["mode"],
      title: clean(parsed.title) || "Add a few sparks.",
      prompt: clean(parsed.prompt),
      seeds: seeds.slice(0, 6),
      skipLabel: clean(parsed.skipLabel) || "JUST MAKE IT",
      continueLabel: clean(parsed.continueLabel) || "MAKE IT",
    };
  } catch {
    return null;
  }
}

export async function buildCreativeSeedPlan(prompt: string): Promise<CreativeSeedPlan> {
  const source = clean(prompt);
  const fallback = fallbackPlan(source);
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return fallback;

  try {
    const result = await localModelGenerate([
      {
        role: "system",
        content: [
          "You are QRE's universal creative intake designer.",
          "The user has already told QRE what they want to create. Your job is to design a tiny, fast, Apple-simple second screen that asks only for the highest-value creative ingredients that would make the result dramatically better.",
          "Never create an industry-specific form. Infer the creation mode yourself from the user's language and context.",
          "Possible modes: memory, service_promo, business, event, personal, artifact, unknown.",
          "Ask for at most 5 useful things plus an optional universal vibe selector.",
          "Questions should feel playful, creative, and tappable—not administrative.",
          "Do not ask for information QRE can already infer from the prompt.",
          "Prefer a mix of fast chips and one optional free-text field.",
          "A service promotion may need subject, memorable detail, transformation, ending, and vibe.",
          "A memory may need person, place, moment, tiny detail, and vibe.",
          "A business/artifact may need what it is, why it matters, memorable detail, audience, desired effect, and vibe.",
          "An event may need who, place, standout moment, atmosphere, final feeling, and vibe.",
          "Always consider whether a vibe selector can unlock creativity; do not force it if the prompt already specifies tone.",
          "Vibe vocabulary can include romantic, funny, horror, thrilling, demented, dark, fierce, nostalgic, playful, dreamlike, chaotic, warm, mysterious, cinematic, or a better context-specific alternative.",
          "The user must be able to skip everything and let QRE create freely.",
          "Return strict JSON: mode, title, prompt, seeds[], skipLabel, continueLabel.",
          "Each seed: id, label, kind, options[], placeholder?, optional?, multi?.",
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ prompt: source, fallbackMode: fallback.mode, universalVibes }) },
    ], "json");
    const parsed = parseJson(result.text);
    if (!parsed || parsed.seeds.length === 0) return fallback;
    return { ...fallback, ...parsed, prompt: source, seeds: parsed.seeds };
  } catch {
    return fallback;
  }
}
