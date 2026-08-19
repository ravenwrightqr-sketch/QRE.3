#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const runtimePath = path.join(ROOT, "apps/api/src/services/localModelRuntime.ts");
const mapPath = path.join(ROOT, "docs/MOUTH_PRODUCTION_MAP.md");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, text) {
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8");
}

function run(command, args) {
  console.log(`\\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

const source = read(runtimePath);
const start = source.indexOf(
  "async function canonicalMouthCandidateRequest("
);
const end = source.indexOf(
  "async function canonicalMouthRequest("
);

if (start < 0 || end < 0 || end <= start) {
  throw new Error(
    "Canonical Mouth candidate function boundary not found; refusing to rewrite runtime."
  );
}

if (source.includes("QRE MOUTH · PER-BEAT REALIZATION")) {
  console.log("Canonical per-beat Mouth runtime is already installed.");
} else {
  const replacement = String.raw`async function canonicalMouthCandidateRequest(
  messages: LocalModelMessage[],
  options: LocalModelOptions,
): Promise<LocalModelResult> {
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
  const evidence = [
    ...(Array.isArray(payload?.facts) ? payload.facts.map(String) : []),
    ...(Array.isArray(payload?.moments) ? payload.moments.map(String) : []),
    ...(Array.isArray(payload?.sourceMoments) ? payload.sourceMoments.map(String) : []),
    ...(Array.isArray(payload?.memory) ? payload.memory.map(String) : []),
  ].map((value) => value.trim()).filter(Boolean).slice(0, 36);

  const envelope = payload?.realityEnvelope && typeof payload.realityEnvelope === "object"
    ? payload.realityEnvelope
    : null;

  const events = envelope && Array.isArray(envelope.events) ? envelope.events : [];
  const labelFor = (id) => {
    const event = events.find((value) => value && typeof value === "object" && String(value.id ?? "") === id);
    return event && typeof event === "object" ? String(event.label ?? "").trim() : "";
  };

  const temperature = options.temperature ?? 0.78;
  const numPredict = Math.min(options.numPredict ?? 512, 512);
  const concurrency = Math.max(
    1,
    Math.min(3, Number(process.env.QRE_MOUTH_CONCURRENCY ?? "2")),
  );

  const cleanLine = (value) => String(value ?? "")
    .replace(/^\\s*(?:[-*•]|\\d+[.)])\\s*/, "")
    .replace(/^['"`\\s]+|['"`\\s]+$/g, "")
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

  const extract = (raw) => {
    const text = String(raw ?? "").replace(/^```(?:json|text|txt)?/i, "").replace(/```$/i, "").trim();
    if (!text) return [];

    try {
      const value = JSON.parse(text);
      const candidates = Array.isArray(value?.variants) ? value.variants : Array.isArray(value?.texts) ? value.texts : [];
      if (Array.isArray(candidates)) {
        return candidates.map(cleanLine).filter(acceptable).filter((value, index, all) => all.indexOf(value) === index).slice(0, 8);
      }
    } catch {
      // Plain text is the canonical format; tolerate accidental JSON only.
    }

    return text
      .split(/\\r?\\n+/)
      .map(cleanLine)
      .filter(acceptable)
      .filter((value, index, all) => all.indexOf(value) === index)
      .slice(0, 8);
  };

  const payoff = (beat) => {
    const role = String(beat?.role ?? "").toLowerCase();
    const attention = String(beat?.attentionFunction ?? "").toLowerCase();
    const mode = String(beat?.realizationMode ?? "").toLowerCase();
    return role === "payoff" || attention === "payoff" || mode.includes("payoff");
  };

  const endpoint = (beat) => {
    const values = Array.isArray(beat?.paysOff) ? beat.paysOff.map(String).map((value) => value.trim()).filter(Boolean) : [];
    return values[0] ?? "";
  };

  const makePrompt = (beat, repair) => {
    const ids = Array.isArray(beat?.eventIds) ? beat.eventIds.map(String) : [];
    const anchors = [
      ...(Array.isArray(beat?.setsUp) ? beat.setsUp.map(String) : []),
      ...(Array.isArray(beat?.paysOff) ? beat.paysOff.map(String) : []),
      ...ids.map(labelFor),
    ].map((value) => value.trim()).filter(Boolean).slice(0, 8);

    const isPayoff = payoff(beat);
    const exact = endpoint(beat);

    return {
      system: [
        "QRE MOUTH · PER-BEAT REALIZATION.",
        "You are the final language realization layer.",
        "Reality is locked. Meaning is locked. The movie is locked. The endpoint is locked.",
        "Your only job is to make ONE approved semantic beat speak as short viewer-facing language.",
        "",
        "ONE CUT. ONE DOMINANT THOUGHT. 2-7 WORDS PREFERRED.",
        "Use implication, contrast, status shift, understatement, callback, reversal, double meaning, recontextualization, wordplay, personification, or genre framing when supported.",
        "Creative framing may be novel. Concrete reality may not.",
        "",
        "NEVER INVENT events, actions, objects, people, places, sounds, body reactions, facial expressions, internal thoughts, dialogue, chronology, or outcomes.",
        "Do not use domain stereotypes that were not supplied.",
        "Do not explain the meaning. Make it felt.",
        "Do not mention QRE, planning, viewers, beats, strategy, cognition, realization, or the next cut.",
        "Do not use questions or comma-heavy summaries.",
        isPayoff
          ? `PAYOFF: output exactly this and nothing else: ${exact}`
          : "Return five materially different candidate lines, one per line, with no numbering or commentary.",
        repair ? "REPAIR: the prior realization was rejected; try a genuinely different phrasing of the SAME approved meaning." : "",
      ].filter(Boolean).join("\\n"),
      user: JSON.stringify({
        task: "realize_one_approved_mouth_beat",
        subject,
        prompt,
        suppliedEvidence: evidence,
        beat: {
          order: beat?.order ?? 1,
          eventIds: ids,
          anchors,
          change: String(beat?.change ?? beat?.informationGain ?? ""),
          next: String(beat?.next ?? beat?.frontier ?? beat?.nextNeed ?? ""),
          attentionFunction: String(beat?.attentionFunction ?? ""),
          creativeMove: String(beat?.creativeMove ?? ""),
          realizationMode: String(beat?.realizationMode ?? ""),
          relationKinds: Array.isArray(beat?.relationKinds) ? beat.relationKinds : [],
          forbiddenMoves: Array.isArray(beat?.forbiddenMoves) ? beat.forbiddenMoves : [],
          payoff: isPayoff,
          endpoint: exact,
        },
      }),
    };
  };

  const realize = async (beat) => {
    if (payoff(beat) && endpoint(beat)) {
      return { order: Number(beat?.order ?? 1), variants: [endpoint(beat)], calls: 0 };
    }

    const attempt = async (repair) => {
      const prompt = makePrompt(beat, repair);
      const data = await request("/api/chat", {
        model: modelName(),
        stream: false,
        keep_alive: keepAlive(),
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        options: {
          temperature: repair ? Math.max(0.55, temperature - 0.12) : temperature,
          num_predict: repair ? 320 : numPredict,
        },
      });
      const raw = outputText(data);
      return { raw, variants: extract(raw) };
    };

    try {
      const first = await attempt(false);
      if (first.variants.length >= 2) {
        return { order: Number(beat?.order ?? 1), variants: first.variants, calls: 1 };
      }

      const second = await attempt(true);
      return {
        order: Number(beat?.order ?? 1),
        variants: [...first.variants, ...second.variants]
          .filter((value, index, all) => all.indexOf(value) === index)
          .slice(0, 8),
        calls: 2,
      };
    } catch (error) {
      console.log(
        `QRE MOUTH BEAT ${String(beat?.order ?? 1)} ERROR:`,
        error instanceof Error ? error.message : error,
      );
      return { order: Number(beat?.order ?? 1), variants: [], calls: 1 };
    }
  };

  const results = [];
  for (let start = 0; start < beats.length; start += concurrency) {
    const batch = beats.slice(start, start + concurrency);
    results.push(...(await Promise.all(batch.map(realize))));
  }

  const byOrder = new Map(results.map((result) => [result.order, result]));
  const variantsByBeat = Array.from({ length: beatCount }, (_, index) => {
    const order = index + 1;
    return { order, variants: byOrder.get(order)?.variants ?? [] };
  });

  const usable = variantsByBeat.filter((entry) => entry.variants.length > 0).length;
  const calls = results.reduce((sum, result) => sum + result.calls, 0);

  console.log("QRE MOUTH PER-BEAT:", `${usable}/${beatCount} beats usable`, `calls=${calls}`, `concurrency=${concurrency}`);

  return {
    text: JSON.stringify({ variantsByBeat }),
    model: modelName(),
    provider: "local",
  };
}
`;

  const updated = source.slice(0, start) + replacement + source.slice(end);
  write(runtimePath, updated);
}

const map = `# QRE Mouth Production Map

## Canonical ownership

Reality / Cognition / Movie / Meaning / Realization are upstream responsibilities.

Production Author: \\`apps/api/src/services/authorBrainUniversal.ts\\`

Mouth candidate ownership: \\`apps/api/src/services/authorMouthCandidateSearch.ts\\`

Model transport + per-beat local realization adapter: \\`apps/api/src/services/localModelRuntime.ts\\`

Sequence selection: \\`apps/api/src/services/authorMouthSequenceBeamSearch.ts\\`

Truth: \\`apps/api/src/services/authorBeatTruthGate.ts\\` + cut policy.

Attention: \\`apps/api/src/services/authorAttentionEditor.ts\\`

Contracts: \\`packages/contracts/src/cogauthor/mouth.ts\\`

## Production invariants

- One production Author path.
- Mouth receives approved meaning; it does not re-plan.
- Candidate generation is isolated per beat.
- One failed beat cannot erase another beat's candidates.
- Payoff is exact and terminal.
- Truth gates never weaken to make tests green.
- Enterprise Mouth remains diagnostic until removed from all production wiring.
`;

write(mapPath, map);

run("pnpm", ["--filter", "@qre/contracts", "build"]);
run("pnpm", ["exec", "tsc", "-p", "apps/api/tsconfig.tests.json", "--noEmit"]);
run("pnpm", ["--filter", "@qre/api", "build"]);
run("node", ["scripts/verify-contract-ownership.mjs"]);
run("node", ["scripts/verify-author-wiring.mjs"]);

console.log("\\nCANONICAL MOUTH MIGRATION COMPLETE");

try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("Temporary migration script removed.");
} catch {
  console.log("Migration completed; remove scripts/reset-canonical-mouth.mjs after reviewing git diff.");
}
