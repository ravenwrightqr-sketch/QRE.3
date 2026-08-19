#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const runtimeFile = path.join(root, "apps/api/src/services/localModelRuntime.ts");
const mouthFile = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");
const logFile = path.join(root, "docs/AUTHOR_FILE_READ_LOG.md");

const runtime = await readFile(runtimeFile, "utf8");
const mouth = await readFile(mouthFile, "utf8");

for (const marker of [
  "async function canonicalMouthCandidateRequest(",
  "function parseUserObject(",
  "function outputText(",
]) {
  if (!runtime.includes(marker)) {
    throw new Error(`Required runtime marker missing: ${marker}`);
  }
}

for (const marker of [
  "export function buildMouthCandidateMessages",
  "export function parseMouthCandidateBatch",
  "export function scoreMouthCandidate",
]) {
  if (!mouth.includes(marker)) {
    throw new Error(`Required Mouth marker missing: ${marker}`);
  }
}

function findBalancedFunction(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`Could not find function: ${marker}`);

  const open = text.indexOf("{", start);
  if (open < 0) throw new Error(`Could not find opening brace: ${marker}`);

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return [start, i + 1];
    }
  }

  throw new Error(`Unbalanced function: ${marker}`);
}

function replaceFunction(text, marker, replacement) {
  const [start, end] = findBalancedFunction(text, marker);
  return text.slice(0, start) + replacement + text.slice(end);
}

const newCandidateFunction = String.raw`async function canonicalMouthCandidateRequest(
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
    const fence = String.fromCharCode(96).repeat(3);
    const text = String(raw ?? "")
      .trim()
      .split(/\\r?\\n+/)
      .map((line) => line.trim())
      .filter((line) => line !== fence)
      .filter((line) => !/^`{3}(?:text|txt|json)?$/i.test(line))
      .join("\\n")
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
    const values = Array.isArray(beat?.paysOff)
      ? beat.paysOff.map(String).filter(Boolean)
      : [];
    return values[0] ?? "";
  };

  const runBeat = async (beat) => {
    const order = Number(beat?.order ?? 1);
    const endpoint = endpointFor(beat);

    if (isPayoff(beat) && endpoint) {
      return { order, variants: [endpoint] };
    }

    const system = [
      "QRE CANONICAL MOUTH · ONE-BEAT REALIZATION.",
      "You create viewer-facing language only.",
      "The movie, meaning, reality, and endpoint are already approved.",
      "Create 5 materially different short realizations for this beat.",
      "2-7 words preferred. One dominant thought. No analysis. No questions.",
      "Creative framing is allowed; concrete reality is locked.",
      "Never invent events, actions, body reactions, objects, people, places, sounds, dialogue, chronology, or outcomes.",
      "Use implication, contrast, reversal, callback, understatement, status, wordplay, or recontextualization when supported.",
      "Do not mention planning, cognition, realization, strategy, Beat Graph, viewer, or next-beat concepts.",
      "Return one candidate per line. No numbering required. No commentary.",
    ].join("\\n");

    const user = JSON.stringify({
      task: "realize_approved_mouth_beat",
      subject,
      prompt,
      facts,
      beat: {
        order,
        eventIds: Array.isArray(beat?.eventIds) ? beat.eventIds.map(String) : [],
        anchors: [
          ...(Array.isArray(beat?.setsUp) ? beat.setsUp.map(String) : []),
          ...(Array.isArray(beat?.paysOff) ? beat.paysOff.map(String) : []),
        ].filter(Boolean).slice(0, 8),
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
              ? `${system}\\nREPAIR: generate different realizations for the same approved beat. Do not change the semantic contract.`
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
        return { order, variants: first };
      }

      const repairRaw = await call(true);
      const repaired = extractVariants(repairRaw);
      const merged = [...first, ...repaired]
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 8);

      console.log(`QRE MOUTH BEAT REPAIR ${order}: ${merged.length} candidates usable`);
      return { order, variants: merged };
    } catch (error) {
      console.log(`QRE MOUTH BEAT ${order} ERROR:`, error instanceof Error ? error.message : error);
      return { order, variants: [] };
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

const updatedRuntime = replaceFunction(
  runtime,
  "async function canonicalMouthCandidateRequest(",
  newCandidateFunction,
);

await writeFile(runtimeFile, updatedRuntime, "utf8");

if (existsSync(logFile)) {
  const existing = await readFile(logFile, "utf8");
  const entry = [
    "",
    "## 2026-08-19 · Canonical Mouth reset",
    "",
    "FILE: apps/api/src/services/localModelRuntime.ts",
    "ROLE: model transport plus canonical per-beat Mouth generation adapter.",
    "CHANGE: isolated per-beat realization, per-beat repair, partial-pool preservation, and bounded concurrency.",
    "",
    "FILE: apps/api/src/services/authorMouthCandidateSearch.ts",
    "ROLE: canonical candidate normalization/scoring owner.",
    "STATUS: unchanged owner.",
    "",
    "FILE: apps/api/src/services/authorBrainUniversal.ts",
    "ROLE: sole production Author orchestrator.",
    "STATUS: unchanged.",
    "",
  ].join("\\n");
  await writeFile(logFile, existing + entry, "utf8");
}

console.log("CANONICAL MOUTH RESET APPLIED");
console.log("Next: pnpm --filter @qre/api build");
