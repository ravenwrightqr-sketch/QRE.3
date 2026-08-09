import { compileStoryExperience } from "./universalStoryCompiler.js";
import { compileCognitiveExperience } from "./cognitiveExperienceCompiler.js";

/**
 * Executable acceptance corpus for the universal compiler.
 *
 * This is intentionally hostile to templates: the prompts span memories,
 * events, commerce, objects, animals, travel, work, play, and abstract ideas.
 * Every prompt must become a coherent experience without a domain-specific
 * compiler path.
 */
const prompts = [
  "Create a dog groomer story for Max the poodle about his first haircut.",
  "Make a funny story about a toaster that finally learns its purpose.",
  "Turn our wedding into a playful memory people can revisit.",
  "Create a cinematic experience for a warehouse rave tonight.",
  "Tell a short story about finding my grandmother's recipe in an old box.",
  "Make this product launch feel exciting without making it corporate.",
  "Create something beautiful from a photograph of the ocean.",
  "Make a game for people waiting in line at the festival.",
  "Turn a quiet walk through Portland into a little mystery.",
  "Create an experience around this QR code that changes every time someone scans it.",
  "Build a story from nothing but the words: red shoes, rain, 1997.",
  "I want people at the event to laugh, discover something, and leave with a memory.",
];

const failures: string[] = [];

for (const prompt of prompts) {
  const result = compileStoryExperience(prompt);

  if (!result.title.trim()) failures.push(`empty title: ${prompt}`);
  if (result.momentCount < 2 || result.momentCount > 7) {
    failures.push(`bad moment count ${result.momentCount}: ${prompt}`);
  }
  if (result.story.beats.length !== result.momentCount) {
    failures.push(`story/moment mismatch: ${prompt}`);
  }
  if (!result.cinematicScenes.length) failures.push(`no scenes: ${prompt}`);
  if (!result.flowSteps.length) failures.push(`no flow: ${prompt}`);
  if (!result.story.provenance.length) failures.push(`no provenance: ${prompt}`);
  if (!result.observation.evidence.length) failures.push(`no observation evidence: ${prompt}`);
  if (result.genome.dna.includes("wedding") || result.genome.dna.includes("dog")) {
    failures.push(`domain leaked into generic DNA: ${prompt}`);
  }
}

const eventResult = compileStoryExperience(
  "Make tonight memorable.",
  {
    event: {
      name: "Night Market",
      venue: "the old station",
      participants: ["Maya", "Jon"],
      atmosphere: "electric",
    },
  },
);

if (eventResult.situation.social !== "shared") {
  failures.push("event context did not create shared social state");
}

const memoryResult = compileStoryExperience(
  "Create something meaningful from today.",
  {
    memories: [{ summary: "The last time everyone was together was five years ago." }],
  },
);

if (memoryResult.genome.memory < 0.8) {
  failures.push("memory context was not incorporated as context");
}

/**
 * Cognitive realization acceptance checks.
 *
 * The language layer is downstream of cognition: it may improve expression,
 * but it must not replace the selected subject/direction or desynchronize the
 * runtime representations that carry the story copy.
 */
const cognitiveResult = compileCognitiveExperience(
  "Create something playful around this old photograph of the ocean.",
);

if (!cognitiveResult.cognition.plan.centralSubject.trim()) {
  failures.push("cognitive realization lost its central subject");
}

if (!cognitiveResult.cognition.plan.direction.trim()) {
  failures.push("cognitive realization lost its selected direction");
}

const cognitiveBeatTexts = new Map(
  cognitiveResult.story.beats.map((beat) => [beat.id, beat.text]),
);

for (const moment of cognitiveResult.blueprint.moments) {
  const beatId = String(
    (moment.payload as { beatId?: unknown } | undefined)?.beatId ?? "",
  );
  const beatText = cognitiveBeatTexts.get(beatId);

  if (beatText && moment.description !== beatText) {
    failures.push(`blueprint language drift: ${beatId}`);
  }
}

for (const moment of cognitiveResult.moments) {
  const beatId = String(
    (moment.meta as { beatId?: unknown } | undefined)?.beatId ?? "",
  );
  const beatText = cognitiveBeatTexts.get(beatId);

  if (beatText && moment.text !== beatText) {
    failures.push(`moment language drift: ${beatId}`);
  }
}

for (const scene of cognitiveResult.scenePlan) {
  const beatText = cognitiveBeatTexts.get(scene.beatId);

  if (beatText && scene.text !== beatText) {
    failures.push(`scene-plan language drift: ${scene.beatId}`);
  }
}

if (
  cognitiveResult.model.metadata?.tags &&
  !cognitiveResult.model.metadata.tags.includes("eloquent-language-realization")
) {
  failures.push("cognitive model did not record language realization");
}

if (failures.length) {
  throw new Error(`Universal story compiler acceptance failures:\n${failures.join("\n")}`);
}

console.log(
  `Universal story compiler acceptance passed: ${prompts.length} adversarial prompts + event + memory + cognitive language synchronization.`,
);
