import { strict as assert } from "node:assert";
import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const INTERNAL = /(?:the situation has not been entered|the subject and situation are established|only the present is visible|continuity is established|the journey is beginning|starting point is clear|participants are separate|a shared context exists|identity is implicit|identity is explicit|the result is available|the target is unclear|the useful target is explicit)/i;

const cases = [
  "Create a memorial for my grandmother",
  "Make my surfboard feel like it has traveled more than I have",
  "Create something completely weird involving aliens and a gas station",
  "Create an absurd luxury spa experience for a billionaire",
  "Turn this concert QR into something people will remember.",
  "A housekeeper documents a client's home after a huge cleaning day.",
];

for (const prompt of cases) {
  const result = compileCognitiveExperience(prompt);
  const text = result.story.beats.map((beat) => beat.text).join(" ");

  assert.ok(result.story.beats.length >= 2, `too few beats: ${prompt}`);
  assert.ok(!result.story.beats.some((beat) => INTERNAL.test(beat.text)), `internal state leaked: ${prompt}\n${text}`);

  const premiseValues = result.cognition.plan.premise?.slots.flatMap((slot) => slot.values) ?? [];
  const concreteAnchors = premiseValues.filter((value) =>
    /\b(?:concert|grandmother|surfboard|aliens|gas station|spa|billionaire|housekeeper|home|cleaning|luxury)\b/i.test(value),
  );

  for (const anchor of concreteAnchors.slice(0, 3)) {
    assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `observed premise evidence disappeared: ${anchor}\n${text}`);
  }

  const creative = result.cognition.plan.realization?.directives
    .flatMap((directive) => directive.evidence)
    .filter((evidence) => evidence.source === "creative_realization") ?? [];

  if (creative.length) {
    const detail = creative[0]?.detail.split(": ").at(-1)?.toLowerCase();
    assert.ok(detail && text.toLowerCase().includes(detail), `creative realization did not survive: ${detail}\n${text}`);
  }
}

console.log("✓ provenance-aware final language acceptance passed");
