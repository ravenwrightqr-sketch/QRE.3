import { localModelGenerate } from "./localModelRuntime.js";

export type CreativeSeedKind = "person" | "subject" | "place" | "time" | "moment" | "detail" | "feeling" | "style" | "audience" | "ending" | "media" | "custom";

export type CreativeSeed = {
  id: string;
  label: string;
  kind: CreativeSeedKind;
  options: string[];
  placeholder?: string;
  optional?: boolean;
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

function fallbackPlan(prompt: string): CreativeSeedPlan {
  const p = prompt.toLowerCase();
  const promotional = /\b(create|make|build|generate|produce|write|turn)\b/.test(p) && /\b(video|ad|commercial|promo|business|brand|service|groom|restaurant|salon|clean|real estate|property)\b/.test(p);
  const memory = /\b(memory|remember|wedding|anniversary|trip|rave|concert|family|grandma|childhood|vacation)\b/.test(p);
  const event = /\b(wedding|party|event|birthday|festival|ceremony)\b/.test(p);
  const mode: CreativeSeedPlan["mode"] = promotional ? "service_promo" : memory ? "memory" : event ? "event" : /\b(business|restaurant|shop|brand)\b/.test(p) ? "business" : "personal";

  if (mode === "service_promo") {
    return {
      mode,
      title: "Make it yours.",
      prompt,
      seeds: [
        { id: "subject", label: "Who's in it?", kind: "subject", options: ["a dog", "a person", "a family"], placeholder: "Coco", optional: true },
        { id: "moment", label: "What's the moment?", kind: "moment", options: ["arrival", "the service", "the transformation"], placeholder: "Coco arrives nervous", optional: true },
        { id: "detail", label: "Give it one detail.", kind: "detail", options: ["a blue bow", "a surprise", "a little chaos"], placeholder: "blue bow", optional: true },
        { id: "style", label: "What should it feel like?", kind: "style", options: ["funny", "fierce", "sweet", "unexpected"], optional: true },
        { id: "ending", label: "How should it land?", kind: "ending", options: ["transformed", "fierce", "laugh out loud", "want to book"], optional: true },
      ],
      skipLabel: "JUST MAKE IT",
      continueLabel: "MAKE IT",
    };
  }

  if (mode === "memory" || mode === "event") {
    return {
      mode,
      title: "Add a few sparks.",
      prompt,
      seeds: [
        { id: "person", label: "Who matters?", kind: "person", options: ["me", "us", "family", "friends"], placeholder: "Who was there?", optional: true },
        { id: "place", label: "Where was it?", kind: "place", options: ["home", "beach", "restaurant", "venue"], placeholder: "Name the place", optional: true },
        { id: "moment", label: "What do you remember?", kind: "moment", options: ["the beginning", "the unexpected part", "the part everyone remembers"], placeholder: "Write one moment", optional: true },
        { id: "detail", label: "One tiny detail.", kind: "detail", options: ["a photo", "something someone said", "something ridiculous", "a sound"], placeholder: "The detail you still see", optional: true },
        { id: "feeling", label: "Leave us with…", kind: "feeling", options: ["warmth", "laughter", "wonder", "goosebumps"], optional: true },
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
      { id: "subject", label: "What's at the center?", kind: "subject", options: ["a person", "a place", "a product", "a moment"], placeholder: "Name it", optional: true },
      { id: "moment", label: "What happens?", kind: "moment", options: ["arrival", "change", "discovery", "surprise"], placeholder: "What happens?", optional: true },
      { id: "detail", label: "What's the memorable detail?", kind: "detail", options: ["something visual", "something funny", "something unexpected"], placeholder: "Add one detail", optional: true },
      { id: "style", label: "Pick a feeling.", kind: "style", options: ["funny", "romantic", "dark", "fierce", "warm"], optional: true },
      { id: "ending", label: "Where should it land?", kind: "ending", options: ["reveal", "payoff", "transformation", "afterglow"], optional: true },
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
      options: Array.isArray(seed?.options) ? seed.options.map(clean).filter(Boolean).slice(0, 8) : [],
      placeholder: clean(seed?.placeholder) || undefined,
      optional: seed?.optional !== false,
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
          "Never create an industry-specific form. Infer the creation mode yourself.",
          "Possible modes: memory, service_promo, business, event, personal, artifact, unknown.",
          "Ask for at most 5 useful things. Prefer tappable options plus an optional one-line field.",
          "Questions should feel playful and creative, not administrative.",
          "Do not ask for information QRE can already infer from the prompt.",
          "A service promotion may need subject, memorable detail, style, transformation, ending.",
          "A memory may need person, place, moment, tiny detail, feeling.",
          "A business/artifact may need what it is, why it matters, memorable detail, audience, desired effect.",
          "An event may need who, place, standout moment, atmosphere, final feeling.",
          "The user must be able to skip everything and let QRE create freely.",
          "Return strict JSON: mode, title, prompt, seeds[], skipLabel, continueLabel.",
          "Each seed: id, label, kind, options[], placeholder?, optional.",
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ prompt: source, fallbackMode: fallback.mode }) },
    ], "json");
    const parsed = parseJson(result.text);
    if (!parsed || parsed.seeds.length === 0) return fallback;
    return { ...fallback, ...parsed, prompt: source, seeds: parsed.seeds };
  } catch {
    return fallback;
  }
}
