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
const MOOD_ONLY = /^(?:electric magic|late-night vibes|happy heart|grooming terror|pink bow panic|treats soothe|proud walk|new normal|pure joy|breathtaking bass|magical moment|beautiful moment|unforgettable moment|good vibes|happy ending|so much fun|love wins|dream come true|full of joy|full of magic|pure magic)$/i;
const ACTION_WORDS = /\b(?:arrives?|returns?|enters?|spots?|sees?|freezes?|stops?|turns?|moves?|slams?|breaks?|flies?|lands?|falls?|runs?|jumps?|dances?|spins?|conquers?|defeats?|surrenders?|loses?|wins?|changes?|shifts?|opens?|closes?|keeps?|continues?|ignores?|refuses?|accepts?|reconsiders?|backs?|stays?|leaves?|appears?|vanishes?|hits?|shakes?|barks?|wags?|sniffs?|blinks?|laughs?|talks?|drinks?|pours?|spills?|cracks?|rings?|echoes?)\b/i;

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
  if (index === total - 2) return "turn";
  if (index === 0) return "jolt";
  return "jolt";
}

function isStretchDomain(input: MicroBeatMouthInput): boolean {
  const value = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  return /\b(?:service|receipt|clean|cleaning|groom|grooming|horror|dinner|knife|knives|glass|door|rave|concert|festival|event)\b/i.test(value);
}

function desiredBeatCount(input: MicroBeatMouthInput): number {
  return isStretchDomain(input) ? 5 : 4;
}

function validBeat(text: string): boolean {
  const value = clean(text);
  const count = words(value).length;
  if (!value || count < 1 || count > 7 || CHAIN.test(value) || META.test(value)) return false;
  if (MOOD_ONLY.test(value)) return false;
  return count <= 2 || ACTION_WORDS.test(value) || /[!?]/.test(value);
}

function fallbackBeats(input: MicroBeatMouthInput): ExperienceBeat[] {
  const source = [...input.sourceMoments, ...input.facts, ...(input.memoryContext ?? [])]
    .map(clean)
    .filter(Boolean);
  const candidates = source.flatMap(sentenceParts).map((value) => trimToWordCeiling(value, 5));
  const unique = [...new Set(candidates)].filter(validBeat);
  const needed = desiredBeatCount(input);
  const subject = clean(input.subject);
  const seed = unique.slice(0, Math.max(needed - 1, 3));
  if (subject && seed.length < 3) seed.unshift(`${subject} returns`);
  while (seed.length < needed - 1) seed.push(seed.length === 0 ? "Something changes" : "Then it shifts");
  const payoff = input.presence?.isReturning ? "We're back." : "See you next time.";
  return [...seed.slice(0, needed - 1), payoff].map((text, index, all) => ({
    id: `micro-beat-${index + 1}`,
    text,
    kind: index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "jolt",
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
  const beatCount = desiredBeatCount(input);
  const stretch = beatCount > 4;

  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's final micro-beat mouth.",
        "The cognitive system has already decided the angle. You do NOT invent a new premise.",
        "Your job is compression, timing, attitude, continuity, concrete change, and payoff.",
        `Write exactly ${beatCount} beats: JOLT → ${beatCount > 4 ? "JOLT → JOLT → TURN → PAYOFF" : "JOLT → JOLT → PAYOFF"}.`,
        "Each beat is ONE thought and ONE perceptible change.",
        "Target 2–4 words per beat.",
        "Hard ceiling: 7 words per beat.",
        "Never exceed 7 words.",
        "Never use pipes, semicolon chains, parentheses, explanations, or paragraphs.",
        "Do not narrate what an uploaded image already makes obvious.",
        "Use text for attitude, tension, timing, contrast, callback, meaning, action, or surprise.",
        "Never spend a beat merely naming a noun, timestamp, place, or mood when it can perform a change.",
        "Reject vague mood-only language such as 'electric magic', 'late-night vibes', 'happy heart', 'grooming terror', or 'breathtaking bass'.",
        "Compress the sentence, NOT the idea.",
        "Every beat must change physical state, status, information, expectation, relationship, or trajectory.",
        "Use the strongest contradiction instead of generic emotional progression.",
        "Round 2+ means history exists: callback to a known quirk instead of reintroducing the character.",
        "Presence history may establish return, place, or time. Never invent an exact location or event that is not supplied by Presence or source facts.",
        "GROUNDING RULE: never turn a creative affordance into a concrete factual event.",
        stretch ? "STRETCH MODE: this domain may use the fifth beat to land an action or escalation; keep every beat tight." : "COMPACT MODE: four strong beats are preferred.",
        "PAYOFF must land the same thread created by the first beats.",
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
        requestedBeatCount: beatCount,
      }),
    },
  ], "json");

  let parsed: BeatDraft | null = null;
  try {
    parsed = JSON.parse(result.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as BeatDraft;
  } catch {
    parsed = null;
  }

  const raw = Array.isArray(parsed?.beats) ? parsed.beats : [];
  const beats = raw
    .map((beat, index) => ({
      text: trimToWordCeiling(beat.text ?? "", 7),
      kind: normalizeKind(beat.kind, index, raw.length || beatCount),
      attentionRole: clean(beat.attentionRole) || undefined,
      operator: clean(beat.operator) || undefined,
      callback: beat.callback === true,
    }))
    .filter((beat) => validBeat(beat.text));

  const candidate = beats.slice(0, beatCount);
  const repaired = candidate.length >= beatCount ? candidate : fallbackBeats(input);
  const final = repaired.length >= beatCount ? repaired.slice(0, beatCount) : fallbackBeats(input).slice(0, beatCount);

  return final.map((beat, index, all) => ({
    id: `micro-beat-${index + 1}`,
    text: trimToWordCeiling(beat.text, 7),
    kind: index === all.length - 1 ? "payoff" : index === all.length - 2 && beatCount > 4 ? "turn" : beat.kind,
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
      stretchMode: stretch,
    },
  }));
}
