import type { AuthorBrainTruth, AuthorScene, SequencePlay } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { mouthCraftSystem, mouthCraftUser, mouthQualityPenalty } from "./authorMouthCraft.js";

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
  const penalty = mouthQualityPenalty(text) + unsupportedPronounPenalty(text, input) + vagueSummaryPenalty(text);
  const compression = words >= 3 && words <= 7 ? 1 : 0;
  const evidenceBreadth = Math.min(1, tokenSet(text).size / 5);
  const punctuationBonus = /[!?—,:;]/.test(text) ? 0.04 : 0;
  return (
    overlap * 0.38 +
    beatMatch * 0.22 +
    evidenceBreadth * 0.16 +
    compression * 0.14 +
    punctuationBonus -
    penalty * 0.7
  );
}

function candidateDirective(index: number): string {
  if (index === 0) return "Write the cleanest, sharpest realization. Concrete first. No explanation.";
  if (index === 1) return "Write a stranger, funnier, more compressed realization. Use a collision or double meaning between supplied details. Still no invented events.";
  return "Write a sly, characterful realization with a hard turn. Make the supplied details do the work.";
}

/** Evidence-first Monster Mouth. The brain chooses the movie and beats; this layer only competes on sentence quality. */
export async function polishAuthorScenes(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  risk = "playful",
): Promise<{ scenes: AuthorScene[]; texts: string[]; rejected: number }> {
  const chosenTexts: string[] = [];

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
        beats: [{ ...beat, candidateDirective: candidateDirective(candidateIndex) }],
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

    let best = "";
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const value = sentenceScore(candidate, input, beat);
      if (value > bestScore) {
        best = candidate;
        bestScore = value;
      }
    }
    chosenTexts.push(bestScore >= 0.22 ? best : "");
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
  return { scenes, texts: chosenTexts, rejected: sequence.cuts.length - scenes.length };
}
