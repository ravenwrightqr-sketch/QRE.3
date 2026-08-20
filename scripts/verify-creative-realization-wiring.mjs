/**
 * QRE CREATIVE REALIZATION WIRING GUARD · CANONICAL
 *
 * Production invariant:
 *
 *   Reality
 *      ↓
 *   Cognition / Character Meaning
 *      ↓
 *   Semantic Trajectory
 *      ↓
 *   Realization Strategies
 *      ↓
 *   Creative Realization
 *      ↓
 *   Mouth
 *      ↓
 *   Beam
 *
 * This guard verifies ownership and wiring.
 *
 * It MUST NOT depend on:
 *   - exact formatting
 *   - variable names chosen by the implementation
 *   - one exact prompt sentence
 *   - whitespace
 *
 * It MUST detect:
 *   - missing production stages
 *   - Master bypassing Creative Realization
 *   - Mouth bypassing Creative Realization
 *   - strategy lattice becoming a second author
 *   - Creative Realization calling a model
 *   - missing shared contract
 *   - missing production documentation
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function absolute(relative) {
  return path.join(root, relative);
}

function exists(relative) {
  return fs.existsSync(absolute(relative));
}

function read(relative) {
  const file = absolute(relative);

  if (!fs.existsSync(file)) {
    throw new Error(
      `QRE CREATIVE REALIZATION GUARD · required file missing: ${relative}`,
    );
  }

  return fs.readFileSync(file, "utf8");
}

function contains(source, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(source);
  }

  return source.includes(pattern);
}

function absent(source, pattern) {
  return !contains(source, pattern);
}

function any(source, patterns) {
  return patterns.some((pattern) =>
    contains(source, pattern),
  );
}

function all(source, patterns) {
  return patterns.every((pattern) =>
    contains(source, pattern),
  );
}

function report(label, passed) {
  console.log(
    `${passed ? "GREEN" : "FAIL"}: ${label}`,
  );

  return passed;
}

const FILES = {
  master:
    "apps/api/src/services/authorBrainUniversal.ts",

  mouth:
    "apps/api/src/services/authorMouthCandidateSearch.ts",

  strategy:
    "apps/api/src/services/authorRealizationStrategyLattice.ts",

  engine:
    "apps/api/src/services/authorCreativeRealizationEngine.ts",

  character:
    "apps/api/src/services/authorCharacterLensEngine.ts",

  contract:
    "packages/contracts/src/cogauthor/mouth.ts",

  manifest:
    "docs/MOUTH_PRODUCTION_MANIFEST.md",
};

const master = read(FILES.master);
const mouth = read(FILES.mouth);
const strategy = read(FILES.strategy);
const engine = read(FILES.engine);
const character = read(FILES.character);
const contract = read(FILES.contract);
const manifest = read(FILES.manifest);

const checks = [
  [
    "engine exists",
    exists(FILES.engine),
  ],

  [
    "character realization input stage exists",
    exists(FILES.character) &&
      contains(
        character,
        /export\s+(?:async\s+)?function\s+buildCharacterProfile\b/,
      ),
  ],

  [
    "shared creative realization contract",
    all(contract, [
      "MouthCreativeRealization",
      "creativeRealization?: MouthCreativeRealization",
    ]),
  ],

  [
    "master imports creative realization stages",
    all(master, [
      'authorCharacterLensEngine.js',
      'authorRealizationStrategyLattice.js',
      'authorCreativeRealizationEngine.js',
    ]),
  ],

  [
    "master invokes creative realization engine",
    contains(
      master,
      /\bbuildCreativeRealization\s*\(/,
    ),
  ],

  [
    "master computes creative realization",
    contains(
      master,
      /\bcreativeRealization\b\s*=/,
    ) &&
      contains(
        master,
        /\bbuildCreativeRealization\s*\(/,
      ),
  ],

  [
    "master passes character meaning into realization",
    all(master, [
      "buildCharacterProfile(",
      "const character",
      "buildCreativeRealization(",
      "character",
    ]),
  ],

  [
    "master passes selected strategies into realization",
    all(master, [
      "selectSafeStrategies(",
      "const strategies",
      "buildCreativeRealization(",
      "strategies",
    ]),
  ],

  [
    "master attaches realization to Mouth beat",
    contains(
      master,
      /\bcreativeRealization\s*,/,
    ) ||
      contains(
        master,
        /creativeRealization\s*:/,
      ),
  ],

  [
    "mouth consumes creative realization",
    all(mouth, [
      "beat.creativeRealization",
      "creativeOpportunity",
      "realizationIntent",
      "viewerEffect",
      "creativeRealization:",
    ]),
  ],

  [
    "mouth treats realization as language authority",
    any(mouth, [
      /approved creative realization/i,
      /approved semantic job/i,
      /creative expression of the approved realization/i,
    ]),
  ],

  [
    "mouth rejects literal fact restatement",
    all(mouth, [
      /raw material/i,
      /literalize the source facts into captions/i,
      /source sentence may be correct/i,
    ]),
  ],

  [
    "mouth rejects fact-collage scaffolding",
    all(mouth, [
      /subject\s*\+\s*trait\s*\+\s*action/i,
      /comma-chain fact collage/i,
    ]),
  ],

  [
    "mouth preserves concrete-reality boundary",
    all(mouth, [
      /invent people, objects, places, actions/i,
      /must not create a new concrete event/i,
    ]),
  ],

  [
    "strategy lattice remains strategy-only",
    contains(
      strategy,
      /\bselectSafeStrategies\s*\(/,
    ) &&
      absent(
        strategy,
        /buildCreativeRealizationForBeat/,
      ) &&
      absent(
        strategy,
        /buildCreativeRealization\s*\(/,
      ),
  ],

  [
    "strategy lattice does not own language generation",
    absent(
      strategy,
      /localModelGenerate\s*\(/,
    ) &&
      absent(
        strategy,
        /\bfetch\s*\(/,
      ) &&
      absent(
        strategy,
        /responsesApi\s*\(/,
      ),
  ],

  [
    "creative realization engine remains deterministic",
    contains(
      engine,
      /\bbuildCreativeRealization\s*\(/,
    ) &&
      absent(
        engine,
        /localModelGenerate\s*\(/,
      ) &&
      absent(
        engine,
        /responsesApi\s*\(/,
      ) &&
      absent(
        engine,
        /OPENAI_API_KEY/,
      ),
  ],

  [
    "creative realization engine consumes approved reality",
    all(engine, [
      "beat",
      "envelope",
      "character",
      "strategies",
    ]),
  ],

  [
    "creative realization engine returns semantic output",
    all(engine, [
      "creativeOpportunity",
      "realizationIntent",
      "viewerEffect",
    ]),
  ],

  [
    "creative realization engine exposes strategy selection without owning it",
    contains(
      engine,
      /strategies/,
    ) &&
      absent(
        engine,
        /function\s+selectSafeStrategies\b/,
      ),
  ],

  [
    "master remains the canonical production author",
    contains(
      master,
      /export\s+async\s+function\s+authorBrainUniversal\b/,
    ),
  ],

  [
    "master delegates Mouth through canonical generator",
    contains(
      master,
      /\bgenerateMouthCandidatePools\s*\(/,
    ),
  ],

  [
    "master does not import retired Enterprise Mouth authority",
    absent(
      master,
      /authorEnterpriseMouth/,
    ) &&
      absent(
        master,
        /authorEnterpriseRuntime/,
      ),
  ],

  [
    "shared contract remains canonical source of Mouth beat type",
    contains(
      mouth,
      /from\s+["']@qre\/contracts["']/,
    ) &&
      contains(
        mouth,
        /MouthCandidateBeat/,
      ),
  ],

  [
    "manifest documents canonical creative realization stage",
    all(manifest, [
      "authorCreativeRealizationEngine.ts",
      "Creative Realization",
    ]),
  ],
];

console.log(
  "=== QRE CREATIVE REALIZATION WIRING GUARD · PRODUCTION AUDIT ===",
);

let failed = 0;

for (const [label, passed] of checks) {
  if (!report(label, Boolean(passed))) {
    failed += 1;
  }
}

if (failed > 0) {
  throw new Error(
    `CREATIVE REALIZATION WIRING GUARD FAILED · ${failed} issue(s)`,
  );
}

console.log(
  "CREATIVE REALIZATION WIRING GUARD GREEN · creative meaning is a canonical production stage",
);