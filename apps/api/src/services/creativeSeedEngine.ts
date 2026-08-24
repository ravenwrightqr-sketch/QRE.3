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
  return {
    mode: "unknown",
    title: "What would make this better?",
    prompt,
    seeds: [
      { id: "context", label: "What should QRE know?", kind: "custom", options: [], placeholder: "Add the person, place, job, object, event, or other context that matters.", optional: true },
      { id: "moment", label: "What matters most?", kind: "moment", options: [], placeholder: "Give QRE one important moment, fact, or change.", optional: true },
      { id: "detail", label: "One detail worth keeping.", kind: "detail", options: [], placeholder: "Add one specific detail.", optional: true },
      { id: "style", label: "How should it feel?", kind: "style", options: ["funny", "cinematic", "dark", "warm", "unexpected"], optional: true },
      { id: "ending", label: "How should it land?", kind: "ending", options: ["payoff", "reveal", "transformation", "quiet hit"], optional: true },
    ],
    skipLabel: "JUST MAKE IT",
    continueLabel: "CONTINUE",
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
      continueLabel: clean(parsed.continueLabel) || "CONTINUE",
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
          "You are QRE's universal creation-intake designer.",
          "The user has already said what they want to create. Never route the user into a hardcoded industry form.",
          "Infer the creation intent and design a tiny second screen that asks only for the minimum useful missing information.",
          "The missing context can be a person, client, property, job, pet, object, event, place, or anything else. Do not assume which.",
          "If a persistent subject/context is already named by the user, focus follow-up questions on facts that advance that same context.",
          "Ask at most 5 things. Prefer free text and small optional choices. Never insert stereotyped examples that imply unsupported reality.",
          "The user must always be able to skip and let QRE create from the supplied reality.",
          "Return strict JSON: mode, title, prompt, seeds[], skipLabel, continueLabel.",
          "Each seed: id, label, kind, options[], placeholder?, optional.",
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ prompt: source }) },
    ], "json");
    const parsed = parseJson(result.text);
    if (!parsed || parsed.seeds.length === 0) return fallback;
    return { ...fallback, ...parsed, prompt: source, seeds: parsed.seeds };
  } catch {
    return fallback;
  }
}
