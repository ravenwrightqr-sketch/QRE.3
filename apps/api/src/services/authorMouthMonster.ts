import type { AuthorBrainTruth, AuthorScene, SequencePlay } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { mouthCraftSystem, mouthCraftUser, mouthQualityPenalty } from "./authorMouthCraft.js";
import { critiqueMouthCandidates } from "./authorMouthCritic.js";

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
  const beatWords = tokenSet([String(beat.change ?? ""), String(beat.frontier ?? ""), String(beat.nextNeed ?? "")].join(" "));
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
  const value = text.toLowerCase();
  const source = [input.subject ?? "", ...input.facts, ...(input.sourceMoments ?? []), ...(input.memoryContext ?? [])].join(" ").toLowerCase();
  let penalty = 0;
  const unsupported = [
    "home", "room", "house", "door", "grandma", "grandmother", "clubhouse", "sunset", "sunrise", "golden", "light", "lights",
    "rain", "street", "car", "chair", "table", "floor", "garden", "park", "school", "suit", "fashion", "winks", "winked",
    "hair", "pocket", "feet", "foot", "hands", "eyes", "bed", "yard", "outside", "inside", "everyone", "nobody",
  ];
  for (const word of unsupported) {
    if (new RegExp(`\\b${word}\\b`, "i").test(value) && !new RegExp(`\\b${word}\\b`, "i").test(source)) penalty += 0.16;
  }
  if (/\b(?:boy|girl|man|woman|male|female|gender|gender reveal|boys'|girls')\b/i.test(value) && !/\b(?:male|female|man|woman|boy|girl)\b/i.test(source)) penalty += 0.35;
  if (/\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered)\b/i.test(value) && !/\b(?:caught|catching|surprised|surprise|shocked|stared|staring|watched|watching|laughed|laughing|clapped|cheered)\b/i.test(source)) penalty += 0.3;
  return Math.min(0.85, penalty);
}

function vagueSummaryPenalty(text: string): number {
  const value = text.toLowerCase();
  let penalty = 0;
  if (/\b(?:happy|fun|joyful|special|meaningful|magical|beautiful|emotional)\b/.test(value) && !/\b(?:bow|bows|ball|balls|tie|ties|return|returned|coco)\b/.test(value)) penalty += 0.35;
  if (/\b(?:love|victorious|grace|smile|laugh|laughs|grin|grins)\b/.test(value) && !/\b(?:bow|bows|ball|balls|tie|ties|returned|coco)\b/.test(value)) penalty += 0.18;
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
    overlap * 0.36 +
    beatMatch * 0.18 +
    evidenceBreadth * 0.14 +
    compression * 0.12 +
    punctuationBonus -
    penalty * 0.78
  );
}

function candidateDirective(index: number, repair = ""): string {
  const base = index === 0
    ? "Write the cleanest, sharpest realization. Concrete first. No explanation."
    : index === 1
      ? "Write a stranger, funnier, more compressed realization. Use a collision or double meaning between supplied details. Still no invented events."
      : "Write a sly, characterful realization with a hard turn. Make the supplied details do the work.";
  return repair ? `${base} CRITIC REPAIR: ${repair}` : base;
}

function safeFallback(beat: Record<string, unknown>): string {
  const change = clean(beat.change);
  if (!change) return "The approved beat lands.";
  return change.split(/\s+/).slice(0, 7).join(" ").replace(/[,:;—-]+$/, "").trim();
}

/** Evidence-first Monster Mouth. The brain chooses the movie and beats; this layer only competes on sentence quality. */
export async function polishAuthorScenes(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  risk = "playful",
): Promise<{ scenes: AuthorScene[]; texts: string[]; rejected: number; retries: number; fallbacks: number }> {
  const chosenTexts: string[] = [];
  let totalRetries = 0;
  let fallbackCount = 0;

  for (const cut of sequence.cuts) {
    const beat = {
      order: cut.order,
      role: cut.role,
      gainKind: cut.gainKind,
      change: cut.informationGain,
      frontier: cut.momentum?.after.informationFrontier?.frontier ?? "",
      nextNeed: cut.nextPromise ?? "",
      necessity: cut.necessity?.reason ?? "",
      sourceIds: cut.sourceIds,
    };

    let chosen: string | null = null;
    let previousFailure = "";
    let lastCandidates: string[] = [];
    let lastScores: number[] = [];

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
              content: `${mouthCraftSystem(risk)}\nQRE's theatrical mouth.\nREALIZATION ONLY. The movie, sequence, and beat are already approved. Never invent a new beat, event, setting, action, person, dialogue, outcome, weather, lighting, time-of-day, or location.\nThe candidate directive is only a stylistic request; source truth wins.\nReturn exactly one line for this one approved beat.`,
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
      lastCandidates = candidates;
      lastScores = deterministicScores;

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
        const score = deterministicScores[critic.bestIndex] ?? -Infinity;
        if (score >= 0.16) chosen = candidates[critic.bestIndex];
        else previousFailure = "The candidate failed QRE's deterministic grounding/quality gate. Remove unsupported concrete detail and tighten the line.";
      } else {
        previousFailure = critic.repairDirective || critic.reason || "Generate a more grounded, specific realization.";
      }
    }

    if (!chosen) {
      const deterministicBest = lastScores.length
        ? lastScores.reduce((bestIndex, value, index, scores) => value > scores[bestIndex] ? index : bestIndex, 0)
        : null;
      if (deterministicBest !== null && lastScores[deterministicBest] >= 0.16) {
        chosen = lastCandidates[deterministicBest];
        fallbackCount += 1;
      } else {
        chosen = safeFallback(beat);
        fallbackCount += 1;
      }
    }

    chosenTexts.push(chosen);
  }

  const scenes: AuthorScene[] = [];
  for (let i = 0; i < sequence.cuts.length; i += 1) {
    const text = chosenTexts[i];
    if (!text) continue;
    scenes.push({
      text,
      kind: sequence.cuts[i].role === "hook" ? "hook" : sequence.cuts[i].role === "payoff" ? "payoff" : "line",
    });
  }

  return {
    scenes,
    texts: chosenTexts,
    rejected: sequence.cuts.length - scenes.length,
    retries: totalRetries,
    fallbacks: fallbackCount,
  };
}
