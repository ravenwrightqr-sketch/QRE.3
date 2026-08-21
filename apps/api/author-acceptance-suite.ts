import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";

type Case = {
  name: string;
  subject: string;
  facts: string[];
  prompt: string;
};

const cases: Case[] = [
  {
    name: "pet-grooming",
    subject: "Coco",
    facts: ["came in nervous", "got a bath", "stole a blue bow", "left looking fabulous"],
    prompt: "Write a 5-line sequence about Coco. Final line: Peace was temporary.",
  },
  {
    name: "housekeeping",
    subject: "Room 412",
    facts: ["check-out was at noon", "room was cleaned", "fresh towels were placed", "guest returned early"],
    prompt: "Write a 5-line sequence about Room 412. Final line: Someone was coming back.",
  },
  {
    name: "lawyer",
    subject: "Mara",
    facts: ["arrived for a contract review", "found one missing clause", "redlined the agreement", "sent it back approved"],
    prompt: "Write a 5-line sequence about Mara. Final line: The answer was already in the fine print.",
  },
  {
    name: "restaurant",
    subject: "Table 9",
    facts: ["ordered quietly", "the kitchen fell behind", "dessert arrived first", "the table laughed"],
    prompt: "Write a 5-line sequence about Table 9. Final line: Dinner had other plans.",
  },
  {
    name: "real-estate",
    subject: "The house",
    facts: ["listed on Monday", "the showing was busy", "one buyer stayed behind", "an offer arrived that night"],
    prompt: "Write a 5-line sequence about the house. Final line: The quiet one made the offer.",
  },
  {
    name: "mechanic",
    subject: "The car",
    facts: ["arrived with a warning light", "diagnosis found a loose connection", "the connection was repaired", "the warning light disappeared"],
    prompt: "Write a 5-line sequence about the car. Final line: The real problem had been smaller than it looked.",
  },
  {
    name: "wedding",
    subject: "The reception",
    facts: ["the speeches ran long", "the DJ changed the song", "everyone moved to the floor", "the couple stayed up front"],
    prompt: "Write a 5-line sequence about the reception. Final line: Nobody wanted the night to end.",
  },
  {
    name: "person",
    subject: "Alex",
    facts: ["arrived late", "said almost nothing", "noticed the one thing everyone missed", "left before anyone asked"],
    prompt: "Write a 5-line sequence about Alex. Final line: The quiet part was the point.",
  },
];

let failures = 0;

for (const test of cases) {
  const result = await authorBrainUniversal({
    prompt: test.prompt,
    subject: test.subject,
    facts: test.facts,
    sourceMoments: test.facts,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });

  const diagnostics = result.diagnostics;
  const expectedLines = 5;
  const accepted = diagnostics.qualityStatus === "ACCEPTED";
  const oneCall = diagnostics.modelCalls === 1;
  const complete = diagnostics.complete === true;
  const exactCount = result.scenes.length === expectedLines;
  const exactEnding = String(test.prompt).match(/final\s+line\s*:\s*(.+)$/i)?.[1]?.trim() ?? "";
  const endingOk = exactEnding
    ? result.scenes.at(-1)?.text.trim().toLowerCase() === exactEnding.toLowerCase()
    : true;

  const ok = accepted && oneCall && complete && exactCount && endingOk;
  if (!ok) failures += 1;

  console.log(
    `${ok ? "PASS" : "FAIL"} ${test.name.padEnd(16)} calls=${String(diagnostics.modelCalls).padEnd(2)} ` +
    `accepted=${accepted ? "yes" : "no"} lines=${result.scenes.length} ` +
    `ending=${endingOk ? "yes" : "no"} score=${String(diagnostics.selectedScore ?? 0)}`,
  );

  if (!ok) {
    console.log(JSON.stringify({
      thesis: diagnostics.thesis,
      transformation: diagnostics.transformation,
      rejectedCandidates: diagnostics.rejectedCandidates,
      rawModelOutput: diagnostics.rawModelOutput,
    }, null, 2));
  }
}

const differentiationPrompt = "Write a 5-line sequence about Coco. Final line: The calm did not last.";
const differentiationCases = [
  {
    label: "state-shift",
    facts: ["arrived timid", "settled after a bath", "stole a blue bow", "left smiling"],
  },
  {
    label: "chaos-shift",
    facts: ["arrived confident", "refused the bath", "stole three red ribbons", "left covered in mud"],
  },
];

const differentiationResults = [] as Array<{
  label: string;
  result: Awaited<ReturnType<typeof authorBrainUniversal>>;
}>;

for (const test of differentiationCases) {
  const result = await authorBrainUniversal({
    prompt: differentiationPrompt,
    subject: "Coco",
    facts: test.facts,
    sourceMoments: test.facts,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  });
  differentiationResults.push({ label: test.label, result });
}

const [first, second] = differentiationResults;
const thesisA = String(first?.result.diagnostics.thesis ?? "");
const thesisB = String(second?.result.diagnostics.thesis ?? "");
const outputA = first?.result.scenes.map((scene) => scene.text.trim().toLowerCase()).join("\n") ?? "";
const outputB = second?.result.scenes.map((scene) => scene.text.trim().toLowerCase()).join("\n") ?? "";
const differentiated = thesisA !== thesisB && outputA !== outputB;

console.log(
  `${differentiated ? "PASS" : "FAIL"} differentiation   ` +
  `thesis=${thesisA !== thesisB ? "different" : "same"} output=${outputA !== outputB ? "different" : "same"}`,
);

if (!differentiated) {
  failures += 1;
  console.log(JSON.stringify({
    first: { thesis: thesisA, output: outputA, raw: first?.result.diagnostics.rawModelOutput },
    second: { thesis: thesisB, output: outputB, raw: second?.result.diagnostics.rawModelOutput },
  }, null, 2));
}

console.log(`\nUNIVERSAL AUTHOR ACCEPTANCE: ${failures === 0 ? "PASS" : "FAIL"}`);
if (failures !== 0) process.exitCode = 1;
