import { localModelGenerate } from "./localModelRuntime.js";

type LearnedWebsiteWorld = {
  businessName: string;
  businessType: string;
  description: string;
  services: string[];
  differentiators: string[];
  signals: string[];
  subjectKinds: string[];
  importantFacts: string[];
};

type UnknownRecord = Record<string, unknown>;

function aiEnabled(): boolean {
  return process.env.QRE_AI_ENABLED === "true";
}

function localEnabled(): boolean {
  return aiEnabled() && process.env.QRE_EXTERNAL_AI_ENABLED !== "true";
}

function externalEnabled(): boolean {
  return aiEnabled() && process.env.QRE_EXTERNAL_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function stringArray(value: unknown, limit: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, limit)
    : [];
}

function normalizeWorld(value: LearnedWebsiteWorld | null, fallbackName = ""): LearnedWebsiteWorld {
  return {
    businessName: String(value?.businessName ?? fallbackName).trim(),
    businessType: String(value?.businessType ?? "").trim(),
    description: String(value?.description ?? "").trim(),
    services: stringArray(value?.services, 32),
    differentiators: stringArray(value?.differentiators, 24),
    signals: stringArray(value?.signals, 32),
    subjectKinds: stringArray(value?.subjectKinds, 16),
    importantFacts: stringArray(value?.importantFacts, 32),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(url: string, content: string, ownerDescription?: string): string {
  return JSON.stringify({
    task: "Learn the business world described by this website.",
    source: {
      url,
      ownerDescription: ownerDescription ?? "",
      websiteText: content.slice(0, 30000),
    },
    rules: [
      "Extract only information supported by the website or owner description.",
      "This is knowledge acquisition, not creative writing.",
      "Do not invent services, locations, people, claims, prices, outcomes, certifications, or customer reactions.",
      "Return a compact reusable world model so a downstream cognition system can understand the business context.",
      "Preserve distinctive phrases only when they are genuinely stated or clearly supported by the source.",
    ],
    output: {
      businessName: "string",
      businessType: "string",
      description: "string",
      services: ["string"],
      differentiators: ["string"],
      signals: ["string"],
      subjectKinds: ["string"],
      importantFacts: ["string"],
    },
  });
}

function extractExternalOutput(data: unknown): string {
  const root = asRecord(data);
  if (!root) return "";
  if (typeof root.output_text === "string") return root.output_text;
  const output = root.output;
  if (!Array.isArray(output)) return "";
  const texts: string[] = [];
  for (const item of output) {
    const itemRecord = asRecord(item);
    if (!itemRecord || !Array.isArray(itemRecord.content)) continue;
    for (const part of itemRecord.content) {
      const partRecord = asRecord(part);
      if (partRecord && typeof partRecord.text === "string") texts.push(partRecord.text);
    }
  }
  return texts.join("\n");
}

async function externalLearn(system: string, user: string): Promise<LearnedWebsiteWorld | null> {
  if (!externalEnabled()) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.QRE_AI_MODEL || "gpt-5",
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: user }] },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Website learning AI failed (${response.status})`);
  const data: unknown = await response.json();
  return normalizeWorld(parseJson<LearnedWebsiteWorld>(extractExternalOutput(data)));
}

export async function learnWebsiteWorld(input: { url: string; ownerDescription?: string }): Promise<{
  url: string;
  title: string;
  world: LearnedWebsiteWorld;
  sourceExcerpt: string;
}> {
  if (!/^https?:\/\//i.test(input.url)) throw new Error("Website URL must start with http:// or https://");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(input.url, {
      signal: controller.signal,
      headers: { "User-Agent": "QRE-Learning/0.1 (+https://qre.local)" },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`);
  const html = await response.text();
  const sourceExcerpt = stripHtml(html).slice(0, 30000);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "";
  if (!sourceExcerpt) throw new Error("No readable website content was found.");
  if (!aiEnabled()) throw new Error("AI learning is not configured.");

  const system = [
    "You are QRE's universal knowledge learner.",
    "Your job is to learn what a source says about a real-world business so another system can reason over it later.",
    "Never write an experience and never invent missing facts.",
    "Return strict JSON only with keys: businessName, businessType, description, services, differentiators, signals, subjectKinds, importantFacts.",
  ].join(" ");

  const user = buildPrompt(input.url, sourceExcerpt, input.ownerDescription);
  const learned = localEnabled()
    ? normalizeWorld(parseJson<LearnedWebsiteWorld>((await localModelGenerate([
        { role: "system", content: system },
        { role: "user", content: user },
      ], "json")).text))
    : await externalLearn(system, user);

  if (!learned) throw new Error("AI could not produce a valid business world model.");
  return {
    url: input.url,
    title,
    world: learned,
    sourceExcerpt: sourceExcerpt.slice(0, 4000),
  };
}
