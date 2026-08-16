import { localModelGenerate } from "../apps/api/src/services/localModelRuntime.js";

type Case = {
  id: number;
  name: string;
  reality: string;
  frame: string | "NONE";
};

type Beat = {
  text?: string;
  job?: string;
  pull?: number;
  move?: string;
};

const cases: Case[] = [
  { id: 1, name: "DOG GROOMING", reality: "Coco came in nervous, got a bath, stole a blue bow, left looking fabulous.", frame: "celebrity prep" },
  { id: 2, name: "HOUSEKEEPING", reality: "Maria arrived at 9:04, cleaned the kitchen and two bathrooms, finished at 11:47.", frame: "NONE" },
  { id: 3, name: "MOVING SERVICE", reality: "Three days, Riverside to Portland, kitchen packed first, one mystery box was still missing at the end.", frame: "spy extraction" },
  { id: 4, name: "CAR WASH", reality: "Black SUV came in filthy, wheels were covered in brake dust, left looking brand new.", frame: "NONE" },
  { id: 5, name: "BARBER", reality: "He asked for a clean fade, kept checking the mirror, walked out saying almost nothing.", frame: "reveal" },
  { id: 6, name: "WEDDING", reality: "They both wrote vows, barely looked at each other before the ceremony, then couldn't stop smiling afterward.", frame: "release" },
  { id: 7, name: "PERSONAL VISION", reality: "I want three years of raves, sushi everywhere, millions of coffee shops, and to meet lots of new women.", frame: "quest" },
  { id: 8, name: "TRAVEL MEMORY", reality: "We went back to Huntington. Same pier. Different year. Stayed until sunset.", frame: "return" },
  { id: 9, name: "HOME KNOWLEDGE", reality: "Paint is recorded, kitchen appliance manuals are saved, and the HVAC was replaced in 2024.", frame: "archive" },
  { id: 10, name: "MEMORIAL", reality: "She loved old records, kept every birthday card, and always played the same song on Sundays.", frame: "NONE" },
];

const system = [
  "You are the QRE attention-carving film editor.",
  "Turn the supplied reality into a tiny movie worth continuing to watch.",
  "The selected frame is only a lens. It is never a template, genre requirement, or excuse to invent events.",
  "Reality is sacred: do not invent concrete people, objects, actions, reactions, dialogue, locations, weather, lighting, physical effects, or chronology.",
  "Creative interpretation is allowed only when it clearly changes the reading of supplied facts without creating new facts.",
  "Write exactly 5 beats when the reality supports 5; otherwise use 3-5 beats. Never pad.",
  "Each beat must be one short sentence, preferably 2-8 words, maximum 10 words.",
  "Beat 1 must hook.",
  "Every later beat must change status, expectation, meaning, tension, or momentum.",
  "Do not make a checklist. Never simply narrate task 1, task 2, task 3.",
  "Each beat must create a reason to want the next beat. Score pull 0.00-1.00.",
  "The final beat must pay off, reframe, or land a memorable afterimage; it must not merely summarize.",
  "Use tiny creative moves: eyebrow moment, status inversion, understatement, implication, contrast, double meaning, sly humor, callback, or earned escalation.",
  "Do not repeat the subject name after beat one unless the repetition is itself the strongest move.",
  "For NONE, stay natural. Do not force a game/spy/mission frame.",
  "For memorial material, avoid gamification, invented grief reactions, and melodrama.",
  "Return JSON exactly: {\"beats\":[{\"text\":\"...\",\"job\":\"hook|expectation|turn|escalation|payoff\",\"pull\":0.0,\"move\":\"...\"}]}.",
].join("\n");

async function main(): Promise<void> {
  for (const test of cases) {
    const result = await localModelGenerate(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            reality: test.reality,
            selectedFrame: test.frame,
            instruction: "Carve the smallest possible movie. Make me want the next sentence. If a beat cannot earn its place, omit it.",
          }),
        },
      ],
      "json",
      { numPredict: 340, temperature: 0.78 },
    );

    let beats: Beat[] = [];
    try {
      const parsed = JSON.parse(String(result.text ?? "").trim()) as { beats?: unknown };
      if (Array.isArray(parsed.beats)) {
        beats = parsed.beats
          .map((beat) => (typeof beat === "object" && beat !== null ? beat as Beat : { text: String(beat) }))
          .filter((beat) => String(beat.text ?? "").trim())
          .slice(0, 5);
      }
    } catch {
      beats = [];
    }

    console.log(`\n[${test.id}] ${test.name}`);
    console.log(`REALITY: ${test.reality}`);
    console.log(`FRAME: ${test.frame}`);
    if (!beats.length) {
      console.log("  [NO PARSEABLE BEATS]");
      continue;
    }
    beats.forEach((beat, index) => {
      console.log(`  [${index + 1}] ${String(beat.text).trim()}`);
      console.log(`      JOB: ${beat.job ?? "?"} | PULL: ${Number(beat.pull ?? 0).toFixed(2)} | MOVE: ${beat.move ?? ""}`);
    });
  }

  console.log("\nATTENTION CARVING TEST COMPLETE");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
