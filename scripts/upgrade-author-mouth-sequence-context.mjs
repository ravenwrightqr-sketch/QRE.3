import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorMouthCandidateSearch.ts");

function readTarget() {
  return fs.readFileSync(target, "utf8");
}

function writeTarget(value) {
  fs.writeFileSync(target, value, "utf8");
}

function replacementFunction() {
  return String.raw`
export async function generateMouthCandidatePools(
  input: MouthCandidateGenerationInput & {
    risk?: string;
    feedback?: string;
  },
): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const basePriorTexts = input.priorTexts ?? [];

  const sequenceRows = ordered.map((beat) => {
    const realization = beat.creativeRealization;

    return {
      order: beat.order,
      role: beat.role,
      attentionFunction: beat.attentionFunction,
      creativeMove: beat.creativeMove,
      realizationMode: beat.realizationMode,
      strategies: beat.realizationStrategies ?? [],
      creativeRealization: realization ?? null,
      eventIds: beat.eventIds ?? [],
      change: beat.change,
      next: beat.next || beat.frontier,
      obligations: beat.obligations ?? [],
      forbiddenMoves: beat.forbiddenMoves ?? [],
      payoff: isPayoffBeat(beat),
      endpoint: endpointText(beat),
    };
  });

  const system = [
    "QRE CANONICAL MOUTH · SEQUENCE AUTHOR.",
    "You are writing ONE complete creative sequence, not independent captions.",
    "The upstream Author owns reality, meaning, relationships, trajectory, creative realization, and endpoint.",
    "Your job is to turn the approved semantic trajectory into memorable viewer-facing language.",
    "",
    "SOURCE FACTS ARE RAW MATERIAL, NOT A SCRIPT.",
    "Do not narrate the receipt.",
    "Do not list the supplied events in order.",
    "Do not paraphrase source moments.",
    "Do not repeat a subject, trait, object, or action merely because it exists in the evidence.",
    "Every line must perform a creative move and make the next line more desirable.",
    "Later lines must recontextualize earlier material rather than summarize it.",
    "",
    "CREATIVE RHYTHM:",
    "Use short cinematic beats.",
    "Vary rhetorical shape across the sequence.",
    "Actively use status, contrast, implication, understatement, double meaning, escalation, callback, and recontextualization when the approved meaning supports them.",
    "Avoid repeating the same nouns and syntactic patterns across adjacent lines.",
    "Prefer language that reveals attitude, subtext, consequence, tension, or a changed reading.",
    "",
    "TRUTH BOUNDARY:",
    "Do not invent people, places, concrete actions, physical reactions, sounds, dialogue, chronology, outcomes, or props.",
    "Creative framing may transform perception without creating new reality.",
    "",
    "PAYOFF:",
    "The supplied terminal endpoint is sovereign.",
    "The payoff beat must use the exact supplied endpoint phrase and nothing else.",
    "",
    "RETURN JSON ONLY.",
    "Return one variantsByBeat entry for every beat.",
    "Each non-payoff beat should contain 5 materially different candidate lines.",
    "",
    '{"variantsByBeat":[{"order":1,"variants":["LINE 1","LINE 2","LINE 3","LINE 4","LINE 5"]}]}'
  ].join("\\n");

  const user = {
    task: "realize_complete_author_sequence",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    priorTexts: basePriorTexts,
    suppliedEvidence: input.envelope.suppliedPhrases,
    sequence: sequenceRows,
  };

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];

  if (input.feedback) {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      last.content += "\\n\\nQRE REPAIR FEEDBACK:\\n" + input.feedback;
    }
  }

  const result = await localModelGenerate(messages, "json", {
    numPredict: Math.max(3072, ordered.length * 768),
    temperature: input.risk === "safe" ? 0.72 : 0.84,
  });

  const parsed = parseMouthCandidateBatch(result.text);
  const variantsByBeat = new Map(
    (parsed?.variantsByBeat ?? []).map((entry) => [entry.order, entry.variants]),
  );

  const pools: MouthCandidatePool[] = [];
  const rawParts = ["SEQUENCE PRIMARY\\n" + result.text];

  for (const beat of ordered) {
    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({
        text: endpointText(beat),
        beat,
        envelope: input.envelope,
        priorTexts: basePriorTexts,
      });

      pools.push({ order: beat.order, candidates: [exact] });
      continue;
    }

    let variants = variantsByBeat.get(beat.order) ?? [];

    if (variants.length < 2) {
      const repairMessages = buildMouthCandidateMessages({
        ...input,
        beats: [beat],
        priorTexts: basePriorTexts,
      });

      repairMessages[0].content += [
        "",
        "SEQUENCE REPAIR",
        "Write only the missing beat.",
        "It must belong to the larger approved trajectory rather than reading like an isolated caption.",
        "Do not restate the source event.",
        "Return 5 distinct short realizations.",
      ].join("\\n");

      const repair = await localModelGenerate(repairMessages, "json", {
        numPredict: 1536,
        temperature: 0.78,
      });

      rawParts.push("BEAT " + beat.order + " REPAIR\\n" + repair.text);

      const repaired = parseMouthCandidateBatch(repair.text);
      const repairedVariants = repaired?.variantsByBeat.find((entry) => entry.order === beat.order)?.variants ?? [];
      variants = unique([...variants, ...repairedVariants]).slice(0, MAX_CANDIDATES);
    }

    const selection = selectBestMouthCandidate({
      texts: variants,
      beat,
      envelope: input.envelope,
      priorTexts: basePriorTexts,
    });

    pools.push({ order: beat.order, candidates: selection.candidates });
  }

  return {
    pools,
    rawText: rawParts.join("\\n--- MOUTH GENERATION ---\\n"),
  };
}
`;
}

const text = readTarget();
const marker = "export async function generateMouthCandidatePools(";
const start = text.indexOf(marker);

if (start < 0) {
  throw new Error("AUTHOR MOUTH SEQUENCE UPGRADE · generateMouthCandidatePools not found");
}

const next = text.slice(0, start) + replacementFunction().trimStart() + "\n";
writeTarget(next);

console.log("AUTHOR MOUTH SEQUENCE GENERATION UPGRADE APPLIED");
