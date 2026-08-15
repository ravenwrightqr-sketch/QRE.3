import { localModelGenerate } from "./localModelRuntime.js";
import type { ExperienceBeat, ExperiencePresenceContext } from "@qre/contracts";

export type MicroBeatMouthInput = {
  prompt: string;
  subject?: string;
  place?: string;
  lens?: string;
  facts: string[];
  sourceMoments: string[];
  memoryContext?: string[];
  creativeLearningContext?: string[];
  trajectory?: string[];
  presence?: ExperiencePresenceContext;
  round?: number;
};

type BeatDraft = {
  beats?: Array<{
    text?: string;
    kind?: string;
    attentionRole?: string;
    operator?: string;
    callback?: boolean;
  }>;
};

const ALLOWED_KINDS = new Set(["jolt", "reveal", "turn", "payoff", "afterglow"]);
const META = /\b(?:qre|ai|prompt|compiler|cognition|metadata|model|instruction|scene rule|beat rule)\b/i;
const CHAIN = /[|;]/;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(text: string): string[] {
  return clean(text).split(/\s+/).filter(Boolean);
}

function sentenceParts(text: string): string[] {
  return clean(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.replace(/^[\[\](){}]+|[.!?]+$/g, "").trim())
    .filter(Boolean);
}

function trimToWordCeiling(text: string, maxWords = 7): string {
  const value = clean(text);
  const parts = sentenceParts(value);
  const candidate = parts[0] ?? value;
  const ws = words(candidate);
  return ws.length <= maxWords ? candidate : ws.slice(0, maxWords).join(" ");
}

function normalizeKind(kind: unknown, index: number, total: number): ExperienceBeat["kind"] {
  const normalized = clean(kind).toLowerCase();
  if (ALLOWED_KINDS.has(normalized)) return normalized as ExperienceBeat["kind"];
  if (index === total - 1) return "payoff";
  if (index === 0) return "jolt";
  if (index === total - 2) return "turn";
  return "jolt";
}

function validBeat(text: string): boolean {
  const value = clean(text);
  const count = words(value).length;
  return Boolean(value) && count >= 1 && count <= 7 && !CHAIN.test(value) && !META.test(value);
}

function fallbackBeats(input: MicroBeatMouthInput): ExperienceBeat[] {
  const source = [...input.sourceMoments, ...input.facts, ...(input.memoryContext ?? [])]
    .map(clean)
    .filter(Boolean);
  const candidates = source.flatMap(sentenceParts).map((value) => trimToWordCeiling(value, 5));
  const unique = [...new Set(candidates)].filter(validBeat);
  const seed = unique.slice(0, 3);
  const subject = clean(input.subject);
  if (subject && seed.length < 3) seed.unshift(`${subject} returns`);
  const payoff = input.presence?.isReturning ? "We're back." : "See you next time.";
  return [...seed.slice(0, 3), payoff].map((text, index, all) => ({
    id: `micro-beat-${index + 1}`,
    text,
    kind: index === all.length - 1 ? "payoff" : "jolt",
    order: index,
    attentionRole: index === all.length - 1 ? "payoff" : "attention_jolt",
    operator: index === all.length - 1 ? "payoff" : "compression",
    callback: Boolean(input.presence?.isReturning && index === 0),
    durationHintMs: index === all.length - 1 ? 1800 : 1200,
  }));
}

export async function authorMicroBeats(input: MicroBeatMouthInput): Promise<ExperienceBeat[]> {
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return fallbackBeats(input);

  const presenceSummary = input.presence?.summary ?? [];
  const returning = input.presence?.isReturning === true;
  const visitNumber = input.presence?.visitNumber;
  const round = input.round ?? (returning ? visitNumber ?? 2 : 1);

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's final micro-beat mouth.",
        "The cognitive system has already decided the angle. You do NOT invent a new premise.",
        "Your job is compression, timing, attitude, continuity, and payoff.",
        "Write 4 beats by default: JOLT, JOLT, JOLT, PAYOFF.",
        "Each beat is ONE thought and ONE perceptible change.",
        "Target 2–4 words per beat.",
        "Hard ceiling: 7 words per beat.",
        "Never exceed 7 words.",
        "Never use pipes, semicolon chains, parentheses, explanations, or paragraphs.",
        "Do not narrate what an uploaded image already makes obvious.",
        "Use text for attitude, tension, timing, contrast, callback, meaning, or surprise.",
        "Use the strongest contradiction instead of generic emotional progression.",
        "Round 2+ means history exists: callback to a known quirk instead of reintroducing the character.",
        "Presence history may establish return, place, or time. Never invent an exact location or event that is not supplied by Presence or source facts.",
        "GROUNDING RULE: never turn a creative affordance into a concrete factual event.",
        "PAYOFF must land the same thread created by the first three beats.",
        "The final line can be extremely short.",
        "Return strict JSON only.",
        "Schema: {\"beats\":[{\"text\":\"...\",\"kind\":\"jolt|reveal|turn|payoff|afterglow\",\"attentionRole\":\"...\",\"operator\":\"...\",\"callback\":true}]}.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        prompt: clean(input.prompt),
        subject: clean(input.subject),
        place: clean(input.place),
        lens: clean(input.lens),
        facts: input.facts.map(clean).filter(Boolean).slice(0, 40),
        sourceMoments: input.sourceMoments.map(clean).filter(Boolean).slice(0, 24),
        memoryContext: (input.memoryContext ?? []).map(clean).filter(Boolean).slice(0, 24),
        creativeLearningContext: (input.creativeLearningContext ?? []).map(clean).filter(Boolean).slice(0, 24),
        trajectory: (input.trajectory ?? []).map(clean).filter(Boolean).slice(0, 24),
        presence: {
          returning,
          visitNumber: visitNumber ?? null,
          summary: presenceSummary.slice(0, 12),
          places: (input.presence?.places ?? []).slice(0, 12),
          firstSeenAt: input.presence?.firstSeenAt ?? null,
          lastSeenAt: input.presence?.lastSeenAt ?? null,
        },
        round,
      }),
    },
  ], "json");

  const parsed = JSON.parse(result.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as BeatDraft;
  const raw = Array.isArray(parsed.beats) ? parsed.beats : [];
  const beats = raw
    .map((beat, index) => ({
      text: trimToWordCeiling(beat.text ?? "", 7),
      kind: normalizeKind(beat.kind, index, raw.length || 4),
      attentionRole: clean(beat.attentionRole) || undefined,
      operator: clean(beat.operator) || undefined,
      callback: beat.callback === true,
    }))
    .filter((beat) => validBeat(beat.text));

  const repaired = beats.length >= 4 ? beats.slice(0, 6) : fallbackBeats(input);
  const final = repaired.length >= 4 ? repaired : fallbackBeats(input);

  return final.map((beat, index, all) => ({
    id: beat.id ?? `micro-beat-${index + 1}`,
    text: trimToWordCeiling(beat.text, 7),
    kind: index === all.length - 1 ? "payoff" : beat.kind,
    order: index,
    attentionRole: beat.attentionRole,
    operator: beat.operator,
    callback: beat.callback === true || (returning && index === 0),
    durationHintMs: index === all.length - 1 ? 1800 : 1200,
    meta: {
      wordCount: words(beat.text).length,
      round,
      returning,
      visitNumber: visitNumber ?? null,
      source: "micro-beat-mouth",
    },
  }));
}
