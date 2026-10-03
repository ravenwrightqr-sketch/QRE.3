import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const requiredFiles = [
  "packages/contracts/src/playout/playout.ts",
  "packages/contracts/src/playout/index.ts",
  "apps/api/src/services/experiencePlayout.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `${file} must exist`);
}

const contractsIndex = read("packages/contracts/src/index.ts");
assert.match(
  contractsIndex,
  /export \* from "\.\/playout\/index\.js";/,
  "current Playout contract must be exported from @qre/contracts",
);

const playoutContract = read("packages/contracts/src/playout/playout.ts");
assert.match(
  playoutContract,
  /revealIndex: number;/,
  "TEXT Playout items must carry deterministic revealIndex within their source scene",
);
assert.doesNotMatch(
  playoutContract,
  /\b(?:duration|durationHintMs|transition|animation|audio|visual|camera)\b/,
  "Playout v2 reveal contract must not add timing, transition, animation, audio, visual, or camera metadata",
);

const authorBrain = read("packages/contracts/src/author/authorBrain.ts");
assert.doesNotMatch(
  authorBrain,
  /\bAuthorRenderedScene\b/,
  "AuthorRenderedScene must not return as current Author presentation architecture",
);
assert.doesNotMatch(
  authorBrain,
  /\b(?:durationHintMs|transitionHint|audioMood|visualHint)\b/,
  "AuthorScene contract must not own presentation hints",
);
assert.doesNotMatch(
  authorBrain,
  /\b(?:fade|slide|zoom|flash)\b/,
  "Author contract must not expose transition vocabulary",
);

const authorServices = [
  "apps/api/src/services/authorBrainCanonical.ts",
  "apps/api/src/services/authorCreative.ts",
  "apps/api/src/services/authorCreativeDiscovery.ts",
  "apps/api/src/services/authorCreativeGroundingVerifier.ts",
  "apps/api/src/services/experiencePlayout.ts",
];

for (const file of authorServices) {
  const source = read(file);
  assert.doesNotMatch(
    source,
    /\b(?:durationHintMs|transitionHint|audioMood|visualHint)\b/,
    `${file} must not depend on legacy presentation hint fields`,
  );
}

const playoutSource = read("apps/api/src/services/experiencePlayout.ts");
assert.doesNotMatch(
  playoutSource,
  /cinematic|Cinematic|movie|Movie/,
  "ExperiencePlayout must not import or depend on old Cinematic/Movie authoring vocabulary",
);
assert.match(
  playoutSource,
  /splitAuthorSceneTextForPlayout/,
  "ExperiencePlayout must own deterministic reveal splitting",
);
assert.match(
  playoutSource,
  /reconstructPlayoutSceneText/,
  "ExperiencePlayout must expose the exact reconstruction rule",
);
assert.match(
  playoutSource,
  /revealIndex/,
  "ExperiencePlayout output must include revealIndex",
);

const experienceService = read("apps/api/src/services/experienceService.ts");
assert.match(
  experienceService,
  /playout\?: ExperiencePlayout;/,
  "compiled experience result must expose additive playout output",
);
assert.match(
  experienceService,
  /const playout = composeExperiencePlayout\(canonical\.scenes\);/,
  "experience service must compose Playout at the canonical Author boundary",
);
assert.match(
  experienceService,
  /\r?\n\s+playout,\r?\n/,
  "experience service must return playout additively",
);
assert.match(
  experienceService,
  /movieMode\?: boolean;/,
  "movieMode may remain only as a deprecated compatibility alias",
);
assert.match(
  experienceService,
  /@deprecated Compatibility only\. Prefer playoutMode\./,
  "movieMode compatibility must stay explicitly deprecated",
);

const storyBeat = read("packages/contracts/src/story/beat.ts");
assert.doesNotMatch(
  storyBeat,
  /\b(?:durationHintMs|audioMood|visualHint)\b/,
  "ExperienceBeat must not own presentation hints now that Playout owns presentation",
);

console.log("PLAYOUT BOUNDARY GREEN - AUTHOR MEANING - PLAYOUT PRESENTATION - LEGACY QUARANTINED");
