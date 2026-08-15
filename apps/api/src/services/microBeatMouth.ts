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
const STATUS_WORDS = /\b(?:again|back|next|ready|gone|still|finally|already|proud|quiet|louder|closer|farther|faster|slower|caught|free|safe|stuck|waiting|winning|losing|defeated|conquered|surrendered|refused|accepted|changed|different)\b/i;
const NOUN_ONLY = /^(?:dinner|wine|conversation|rave|bass|bathrooms?|kitchen|laundry|grooming|bow|bows|treats?|fear|joy|magic|vibes?|night|morning|afternoon|evening|house|home|water|glass|knives?|chairs?|mirror|party|friends?|music|salon|poodle|dog|tag)$/i;

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
  if (!value || count > 7 || CHAIN.test(value) || META.test(value)) return false;
  if (MOOD_ONLY.test(value)) return false;
  if (count === 1) return ACTION_WORDS.test(value) && !NOUN_ONLY.test(value);
  if (count === 2) return ACTION_WORDS.test(value) || STATUS_WORDS.test(value) || /[!?]/.test(value);
  return ACTION_WORDS.test(value) || STATUS_WORDS.test(value) || /[!?]/.test(value);
}

function fallbackBeats(input: MicroBeatMouthInput): ExperienceBeat[] {
  const source = [...input.sourceMoments, ...input.facts, ...(input.memoryContext ?? [])]
    .map(clean)
    .filter(Boolean);
  const candidates = source
    .flatMap(sentenceParts)
    .map((value) => trimToWordCeiling(value, 5));
  const unique = [...new Set(candidates)].filter(validBeat);
  const needed = desiredBeatCount(input);
  const subject = clean(input.subject);
  const seed = unique.slice(0, Math.max(needed - 1, 3));
  if (subject && seed.length < 3 && validBeat(`${subject} returns`)) seed.unshift(`${subject} returns`);
  if (seed.length < needed - 1) return [];
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

async function generateBeats(input: MicroBeatMouthInput, beatCount: number, stretch: boolean, rejected: string[] = []): Promise<BeatDraft | null> {
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
        "Your job is compression, timing, attitude, continuity, concrete change, and payoff.",
        `Write exactly ${beatCount} beats: ${beatCount > 4 ? "JOLT → JOLT → JOLT → TURN → PAYOFF" : "JOLT → JOLT → JOLT → PAYOFF"}.`,
        "Each beat is ONE thought and ONE perceptible change.",
        "Target 2–4 words per beat.",
        "Hard ceiling: 7 words per beat.",
        "Never exceed 7 words.",
        "Never use pipes, semicolon chains, parentheses, explanations, or paragraphs.",
        "Do not narrate what an uploaded image already makes obvious.",
        "Use text for attitude, tension, timing, contrast, callback, meaning, action, or surprise.",
        "Never spend a beat merely naming a noun, timestamp, place, or mood when it can perform a change.",
        "Reject vague mood-only language.",
        "Compress the sentence, NOT the idea.",
        "Every beat must change physical state, status, information, expectation, relationship, or trajectory.",
        "Use the strongest contradiction instead of generic emotional progression.",
        "Round 2+ means history exists: callback to a known quirk instead of reintroducing the character.",
        "Presence history may establish return, place, or time. Never invent an exact location or event that is not supplied by Presence or source facts.",
        "GROUNDING RULE: never turn a creative affordance into a concrete factual event.",
        stretch ? "STRETCH MODE: use the fifth beat only when it creates a real escalation or needed service/horror/event substance." : "COMPACT MODE: four strong beats are preferred.",
        rejected.length ? `REJECTED OUTPUTS — replace these with concrete state changes: ${rejected.join(" | ")}` : "",
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

  try {
    return JSON.parse(result.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()) as BeatDraft;
  } catch {
    return null;
  }
}

function normalizeDraft(input: MicroBeatMouthInput, parsed: BeatDraft | null, beatCount: number): ExperienceBeat[] {
  const raw = Array.isArray(parsed?.beats) ? parsed.beats : [];
  const returning = input.presence?.isReturning === true;
  const round = input.round ?? (returning ? input.presence?.visitNumber ?? 2 : 1);
  return raw
    .map((beat, index) => ({
      text: trimToWordCeiling(beat.text ?? "", 7),
      kind: normalizeKind(beat.kind, index, raw.length || beatCount),
      attentionRole: clean(beat.attentionRole) || undefined,
      operator: clean(beat.operator) || undefined,
      callback: beat.callback === true,
      order: index,
    }))
    .filter((beat) => validBeat(beat.text))
    .slice(0, beatCount)
    .map((beat, index, all) => ({
      id: `micro-beat-${index + 1}`,
      text: beat.text,
      kind: index === all.length - 1 ? "payoff" : index === all.length - 2 && beatCount > 4 ? "turn" : beat.kind,
      order: index,
      attentionRole: beat.attentionRole,
      operator: beat.operator,
      callback: beat.callback || (returning && index === 0),
      durationHintMs: index === all.length - 1 ? 1800 : 1200,
      meta: {
        wordCount: words(beat.text).length,
        round,
        returning,
        visitNumber: input.presence?.visitNumber ?? null,
        source: "micro-beat-mouth",
        stretchMode: beatCount > 4,
      },
    }));
}

export async function authorMicroBeats(input: MicroBeatMouthInput): Promise<ExperienceBeat[]> {
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return fallbackBeats(input);

  const beatCount = desiredBeatCount(input);
  const stretch = beatCount > 4;

  const first = normalizeDraft(input, await generateBeats(input, beatCount, stretch), beatCount);
  if (first.length === beatCount) return first;

  const rejected = first.map((beat) => beat.text).filter(Boolean);
  const repaired = normalizeDraft(input, await generateBeats(input, beatCount, stretch, rejected), beatCount);
  if (repaired.length === beatCount) return repaired;

  return fallbackBeats(input);
}
