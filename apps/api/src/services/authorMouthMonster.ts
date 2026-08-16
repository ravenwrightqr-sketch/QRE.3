import type { AuthorBrainTruth, AuthorScene, SequencePlay } from "@qre/contracts";
import { localModelGenerate } from "./localModelRuntime.js";
import { mouthCraftSystem, mouthCraftUser, mouthQualityPenalty } from "./authorMouthCraft.js";

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function parse(raw: string): string[] {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as { texts?: unknown };
    return Array.isArray(value.texts) ? value.texts.map(clean).filter(Boolean).slice(0, 8) : [];
  } catch {
    return [];
  }
}

function sourceTokens(input: AuthorBrainTruth): Set<string> {
  const source = [input.subject ?? "", ...input.facts, ...(input.sourceMoments ?? []), ...(input.memoryContext ?? [])].join(" ");
  return new Set(source.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4));
}

function sourceOverlap(text: string, source: Set<string>): number {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 4));
  if (!words.size || !source.size) return 0;
  let hits = 0;
  for (const word of words) if (source.has(word)) hits += 1;
  return hits / words.size;
}

function score(text: string, source: Set<string>): number {
  const penalty = mouthQualityPenalty(text);
  const overlap = sourceOverlap(text, source);
  const words = text.split(/\s+/).filter(Boolean).length;
  const compression = words >= 3 && words <= 7 ? 1 : 0;
  return overlap * 0.55 + compression * 0.2 - penalty * 0.65;
}

/**
 * Evidence-first monster mouth.
 * The brain chooses the movie and beats. This layer only competes on sentence quality.
 */
export async function polishAuthorScenes(
  input: AuthorBrainTruth,
  sequence: SequencePlay,
  risk = "playful",
): Promise<{ scenes: AuthorScene[]; texts: string[]; rejected: number }> {
  const source = sourceTokens(input);
  const texts: string[] = [];

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

    const userContent = mouthCraftUser({
      prompt: input.prompt,
      lens: input.lens,
      subject: input.subject,
      subjectTruth: input.subjectTruth,
      facts: input.facts,
      moments: input.sourceMoments ?? [],
      memory: input.memoryContext ?? [],
      trajectory: input.trajectory ?? [],
      beats: [beat],
    });

    const result = await localModelGenerate(
      [
        {
          role: "system",
          content: `${mouthCraftSystem(risk)}\nQRE's theatrical mouth.\nThis request is realization only. The movie and beat are already approved. Never invent a new beat, event, setting, action, or outcome. Return exactly one line for this one approved beat.`,
        },
        { role: "user", content: userContent },
      ],
      "json",
      { numPredict: 256, temperature: risk === "safe" ? 0.62 : 0.88 },
    );

    const candidate = parse(result.text)[0] ?? "";
    if (candidate && score(candidate, source) >= 0.18) texts.push(candidate);
    else texts.push("");
  }

  const scenes: AuthorScene[] = [];
  for (let i = 0; i < sequence.cuts.length; i += 1) {
    const text = texts[i];
    if (!text) continue;
    scenes.push({ text, kind: sequence.cuts[i].role === "hook" ? "hook" : sequence.cuts[i].role === "payoff" ? "payoff" : "line" });
  }
  return { scenes, texts, rejected: sequence.cuts.length - scenes.length };
}
