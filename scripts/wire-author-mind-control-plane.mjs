import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function file(relativePath) {
  return path.join(ROOT, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(file(relativePath), "utf8");
}

function write(relativePath, value) {
  fs.writeFileSync(file(relativePath), value, "utf8");
}

function requireOnce(source, marker, message) {
  if (!source.includes(marker)) {
    throw new Error(`AUTHOR_MIND_WIRING_MISSING_ANCHOR: ${message}`);
  }
}

function replaceOnce(source, from, to, message) {
  const count = source.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`AUTHOR_MIND_WIRING_EXPECTED_ONE_MATCH: ${message}; found=${count}`);
  }
  return source.replace(from, to);
}

const files = [
  "apps/api/src/services/authorCognition.ts",
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorMouth.ts",
  ".github/workflows/qre-ci.yml",
];

const backups = files
  .filter((relativePath) => fs.existsSync(file(relativePath)))
  .map((relativePath) => [relativePath, read(relativePath)]);

try {
  let cognition = read("apps/api/src/services/authorCognition.ts");
  requireOnce(cognition, "export type AuthorCognitivePlan = {", "AuthorCognitivePlan");

  if (!cognition.includes('from "./authorMindControlPlane.js"')) {
    cognition = replaceOnce(
      cognition,
      'import {\n  classifyLens,\n  rankLensOpportunities,\n} from "./authorCharacterLensEngine.js";\n',
      'import {\n  classifyLens,\n  rankLensOpportunities,\n} from "./authorCharacterLensEngine.js";\nimport type { AuthorMindState } from "./authorMindControlPlane.js";\nimport {\n  assertAuthorMindState,\n  buildAuthorMindState,\n} from "./authorMindControlPlane.js";\n',
      "authorCognition imports",
    );
  }

  cognition = replaceOnce(
    cognition,
    '  frameSummary: string;\n};\n',
    '  frameSummary: string;\n  mindState: AuthorMindState;\n};\n',
    "AuthorCognitivePlan mindState field",
  );

  const mindAnchor = `\n  const permanentTruths = uniq(\n`;
  requireOnce(cognition, mindAnchor, "permanentTruths construction");

  if (!cognition.includes("  const mindState = buildAuthorMindState({")) {
    cognition = replaceOnce(
      cognition,
      mindAnchor,
      `\n  const mindState = buildAuthorMindState({\n    graph: input.realityGraph ?? {\n      evidence: [],\n      events: [],\n      relations: [],\n      unresolvedTensions: [],\n      recurringSignals: [],\n      sensorySignals: [],\n    },\n    subject: input.subject,\n    selectedLens,\n    round: input.round,\n    priorScenes: input.priorScenes,\n    movieCandidates: movie.latentMovieCandidates,\n    selectedMovie,\n    experienceState,\n  });\n\n  assertAuthorMindState(mindState);\n\n  const permanentTruths = uniq(\n`,
      "mindState construction before permanent truths",
    );
  }

  cognition = replaceOnce(
    cognition,
    '    frameSummary,\n  };\n',
    '    frameSummary,\n    mindState,\n  };\n',
    "return mindState",
  );

  if (!cognition.includes("MIND CONTROL:")) {
    cognition = replaceOnce(
      cognition,
      '    "Metamorphic reasoning is the preferred path for changing meaning from supplied reality.",\n',
      '    "Metamorphic reasoning is the preferred path for changing meaning from supplied reality.",\n    `MIND CONTROL: primary=${mindState.decision.primaryCapability}; mechanism=${mindState.decision.primaryMechanism}; active=${mindState.selectedCapabilityIds.join(",")}.`,\n    `FRONTIER: ${mindState.frontier.nextCutObjective}`,\n',
      "authorBrief mind control summary",
    );
  }

  write("apps/api/src/services/authorCognition.ts", cognition);

  let brain = read("apps/api/src/services/authorBrainCanonical.ts");
  requireOnce(brain, "buildMouthCandidateMessages({", "Canonical Mouth handoff");

  if (!brain.includes("mindState: cognition.mindState")) {
    const worldPattern = /\n\s*worldSimulation:\s*cognition\.experienceState\?\.worldSimulation,\n/;
    if (worldPattern.test(brain)) {
      brain = brain.replace(
        worldPattern,
        (match) => `${match}      mindState: cognition.mindState,\n`,
      );
    } else {
      brain = replaceOnce(
        brain,
        '      domainContext:\n        input.domainContext,\n',
        '      domainContext:\n        input.domainContext,\n      mindState: cognition.mindState,\n',
        "Mouth mindState handoff",
      );
    }
  }

  write("apps/api/src/services/authorBrainCanonical.ts", brain);

  let mouth = read("apps/api/src/services/authorMouth.ts");
  requireOnce(mouth, "export type MouthCandidateGenerationInput = {", "Mouth input contract");

  if (!mouth.includes("  mindState?: unknown;\n")) {
    mouth = replaceOnce(
      mouth,
      '  domainContext?: AuthorDomainContext;\n',
      '  domainContext?: AuthorDomainContext;\n  mindState?: unknown;\n',
      "Mouth mindState input field",
    );
  }

  if (!mouth.includes("authorMind: input.mindState")) {
    mouth = replaceOnce(
      mouth,
      '          task: "REALIZE_AUTHORIZED_MATERIAL",\n',
      '          task: "REALIZE_AUTHORIZED_MATERIAL",\n          authorMind: input.mindState,\n',
      "Mouth selective control context",
    );
  }

  write("apps/api/src/services/authorMouth.ts", mouth);

  let workflow = read(".github/workflows/qre-ci.yml");
  const step = `\n      - name: Author mind control plane acceptance\n        run: pnpm exec tsx apps/api/author-mind-control-plane-acceptance.ts\n`;
  if (!workflow.includes("author-mind-control-plane-acceptance.ts")) {
    requireOnce(workflow, "      - name: Production gate\n", "CI production gate anchor");
    workflow = workflow.replace(
      "      - name: Production gate\n",
      `${step}\n      - name: Production gate\n`,
    );
    write(".github/workflows/qre-ci.yml", workflow);
  }

  console.log("AUTHOR MIND CONTROL PLANE WIRING: PASS");
  console.log("  cognition=CONNECTED");
  console.log("  canonical-brain=CONNECTED");
  console.log("  mouth=CONNECTED");
  console.log("  ci=CONNECTED");
} catch (error) {
  for (const [relativePath, contents] of backups) write(relativePath, contents);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
