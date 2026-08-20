import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const brainPath = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const mouthPath = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");
const planPath = path.join(root, "docs/AUTHOR_MOUTH_PRODUCTION_CONSOLIDATION_PLAN.md");
const registryPath = path.join(root, "docs/AUTHOR_FILE_REGISTRY.md");
const readLogPath = path.join(root, "docs/AUTHOR_FILE_READ_LOG.md");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let mouth = read(mouthPath);
let brain = read(brainPath);

assert(mouth.includes("export async function generateAndSelectMouthCandidates("), "Mouth candidate generator anchor missing");
assert(brain.includes("async function generateCandidatePools("), "Brain duplicate generation anchor missing");
assert(brain.includes('parseMouthCandidateBatch'), "Brain parser import anchor missing");
assert(brain.includes('selectBestMouthCandidate'), "Brain selection import anchor missing");

// ---------------------------------------------------------------------------
// 1. Promote the existing canonical Mouth candidate service to sole
//    model-generation/pool ownership.
// ---------------------------------------------------------------------------

mouth = mouth.replace(
  '  MouthCandidateSelection,\n} from "@qre/contracts";',
  '  MouthCandidateSelection,\n  AuthorStrategyCandidate,\n} from "@qre/contracts";',
);

mouth = mouth.replace(
  '  lens?: string;\n};',
  '  lens?: string;\n  strategyCandidates?: readonly AuthorStrategyCandidate[];\n};',
);

const strategyPrompt = `
    if (input.strategyCandidates?.length) {
      system.push(
        "APPROVED REALIZATION STRATEGIES:",
        ...input.strategyCandidates.map((candidate) =>
          `- ${candidate.strategy}: ${candidate.reason}`,
        ),
        "Use the approved strategy as a language realization choice only.",
        "Do not create a new event, action, object, person, location, chronology, sound, reaction, or outcome.",
      );
    }
`;

assert(mouth.includes('const system = ['), "Mouth system prompt anchor missing");
mouth = mouth.replace(
  '  const system = [\n',
  '  const system = [\n',
);
const systemClose = '  ].join("\\n");\n\n  const user = {';
assert(mouth.includes(systemClose), "Mouth system prompt close anchor missing");
mouth = mouth.replace(
  systemClose,
  `${strategyPrompt}\n  ].join("\\n");\n\n  const user = {`,
);

const userAnchor = '    lens:\n      clean(input.lens),\n    priorTexts:';
assert(mouth.includes(userAnchor), "Mouth user payload anchor missing");
mouth = mouth.replace(
  userAnchor,
  '    lens:\n      clean(input.lens),\n    realizationStrategies: input.strategyCandidates ?? [],\n    priorTexts:',
);

const generatorStart = mouth.indexOf('export async function generateAndSelectMouthCandidates(');
assert(generatorStart >= 0, "Mouth generator start not found");

const canonicalGenerator = `export async function generateMouthCandidatePools(
  input: MouthCandidateGenerationInput & {
    model: MouthCandidateModel;
    strategyCandidatesByBeat?: ReadonlyMap<number, readonly AuthorStrategyCandidate[]>;
  },
): Promise<{
  pools: MouthCandidatePool[];
  rawText: string;
}> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const MAX_CONCURRENT_REQUESTS = 3;
  const basePriorTexts = input.priorTexts ?? [];

  type BeatJobResult = {
    beat: MouthCandidateBeat;
    exact?: MouthCandidate;
    variants: string[];
    rawParts: string[];
    repairsUsed: number;
  };

  const runBeatJob = async (beat: MouthCandidateBeat): Promise<BeatJobResult> => {
    const strategyCandidates =
      input.strategyCandidatesByBeat?.get(beat.order) ??
      input.strategyCandidates ??
      [];

    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts: basePriorTexts,
      });
      return { beat, exact, variants: [], rawParts: [], repairsUsed: 0 };
    }

    const messages = buildMouthCandidateMessages({
      ...input,
      beats: [beat],
      priorTexts: basePriorTexts,
      strategyCandidates,
    });

    const rawParts: string[] = [];
    let repairsUsed = 0;
    let result = await input.model(messages);
    rawParts.push(`BEAT ${beat.order} PRIMARY\\n${result.text}`);

    let parsed = parseMouthCandidateBatch(result.text);
    let variants =
      parsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];

    if (variants.length < 2 && repairsUsed < MAX_REPAIRS_PER_BEAT) {
      repairsUsed += 1;
      const repairMessages: Array<{ role: "system" | "user"; content: string }> = [
        messages[0]!,
        {
          role: "user",
          content:
            messages[1]!.content +
            "\\n\\nREPAIR THIS BEAT ONLY." +
            "\\nReturn 5 actual language realizations." +
            "\\nDo not return placeholders." +
            "\\nPreserve the approved realization strategy when useful." +
            "\\nDo not invent concrete reality." +
            "\\nReturn JSON only.",
        },
      ];

      result = await input.model(repairMessages);
      rawParts.push(`BEAT ${beat.order} REPAIR\\n${result.text}`);
      parsed = parseMouthCandidateBatch(result.text);
      const repairedVariants =
        parsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];
      variants = [...new Set([...variants, ...repairedVariants])].slice(0, MAX_CANDIDATES);
    }

    return { beat, variants, rawParts, repairsUsed };
  };

  const jobs: BeatJobResult[] = [];
  for (let start = 0; start < ordered.length; start += MAX_CONCURRENT_REQUESTS) {
    const batch = ordered.slice(start, start + MAX_CONCURRENT_REQUESTS);
    jobs.push(...await Promise.all(batch.map(runBeatJob)));
  }

  const pools: MouthCandidatePool[] = [];
  for (const job of jobs.sort((a, b) => a.beat.order - b.beat.order)) {
    if (job.exact) {
      pools.push({ order: job.beat.order, candidates: [job.exact] });
      continue;
    }

    const selection = selectBestMouthCandidate({
      texts: job.variants,
      beat: job.beat,
      envelope: input.envelope,
      priorTexts: basePriorTexts,
    });

    pools.push({ order: job.beat.order, candidates: selection.candidates });
  }

  return {
    pools,
    rawText: jobs.flatMap((job) => job.rawParts).join("\\n--- BEAT ---\\n"),
  };
}

export async function generateAndSelectMouthCandidates(
  input: MouthCandidateGenerationInput & {
    model: MouthCandidateModel;
  },
): Promise<{
  texts: string[];
  candidates: MouthCandidate[];
  rawText: string;
}> {
  const pools = await generateMouthCandidatePools(input);
  const texts: string[] = [];
  const candidates: MouthCandidate[] = [];

  for (const beat of [...input.beats].sort((a, b) => a.order - b.order)) {
    const pool = pools.pools.find((candidatePool) => candidatePool.order === beat.order);
    const priorTexts = [...(input.priorTexts ?? []), ...texts];

    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts,
      });
      texts.push(exact.text);
      candidates.push(exact);
      continue;
    }

    const selection = selectBestMouthCandidate({
      texts: pool?.candidates.map((candidate) => candidate.text) ?? [],
      beat,
      envelope: input.envelope,
      priorTexts,
    });

    if (selection.selected) {
      texts.push(selection.selected.text);
      candidates.push(selection.selected);
    } else {
      texts.push("");
    }
  }

  return {
    texts,
    candidates,
    rawText: pools.rawText,
  };
}
`;

mouth = mouth.slice(0, generatorStart) + canonicalGenerator;
write(mouthPath, mouth);

// ---------------------------------------------------------------------------
// 2. Remove Brain's independent parse/repair/generation ownership.
// ---------------------------------------------------------------------------

brain = brain.replace(
  'import {\n  buildMouthCandidateMessages,\n  parseMouthCandidateBatch,\n  scoreMouthCandidate,\n  selectBestMouthCandidate,\n  type MouthCandidateBeat,\n} from "./authorMouthCandidateSearch.js";',
  'import {\n  generateMouthCandidatePools,\n  type MouthCandidateBeat,\n} from "./authorMouthCandidateSearch.js";',
);

const oldGeneratorStart = brain.indexOf('async function generateCandidatePools(');
const endpointStart = brain.indexOf('function ensureEndpointCandidate(', oldGeneratorStart);
assert(oldGeneratorStart >= 0 && endpointStart > oldGeneratorStart, "Brain generation block bounds not found");

const newWrapper = `async function generateCandidatePools(
  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  beats: readonly MouthCandidateBeat[],
  lens: string | undefined,
  priorTexts: readonly string[],
  risk: string,
  feedback?: string,
  strategyCandidatesByBeat?: ReadonlyMap<number, readonly import("@qre/contracts").AuthorStrategyCandidate[]>,
): Promise<{
  pools: MouthCandidatePool[];
  rawText: string;
}> {
  const normalizedBeats = beats.map((beat) => ({ ...beat }));
  const feedbackBeats = feedback
    ? normalizedBeats.map((beat) => ({
        ...beat,
        obligations: [
          ...(beat.obligations ?? []),
          `QRE attention repair feedback: ${feedback}`,
        ],
      }))
    : normalizedBeats;

  return generateMouthCandidatePools({
    envelope,
    beats: feedbackBeats,
    priorTexts,
    lens,
    strategyCandidates: [],
    strategyCandidatesByBeat,
    model: (messages) =>
      localModelGenerate(messages, "json", {
        numPredict: 1536,
        temperature: risk === "safe" ? 0.55 : 0.72,
      }),
  });
}

`;
brain = brain.slice(0, oldGeneratorStart) + newWrapper + brain.slice(endpointStart);

// Wire the existing Strategy Lattice into the canonical Mouth call.
const strategyImport = 'import { selectSafeStrategies } from "./authorRealizationStrategyLattice.js";\n';
assert(brain.includes('import {\n  groundAuthorBeat,'), "Brain lower import anchor missing");
brain = brain.replace(
  'import {\n  groundAuthorBeat,\n} from "./authorBeatTruthGate.js";\n',
  'import {\n  groundAuthorBeat,\n} from "./authorBeatTruthGate.js";\n' + strategyImport,
);

const canonicalBeatAnchor = `  const canonicalBeats =\n  slots.map(`;
assert(brain.includes(canonicalBeatAnchor), "Canonical beat construction anchor missing");
const strategyMapInsert = `  const strategyCandidatesByBeat = new Map(\n    canonicalBeats.map((beat) => [\n      beat.order,\n      selectSafeStrategies(beat, envelope, 5),\n    ]),\n  );\n  `;
brain = brain.replace(
  '  \n  let generated =\n    await generateCandidatePools(\n',
  `  \n${strategyMapInsert}\n  let generated =\n    await generateCandidatePools(\n`,
);

brain = brain.replace(
  '      risk,\n    );',
  '      risk,\n      undefined,\n      strategyCandidatesByBeat,\n    );',
  1,
);
brain = brain.replace(
  '        risk,\n        feedback,\n      );',
  '        risk,\n        feedback,\n        strategyCandidatesByBeat,\n      );',
  1,
);

// Ensure the Brain does not directly parse/score Mouth model output anywhere else.
assert(!/parseMouthCandidateBatch/.test(brain), "Brain still directly parses Mouth model output");
assert(!/selectBestMouthCandidate/.test(brain), "Brain still directly selects Mouth candidates");
assert(!/buildMouthCandidateMessages/.test(brain), "Brain still directly builds Mouth model prompts");

write(brainPath, brain);

// ---------------------------------------------------------------------------
// 3. Update the explicit operating ledger.
// ---------------------------------------------------------------------------

let plan = read(planPath);
plan += `\n## 2026-08-19 · Phase 2 completed\n\n- Canonical Mouth generation/pool ownership moved to \\`authorMouthCandidateSearch.ts\\`.\n- \\`authorBrainUniversal.ts\\` now delegates candidate generation and no longer parses or selects raw Mouth model output.\n- Existing bounded per-beat repair/concurrency remains centralized.\n- Existing \\`authorRealizationStrategyLattice.ts\\` is now fed into canonical Mouth generation.\n`;
write(planPath, plan);

let registry = read(registryPath);
registry += `\n## 2026-08-19 · Mouth ownership consolidation\n\n| File | Status | Ownership decision |\n|---|---|---|\n| \\`apps/api/src/services/authorBrainUniversal.ts\\` | CANONICAL ORCHESTRATOR | Delegates Mouth generation; no raw Mouth parsing/selection ownership. |\n| \\`apps/api/src/services/authorMouthCandidateSearch.ts\\` | CANONICAL MOUTH OWNER | Sole model-generation, bounded repair, parsing, pool construction, and candidate scoring owner. |\n| \\`apps/api/src/services/authorRealizationStrategyLattice.ts\\` | CANONICAL STRATEGY OWNER | Supplies approved realization strategies into Mouth generation. |\n`;
write(registryPath, registry);

let readLog = read(readLogPath);
readLog += `\n\n## 2026-08-19 · Mouth production consolidation\n\nFILE: apps/api/src/services/authorBrainUniversal.ts\nROLE: canonical production orchestrator.\nCHANGE: removed direct Mouth parsing/selection/generation ownership; delegates to canonical Mouth candidate service.\nSTATUS: CANONICAL ORCHESTRATOR.\n\nFILE: apps/api/src/services/authorMouthCandidateSearch.ts\nROLE: canonical Mouth generation + scoring owner.\nCHANGE: centralized candidate-pool generation and bounded repair; legacy single-selection API now delegates to the same pool owner.\nSTATUS: CANONICAL MOUTH OWNER.\n\nFILE: apps/api/src/services/authorRealizationStrategyLattice.ts\nROLE: realization strategy selection.\nCHANGE: strategy candidates now feed canonical Mouth generation.\nSTATUS: CANONICAL STRATEGY OWNER.\n`;
write(readLogPath, readLog);

// The migration is single-shot; remove the helper script and workflow in the commit.
for (const file of [
  path.join(root, "scripts/.one-shot-consolidate-mouth-production.mjs"),
  path.join(root, ".github/workflows/one-shot-mouth-consolidation.yml"),
]) {
  if (fs.existsSync(file)) fs.rmSync(file);
}

console.log("MOUTH PRODUCTION CONSOLIDATION PATCH COMPLETE");
