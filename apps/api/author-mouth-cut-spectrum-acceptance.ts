/**
 * QRE CANONICAL AUTHOR LAW
 * ROLE: deterministic proof for viewer-facing cut freedom.
 * LAW: QRE may surprise us.
 * This is a proof harness, not a creative template.
 */

import { evaluateMouthInterpretation } from "./src/services/authorMouthInterpretation.js";
import type { RealityEnvelope } from "./src/services/authorRealityEnvelope.js";

const envelope = (events: string[]): RealityEnvelope => ({
  subject: "Coco",
  events: events.map((label, index) => ({
    id: `event-${index + 1}`,
    label,
    sourceIds: [`source-${index + 1}`],
  })),
  relations: [],
  suppliedPhrases: events,
  suppliedEntities: ["Coco", "poodle", "squirrels", "park", "grass", "apples"],
  suppliedActions: events.filter((value) => /walk|roll|run|chase/i.test(value)),
  suppliedStates: [],
  recurringSignals: [],
  sensorySignals: [],
  unresolvedTensions: [],
});

const cases = [
  {
    name: "single_word_place",
    text: "Park.",
    labels: ["Coco loves the park"],
    events: ["Coco loves the park"],
    expectAccepted: true,
  },
  {
    name: "single_word_interest",
    text: "Squirrels.",
    labels: ["Coco likes squirrels"],
    events: ["Coco likes squirrels"],
    expectAccepted: true,
  },
  {
    name: "obsessive_framing",
    text: "Her favorite problem.",
    labels: ["Coco likes squirrels"],
    events: ["Coco likes squirrels"],
    expectAccepted: true,
  },
  {
    name: "dreamy_framing",
    text: "Her favorite thought.",
    labels: ["Coco likes squirrels"],
    events: ["Coco likes squirrels"],
    expectAccepted: true,
  },
  {
    name: "bounded_emphasis",
    text: "So many squirrels.",
    labels: ["Coco likes squirrels"],
    events: ["Coco likes squirrels"],
    expectAccepted: true,
  },
  {
    name: "cross_fact_compression",
    text: "Park got interesting.",
    labels: ["Coco likes squirrels", "Coco loves the park"],
    events: ["Coco likes squirrels", "Coco loves the park"],
    expectAccepted: true,
  },
  {
    name: "grounded_physical_event",
    text: "Squirrel chase.",
    labels: ["Coco ran through the park chasing squirrels"],
    events: ["Coco ran through the park chasing squirrels"],
    expectAccepted: true,
  },
  {
    name: "invented_physical_event",
    text: "She chased them all afternoon.",
    labels: ["Coco likes squirrels", "Coco loves the park"],
    events: ["Coco likes squirrels", "Coco loves the park"],
    expectAccepted: false,
  },
  {
    name: "invented_location_event",
    text: "She chased squirrels through the park.",
    labels: ["Coco likes squirrels", "Coco loves the park"],
    events: ["Coco likes squirrels", "Coco loves the park"],
    expectAccepted: false,
  },
] as const;

console.log("QRE MOUTH CUT-SPECTRUM ACCEPTANCE");

for (const item of cases) {
  const result = evaluateMouthInterpretation({
    text: item.text,
    sourceLabels: item.labels,
    envelope: envelope(item.events),
  });

  const ok = result.accepted === item.expectAccepted;
  console.log(
    `${item.name}: ${ok ? "PASS" : "FAIL"} · accepted=${result.accepted} · concreteRisk=${result.unsupportedConcreteRisk} · creative=${result.creativeFraming.toFixed(3)}`,
  );

  if (!ok) {
    throw new Error(
      `${item.name}: expected accepted=${item.expectAccepted} but got ${result.accepted}`,
    );
  }
}

console.log("QRE MOUTH CUT-SPECTRUM: PASS");
