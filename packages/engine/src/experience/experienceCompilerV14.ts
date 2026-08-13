import type { MemoryContext, MemoryPreferenceV14 } from "@qre/contracts";
import { compileExperienceV13, type CompiledExperienceV13, type ExperienceCompilerContextV13 } from "./experienceCompilerV13.js";
import { compileUniversalMemoryV14, memoryIntelligenceSignalsV14, type UniversalMemoryV14 } from "./universalMemoryV14.js";

export type ExperienceCompilerContextV14 = ExperienceCompilerContextV13 & {
  memory?: MemoryContext;
};

export type CompiledExperienceV14 = Omit<CompiledExperienceV13, "version" | "memory"> & {
  version: "v14";
  memory: UniversalMemoryV14;
  memoryIntelligenceSignals: string[];
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const key = (value: string) => normalize(value).replace(/\s+/g, "-");

function explicitPreferencesFromPrompt(prompt: string, memory: UniversalMemoryV14): MemoryPreferenceV14[] {
  const results: MemoryPreferenceV14[] = [];
  const pattern = /\b(like|likes|love|loves|enjoy|enjoys|prefer|prefers|favorite|favourite|dislike|dislikes|hate|hates|avoid|avoids)\b\s+([^.!?]+)/gi;

  for (const match of prompt.matchAll(pattern)) {
    const verb = match[1].toLowerCase();
    const value = match[2].trim().replace(/\s+/g, " ");
    if (!value) continue;

    const polarity: MemoryPreferenceV14["polarity"] = /prefer/.test(verb)
      ? "prefers"
      : /dislike|hate/.test(verb)
        ? "dislikes"
        : /avoid/.test(verb)
          ? "avoids"
          : "likes";

    const normalizedSentence = normalize(match[0]);
    const evidence = memory.events.find((event) => {
      const normalizedEvent = normalize(event.summary);
      return normalizedEvent.includes(normalizedSentence) || normalizedSentence.includes(normalizedEvent);
    });
    const entityIds = evidence?.entityIds.length
      ? evidence.entityIds
      : memory.entities.filter((entity) => normalize(match[0]).includes(normalize(entity.name))).map((entity) => entity.id);
    const fallbackEntityIds = entityIds.length ? entityIds : memory.events.at(-1)?.entityIds ?? [];
    const observedAt = evidence?.occurredAt ?? memory.generatedAt;

    for (const entityId of fallbackEntityIds) {
      results.push({
        id: `memory-preference-v14-explicit-${key(entityId)}-${key(value)}`,
        entityId,
        value,
        polarity,
        confidence: evidence?.confidence ?? 0.9,
        evidenceEventIds: evidence ? [evidence.id] : [],
        firstObservedAt: observedAt,
        lastObservedAt: observedAt,
        visibility: memory.entities.find((entity) => entity.id === entityId)?.visibility ?? "private",
      });
    }
  }

  return results;
}

export function compileExperienceV14(prompt: string, context: ExperienceCompilerContextV14 = {}): CompiledExperienceV14 {
  const v13 = compileExperienceV13(prompt, context);
  let memory = compileUniversalMemoryV14(
    context.memoryScope ?? { assetId: "experience-v14" },
    prompt,
    v13.movie,
    context.memory,
  );

  const explicit = explicitPreferencesFromPrompt(prompt, memory);
  if (explicit.length) {
    const merged = new Map(memory.intelligence.preferences.map((preference) => [preference.id, preference]));
    for (const preference of explicit) merged.set(preference.id, preference);
    memory = {
      ...memory,
      intelligence: {
        ...memory.intelligence,
        preferences: [...merged.values()],
      },
    };
  }

  const subjectId = v13.movie.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...v13,
    version: "v14",
    memory,
    memoryIntelligenceSignals: memoryIntelligenceSignalsV14(memory, subjectId),
  };
}
