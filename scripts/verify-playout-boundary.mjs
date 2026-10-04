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

assert.match(
  playoutContract,
  /durationMs: number;/,
  "TEXT Playout items must carry current Playout-owned durationMs",
);

assert.match(
  playoutContract,
  /export type PlayoutImageItem = \{/,
  "Playout must own the IMAGE presentation item contract",
);

assert.match(
  playoutContract,
  /kind: "IMAGE";/,
  "IMAGE Playout items must use the IMAGE discriminator",
);

assert.match(
  playoutContract,
  /mediaId: string;/,
  "IMAGE Playout items must preserve canonical media identity",
);

assert.match(
  playoutContract,
  /url: string;/,
  "IMAGE Playout items must preserve canonical media URL",
);

assert.match(
  playoutContract,
  /sourceEventIds: string\[\];/,
  "IMAGE Playout items must carry truthful provenance",
);
assert.match(
  playoutContract,
  /export type PlayoutVideoItem = \{/,
  "Playout contract must define VIDEO items",
);

assert.match(
  playoutContract,
  /kind: "VIDEO";/,
  "VIDEO Playout items must use the VIDEO discriminator",
);

assert.match(
  playoutContract,
  /mediaId: string;/,
  "VIDEO Playout items must preserve canonical media identity",
);

assert.match(
  playoutContract,
  /url: string;/,
  "VIDEO Playout items must preserve canonical media URL",
);

assert.match(
  playoutContract,
  /sourceEventIds: string\[\];/,
  "VIDEO Playout items must carry truthful provenance",
);
assert.doesNotMatch(
  playoutContract,
  /\b(?:durationHintMs|timingHint|cinematicDuration|sceneDuration|transition|animation|audioMood|visualHint|camera|narrativeRole|placementHint)\b/,
  "Playout contracts must not add legacy presentation hints or invented narrative/media authority",
);

const authorBrain = read("packages/contracts/src/author/authorBrain.ts");

assert.doesNotMatch(
  authorBrain,
  /\bAuthorRenderedScene\b/,
  "AuthorRenderedScene must not return as current Author presentation architecture",
);

assert.doesNotMatch(
  authorBrain,
  /\b(?:durationMs|durationHintMs|transitionHint|audioMood|visualHint)\b/,
  "AuthorScene contract must not own Playout presentation timing or hints",
);

assert.doesNotMatch(
  authorBrain,
  /\b(?:imagePlacement|imageIndex|mediaPlacement|placementHint)\b/,
  "Author contract must not own media placement",
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
];

for (const file of authorServices) {
  const source = read(file);

  assert.doesNotMatch(
    source,
    /\b(?:durationMs|durationHintMs|transitionHint|audioMood|visualHint|imagePlacement|mediaPlacement|placementHint)\b/,
    `${file} must not depend on Playout presentation fields`,
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
  /deriveTextRevealDurationMs/,
  "ExperiencePlayout must own deterministic TEXT reveal duration derivation",
);

assert.match(
  playoutSource,
  /durationMs: deriveTextRevealDurationMs\(text\)/,
  "TEXT Playout output must include Playout-owned durationMs",
);

assert.match(
  playoutSource,
  /asset\.type === "image"/,
  "IMAGE composition must derive only from canonical image media",
);

assert.match(
  playoutSource,
  /mediaId: asset\.id/,
  "media composition must preserve source media identity",
);

assert.match(
  playoutSource,
  /url: asset\.url/,
  "media composition must preserve source media URL",
);

assert.match(
  playoutSource,
  /mediaSourceEventIds\(asset\)/,
  "media composition must preserve only explicit supplied provenance",
);

assert.match(
  playoutSource,
  /asset\.type === "video"/,
  "VIDEO composition must derive only from canonical video media",
);

assert.match(
  playoutSource,
  /kind: "VIDEO"/,
  "VIDEO composition must emit the VIDEO discriminator",
);

assert.match(
  playoutSource,
  /function composeMediaItems\(/,
  "Playout must compose IMAGE and VIDEO through one deterministic supplied-media stream",
);

assert.match(
  playoutSource,
  /function latestMatchingSceneIndex\(/,
  "Playout must derive provenance placement from matching Author scene boundaries",
);

assert.match(
  playoutSource,
  /items: composePlacedItems\(scenes, media\)/,
  "Playout must use deterministic provenance-aware item placement",
);

assert.doesNotMatch(
  playoutSource,
  /\b(?:captionGenerated|visualHint|camera|narrativeRole|placementHint|transitionHint)\b/,
  "media composition must not invent captions, camera direction, narrative role, or placement hints",
);

const experienceService = read("apps/api/src/services/experienceService.ts");

assert.match(
  experienceService,
  /playout\?: ExperiencePlayout;/,
  "compiled experience result must expose additive playout output",
);

assert.match(
  experienceService,
  /media\?: MediaAsset\[\];/,
  "compileExperience may accept canonical supplied media at the Playout boundary",
);

assert.match(
  experienceService,
  /const playout = composeExperiencePlayout\(canonical\.scenes,\s*input\.media \?\? \[\]\);/,
  "experience service must compose supplied media into Playout at the canonical Author boundary",
);

assert.doesNotMatch(
  experienceService,
  /const authorInput:[\s\S]*?\bmedia\s*:/,
  "supplied media must not be injected into AuthorBrainTruth as presentation authority",
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
  /\b(?:durationMs|durationHintMs|audioMood|visualHint|imagePlacement|mediaPlacement)\b/,
  "ExperienceBeat must not own Playout presentation timing or media placement",
);

console.log(
  "PLAYOUT BOUNDARY GREEN - AUTHOR MEANING - PLAYOUT TEXT/TIMING/MEDIA PROVENANCE PLACEMENT - LEGACY QUARANTINED",
);
