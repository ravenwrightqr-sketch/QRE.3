import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const sourceFile = "apps/api/src/services/authorMouthCandidateSearch.ts";
const sourcePath = path.join(root, sourceFile);

const canonical = execFileSync("git", ["show", `HEAD:${sourceFile}`], {
  cwd: root,
  encoding: "utf8",
});

const generateMarker = "export async function generateMouthCandidatePools(";
const generateIndex = canonical.indexOf(generateMarker);
if (generateIndex < 0) throw new Error("AUTHOR CREATIVE GRAMMAR · generator anchor missing");

const parserMarker = "export function parseMouthCandidateBatch(";
const parserIndex = canonical.indexOf(parserMarker);
if (parserIndex < 0) throw new Error("AUTHOR CREATIVE GRAMMAR · parser anchor missing");

const sequenceBuilder = `function buildSequenceMouthCandidateMessages(input: MouthCandidateGenerationInput): Array<{ role: "system" | "user"; content: string }> {
  const beats = [...input.beats].sort((a, b) => a.order - b.order);
  const rhetoricalJobs = beats.map((beat, index) => {
    if (isPayoffBeat(beat)) return { order: beat.order, job: "EXACT PAYOFF" };
    if (index === 0) return { order: beat.order, job: "ESTABLISH: reveal the unusual character, attitude, status, tension, or contradiction hiding inside reality. Do not report the event." };
    if (index === 1) return { order: beat.order, job: "CONTRAST: sharpen the contradiction established by the previous beat without repeating it." };
    if (index === 2) return { order: beat.order, job: "ESCALATE: turn a supplied detail into evidence of the emerging attitude or meaning. Make the next beat desirable." };
    return { order: beat.order, job: "IMPLY / RECONTEXTUALIZE: say less, make more land, and change the reading of earlier material." };
  });

  const sequence = beats.map((beat) => ({
    order: beat.order,
    role: beat.role,
    attentionFunction: beat.attentionFunction,
    creativeMove: beat.creativeMove,
    realizationMode: beat.realizationMode,
    realizationStrategies: beat.realizationStrategies ?? [],
    creativeRealization: beat.creativeRealization ?? null,
    change: beat.change,
    next: beat.next || beat.frontier,
    payoff: isPayoffBeat(beat),
    endpoint: endpointText(beat),
  }));

  const system = [
    "QRE CANONICAL MOUTH · CREATIVE SEQUENCE AUTHOR.",
    "Write one complete viewer-facing experience, not a set of captions.",
    "Upstream QRE owns reality, meaning, relationships, trajectory, and payoff. You own language realization only.",
    "SOURCE FACTS ARE TRUTH CONSTRAINTS, NOT WRITING MATERIAL.",
    "The evidence tells you what may be true; it does not tell you what sentence to write.",
    "Never narrate the receipt, summarize events, or paraphrase supplied moments.",
    "A line that could be made by copying a supplied phrase and changing punctuation is a failed line.",
    "",
    "UNIVERSAL CREATIVE GRAMMAR:",
    "ESTABLISH → CONTRAST → ESCALATE → IMPLY / RECONTEXTUALIZE → PAYOFF.",
    "Each beat must perform its rhetorical job and alter the audience's reading or expectation.",
    "Do not reset to a new caption at every beat.",
    "Later material should make earlier material feel different in retrospect.",
    "",
    "RHYTHM FORMS — EXAMPLES ARE SHAPES, NOT FACTS TO IMPORT:",
    "STATUS: Already had terms. / Apparently, someone had plans.",
    "CONTRAST: Nerves showed up. Attitude stayed. / A little unsure. Still in charge.",
    "IMPLICATION: Then came the part nobody negotiated. / That explained a few things.",
    "UNDERSTATEMENT: Not exactly subtle. / Minor development.",
    "ESCALATION: Then it got interesting. / That was only the beginning.",
    "RECONTEXTUALIZATION: Suddenly, the earlier detail made sense. / So THAT was the plan.",
    "DOUBLE MEANING: Terms were non-negotiable. / Peace had a short contract.",
    "",
    "Do not copy these examples literally. Use their rhetorical behavior to invent language appropriate to the supplied reality.",
    "",
    "TRUTH BOUNDARY:",
    "Do not invent people, places, objects, concrete actions, physical reactions, sounds, dialogue, chronology, outcomes, or props.",
    "Metaphor, implication, attitude, status framing, and safe personification are allowed when they do not assert a new event.",
    "",
    "PAYOFF:",
    "The supplied terminal endpoint is sovereign. Use it exactly and alone on the payoff beat.",
    "",
    "RETURN JSON ONLY.",
    "Return one variantsByBeat entry for every beat. Each non-payoff beat must contain 5 materially different candidate lines.",
    '{"variantsByBeat":[{"order":1,"variants":["LINE 1","LINE 2","LINE 3","LINE 4","LINE 5"]}]}'
  ].join("\\n");

  const user = {
    task: "realize_complete_author_sequence",
    subject: input.envelope.subject,
    lens: clean(input.lens),
    truthConstraints: input.envelope.suppliedPhrases,
    rhetoricalJobs,
    sequence,
  };

  return [
    { role: "system", content: system },
    { role: "user", content: JSON.stringify(user) },
  ];
}
`;

const generation = `export async function generateMouthCandidatePools(input: MouthCandidateGenerationInput & { risk?: string; feedback?: string }): Promise<{ pools: MouthCandidatePool[]; rawText: string }> {
  const ordered = [...input.beats].sort((a, b) => a.order - b.order);
  const priorTexts = input.priorTexts ?? [];
  const messages = buildSequenceMouthCandidateMessages(input);
  if (input.feedback) {
    const last = messages[messages.length - 1];
    if (last?.role === "user") last.content += "\\n\\nQRE SEQUENCE FEEDBACK:\\n" + input.feedback;
  }
  const result = await localModelGenerate(messages, "json", {
    numPredict: Math.min(3072, Math.max(2048, ordered.length * 384)),
    temperature: input.risk === "safe" ? 0.72 : 0.84,
  });
  const parsed = parseMouthCandidateBatch(result.text);
  const variantsByBeat = new Map((parsed?.variantsByBeat ?? []).map((entry) => [entry.order, entry.variants]));
  const pools: MouthCandidatePool[] = [];
  for (const beat of ordered) {
    if (isPayoffBeat(beat) && endpointText(beat)) {
      const exact = scoreMouthCandidate({ text: endpointText(beat), beat, envelope: input.envelope, priorTexts });
      pools.push({ order: beat.order, candidates: [exact] });
      continue;
    }
    const variants = variantsByBeat.get(beat.order) ?? [];
    const selection = selectBestMouthCandidate({ texts: variants, beat, envelope: input.envelope, priorTexts });
    pools.push({ order: beat.order, candidates: selection.candidates });
  }
  return { pools, rawText: result.text };
}
`;

const output = canonical.slice(0, parserIndex) + sequenceBuilder + canonical.slice(parserIndex, generateIndex) + generation;
fs.writeFileSync(sourcePath, output, "utf8");
console.log("AUTHOR MOUTH CREATIVE GRAMMAR APPLIED");
console.log("SOURCE RESTORED FROM HEAD BEFORE PATCH");
console.log("ONE SEQUENCE MODEL CALL · NO PER-BEAT REPAIR LOOP");
console.log("RHYTHM: ESTABLISH → CONTRAST → ESCALATE → IMPLY/RECONTEXTUALIZE → PAYOFF");
