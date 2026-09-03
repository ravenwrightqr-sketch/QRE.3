import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorWorldSimulation } from "./src/services/authorWorldSimulation.js";

type Case = {
  name: string;
  subject: string;
  lens?: string;
  facts: string[];
  sourceMoments: string[];
};

const cases: Case[] = [
  {
    name: "Milo / dog tag / bacon",
    subject: "Milo",
    lens: "game",
    facts: ["Milo is a small dog", "Milo wears a dog tag", "Milo loves bacon"],
    sourceMoments: ["Here is Milo", "Do I smell bacon?", "The tag is still on him"],
  },
  {
    name: "service receipt / watched",
    subject: "the customer",
    lens: "noir",
    facts: ["Kitchen cleaned", "Two bathrooms cleaned", "A cat watched"],
    sourceMoments: ["Arrived", "Kitchen cleared", "Two bathrooms cleared", "Cat watched", "Finished"],
  },
  {
    name: "wedding / return",
    subject: "the couple",
    lens: "romance",
    facts: ["Wedding held", "Old photograph present", "Everyone stayed", "They returned years later"],
    sourceMoments: ["People arrived", "Old photo surfaced", "Everyone stayed", "They came back"],
  },
  {
    name: "physical product / ownership",
    subject: "the owner",
    lens: "spy",
    facts: ["A tagged object was delivered", "The owner scanned it", "The object traveled home", "The tag remained attached"],
    sourceMoments: ["Package delivered", "Owner scanned", "Object went home", "Tag remained"],
  },
];

function fail(message: string): never {
  throw new Error(`WORLD SIMULATION ACCEPTANCE FAILED: ${message}`);
}

for (const test of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: test.name,
    subject: test.subject,
    place: "",
    facts: test.facts,
    sourceMoments: test.sourceMoments,
    memoryContext: [],
    trajectory: [],
  });

  const simulation = buildAuthorWorldSimulation({
    reality: graph,
    subject: test.subject,
    lens: test.lens,
    priorExperienceIds: test.name.includes("return") ? ["experience-prior"] : [],
  });

  if (!simulation.refs.length) fail(`${test.name}: no world refs`);
  if (!simulation.snapshots.length) fail(`${test.name}: no world snapshots`);
  if (!simulation.interpretationOpportunities.length) fail(`${test.name}: no interpretation opportunities`);
  if (!simulation.cutObjectives.length && graph.events.length > 1) fail(`${test.name}: no simulation cut objectives`);

  for (const question of simulation.questions) {
    if (!question.openedByEventIds.length) fail(`${test.name}: question without event grounding`);
  }

  for (const objective of simulation.cutObjectives) {
    if (!objective.sourceEventIds.length) fail(`${test.name}: cut objective without source event`);
    if (!objective.viewerBefore || !objective.viewerAfter) fail(`${test.name}: cut objective without viewer states`);
  }

  const sourceEventIds = new Set(graph.events.map((event) => event.id));
  for (const relation of simulation.relations) {
    for (const id of relation.evidenceEventIds) {
      if (!sourceEventIds.has(id)) fail(`${test.name}: relation escaped source event universe: ${id}`);
    }
  }

  if (simulation.reentry.meaningCanChange && simulation.reentry.eligibleCallbacks.length === 0) {
    fail(`${test.name}: return context has no eligible callback/thread`);
  }

  console.log(`PASS: ${test.name}`);
  console.log(`  refs=${simulation.refs.length} relations=${simulation.relations.length} questions=${simulation.questions.length}`);
  console.log(`  opportunities=${simulation.interpretationOpportunities.length} cuts=${simulation.cutObjectives.length} threads=${simulation.durableThreads.length}`);
  console.log(`  viewer hypotheses=${simulation.viewer.hypotheses.length} predictionErrors=${simulation.viewer.predictionErrors.length}`);
}

console.log("WORLD SIMULATION ACCEPTANCE: PASS");
