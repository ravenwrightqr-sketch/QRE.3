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
const GENERIC_BEAT = /^(?:something changes|then it shifts|still here|see you next time|the experience unfolds|a beautiful moment|a magical moment|an unforgettable moment|new normal)$/i;
const GENERIC_PAYOFF = /^(?:see you next time|the experience unfolds|a beautiful moment|a magical moment|an unforgettable moment|happy ending|dream come true)$/i;

const MOVEMENT_WORDS = /\b(?:am|are|be|became|becomes|been|being|breaks?|barks?|backs?|blinks?|caught|changes?|changed|closes?|conquers?|cracks?|dances?|defeats?|disappears?|drinks?|echoes?|enters?|falls?|feels?|flies?|freezes?|gets?|gives?|goes?|grabs?|hates?|has|have|hits?|jumps?|keeps?|knows?|lands?|laughs?|leaves?|likes?|loves?|loses?|looks?|meets?|moves?|opens?|passes?|pours?|pulls?|refuses?|remembers?|returns?|rings?|runs?|sees?|shakes?|shifts?|sits?|slams?|sniffs?|spills?|spots?|stares?|stays?|steals?|stops?|talks?|takes?|turns?|waits?|walks?|wants?|watches?|wags?|wins?|works?|appears?|vanishes?|surrenders?|accepts?|reconsiders?|continues?|ignores?|rejects?|offers?|starts?|holds?|finds?|reveals?|follows?|fades?|rises?|drops?|still|again|back|next|ready|gone|finally|already|proud|quiet|louder|closer|farther|faster|slower|caught|free|safe|stuck|waiting|winning|losing|defeated|conquered|surrendered|refused|accepted|different|afraid|nervous|calm|suspicious|angry|relieved|late|early|alive|dead)\b/i;
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
  return index === 0 ? "jolt" : "jolt";
}

function isReturning(input: MicroBeatMouthInput): boolean {
  return input.presence?.isReturning === true || (input.round ?? 1) > 1;
}

function desiredBeatCount(input: MicroBeatMouthInput): number {
  // Returning chapters stay compact. Domain keywords must not inflate them.
  if (isReturning(input)) return 4;
  const value = `${input.prompt} ${input.lens ?? ""}`.toLowerCase();
  return /\b(?:service|receipt|clean|cleaning|groom|grooming|horror|dinner|knife|knives|glass|door|rave|concert|festival|event)\b/i.test(value) ? 5 : 4;
}

function hasMovement(value: string): boolean {
  return VERB_LIKE.test(value) || STATUS_WORDS.test(value) || MOVEMENT_WORDS.test(value) || (/[!?]$/.test(value) && words(value).length <= 4);
}

function signatureBeat(input: MicroBeatMouthInput): string | null {
  const subject = clean(input.subject);
  return subject ? `${subject}. The one and only.` : null;
}

function isIdentityRestatement(value: string, input: MicroBeatMouthInput): boolean {
  const subject = clean(input.subject);
  if (!subject) return false;
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const subjectPrefix = new RegExp(`^${escaped}\\s+(?:is|was|remains?)\\s+(?:a|an|the)\\s+`, "i");
  if (!subjectPrefix.test(value)) return false;
  return input.facts.some((fact) => /^.+\s+(?:is|was)\s+(?:a|an|the)\s+/i.test(fact));
}

function isGenericOrWeak(value: string, input: MicroBeatMouthInput): boolean {
  if (GENERIC_BEAT.test(value)) return true;
  if (isIdentityRestatement(value, input)) return true;
  if (GENERIC_PAYOFF.test(value)) return true;
  return false;
}

function validBeat(text: string, input: MicroBeatMouthInput): boolean {
  const value = clean(text);
  const count = words(value).length;
  if (!value || count > 7 || CHAIN.test(value) || META.test(value)) return false;
  if (MOOD_ONLY.test(value) || NOUN_ONLY.test(value) || isGenericOrWeak(value, input)) return false;
  if (signatureBeat(input)?.toLowerCase() === value.toLowerCase()) return true;
  if (count === 1) return hasMovement(value);
  return hasMovement(value) || (/[!?]$/.test(value) && count <= 4);
}

function parseJsonDraft(text: string): BeatDraft | null {
  const cleaned = clean(text).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned) as BeatDraft; } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)) as BeatDraft; } catch { return null; }
    }
    return null;
  }
}

function factToBeat(fact: string): string {
  return trimToWordCeiling(fact, 5).replace(/[.!?]+$/, "");
}

function fallbackBeats(input: MicroBeatMouthInput): ExperienceBeat[] {
  const needed = desiredBeatCount(input);
  const returning = isReturning(input);
  const subject = clean(input.subject);
  const facts = input.facts.map(clean).filter(Boolean);
  const moments = input.sourceMoments.map(clean).filter(Boolean);
  const candidates: string[] = [];

  if (subject) candidates.push(signatureBeat(input) ?? subject);
  for (const fact of facts) {
    const beat = factToBeat(fact);
    if (beat && !candidates.includes(beat)) candidates.push(beat);
  }
  for (const moment of moments) {
    const beat = factToBeat(moment);
    if (beat && !candidates.includes(beat)) candidates.push(beat);
  }

  if (subject && facts.some((fact) => /\bhates?\s+(?:the\s+)?bows?\b/i.test(fact))) {
    candidates.unshift(signatureBeat(input) ?? subject);
    candidates.push(`${subject} still hates bows`);
  }

  const selected = candidates.filter((value, index, all) => validBeat(value, input) && all.indexOf(value) === index).slice(0, needed - 1);
  if (selected.length < needed - 1) return [];

  const payoff = returning
    ? (subject ? `${subject} leaves undefeated.` : "We came back different.")
    : subject ? `${subject} leaves a mark.` : "It stays with us.";

  return [...selected, payoff].slice(0, needed).map((text, index, all) => ({
    id: `micro-beat-${index + 1}`,
    text,
    kind: index === all.length - 1 ? "payoff" : index === all.length - 2 ? "turn" : "jolt",
    order: index,
    attentionRole: index === all.length - 1 ? "payoff" : "attention_jolt",
    operator: index === all.length - 1 ? "payoff" : "compression",
    callback: returning && (index === 0 || /\bagain|still|returns?\b/i.test(text)),
    durationHintMs: index === all.length - 1 ? 1800 : 1100,
    meta: {
      wordCount: words(text).length,
      round: input.round ?? (returning ? 2 : 1),
      returning,
      visitNumber: input.presence?.visitNumber ?? null,
      source: "micro-beat-mouth",
      stretchMode: needed > 4,
    },
  }));
}

async function generateBeats(input: MicroBeatMouthInput, beatCount: number, rejected: string[] = []): Promise<BeatDraft | null> {
  const returning = isReturning(input);
  const result = await localModelGenerate([
    {
      role: "system",
      content: [
        "You are QRE's final micro-beat mouth.",
        "The cognitive system already chose the angle. You are the editor who makes the latent movie visible one cut at a time.",
        `Write exactly ${beatCount} beats.`,
        beatCount > 4 ? "Rhythm: JOLT → JOLT → JOLT → TURN → PAYOFF." : "Rhythm: JOLT → JOLT → JOLT → PAYOFF.",
        "The object, person, place, or event is the STAR.",
        "Each beat is a fast film cut, not a sentence from a paragraph.",
        "Target 2–5 words. Hard ceiling 7.",
        "Every cut must change information, expectation, tension, status, relationship, movement, or meaning.",
        "Do not list supplied facts. Transform them into screen language.",
        "Do not turn identity into taxonomy. Instead of 'Coco is a poodle', use a signature entrance, attitude, contradiction, or memorable framing such as 'Coco. The one and only.' when justified.",
        "Do not spend a beat on generic connective tissue: 'Something changes', 'Then it shifts', 'Still here', 'See you next time'.",
        "Use exact supplied timestamps as factual anchors when they matter. A timestamp can be a deliberate hard cut.",
        "Grounded reality is sacred: never invent concrete events, people, places, weather, outcomes, or actions not supported by the supplied material.",
        "Creative language may interpret facts, but may not manufacture facts.",
        returning ? "This is a RETURNING chapter. Do not reintroduce taxonomy. Callback to an established trait, object, phrase, behavior, or prior beat. At least one beat must make the return meaningful." : "",
        "Static lines are allowed only when they create tension or character: 'Coco hates bows', 'Everyone keeps talking', 'Nobody looks up'.",
        "A beat may be a fragment or question if it creates forward pull.",
        "Final beat must pay off the thread established by the opening beats and must not be a generic sign-off.",
        rejected.length ? `Rejected drafts to avoid: ${rejected.join(" | ")}` : "",
        "Return strict JSON only: {\"beats\":[{\"text\":\"...\",\"kind\":\"jolt|reveal|turn|payoff|afterglow\",\"attentionRole\":\"...\",\"operator\":\"...\",\"callback\":true}]}",
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
          visitNumber: input.presence?.visitNumber ?? null,
          summary: (input.presence?.summary ?? []).slice(0, 12),
          places: (input.presence?.places ?? []).slice(0, 12),
          firstSeenAt: input.presence?.firstSeenAt ?? null,
          lastSeenAt: input.presence?.lastSeenAt ?? null,
        },
        round: input.round ?? (returning ? 2 : 1),
        requestedBeatCount: beatCount,
      }),
    },
  ], "json");
  return parseJsonDraft(result.text);
}

function normalizeDraft(input: MicroBeatMouthInput, parsed: BeatDraft | null, beatCount: number): ExperienceBeat[] {
  const raw = Array.isArray(parsed?.beats) ? parsed.beats : [];
  const returning = isReturning(input);
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
    .filter((beat) => validBeat(beat.text, input))
    .slice(0, beatCount)
    .map((beat, index, all) => ({
      id: `micro-beat-${index + 1}`,
      text: beat.text,
      kind: index === all.length - 1 ? "payoff" : index === all.length - 2 && beatCount > 4 ? "turn" : beat.kind,
      order: index,
      attentionRole: beat.attentionRole,
      operator: beat.operator,
      callback: beat.callback || (returning && index === 0),
      durationHintMs: index === all.length - 1 ? 1800 : 1100,
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

function qualityFailures(input: MicroBeatMouthInput, beats: ExperienceBeat[]): string[] {
  const failures: string[] = [];
  if (!beats.length) return ["no beats"];
  if (beats.some((beat) => isGenericOrWeak(beat.text, input))) failures.push("generic or taxonomy beat");
  if (beats.some((beat) => GENERIC_PAYOFF.test(beat.text))) failures.push("generic payoff");
  if (new Set(beats.map((beat) => beat.text.toLowerCase())).size !== beats.length) failures.push("duplicate beat");
  if (isReturning(input) && !beats.some((beat) => beat.callback || /\bagain|still|returns?\b/i.test(beat.text))) failures.push("missing callback");
  return failures;
}

export async function authorMicroBeats(input: MicroBeatMouthInput): Promise<ExperienceBeat[]> {
  if (process.env.QRE_AI_ENABLED !== "true" || process.env.QRE_EXTERNAL_AI_ENABLED === "true") return fallbackBeats(input);

  const beatCount = desiredBeatCount(input);
  const first = normalizeDraft(input, await generateBeats(input, beatCount), beatCount);
  const firstFailures = first.length === beatCount ? qualityFailures(input, first) : ["wrong beat count"];
  if (first.length === beatCount && firstFailures.length === 0) return first;

  const rejected = first.map((beat) => beat.text).filter(Boolean);
  const repaired = normalizeDraft(input, await generateBeats(input, beatCount, rejected), beatCount);
  const repairedFailures = repaired.length === beatCount ? qualityFailures(input, repaired) : ["wrong beat count"];
  if (repaired.length === beatCount && repairedFailures.length === 0) return repaired;

  return fallbackBeats(input);
}
