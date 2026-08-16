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

/** Evidence-first mouth pass. Brain decisions stay untouched; only sentence realization is replaced. */
export async function polishAuthorScenes(input: AuthorBrainTruth, sequence: SequencePlay, risk = "playful"): Promise<{ scenes: AuthorScene[]; texts: string[]; rejected: number }> {
  const beats = sequence.cuts.map((cut, index) => ({
    order: index + 1,
    role: cut.role,
    change: cut.informationGain,
    frontier: cut.momentum?.after.informationFrontier?.frontier ?? "",
    nextNeed: cut.nextPromise ?? "",
    necessity: cut.necessity?.reason ?? "",
  }));
  const result = await localModelGenerate([
    { role: "system", content: mouthCraftSystem(risk) },
    { role: "user", content: mouthCraftUser({
      prompt: input.prompt,
      lens: input.lens,
      subject: input.subject,
      subjectTruth: input.subjectTruth,
      facts: input.facts,
      moments: input.sourceMoments,
      memory: input.memoryContext ?? [],
      trajectory: input.trajectory ?? [],
      beats,
    }) },
  ], "json", { numPredict: 640, temperature: risk === "safe" ? 0.62 : 0.86 });
  const texts = parse(result.text);
  const scenes: AuthorScene[] = [];
  for (let i = 0; i < sequence.cuts.length; i += 1) {
    const text = texts[i];
    if (!text || mouthQualityPenalty(text) > 0.45) continue;
    scenes.push({ text, kind: sequence.cuts[i].role === "hook" ? "hook" : sequence.cuts[i].role === "payoff" ? "payoff" : "line" });
  }
  return { scenes, texts, rejected: sequence.cuts.length - scenes.length };
}
