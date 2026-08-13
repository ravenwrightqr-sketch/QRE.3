/**
 * Super Cog context enrichment.
 * Memory is context, not a replacement for the present prompt.
 */

import { compileSuperCogExperience as compileCanonical } from "./superCogCanonical.js";
import type { CognitiveCompileContext, CompiledCognitiveExperience } from "@qre/contracts";

export function compileSuperCogExperience(
  prompt: string,
  context: CognitiveCompileContext = {},
): CompiledCognitiveExperience {
  const result = compileCanonical(prompt);
  const memories = context.memories?.filter((memory) => memory.summary.trim()) ?? [];
  if (!memories.length && !context.audience?.length && !context.priorEvidence?.length && !context.location) return result;

  const memoryText = memories.map((memory) => memory.summary.trim()).join(" ");
  const memorySignals = memories.length
    ? [...result.cognition.understanding.memorySignals, "prior memory is available as context"]
    : result.cognition.understanding.memorySignals;
  const audience = context.audience?.length
    ? [...new Set([...result.cognition.understanding.audience, ...context.audience])]
    : result.cognition.understanding.audience;
  const worldSignals = context.location
    ? [...result.cognition.understanding.worldSignals, `context location: ${context.location.label ?? context.location.city ?? context.location.region ?? "known place"}`]
    : result.cognition.understanding.worldSignals;

  const understanding = {
    ...result.cognition.understanding,
    memorySignals: [...new Set(memorySignals)],
    audience: [...new Set(audience)],
    worldSignals: [...new Set(worldSignals)],
  };

  const plan = {
    ...result.cognition.plan,
    memoryModel: [...new Set([...result.cognition.plan.memoryModel, ...memories.map((memory) => memory.summary.trim())])],
    futureEvolution: [...result.cognition.plan.futureEvolution, ...(memories.length ? ["New memories can extend this experience without erasing the present encounter."] : [])],
    evidence: [...result.cognition.plan.evidence, ...(context.priorEvidence ?? []).map((signal) => ({ signal, source: "context" as const, weight: 0.82 }))],
  };

  const story = memoryText && result.story.beats.length
    ? {
        ...result.story,
        hook: `Existing memory adds context: ${memoryText} ${result.story.hook}`,
        beats: result.story.beats.map((beat, index) => index === 0
          ? { ...beat, text: `Existing memory adds context: ${memoryText} ${beat.text}` }
          : beat),
      }
    : result.story;

  const moments = result.moments.map((moment, index) => index === 0 && "text" in moment && memoryText
    ? { ...moment, text: `Existing memory adds context: ${memoryText} ${moment.text}` }
    : moment);
  const scenePlan = result.scenePlan.map((scene, index) => index === 0 && memoryText
    ? { ...scene, text: `Existing memory adds context: ${memoryText} ${scene.text}` }
    : scene);
  const cinematicScenes = result.cinematicScenes.map((scene, index) => index === 0 && memoryText && "text" in scene.moment
    ? { ...scene, moment: { ...scene.moment, text: `Existing memory adds context: ${memoryText} ${scene.moment.text}` } }
    : scene);

  const cognition = {
    ...result.cognition,
    understanding,
    plan,
    story,
    opportunities: {
      ...result.cognition.opportunities,
      memory: memories.length ? [...result.cognition.opportunities.memory, ...memories.map((memory) => `Remembered context: ${memory.summary}`)] : result.cognition.opportunities.memory,
      temporal: memories.length ? [...result.cognition.opportunities.temporal, "Later memories can change future encounters."] : result.cognition.opportunities.temporal,
    },
  };
  cognition.memoryOpportunities = cognition.opportunities.memory;
  cognition.temporalOpportunities = cognition.opportunities.temporal;

  const genome = {
    ...result.genome,
    memory: memories.length ? 0.95 : result.genome.memory,
    replay: memories.length ? Math.max(result.genome.replay, 0.9) : result.genome.replay,
    meaning: { ...result.genome.meaning, memories: [...result.genome.meaning.memories, ...memories.map((memory) => memory.summary)] },
    themes: [...new Set([...result.genome.themes, ...(memories.length ? ["memory"] : [])])],
    dna: [...new Set([...result.genome.dna, ...(memories.length ? ["memory-as-context"] : [])])],
  };

  const blueprint = {
    ...result.blueprint,
    cognitivePlan: plan,
    moments: result.blueprint.moments.map((moment, index) => index === 0 && memoryText
      ? { ...moment, description: `Existing memory adds context: ${memoryText} ${moment.description ?? ""}` }
      : moment),
  };

  return { ...result, cognition, genome, story, blueprint, moments, scenePlan, cinematicScenes };
}
