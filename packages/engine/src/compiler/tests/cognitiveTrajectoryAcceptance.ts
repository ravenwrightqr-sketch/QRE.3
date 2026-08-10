import { understandExperience } from "../../cognition/cognitiveEngine.js";
import { composeCognitiveTrajectory } from "../../experience/cognitiveTrajectory.js";

type Probe = {
  name: string;
  prompt: string;
  mustContainMechanics: string[];
  mustContainBeats: string[];
};

const probes: Probe[] = [
  {
    name: "Over-the-top indulgence",
    prompt: "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mustContainMechanics: ["excess", "escalation", "pampering"],
    mustContainBeats: ["encounter", "escalation", "transformation", "payoff"],
  },
  {
    name: "Suspense machine",
    prompt: "Create a genuinely terrifying haunted-house experience where every room makes the threat less certain and more dangerous.",
    mustContainMechanics: ["uncertainty", "escalation", "suspense"],
    mustContainBeats: ["threshold", "encounter", "reveal", "escalation", "payoff"],
  },
  {
    name: "Living folklore",
    prompt: "Create a funny birthday memory that family members can keep adding to, with each version becoming more ridiculous.",
    mustContainMechanics: ["accumulation", "contribution", "memory", "continuation", "escalation"],
    mustContainBeats: ["origin", "encounter", "contribution", "escalation", "reflection", "payoff", "continuation"],
  },
  {
    name: "Agency and prestige",
    prompt: "Create an exclusive spectacular celebration where participants choose their own path, build mastery, unlock a rare surprise, and leave with a personalized artifact that becomes part of their legacy.",
    mustContainMechanics: [
      "prestige",
      "spectacle",
      "celebration",
      "agency",
      "mastery",
      "scarcity",
      "surprise",
      "curation",
      "ownership",
      "legacy",
    ],
    mustContainBeats: ["threshold", "action", "challenge", "feedback", "milestone", "unlock", "identity", "payoff", "continuation"],
  },
];

for (const probe of probes) {
  const state = understandExperience(probe.prompt, {});
  const trajectory = composeCognitiveTrajectory({ plan: state.plan });
  const mechanics = trajectory.mechanics
    .filter((signal) => signal.confidence >= 0.7)
    .map((signal) => signal.mechanic);

  const missingMechanics = probe.mustContainMechanics.filter(
    (mechanic) => !mechanics.includes(mechanic as never),
  );

  const missingBeats = probe.mustContainBeats.filter(
    (beat) => !trajectory.beats.includes(beat as never),
  );

  if (missingMechanics.length || missingBeats.length) {
    throw new Error(
      `${probe.name} failed.\n` +
        `Missing mechanics: ${missingMechanics.join(", ") || "none"}\n` +
        `Missing beats: ${missingBeats.join(", ") || "none"}\n` +
        `Mechanics: ${mechanics.join(", ")}\n` +
        `Beats: ${trajectory.beats.join(" → ")}`,
    );
  }

  console.log(`✓ ${probe.name}`);
  console.log(`  mechanics: ${mechanics.join(", ")}`);
  console.log(`  beats: ${trajectory.beats.join(" → ")}`);
}

console.log("✓ Super Cog cognitive trajectory acceptance passed.");
