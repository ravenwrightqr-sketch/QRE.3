import { localModelGenerate } from "../apps/api/src/services/localModelRuntime.js";

type Case = {
  id: number;
  name: string;
  prompt: string;
  frames: string[];
};

type Selection = {
  frame: string | "NONE";
  confidence: number;
  increase: string;
  why: string;
  sequenceRisk: string;
};

const cases: Case[] = [
  { id: 1, name: "DOG GROOMING", prompt: "Coco came in nervous, got a bath, stole a blue bow, left looking fabulous.", frames: ["negotiation", "heist", "celebrity prep", "transformation"] },
  { id: 2, name: "HOUSEKEEPING", prompt: "Maria arrived at 9:04, cleaned the kitchen and two bathrooms, finished at 11:47.", frames: ["mission", "speedrun", "operation", "boss fight"] },
  { id: 3, name: "MOVING SERVICE", prompt: "Three days, Riverside to Portland, kitchen packed first, one mystery box was still missing at the end.", frames: ["spy extraction", "heist", "mission", "investigation"] },
  { id: 4, name: "CAR WASH", prompt: "Black SUV came in filthy, wheels were covered in brake dust, left looking brand new.", frames: ["pit stop", "restoration", "transformation", "race prep"] },
  { id: 5, name: "BARBER", prompt: "He asked for a clean fade, kept checking the mirror, walked out saying almost nothing.", frames: ["reveal", "character upgrade", "status change", "understatement"] },
  { id: 6, name: "WEDDING", prompt: "They both wrote vows, barely looked at each other before the ceremony, then couldn't stop smiling afterward.", frames: ["countdown", "reveal", "romantic tension", "release"] },
  { id: 7, name: "PERSONAL VISION", prompt: "I want three years of raves, sushi everywhere, millions of coffee shops, and to meet lots of new women.", frames: ["quest", "achievement", "adventure", "campaign"] },
  { id: 8, name: "TRAVEL MEMORY", prompt: "We went back to Huntington. Same pier. Different year. Stayed until sunset.", frames: ["return", "memory loop", "reframing", "time passage"] },
  { id: 9, name: "HOME KNOWLEDGE", prompt: "Paint is recorded, kitchen appliance manuals are saved, and the HVAC was replaced in 2024.", frames: ["archive", "command center", "legacy", "property dossier"] },
  { id: 10, name: "MEMORIAL", prompt: "She loved old records, kept every birthday card, and always played the same song on Sundays.", frames: ["memory", "refrain", "portrait", "quiet observation"] },
];

const system = [
  "You are QRE's creative mechanic selector.",
  "Choose a creative frame ONLY when it materially increases the experience.",
  "A frame is a cinematic lens, never a template and never a required genre.",
  "Do not force a game, spy, mission, quest, heist, boss fight, or status frame onto emotionally quiet or memorial material.",
  "The frame must arise from the actual supplied reality: change, tension, status, pattern, transformation, unresolved question, repetition, or goal.",
  "A high score means the frame gives the future beat writer more interesting possibilities than a natural reading would.",
  "NONE is a strong and correct answer when a frame would merely decorate the facts.",
  "Do not invent facts while explaining the choice.",
  "Return JSON exactly: {\"frame\":\"...|NONE\",\"confidence\":0.0,\"increase\":\"...\",\"why\":\"...\",\"sequenceRisk\":\"...\"}.",
  "Confidence is 0.00 to 1.00.",
  "increase must say what the frame adds to the reading.",
  "sequenceRisk must identify the biggest way this frame could become a lame template.",
].join("\n");

async function main(): Promise<void> {
  for (const test of cases) {
    const result = await localModelGenerate(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            reality: test.prompt,
            candidateFrames: test.frames,
            instruction: "Select the strongest frame only if it genuinely increases the experience. Otherwise return NONE.",
          }),
        },
      ],
      "json",
      { numPredict: 180, temperature: 0.25 },
    );

    let selection: Selection;
    try {
      selection = JSON.parse(String(result.text ?? "").trim()) as Selection;
    } catch {
      selection = { frame: "NONE", confidence: 0, increase: "unparseable", why: "model output could not be parsed", sequenceRisk: "unknown" };
    }

    console.log(`\n[${test.id}] ${test.name}`);
    console.log(`PROMPT: ${test.prompt}`);
    console.log(`CANDIDATES: ${test.frames.join(" | ")}`);
    console.log(`SELECTED: ${selection.frame ?? "NONE"}`);
    console.log(`CONFIDENCE: ${Number(selection.confidence ?? 0).toFixed(2)}`);
    console.log(`INCREASE: ${selection.increase ?? ""}`);
    console.log(`WHY: ${selection.why ?? ""}`);
    console.log(`SEQUENCE RISK: ${selection.sequenceRisk ?? ""}`);
  }

  console.log("\nFRAME TEST COMPLETE");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
