import { buildMemoryWriteBatch, compileCognitiveExperience } from "@qre/engine";

const cases = [
  {
    prompt: "Preserve my wedding day forever with my wife and our family.",
    expected: ["memory", "wedding"],
  },
  {
    prompt: "My dog Max has been part of our family for ten years and his story should keep growing.",
    expected: ["dog", "Max"],
  },
  {
    prompt: "Our house on Oak Street is where every family holiday happened.",
    expected: ["house", "Oak Street"],
  },
  {
    prompt: "Create a mysterious alien portal at the gas station.",
    expected: ["gas station"],
  },
];

for (const test of cases) {
  const compiled = compileCognitiveExperience(test.prompt);
  const batch = buildMemoryWriteBatch({
    assetId: "acceptance-asset",
    prompt: test.prompt,
    plan: compiled.cognition.plan,
  });

  const haystack = [
    ...batch.entities.map((entity) => entity.name),
    ...batch.facts.map((fact) => fact.value),
    ...batch.relations.map((relation) => relation.relation),
  ].join(" ").toLowerCase();

  for (const expected of test.expected) {
    if (!haystack.includes(expected.toLowerCase())) {
      throw new Error(`memory compiler lost observed material: ${expected} for ${test.prompt}`);
    }
  }

  for (const fact of batch.facts) {
    if (fact.source === "system" && String(fact.metadata ?? "").includes("creative_realization")) {
      throw new Error("creative realization crossed into durable factual memory");
    }
  }
}

const first = compileCognitiveExperience("My grandfather gave me this watch.");
const second = compileCognitiveExperience("My grandfather gave me this watch and I want its history to continue.", {
  memories: [
    {
      summary: "subject: watch",
      entities: ["watch", "grandfather"],
      timestamp: new Date().toISOString(),
    },
  ],
});

if (first.cognition.plan.direction !== "discovery" && first.cognition.plan.direction !== "memory") {
  throw new Error("expected memory/discovery direction for family artifact");
}

if (!second.cognition.plan.dynamicBehavior.length) {
  throw new Error("memory-aware compilation lost adaptive behavior");
}

console.log("✓ durable memory compiler acceptance passed");
