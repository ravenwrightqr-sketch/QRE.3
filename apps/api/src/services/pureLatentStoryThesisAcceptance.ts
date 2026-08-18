import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";
import { deriveLatentStoryThesis } from "./authorLatentStoryThesis.js";

const probes = [
  {
    name: "weathered-object-return",
    subject: "Mara",
    facts: [
      "Mara returned to the apartment after eight years.",
      "A cracked blue cup was still on the same shelf.",
      "The cup had been repaired twice.",
      "The repaired crack was visible again.",
    ],
    moments: [
      "Mara returned to the apartment after eight years.",
      "A cracked blue cup was still on the same shelf.",
      "The repaired crack was visible again.",
    ],
  },
  {
    name: "technical-failure-ritual",
    subject: "Noah",
    facts: [
      "The generator failed during the night.",
      "The system restarted after the switch was left alone.",
      "The old instruction appeared more important after the restart.",
      "The sequence ended with a note to leave one switch untouched.",
    ],
    moments: [
      "The generator failed during the night.",
      "The system restarted after the switch was left alone.",
      "The old instruction appeared more important after the restart.",
      "The sequence ended with a note to leave one switch untouched.",
    ],
  },
  {
    name: "quiet-family-ritual",
    subject: "the siblings",
    facts: [
      "One sibling always arrived late.",
      "Every Sunday the record started before the late sibling arrived.",
      "This Sunday the record started before the late sibling arrived again.",
      "The song was already playing when the late sibling walked in.",
    ],
    moments: [
      "One sibling always arrived late.",
      "Every Sunday the record started before the late sibling arrived.",
      "The song was already playing when the late sibling walked in.",
    ],
  },
  {
    name: "physical-work-surprise",
    subject: "the storefront",
    facts: [
      "A painter was hired to refresh a small storefront.",
      "The owner asked for the old lettering to disappear.",
      "A second older name became visible.",
      "The storefront was left partly restored and partly exposed.",
    ],
    moments: [
      "A painter was hired to refresh a small storefront.",
      "The owner asked for the old lettering to disappear.",
      "A second older name became visible.",
      "The storefront was left partly restored and partly exposed.",
    ],
  },
] as const;

const results = probes.map((probe) => {
  const graph = buildAuthorRealityGraph({
    prompt: probe.name,
    subject: probe.subject,
    facts: [...probe.facts],
    sourceMoments: [...probe.moments],
    memoryContext: [],
    trajectory: [],
  });

  const candidate = searchLatentMovieCandidates({
    graph,
    subject: probe.subject,
    lens: "neutral",
    limit: 4,
  })[0];

  if (!candidate) {
    return {
      name: probe.name,
      passed: false,
      failure: "no latent movie candidate",
    };
  }

  const thesis = deriveLatentStoryThesis(graph, candidate);

  return {
    name: probe.name,
    passed:
      Boolean(thesis.initialReading) &&
      Boolean(thesis.semanticTurn) &&
      thesis.carrierEventIds.length > 0 &&
      thesis.sealingEventIds.length > 0 &&
      Boolean(thesis.payoffDependency) &&
      thesis.counterfactualDependency > 0,
    thesis,
    candidateScore: candidate.score,
    supportingRelationKinds: candidate.supportingRelationKinds,
    trajectoryLength: candidate.trajectory.length,
  };
});

const failures = results.filter((result) => !result.passed);

const output = {
  passed: failures.length === 0,
  score: Number(
    (results.filter((result) => result.passed).length / results.length).toFixed(3),
  ),
  failures: failures.map((result) => result.name),
  results,
};

console.log(JSON.stringify(output, null, 2));

if (!output.passed) {
  process.exitCode = 1;
}
