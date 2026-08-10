import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

type RuntimeCase = {
  name: string;
  prompt: string;
  anchors: string[];
};

const cases: RuntimeCase[] = [
  {
    name: "memory",
    prompt: "My dog just turned ten and I want her story to keep growing after I'm gone",
    anchors: ["dog", "story", "memories"],
  },
  {
    name: "commerce",
    prompt: "I run a tattoo shop but I don't want another boring loyalty program",
    anchors: ["tattoo", "return"],
  },
  {
    name: "game",
    prompt: "Create a treasure hunt for kids",
    anchors: ["treasure", "clue"],
  },
  {
    name: "journey",
    prompt: "Make my surfboard feel like it has traveled more than I have",
    anchors: ["surfboard", "journey"],
  },
  {
    name: "utility",
    prompt: "Teach someone how to make sourdough",
    anchors: ["sourdough", "useful"],
  },
  {
    name: "social",
    prompt: "Make a QR experience for a nightclub",
    anchors: ["nightclub", "people"],
  },
  {
    name: "discovery",
    prompt: "Turn a musician's guitar pick into a portal into their universe",
    anchors: ["guitar", "discover"],
  },
  {
    name: "story",
    prompt: "Create something completely weird involving aliens and a gas station",
    anchors: ["aliens", "gas station"],
  },
];

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function beatId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" ? id : "";
}

function beatText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return text((value as { text?: unknown }).text);
}

function payload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function assertRuntimeContinuity(name: string, result: ReturnType<typeof compileCognitiveExperience>): void {
  const beats = result.story.beats;
  const byId = new Map(beats.map((beat) => [beat.id, beat.text]));

  if (!beats.length) {
    throw new Error(`No story beats produced for ${name}`);
  }

  if (new Set(beats.map((beat) => beat.text.trim().toLowerCase())).size < Math.min(3, beats.length)) {
    throw new Error(`Story prose collapsed into repeated beats for ${name}`);
  }

  if (result.flowSteps.length !== beats.length) {
    throw new Error(`Flow/beat count drift for ${name}`);
  }

  if (result.moments.length !== beats.length) {
    throw new Error(`Moment/beat count drift for ${name}`);
  }

  if (result.cinematicScenes.length !== beats.length) {
    throw new Error(`Scene/beat count drift for ${name}`);
  }

  for (const step of result.flowSteps) {
    const beat = payload(step.payload).beat;
    const id = beatId(beat);
    if (!id || !byId.has(id)) {
      throw new Error(`Flow step lost its source beat for ${name}`);
    }
    if (beatText(beat) !== byId.get(id)) {
      throw new Error(`Flow beat text drifted from story beat for ${name}`);
    }
  }

  for (const moment of result.moments) {
    const meta = moment.meta as { beatId?: unknown } | undefined;
    const id = typeof meta?.beatId === "string" ? meta.beatId : "";
    if (!id || !byId.has(id)) {
      throw new Error(`Moment lost its source beat for ${name}`);
    }
    if (moment.text !== byId.get(id)) {
      throw new Error(`Moment text drifted from story beat for ${name}`);
    }
  }

  for (const moment of result.blueprint.moments) {
    const meta = payload(moment.payload);
    const id = typeof meta.beatId === "string" ? meta.beatId : "";
    if (!id || !byId.has(id)) {
      throw new Error(`Blueprint moment lost its source beat for ${name}`);
    }
    if (moment.description !== byId.get(id)) {
      throw new Error(`Blueprint moment description drifted for ${name}`);
    }
  }

  for (const [index, scene] of result.cinematicScenes.entries()) {
    const moment = result.moments[index];
    if (!moment || JSON.stringify(scene.moment) !== JSON.stringify(moment)) {
      throw new Error(`Cinematic scene ${index} drifted from its semantic moment for ${name}`);
    }
  }
}

const results = cases.map((testCase) => {
  const result = compileCognitiveExperience(testCase.prompt);
  const plan = result.cognition.plan;

  if (plan.direction !== result.cognition.selectedHypothesis.kind) {
    throw new Error(`Cognitive direction drifted for ${testCase.name}`);
  }

  if (result.blueprint.cognitivePlan?.direction !== plan.direction) {
    throw new Error(`Blueprint lost cognitive direction for ${testCase.name}`);
  }

  if (!plan.premise) {
    throw new Error(`Conserved premise missing for ${testCase.name}`);
  }

  const storyText = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();
  const realizedAnchor = testCase.anchors.some((anchor) => storyText.includes(anchor.toLowerCase()));
  if (!realizedAnchor) {
    throw new Error(`No salient prompt anchor reached story prose for ${testCase.name}`);
  }

  assertRuntimeContinuity(testCase.name, result);

  return result;
});

const directions = new Set(results.map((result) => result.cognition.plan.direction));
if (directions.size < 6) {
  throw new Error(`Cognitive/runtime collapse: expected at least 6 directions, got ${directions.size}`);
}

const arbitrary = compileCognitiveExperience("asdf 123");
if (!arbitrary.story.beats.length || !arbitrary.moments.length || !arbitrary.cinematicScenes.length) {
  throw new Error("Arbitrary input did not survive the complete runtime compilation path");
}
assertRuntimeContinuity("arbitrary input", arbitrary);

const memory = results.find((result) => result.cognition.plan.direction === "memory");
const utility = results.find((result) => result.cognition.plan.direction === "utility");
if (!memory || !utility) {
  throw new Error("Required memory/utility probes were not produced");
}

if (memory.story.beats.map((beat) => beat.kind).join("→") === utility.story.beats.map((beat) => beat.kind).join("→")) {
  throw new Error("Distinct cognitive directions collapsed into the same runtime trajectory");
}

const accumulating = compileCognitiveExperience(
  "Create a funny birthday memory that family members can keep adding to until it becomes folklore.",
);
const accumulatingText = accumulating.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

if (!/(add|adding|accumulat|grows?|folklore|contribut)/i.test(accumulatingText)) {
  throw new Error("Accumulation/contribution semantics were inferred but did not reach realized story prose");
}

const adaptive = compileCognitiveExperience(
  "Princess the poodle returns to the groomer. She remembers the absurd treatment, has preferences now, and every visit should adapt to what she loved before.",
);
const adaptiveText = adaptive.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

if (!/(adapt|prefer|remember|history|previous|return|loved)/i.test(adaptiveText)) {
  throw new Error("Adaptive/history semantics were inferred but did not reach realized story prose");
}

console.log("✓ cognitive runtime continuity acceptance passed");
console.log(`  cases: ${cases.length}`);
console.log(`  directions: ${[...directions].join(", ")}`);
console.log("  runtime chain: cognition → premise → story → blueprint → flow → moments → scenes");
console.log("  semantic mechanics: accumulation + adaptation reached realized prose");
