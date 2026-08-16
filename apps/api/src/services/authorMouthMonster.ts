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

function parseChoice(raw: string, count: number): number | null {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as { bestIndex?: unknown };
    const index = Number(value.bestIndex);
    return Number.isInteger(index) && index >= 0 && index < count ? index : null;
  } catch {
    return null;
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
  ];
  for (const word of unsupported) {
    if (new RegExp(`\\b${word}\\b`, "i").test(value) && !new RegExp(`\\b${word}\\b`, "i").test(source)) penalty += 0.16;
  }
  if (/\b(?:boy|girl|man|woman|male|female|gender|gender reveal|boys'|girls')\b/i.test(value) && !/\b(?:male|female|man|woman|boy|girl)\b/i.test(source)) penalty += 0.35;
  return Math.min(0.65, penalty);
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

function candidateDirective(index: number): string {
  if (index === 0) return "Write the cleanest, sharpest realization. Concrete first. No explanation.";
  if (index === 1) return "Write a stranger, funnier, more compressed realization. Use a collision or double meaning between supplied details. Still no invented events.";
  return "Write a sly, characterful realization with a hard turn. Make the supplied details do the work.";
}

async function judgeCandidates(
  input: AuthorBrainTruth,
  beat: Record<string, unknown>,
  candidates: string[],
  risk: string,
): Promise<number | null> {
  if (candidates.length < 2) return candidates.length === 1 ? 0 : null;

  const source = JSON.stringify({
    prompt: input.prompt,
    subject: input.subject ?? "",
    facts: input.facts,
    moments: input.sourceMoments ?? [],
    memory: input.memoryContext ?? [],
    subjectTruth: input.subjectTruth ?? null,
  });

  const prompt = [
    "You are QRE's sentence judge.",
    "The movie and beat are already approved. You MUST choose between supplied candidate lines; do not rewrite them.",
    "Choose the line that is most specific, surprising, compressed, characterful, and faithful to source truth.",
    "Reject any candidate that asserts an unsupported person, place, object, action, relationship, outcome, dialogue, setting, or gender interpretation.",
    "Prefer a line that makes supplied details collide or change meaning without explaining the joke.",
    "Do not reward generic cinematic atmosphere.",
    `RISK DIAL: ${risk}.`,
    `SOURCE=${source}`,
    `APPROVED_BEAT=${JSON.stringify(beat)}`,
    `CANDIDATES=${JSON.stringify(candidates)}`,
    `Return JSON exactly: {"bestIndex":0} or {"bestIndex":1}.`,
  ].join("\n");

  const result = await localModelGenerate(
    [{ role: "system", content: prompt }, { role: "user", content: "Choose the strongest candidate only." }],
    "json",
    { numPredict: 96, temperature: 0.15 },
  );
  return parseChoice(result.text, candidates.length);
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

    const deterministicScores = candidates.map((candidate) => sentenceScore(candidate, input, beat));
    const judgeIndex = await judgeCandidates(input, beat, candidates, risk);
    const deterministicBest = deterministicScores.length
      ? deterministicScores.reduce((bestIndex, value, index, scores) => value > scores[bestIndex] ? index : bestIndex, 0)
      : null;
    const selectedIndex = judgeIndex !== null && deterministicScores[judgeIndex] >= 0.18
      ? judgeIndex
      : deterministicBest !== null && deterministicScores[deterministicBest] >= 0.22
        ? deterministicBest
        : null;

    chosenTexts.push(selectedIndex === null ? "" : candidates[selectedIndex]);
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
