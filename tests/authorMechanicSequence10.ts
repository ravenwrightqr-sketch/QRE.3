import { localModelGenerate } from "../apps/api/src/services/localModelRuntime.js";

type Case = {
  id: number;
  name: string;
  reality: string;
  frame: string | "NONE";
  frameRisk: string;
};

const cases: Case[] = [
  { id: 1, name: "DOG GROOMING", reality: "Coco came in nervous, got a bath, stole a blue bow, left looking fabulous.", frame: "celebrity prep", frameRisk: "Do not turn every groom into celebrity language." },
  { id: 2, name: "HOUSEKEEPING", reality: "Maria arrived at 9:04, cleaned the kitchen and two bathrooms, finished at 11:47.", frame: "NONE", frameRisk: "Do not force mission language when the facts already support a better natural turn." },
  { id: 3, name: "MOVING SERVICE", reality: "Three days, Riverside to Portland, kitchen packed first, one mystery box was still missing at the end.", frame: "spy extraction", frameRisk: "Do not turn packing steps into a checklist of spy clichés." },
  { id: 4, name: "CAR WASH", reality: "Black SUV came in filthy, wheels were covered in brake dust, left looking brand new.", frame: "NONE", frameRisk: "Do not add racing, engines, or pit-crew facts." },
  { id: 5, name: "BARBER", reality: "He asked for a clean fade, kept checking the mirror, walked out saying almost nothing.", frame: "reveal", frameRisk: "Do not invent a reaction or crowd." },
  { id: 6, name: "WEDDING", reality: "They both wrote vows, barely looked at each other before the ceremony, then couldn't stop smiling afterward.", frame: "release", frameRisk: "Do not turn it into generic romance language." },
  { id: 7, name: "PERSONAL VISION", reality: "I want three years of raves, sushi everywhere, millions of coffee shops, and to meet lots of new women.", frame: "quest", frameRisk: "Do not turn goals into badges or a literal game UI." },
  { id: 8, name: "TRAVEL MEMORY", reality: "We went back to Huntington. Same pier. Different year. Stayed until sunset.", frame: "return", frameRisk: "Do not explain the meaning of the return." },
  { id: 9, name: "HOME KNOWLEDGE", reality: "Paint is recorded, kitchen appliance manuals are saved, and the HVAC was replaced in 2024.", frame: "archive", frameRisk: "Do not make useful property knowledge sound like a museum." },
  { id: 10, name: "MEMORIAL", reality: "She loved old records, kept every birthday card, and always played the same song on Sundays.", frame: "NONE", frameRisk: "Do not gamify, missionize, or manufacture grief." },
];

const system = [
  "You are QRE's micro-cinematic sequence author.",
  "Write a tiny movie from supplied reality using the selected frame only as a lens.",
  "The frame is NOT a template and must never dictate a canned sequence.",
  "Every beat must be earned from the supplied facts or a clearly creative interpretation of them.",
  "Do not invent concrete people, objects, actions, places, reactions, dialogue, outcomes, chronology, weather, lighting, or physical positions.",
  "Each beat is one sentence, 3-7 words preferred, maximum 9 words.",
  "Do not repeat the subject's name after beat one unless the name makes the line hit harder.",
  "Do not simply restate the source facts.",
  "The sequence must progress: setup → expectation → turn → escalation/reframe → payoff.",
  "Each beat must change the reading, status, expectation, or momentum from the previous beat.",
  "Avoid checklist sequences such as task 1, task 2, task 3.",
  "Prefer eyebrow moments, status turns, implication, understatement, contrast, double meaning, sly humor, and memorable tiny payoffs.",
  "For NONE, use the strongest natural micro-cinematic interpretation without forcing a genre frame.",
  "For memorial material, protect quietness and specificity.",
  "Return JSON exactly: {\"beats\":[\"...\",\"...\",\"...\",\"...\",\"...\"]}.",
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
            frameRisk: test.frameRisk,
            instruction: "Make the smallest possible little movie that makes the reader want the next beat.",
          }),
        },
      ],
      "json",
      { numPredict: 260, temperature: 0.72 },
    );

    let beats: string[] = [];
    try {
      const parsed = JSON.parse(String(result.text ?? "").trim()) as { beats?: unknown };
      if (Array.isArray(parsed.beats)) beats = parsed.beats.map(String).map((x) => x.trim()).filter(Boolean).slice(0, 5);
    } catch {
      beats = [];
    }

    console.log(`\n[${test.id}] ${test.name}`);
    console.log(`REALITY: ${test.reality}`);
    console.log(`FRAME: ${test.frame}`);
    beats.forEach((beat, index) => console.log(`  [${index + 1}] ${beat}`));
    if (!beats.length) console.log("  [NO PARSEABLE BEATS]");
  }

  console.log("\nSEQUENCE TEST COMPLETE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
