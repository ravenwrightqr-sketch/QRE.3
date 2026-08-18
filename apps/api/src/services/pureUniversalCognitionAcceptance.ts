import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAuthorRealityGraph } from "./authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./authorCognition.js";
import { searchLatentMovieCandidates } from "./authorLatentMovieSearch.js";

export type UniversalCognitionProbe = {
  name: string;
  facts: string[];
  moments: string[];
  lens?: string;
};

export type UniversalCognitionAcceptance = {
  passed: boolean;
  score: number;
  failures: string[];
  probes: Array<{
    name: string;
    events: number;
    relations: number;
    candidates: number;
    topScore: number;
    topHypothesis: string;
    topEvidence: string[];
  }>;
  architectureLeaks: string[];
};

const ROOT = join(process.cwd(), "apps", "api", "src", "services");

/**
 * These strings are acceptance evidence, not authoring instructions.
 * The universal author must never contain source-example recipes that teach it
 * how to solve a particular domain.
 */
const FORBIDDEN_RECIPE_LEAKS = [
  "Coco got a bath",
  "Coco stole a blue bow",
  "Dog grooming service receipt",
  "poodle|nervous|fierce|cool",
  "wedding|vows|ceremony",
  "qr|tag|keychain|plaque",
  "million|expensive|luxury|wealth",
  "service|client|customer|groom",
];

const UNIVERSAL_FILES = [
  "authorRealityGraph.ts",
  "authorCognition.ts",
  "authorLatentMovieSearch.ts",
  "authorLatentMovieConvergence.ts",
  "authorBrainUniversal.ts",
];

const PROBES: UniversalCognitionProbe[] = [
  {
    name: "weathered-object-return",
    facts: [
      "Mara returned to the apartment after eight years.",
      "A cracked blue cup was still on the same shelf.",
      "The cup had been repaired twice.",
      "She left without taking it.",
    ],
    moments: [
      "Mara stopped when she saw the cup.",
      "The repaired crack was visible again.",
      "She left the cup where it was.",
    ],
    lens: "observational",
  },
  {
    name: "technical-failure-ritual",
    facts: [
      "The generator failed during the night.",
      "The technician followed an old handwritten startup sequence.",
      "The sequence ended with a note to leave one switch untouched.",
      "The system restarted after the switch was left alone.",
    ],
    moments: [
      "The old instruction appeared more important after the restart.",
      "The technician did not change the final switch.",
    ],
    lens: "tension",
  },
  {
    name: "quiet-family-ritual",
    facts: [
      "Every Sunday, three siblings placed the same record on the turntable.",
      "One sibling always arrived late.",
      "This Sunday the record started before the late sibling arrived.",
      "Nobody stopped the song.",
    ],
    moments: [
      "The song was already playing when the late sibling walked in.",
      "The ritual continued without being explained.",
    ],
    lens: "sentimental",
  },
  {
    name: "physical-work-surprise",
    facts: [
      "A painter was hired to refresh a small storefront.",
      "The owner asked for the old lettering to disappear.",
      "Under the peeling paint, a second older name became visible.",
      "The owner kept the older name exposed.",
    ],
    moments: [
      "The hidden lettering changed the final decision.",
      "The storefront was left partly restored and partly exposed.",
    ],
    lens: "discovery",
  },
];

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function assertStructuralMovie(candidate: ReturnType<typeof searchLatentMovieCandidates>[number]): string[] {
  const failures: string[] = [];
  if (!candidate.evidence.length) failures.push("movie has no evidence");
  if (!candidate.trajectory.length) failures.push("movie has no trajectory");
  if (!candidate.hypothesis.length) failures.push("movie has no hypothesis");
  if (candidate.truthRisk > 0.35) failures.push(`truth risk too high: ${candidate.truthRisk}`);
  if (candidate.score <= 0) failures.push("movie score did not rise above zero");
  return failures;
}

function architectureLeakScan(): string[] {
  const leaks: string[] = [];
  for (const file of UNIVERSAL_FILES) {
    const path = join(ROOT, file);
    const source = readFileSync(path, "utf8");
    for (const forbidden of FORBIDDEN_RECIPE_LEAKS) {
      if (source.toLowerCase().includes(forbidden.toLowerCase())) {
        leaks.push(`${file}: forbidden recipe/domain phrase '${forbidden}'`);
      }
    }
  }
  return leaks;
}

export function runPureUniversalCognitionAcceptance(): UniversalCognitionAcceptance {
  const failures: string[] = [];
  const probes: UniversalCognitionAcceptance["probes"] = [];

  for (const probe of PROBES) {
    const graph = buildAuthorRealityGraph({
      prompt: `${probe.name} universal cognition probe`,
      subject: "the supplied subject",
      facts: probe.facts,
      sourceMoments: probe.moments,
      memoryContext: [],
      place: undefined,
    });

    if (graph.events.length < 2) failures.push(`${probe.name}: insufficient graph events`);
    if (!graph.relations.length) failures.push(`${probe.name}: no relations discovered`);

    const cognition = buildAuthorCognitivePlan({
      prompt: `${probe.name} universal cognition probe`,
      lens: probe.lens,
      subject: "the supplied subject",
      facts: probe.facts,
      sourceMoments: probe.moments,
      realityGraph: graph,
      memoryContext: [],
      priorScenes: [],
      priorStrategies: [],
      round: 1,
    });

    if (!cognition.latentMovieCandidates.length) {
      failures.push(`${probe.name}: cognition produced no latent movie candidates`);
    }

    const top = cognition.latentMovieCandidates[0];
    if (top) failures.push(...assertStructuralMovie(top).map((failure) => `${probe.name}: ${failure}`));

    probes.push({
      name: probe.name,
      events: graph.events.length,
      relations: graph.relations.length,
      candidates: cognition.latentMovieCandidates.length,
      topScore: top?.score ?? 0,
      topHypothesis: clean(top?.hypothesis?.[0] ?? ""),
      topEvidence: top?.evidence?.slice(0, 4) ?? [],
    });
  }

  const architectureLeaks = architectureLeakScan();
  failures.push(...architectureLeaks);

  const distinctHypotheses = new Set(
    probes.map((probe) => probe.topHypothesis).filter(Boolean),
  );
  if (distinctHypotheses.size < Math.min(3, probes.length)) {
    failures.push("cross-domain probes collapsed into too few distinct cognitive hypotheses");
  }

  const topEvidenceStrings = probes.map((probe) => probe.topEvidence.join(" | ")).join(" ").toLowerCase();
  if (topEvidenceStrings.includes("coco") || topEvidenceStrings.includes("blue bow")) {
    failures.push("historical Coco recipe leaked into cognitive evidence");
  }

  const passed = failures.length === 0;
  const score = Math.max(
    0,
    Number(
      (
        1 -
        failures.length /
          Math.max(1, PROBES.length * 4 + architectureLeaks.length)
      ).toFixed(3),
    ),
  );

  return { passed, score, failures, probes, architectureLeaks };
}

if (process.argv[1]?.endsWith("pureUniversalCognitionAcceptance.ts")) {
  const result = runPureUniversalCognitionAcceptance();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.passed ? 0 : 1;
}
