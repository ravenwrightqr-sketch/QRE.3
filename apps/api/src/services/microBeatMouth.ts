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

// The mouth is not a part-of-speech parser. These are deliberately broad
// semantic signals: physical action, perception, thought, relationship,
// possession, change, recurrence, and state all count as movement when they
// alter what the viewer knows, expects, or feels.
const MOVEMENT_WORDS = /\b(?:am|are|be|became|becomes|been|being|breaks?|barks?|backs?|blinks?|caught|changes?|changed|closes?|conquers?|cracks?|dances?|defeats?|disappears?|drinks?|echoes?|enters?|falls?|feels?|flies?|freezes?|gets?|gives?|goes?|grabs?|hates?|has|have|hits?|jumps?|keeps?|knows?|lands?|laughs?|leaves?|likes?|loves?|loses?|looks?|meets?|moves?|opens?|passes?|pours?|pulls?|refuses?|remembers?|returns?|rings?|runs?|sees?|shakes?|shifts?|sits?|slams?|sniffs?|spills?|spots?|stares?|stays?|steals?|stops?|talks?|takes?|turns?|waits?|walks?|wants?|watches?|wags?|wins?|works?|appears?|vanishes?|surrenders?|accepts?|reconsiders?|continues?|ignores?|rejects?|offers?|starts?|keeps?|holds?|finds?|loses?|reveals?|follows?|follows?|fades?|rises?|drops?|keeps?|still|again|back|next|ready|gone|finally|already|proud|quiet|louder|closer|farther|faster|slower|caught|free|safe|stuck|waiting|winning|losing|defeated|conquered|surrendered|refused|accepted|different|afraid|nervous|calm|suspicious|angry|relieved|late|early|alive|dead)\b/i;
const VERB_LIKE = /\b(?:is|was|are|were|am|be|became|becomes|has|have|had|hates?|loves?|likes?|wants?|needs?|keeps?|stays?|leaves?|returns?|arrives?|enters?|spots?|sees?|finds?|steals?|walks?|runs?|dances?|moves?|turns?|breaks?|flies?|lands?|falls?|changes?|shifts?|opens?|closes?|refuses?|accepts?|remembers?|reveals?|waits?|watches?|talks?|laughs?|drinks?|pours?|spills?|cracks?|rings?|echoes?|slams?|throws?|grabs?|holds?|offers?|starts?|stops?|continues?|ignores?|appears?|vanishes?|barks?|wags?|sniffs?|blinks?|shakes?|jumps?|wins?|loses?|keeps?)\b/i;
const STATUS_WORDS = /\b(?:again|back|next|ready|gone|still|finally|already|proud|quiet|louder|closer|farther|faster|slower|caught|free|safe|stuck|waiting|winning|losing|defeated|conquered|surrendered|refused|accepted|changed|different|afraid|nervous|calm|suspicious|relieved|late|early|alive|dead)\b/i;
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

function hasMovement(value: string): boolean {
  if (VERB_LIKE.test(value)) return true;
  if (STATUS_WORDS.test(value)) return true;
  if (MOVEMENT_WORDS.test(value)) return true;
  if (/[!?]$/.test(value) && words(value).length <= 4) return true;
  return false;
}

function validBeat(text: string): boolean {
  const value = clean(text);
  const count = words(value).length;
  if (!value || count > 7 || CHAIN.test(value) || META.test(value)) return false;
  if (MOOD_ONLY.test(value) || NOUN_ONLY.test(value)) return false;

  // A one-word beat can work when it actually changes the state: "Again."
  // or "Gone." are meaningful. Bare nouns are not.
  if (count === 1) return hasMovement(value);

  // Two-word beats can be compressed fragments when the semantic movement is
  // obvious: "Bow returns", "Still dancing", "Knives fly".
  return hasMovement(value);
}

function parseJsonDraft(text: string): BeatDraft | null {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as BeatDraft;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as BeatDraft;
      } catch {
        return null;
      }
    }
    return null;
  }
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

  // Prefer supplied semantic actions/states. Do not manufacture a whole story
  // just to satisfy a count; use tiny grounded repairs instead.
  const seed = unique.slice(0, Math.max(needed - 1, 3));
  const groundedRepairs = [
    subject && input.sourceMoments[0] ? `${subject} returns` : "Still here",
    subject && input.facts.some((fact) => /hates?/i.test(fact)) ? `${subject} still hates bows` : "Something changes",
    input.sourceMoments.length > 1 ? trimToWordCeiling(input.sourceMoments[1], 5) : "Then it shifts",
  ].filter(validBeat);

  for (const repair of groundedRepairs) {
    if (seed.length >= needed - 1) break;
    if (!seed.includes(repair)) seed.push(repair);
  }

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
        "The sequence must MOVE. Each beat must alter physical state, information, expectation, relationship, status, or trajectory.",
        "Target 2–4 words per beat.",
        "Hard ceiling: 7 words per beat.",
        "Never exceed 7 words.",
        "Never use pipes, semicolon chains, parentheses, explanations, or paragraphs.",
        "Do not narrate what an uploaded image already makes obvious.",
        "Use text for attitude, tension, timing, contrast, callback, meaning, action, or surprise.",
        "Never spend a beat merely naming a noun, timestamp, place, or mood when it can perform a change.",
        "Reject vague mood-only language.",
        "Compress the sentence, NOT the idea.",
        "Use the strongest supplied contradiction instead of generic emotional progression.",
        "Static states are allowed when they create tension or contrast: 'Coco hates bows', 'Everyone keeps talking', 'Nobody looks up'.",
        "A beat does not need a dramatic action verb to move; perception, refusal, recurrence, contradiction, and changed expectation count.",
        "Round 2+ means history exists: callback to a known quirk instead of reintroducing the character.",
        "Presence history may establish return, place, or time. Never invent an exact location or event that is not supplied by Presence or source facts.",
        "GROUNDING RULE: never turn a creative affordance into a concrete factual event.",
        stretch ? "STRETCH MODE: use the fifth beat only when it creates a real escalation or needed service/horror/event substance." : "COMPACT MODE: four strong beats are preferred.",
        rejected.length ? `REJECTED OUTPUTS — replace these with stronger semantic movement, not synonyms: ${rejected.join(" | ")}` : "",
        "PAYOFF must land the same thread created by the first beats.",
        "The final line can be extremely short, but it must feel earned rather than generic.",
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

  return parseJsonDraft(result.text);
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
