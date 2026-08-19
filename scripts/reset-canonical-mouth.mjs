#!/usr/bin/env node

import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const run = (command, args) => {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
};

const file = (relative) => path.join(root, relative);

const mouthPath = file("apps/api/src/services/authorMouthCandidateSearch.ts");
const runtimePath = file("apps/api/src/services/localModelRuntime.ts");
const logPath = file("docs/AUTHOR_FILE_READ_LOG.md");

const readUtf8 = async (relative) => readFile(file(relative), "utf8");
const writeUtf8 = async (relative, content) => writeFile(file(relative), content, "utf8");

const source = await readUtf8("apps/api/src/services/authorMouthCandidateSearch.ts");
const runtime = await readUtf8("apps/api/src/services/localModelRuntime.ts");

const requiredMarkers = [
  "export function buildMouthCandidateMessages",
  "export function parseMouthCandidateBatch",
  "export function scoreMouthCandidate",
];

for (const marker of requiredMarkers) {
  if (!source.includes(marker)) {
    throw new Error(`Canonical Mouth source marker missing: ${marker}`);
  }
}

const canonicalMarker = "async function canonicalMouthCandidateRequest(";
if (!runtime.includes(canonicalMarker)) {
  throw new Error("Canonical Mouth runtime boundary missing; refusing to patch.");
}

const concurrencyMarker = "const concurrency = Math.max(";
if (!runtime.includes(concurrencyMarker)) {
  throw new Error("Canonical Mouth runtime concurrency boundary missing; refusing to patch.");
}

function findBalancedBlock(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`Could not find block: ${marker}`);

  const open = text.indexOf("{", start);
  if (open < 0) throw new Error(`Could not find opening brace for: ${marker}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let regex = false;
  let regexClass = false;

  for (let i = open; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (regex) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "[" && !regexClass) {
        regexClass = true;
        continue;
      }
      if (char === "]" && regexClass) {
        regexClass = false;
        continue;
      }
      if (char === "/" && !regexClass) {
        regex = false;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "/" && next !== "/" && next !== "*") {
      regex = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return [start, i + 1];
    }
  }

  throw new Error(`Unbalanced block: ${marker}`);
}

function replaceBalancedFunction(text, marker, replacement) {
  const [start, end] = findBalancedBlock(text, marker);
  return `${text.slice(0, start)}${replacement}${text.slice(end)}`;
}

const newCandidateBlock = `async function canonicalMouthCandidateRequest(
  messages,
  options,
) {
  const payload = parseUserObject(messages);
  const beats = Array.isArray(payload?.beats) ? payload.beats : [];
  const beatCount = beats.length;

  if (!beatCount) {
    return {
      text: JSON.stringify({ variantsByBeat: [] }),
      model: modelName(),
      provider: "local",
    };
  }

  const subject = typeof payload?.subject === "string" ? payload.subject : "";
  const prompt = typeof payload?.prompt === "string" ? payload.prompt : "";
  const facts = [
    ...(Array.isArray(payload?.facts) ? payload.facts : []),
    ...(Array.isArray(payload?.moments) ? payload.moments : []),
    ...(Array.isArray(payload?.sourceMoments) ? payload.sourceMoments : []),
    ...(Array.isArray(payload?.memory) ? payload.memory : []),
  ].map(String).filter(Boolean).slice(0, 32);

  const temperature = options.temperature ?? Number(process.env.QRE_LOCAL_MODEL_TEMPERATURE ?? "0.72");
  const numPredict = options.numPredict ?? Number(process.env.QRE_LOCAL_MODEL_NUM_PREDICT ?? "640");
  const concurrency = Math.max(1, Math.min(3, Number(process.env.QRE_MOUTH_CONCURRENCY ?? "2")));

  const cleanLine = (value) => String(value ?? "")
    .replace(/^\\s*(?:[-*•]|\\d+[.)])\\s*/, "")
    .replace(/^['"\\s]+|['"\\s]+$/g, "")
    .replace(/\\s+/g, " ")
    .trim();

  const acceptable = (line) => {
    if (!line) return false;
    const words = line.split(/\\s+/).filter(Boolean).length;
    if (words < 2 || words > 10) return false;
    if (/[?]/.test(line)) return false;
    if (/\\b(?:beat|viewer|audience|planner|cognition|realization|meaning spine|next beat|next cut|strategy)\\b/i.test(line)) return false;
    if (/\\b(?:eyes widened|tail wagged|squared shoulders|looked confident|became determined|snatched|grabbed|trembled|sighed|blinked)\\b/i.test(line)) return false;
    return true;
  };

  const extractVariants = (raw) => {
    const text = String(raw ?? "")
      .replace(/^\\s*```(?:text|txt|json)?\\s*/i, "")
      .replace(/\\s*```\\s*$/i, "")
      .trim();

    if (!text) return [];

    try {
      const value = JSON.parse(text);
      if (Array.isArray(value?.variants)) {
        return value.variants.map(cleanLine).filter(acceptable).slice(0, 8);
      }
      if (Array.isArray(value?.texts)) {
        return value.texts.map(cleanLine).filter(acceptable).slice(0, 8);
      }
    } catch {
      // Plain text is the canonical creative output path.
    }

    return text
      .split(/\\r?\\n+/)
      .map(cleanLine)
      .filter(acceptable)
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 8);
  };

  const isPayoff = (beat) => {
    const role = String(beat?.role ?? "").toLowerCase();
    const attention = String(beat?.attentionFunction ?? "").toLowerCase();
    const mode = String(beat?.realizationMode ?? "").toLowerCase();
    return role === "payoff" || attention === "payoff" || mode.includes("payoff");
  };

  const endpointFor = (beat) => {
    const values = Array.isArray(beat?.paysOff) ? beat.paysOff.map(String).filter(Boolean) : [];
    return values[0] ?? "";
  };

  const runBeat = async (beat) => {
    const order = Number(beat?.order ?? 1);
    const endpoint = endpointFor(beat);

    if (isPayoff(beat) && endpoint) {
      return { order, variants: [endpoint], repaired: false };
    }

    const eventIds = Array.isArray(beat?.eventIds) ? beat.eventIds.map(String) : [];
    const anchors = [
      ...(Array.isArray(beat?.setsUp) ? beat.setsUp.map(String) : []),
      ...(Array.isArray(beat?.paysOff) ? beat.paysOff.map(String) : []),
    ].filter(Boolean).slice(0, 8);

    const system = [
      "QRE CANONICAL MOUTH · ONE-BEAT REALIZATION.",
      "You create viewer-facing language only.",
      "The movie, meaning, reality, and endpoint are already approved.",
      "Create 5 materially different short realizations for this beat.",
      "2-7 words preferred. One dominant thought. No analysis. No questions.",
      "Creative framing is allowed; concrete reality is locked.",
      "Never invent events, actions, body reactions, objects, people, places, sounds, dialogue, chronology, or outcomes.",
      "Use implication, contrast, reversal, callback, understatement, status, wordplay, or recontextualization when supported.",
      "Do not name planning, cognition, realization, strategy, Beat Graph, viewer, or next-beat concepts.",
      "Return one candidate per line. No numbering required. No commentary.",
    ].join("\\n");

    const user = JSON.stringify({
      task: "realize_approved_mouth_beat",
      subject,
      prompt,
      facts,
      beat: {
        order,
        eventIds,
        anchors,
        change: String(beat?.change ?? beat?.informationGain ?? ""),
        next: String(beat?.next ?? beat?.frontier ?? beat?.nextNeed ?? ""),
        attentionFunction: String(beat?.attentionFunction ?? ""),
        creativeMove: String(beat?.creativeMove ?? ""),
        realizationMode: String(beat?.realizationMode ?? ""),
        relationKinds: Array.isArray(beat?.relationKinds) ? beat.relationKinds.map(String) : [],
        forbiddenMoves: Array.isArray(beat?.forbiddenMoves) ? beat.forbiddenMoves.map(String) : [],
        endpoint,
      },
    });

    const call = async (repair) => {
      const data = await request("/api/chat", {
        model: modelName(),
        stream: false,
        keep_alive: keepAlive(),
        messages: [
          {
            role: "system",
            content: repair
              ? `${system}\\nREPAIR: produce materially different candidates for the same approved beat; do not change the semantic contract.`
              : system,
          },
          { role: "user", content: user },
        ],
        options: {
          temperature: repair ? Math.max(0.55, temperature - 0.12) : temperature,
          num_predict: repair ? Math.min(numPredict, 384) : Math.min(numPredict, 512),
        },
      });

      return outputText(data);
    };

    try {
      const firstRaw = await call(false);
      const first = extractVariants(firstRaw);

      if (first.length >= 2) {
        console.log(`QRE MOUTH BEAT ${order}: ${first.length} candidates usable`);
        return { order, variants: first, repaired: false };
      }

      const repairRaw = await call(true);
      const repaired = extractVariants(repairRaw);
      const merged = [...first, ...repaired]
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 8);

      console.log(`QRE MOUTH BEAT REPAIR ${order}: ${merged.length} candidates usable`);
      return { order, variants: merged, repaired: true };
    } catch (error) {
      console.log(`QRE MOUTH BEAT ${order} ERROR:`, error instanceof Error ? error.message : error);
      return { order, variants: [], repaired: false };
    }
  };

  const results = [];
  for (let index = 0; index < beats.length; index += concurrency) {
    const batch = beats.slice(index, index + concurrency);
    results.push(...await Promise.all(batch.map(runBeat)));
  }

  const variantsByBeat = Array.from({ length: beatCount }, (_, index) => {
    const order = index + 1;
    const result = results.find((value) => value.order === order);
    return { order, variants: result?.variants ?? [] };
  });

  const usable = variantsByBeat.filter((entry) => entry.variants.length > 0).length;
  console.log("QRE MOUTH PER-BEAT PARSE:", `${usable}/${beatCount} beats usable`);

  return {
    text: JSON.stringify({ variantsByBeat }),
    model: modelName(),
    provider: "local",
  };
}
`;

const nextRuntime = replaceBalancedFunction(
  runtime,
  "async function canonicalMouthCandidateRequest(",
  newCandidateBlock,
);

await writeUtf8(
  "apps/api/src/services/localModelRuntime.ts",
  nextRuntime,
);

const logEntry = `\n## 2026-08-19 · Canonical Mouth reset\n\n\`FILE: apps/api/src/services/localModelRuntime.ts\`\nROLE: local model transport + canonical per-beat Mouth generation adapter.\nCHANGE: replaced all-beats JSON candidate generation with isolated per-beat realization, per-beat repair, partial-pool preservation, and bounded concurrency.\n\n\`FILE: apps/api/src/services/authorMouthCandidateSearch.ts\`\nROLE: canonical Mouth candidate normalization/scoring/selection input.\nSTATUS: unchanged owner.\n\n\`FILE: apps/api/src/services/authorBrainUniversal.ts\`\nROLE: sole production Author orchestrator.\nSTATUS: unchanged.\n\n`;

if (existsSync(logPath)) {
  const existing = await readFile(logPath, "utf8");
  await writeFile(logPath, existing + logEntry, "utf8");
}

console.log("CANONICAL MOUTH RESET APPLIED");
console.log("Next: pnpm --filter @qre/api build");
