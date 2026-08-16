import type { AuthorBrainTruth, AuthorScene, SequencePlay } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { mouthCraftSystem, mouthCraftUser, mouthQualityPenalty } from "./authorMouthCraft.js";
import { critiqueMouthCandidates } from "./authorMouthCritic.js";
import { groundAuthorBeat, type GroundedBeat } from "./authorBeatTruthGate.js";

const MAX_CRITIC_ATTEMPTS = 3;
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function parse(raw: string): string[] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as { texts?: unknown; text?: unknown };
    if (Array.isArray(value.texts)) return value.texts.map(clean).filter(Boolean).slice(0, 8);
    if (typeof value.text === "string") return [clean(value.text)];
    return [];
  } catch {
    return [];
  }
}

function sourceTokens(input: AuthorBrainTruth): Set<string> {
  const source = [input.subject ?? "", ...input.facts, ...(input.sourceMoments ?? []), ...(input.memoryContext ?? [])].join(" ");
  return new Set(source.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4));
}

function tokenSet(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4));
}

function sourceOverlap(text: string, source: Set<string>): number {
  const words = tokenSet(text);
  if (!words.size || !source.size) return 0;
  let hits = 0;
  for (const word of words) if (source.has(word)) hits += 1;
  return hits / words.size;
}

function beatOverlap(text: string, beat: Record<string, unknown>): number {
  const beatWords = tokenSet([
    String(beat.creativeOpportunity ?? ""),
    ...(Array.isArray(beat.approvedEvidence) ? beat.approvedEvidence.map(String) : []),
  ].join(" "));
  const words = tokenSet(text);
  if (!beatWords.size || !words.size) return 0;
  let hits = 0;
  for (const word of words) if (beatWords.has(word)) hits += 1;
  return hits / words.size;
}

function unsupportedPronounPenalty(text: string, input: AuthorBrainTruth): number {
  const source = [input.subject ?? "", ...input.facts, ...(input.sourceMoments ?? [])].join(" ").toLowerCase();
  if (/\bmale\b|\bman\b|\bhe\b|\bhis\b/.test(source) && /\b(?:she|her|hers)\b/i.test(text)) return 0.5;
  if (/\bfemale\b|\bwoman\b|\bshe\b|\bher\b/.test(source) && /\b(?:he|him|his)\b/i.test(text)) return 0.5;
  return 0;
}

function unsupportedConcretePenalty(text: string, input: AuthorBrainTruth): number {
  const valueTokens = tokenSet(text);
  const sourceTokensSet = sourceTokens(input);
  let penalty = 0;
  // These are high-risk physical/world-building additions. They are intentionally
  // separate from creative status language such as lawyer, case, negotiation,
  // peace, approval, rebellion, or mission, which can be metaphorical and are allowed.
  const unsupportedPhysical = new Set([
    "home", "room", "house", "door", "grandma", "grandmother", "clubhouse", "sunset", "sunrise", "golden", "light", "lights",
    "rain", "street", "car", "chair", "table", "floor", "garden", "park", "school", "suit", "fashion",
    "hair", "pocket", "feet", "foot", "hands", "eyes", "bed", "yard", "outside", "inside", "everyone", "nobody",
    "disco", "roar", "sparkle", "sparkles", "twirl", "twirls", "prance", "prances", "pranced",
    "shadow", "shadows", "moonlight", "moon", "sunlight", "fading", "glow", "glows", "glowing", "whisper", "whispers", "whispered",
    "sweat", "tears", "tear", "smile", "smiles", "grin", "grins", "laugh", "laughs", "laughter", "music", "melody", "sound", "sounds",
    "bubbled", "bubble", "ripples", "ripple", "towel", "brow", "secret", "secrets", "mystery", "clue", "clues", "ghostly", "ominous", "ominously",
    "boot", "boots", "footsteps", "steps", "audience", "crowd", "altar", "wedding", "ceremony", "camera", "shot", "focus", "slow-motion",
    "yellowed", "faded", "finger", "fingers", "record-scratch", "scratch", "scratchy", "dawn", "dusk",
  ]);
  for (const word of unsupportedPhysical) {
    if (valueTokens.has(word) && !sourceTokensSet.has(word)) penalty += 0.25;
  }
  if (/\b(?:boy|girl|man|woman|male|female|gender|gender reveal)\b/i.test(text) && !/\b(?:male|female|man|woman|boy|girl)\b/i.test([input.subject ?? "", ...input.facts].join(" "))) penalty += 0.35;
  if (/\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered|cried|crying)\b/i.test(text) && !/\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered|cried|crying)\b/i.test([input.subject ?? "", ...input.facts, ...(input.sourceMoments ?? [])].join(" "))) penalty += 0.35;
  return Math.min(1, penalty);
}

function vagueSummaryPenalty(text: string): number {
  const value = text.toLowerCase();
  let penalty = 0;
  if (/\b(?:happy|fun|joyful|special|meaningful|magical|beautiful|emotional)\b/.test(value) && !/\b(?:bow|bows|ball|balls|tie|ties|return|returned|coco)\b/.test(value)) penalty += 0.35;
  if (/\b(?:love|victorious|grace|smile|laugh|laughs|grin|grins)\b/.test(value) && !/\b(?:bow|bows|ball|balls|ties|returned|coco)\b/.test(value)) penalty += 0.18;
  return penalty;
}

function sentenceScore(text: string, input: AuthorBrainTruth, beat: Record<string, unknown>): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const source = sourceTokens(input);
  const overlap = sourceOverlap(text, source);
  const beatMatch = beatOverlap(text, beat);
  const penalty = mouthQualityPenalty(text) + unsupportedPronounPenalty(text, input) + unsupportedConcretePenalty(text, input) + vagueSummaryPenalty(text);
  const compression = words >= 3 && words <= 7 ? 1 : 0;
  const evidenceBreadth = Math.min(1, tokenSet(text).size / 5);
  const punctuationBonus = /[!?—,:;]/.test(text) ? 0.04 : 0;
  return (
    overlap * 0.34 +
    beatMatch * 0.18 +
    evidenceBreadth * 0.12 +
    compression * 0.16 +
    punctuationBonus -
    penalty * 0.94
  );
}

function candidateDirective(index: number, repair = ""): string {
  const base = index === 0
    ? "Write the cleanest, sharpest realization. Concrete first. No explanation."
    : index === 1
      ? "Write a stranger, funnier, more compressed realization. Use a collision or double meaning between supplied details. Still no invented events or atmosphere."
      : "Write a sly, characterful realization with a hard turn. Make the supplied details do the work. Never add a physical event just to make it cinematic.";
  return repair ? `${base} CRITIC REPAIR: ${repair}` : base;
}

function safeFallback(beat: GroundedBeat, subject?: string): string {
  const evidence = beat.approvedEvidence.slice(0, 6).filter(Boolean);
  if (subject && evidence.length) {
    const withoutSubject = evidence.filter((item) => item.toLowerCase() !== subject.toLowerCase());
    if (withoutSubject.length) return `${subject} — ${withoutSubject.slice(0, 4).join(", ")}.`;
  }
  if (evidence.length) return evidence.slice(0, 5).join(", ") + ".";
  return "The approved evidence holds.";
}

/** Evidence-first Monster Mouth. The brain chooses the movie and beats; this layer grounds each beat before competing on sentence quality. */
export async function polishAuthorScenes(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  risk = "playful",
): Promise<{ scenes: AuthorScene[]; texts: string[]; rejected: number; retries: number; fallbacks: number }> {
  const chosenTexts: string[] = [];
  let totalRetries = 0;
  let fallbackCount = 0;

  for (const cut of sequence.cuts) {
    const rawBeat = {
      order: cut.order,
      role: cut.role,
      gainKind: cut.gainKind,
      change: cut.informationGain,
      frontier: cut.momentum?.after.informationFrontier?.frontier ?? "",
      nextNeed: cut.nextPromise ?? "",
      necessity: cut.necessity?.reason ?? "",
    };

    const grounded = await groundAuthorBeat({
      subject: input.subject,
      facts: input.facts,
      moments: input.sourceMoments ?? [],
      memory: input.memoryContext ?? [],
      beat: rawBeat,
    });

    const beat: Record<string, unknown> = {
      ...grounded,
      candidateBoundary: "Only approvedEvidence may be asserted as concrete reality.",
    };

    let chosen: string | null = null;
    let previousFailure = "";

    for (let attempt = 0; attempt < MAX_CRITIC_ATTEMPTS && !chosen; attempt += 1) {
      if (attempt > 0) totalRetries += 1;
      const candidates: string[] = [];

      for (let candidateIndex = 0; candidateIndex < 2; candidateIndex += 1) {
        const userContent = mouthCraftUser({
          prompt: input.prompt,
          lens: input.lens,
          subject: input.subject,
          subjectTruth: input.subjectTruth,
          facts: input.facts,
          moments: input.sourceMoments ?? [],
          memory: input.memoryContext ?? [],
          trajectory: input.trajectory ?? [],
          beats: [{ ...beat, candidateDirective: candidateDirective(candidateIndex, previousFailure) }],
        });

        const result = await localModelGenerate(
          [
            {
              role: "system",
              content: `${mouthCraftSystem(risk)}\nQRE's theatrical mouth.\nREALIZATION ONLY. The movie, sequence, and beat are already approved, but the beat has passed through QRE's Truth Gate.\nSOURCE BOUNDARY: only approvedEvidence may become a concrete factual claim. creativeOpportunity is an invitation to explore a relationship, not a fact. forbiddenClaims must not be realized.\nA frame can change the attitude or implication of the line, but cannot supply a new physical world.\nNever invent a new event, setting, action, person, dialogue, outcome, weather, lighting, time-of-day, location, body position, wardrobe placement, object, sound, crowd reaction, or camera direction.\nThe candidate directive is only a stylistic request; source truth wins.\nReturn exactly one line for this one approved beat.`,
            },
            { role: "user", content: userContent },
          ],
          "json",
          { numPredict: 192, temperature: candidateIndex === 0 ? 0.78 : 0.92 },
        );
        const candidate = parse(result.text)[0] ?? "";
        if (candidate) candidates.push(candidate);
      }

      const deterministicScores = candidates.map((candidate) => sentenceScore(candidate, input, beat));
      const critic = await critiqueMouthCandidates({
        prompt: input.prompt,
        lens: input.lens,
        subject: input.subject,
        facts: input.facts,
        moments: input.sourceMoments ?? [],
        memory: input.memoryContext ?? [],
        beat,
        candidates,
        previousFailure,
      });

      if (critic.decision === "accept" && critic.bestIndex >= 0 && critic.bestIndex < candidates.length) {
        const candidate = candidates[critic.bestIndex];
        const score = deterministicScores[critic.bestIndex] ?? -Infinity;
        const hardPhysicalPenalty = unsupportedConcretePenalty(candidate, input);
        if (hardPhysicalPenalty < 0.25 && score >= 0.18) chosen = candidate;
        else previousFailure = "Hard reject: invented physical/world detail or generic atmosphere. Keep the creative attitude, but make the supplied detail do the work.";
      } else {
        previousFailure = critic.repairDirective || critic.reason || "Generate a shorter, source-specific realization with a clever turn and no invented physical detail.";
      }
    }

    if (!chosen) {
      chosen = safeFallback(grounded, input.subject);
      fallbackCount += 1;
    }

    chosenTexts.push(chosen);
  }

  const scenes: AuthorScene[] = [];
  for (let i = 0; i < sequence.cuts.length; i += 1) {
    const text = chosenTexts[i] || safeFallback({
      order: sequence.cuts[i].order,
      role: sequence.cuts[i].role,
      gainKind: sequence.cuts[i].gainKind,
      approvedEvidence: [input.subject ?? "", ...input.facts].filter(Boolean),
      creativeOpportunity: "",
      forbiddenClaims: [],
      sourceBoundary: "",
    }, input.subject);
    scenes.push({
      text,
      kind: sequence.cuts[i].role === "hook" ? "hook" : sequence.cuts[i].role === "payoff" ? "payoff" : "line",
    });
  }

  return {
    scenes,
    texts: scenes.map((scene) => scene.text),
    rejected: Math.max(0, sequence.cuts.length - scenes.length),
    retries: totalRetries,
    fallbacks: fallbackCount,
  };
}
