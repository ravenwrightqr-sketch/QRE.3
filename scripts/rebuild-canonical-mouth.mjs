#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");

function findFunction(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) throw new Error(`Missing function: ${marker}`);
  const open = text.indexOf("{", start);
  if (open < 0) throw new Error(`Missing opening brace: ${marker}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return [start, i + 1];
    }
  }
  throw new Error(`Unbalanced function: ${marker}`);
}

function replaceFunction(text, marker, replacement) {
  const [start, end] = findFunction(text, marker);
  return text.slice(0, start) + replacement + text.slice(end);
}

let source = await readFile(target, "utf8");

const oldInterpretive = '    "apparently",\n    "almost",\n    "already",\n    "again",\n    "still",\n    "only",\n    "instead",\n    "somehow",\n    "perhaps",\n    "maybe",\n    "finally",\n    "naturally",\n    "clearly",\n    "quietly",\n    "barely",\n    "exactly",\n    "enough",';

const newInterpretive = '    "apparently",\n    "almost",\n    "already",\n    "again",\n    "still",\n    "only",\n    "instead",\n    "somehow",\n    "perhaps",\n    "maybe",\n    "finally",\n    "naturally",\n    "clearly",\n    "quietly",\n    "barely",\n    "exactly",\n    "enough",\n    "anyway",\n    "temporary",\n    "temporarily",\n    "apparently",\n    "oddly",\n    "somehow",';

if (!source.includes(oldInterpretive)) {
  throw new Error("Could not locate INTERPRETIVE vocabulary block.");
}
source = source.replace(oldInterpretive, newInterpretive);

const newPromptFunction = String.raw`export function buildMouthCandidateMessages(
  input: MouthCandidateGenerationInput,
): Array<{
  role: "system" | "user";
  content: string;
}> {
  const beat = input.beats[0];

  if (!beat) {
    return [
      {
        role: "system",
        content: "QRE MOUTH: no approved beat supplied.",
      },
      {
        role: "user",
        content: JSON.stringify({ task: "none" }),
      },
    ];
  }

  const anchorEvents = (beat.eventIds ?? [])
    .map((id) => input.envelope.events.find((event) => event.id === id))
    .filter(Boolean)
    .map((event) => event.label);

  const relations = input.envelope.relations
    .filter((relation) =>
      (beat.eventIds ?? []).includes(relation.from) ||
      (beat.eventIds ?? []).includes(relation.to),
    )
    .map((relation) => ({
      from: input.envelope.events.find((event) => event.id === relation.from)?.label ?? relation.from,
      to: input.envelope.events.find((event) => event.id === relation.to)?.label ?? relation.to,
      kind: relation.kind,
      strength: relation.strength,
    }));

  const system = [
    "QRE CANONICAL MOUTH · ONE APPROVED BEAT.",
    "The upstream Author already chose reality, movie, meaning, relationship, and endpoint.",
    "Your only job is language realization.",
    "",
    "Write 5 materially different short viewer-facing lines for THIS beat.",
    "2-7 words preferred.",
    "One dominant thought per line.",
    "Make the semantic move felt; do not explain it.",
    "Make the next cut feel desirable without inventing a new event.",
    "",
    "REALITY LOCK:",
    "Never invent concrete actions, body reactions, facial expressions, objects, people, places, sounds, dialogue, chronology, or outcomes.",
    "Creative framing can change perspective, status, implication, rhythm, attitude, or genre flavor, but it cannot add physical reality.",
    "",
    "NEVER write analyst/planner language.",
    "NEVER name the Beat Graph, meaning, relationship, operation, viewer, strategy, or realization mode.",
    "NEVER produce a comma-chain summary.",
    "NEVER repeat the source sentence five ways.",
    "",
    "REFERENCE RHYTHM ONLY:",
    "Came in nervous.",
    "Fierce anyway.",
    "Then came the bow.",
    "Blue, apparently.",
    "Peace was temporary.",
    "Those examples are rhythm references, not facts to copy.",
    "",
    "OUTPUT: JSON only.",
    "Return exactly one variantsByBeat entry with this beat order.",
    '{"variantsByBeat":[{"order":1,"variants":["...","...","...","...","..."]}]}'
  ].join("\n");

  const user = JSON.stringify({
    task: "realize_one_approved_beat",
    subject: input.envelope.subject,
    suppliedEvidence: input.envelope.suppliedPhrases.slice(0, 24),
    beat: {
      order: beat.order,
      role: beat.role,
      attentionFunction: beat.attentionFunction,
      creativeMove: beat.creativeMove,
      realizationMode: beat.realizationMode,
      eventIds: beat.eventIds ?? [],
      anchorEvents,
      relationKinds: beat.relationKinds ?? [],
      relationStrength: beat.relationStrength ?? 0,
      relations,
      change: clean(beat.change),
      next: clean(beat.next || beat.frontier),
      obligations: beat.obligations ?? [],
      forbiddenMoves: beat.forbiddenMoves ?? [],
      payoff: isPayoffBeat(beat),
      endpoint: endpointText(beat),
    },
    lens: clean(input.lens),
    priorTexts: input.priorTexts ?? [],
  });

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}`;

source = replaceFunction(
  source,
  "export function buildMouthCandidateMessages(",
  newPromptFunction,
);

const newSelector = String.raw`export function selectBestMouthCandidate(
  input: {
    texts: readonly string[];
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidateSelection {
  const candidates = input.texts
    .map((text) => scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts: input.priorTexts,
    }))
    .filter((candidate) => candidate.text.length > 0)
    .filter((candidate) => {
      if (isPayoffBeat(input.beat)) {
        return candidate.endpointExactness === 1 && candidate.forbiddenMoveRisk === 0;
      }
      return candidate.forbiddenMoveRisk === 0 && candidate.inventionRisk < 0.82;
    })
    .sort((a, b) => b.score - a.score);

  return {
    selected: candidates[0],
    candidates,
  };
}`;

source = replaceFunction(
  source,
  "export function selectBestMouthCandidate(",
  newSelector,
);

const newGenerator = String.raw`export async function generateAndSelectMouthCandidates(
  input: MouthCandidateGenerationInput & {
    model: MouthCandidateModel;
  },
): Promise<{
  texts: string[];
  candidates: MouthCandidate[];
  rawText: string;
}> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const texts: string[] = [];
  const selected: MouthCandidate[] = [];
  const rawParts: string[] = [];

  for (const beat of ordered) {
    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts: texts,
      });
      texts.push(exact.text);
      selected.push(exact);
      continue;
    }

    const messages = buildMouthCandidateMessages({
      ...input,
      beats: [beat],
      priorTexts: texts,
    });

    let parsed: MouthCandidateBatch | undefined;
    let rawText = "";

    const first = await input.model(messages);
    rawText = first.text;
    parsed = parseMouthCandidateBatch(first.text);

    const firstVariants = parsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ??
      parsed?.variantsByBeat[0]?.variants ?? [];

    let variants = firstVariants;

    if (variants.length < 2) {
      const repairedMessages = [
        messages[0],
        {
          role: "user" as const,
          content: `${messages[1]?.content ?? ""}\n\nREPAIR: generate materially different language realizations for this same approved beat. Do not change reality or meaning. Return only the JSON variantsByBeat object.`,
        },
      ];
      const repaired = await input.model(repairedMessages);
      rawText = rawText + "\n" + repaired.text;
      const repairParsed = parseMouthCandidateBatch(repaired.text);
      const repairVariants = repairParsed?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ??
        repairParsed?.variantsByBeat[0]?.variants ?? [];
      variants = unique([...variants, ...repairVariants]).slice(0, 8);
    }

    rawParts.push(rawText);

    const selection = selectBestMouthCandidate({
      texts: variants.filter((text) => clean(text).split(/\s+/).length <= 10),
      beat,
      envelope: input.envelope,
      priorTexts: texts,
    });

    if (selection.selected) {
      texts.push(selection.selected.text);
      selected.push(selection.selected);
      console.log(`QRE CANONICAL MOUTH BEAT ${beat.order}: ${selection.candidates.length} truth-gated candidates; selected=${selection.selected.text}`);
    } else {
      texts.push("");
      console.log(`QRE CANONICAL MOUTH BEAT ${beat.order}: no candidate survived the truth/meaning gate`);
    }
  }

  return {
    texts,
    candidates: selected,
    rawText: rawParts.join("\n--- BEAT ---\n"),
  };
}`;

source = replaceFunction(
  source,
  "export async function generateAndSelectMouthCandidates(",
  newGenerator,
);

await writeFile(target, source, "utf8");
console.log("CANONICAL MOUTH CANDIDATE REBUILD APPLIED");
console.log("Owner: apps/api/src/services/authorMouthCandidateSearch.ts");
console.log("Transport untouched: apps/api/src/services/localModelRuntime.ts");
console.log("Next: pnpm --filter @qre/api build");
