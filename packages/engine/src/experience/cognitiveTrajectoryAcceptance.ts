import { understandExperience } from "../cognition/cognitiveEngine.js";
import { composeCognitiveTrajectory } from "./cognitiveTrajectory.js";

type Probe = {
  name: string;
  prompt: string;
  mustContainBeat: string[];
  mustContainMechanic: string[];
};

const probes: Probe[] = [
  {
    name: "Restaurant mystery",
    prompt: "Make my restaurant's QR code turn dinner into a ridiculous mystery.",
    mustContainBeat: ["discovery", "reveal", "payoff"],
    mustContainMechanic: ["discovery", "surprise"],
  },
  {
    name: "Birthday folklore",
    prompt: "Make a funny birthday memory where every family member adds a more ridiculous version until one birthday becomes family folklore.",
    mustContainBeat: ["contribution", "feedback", "payoff"],
    mustContainMechanic: ["accumulation", "contribution", "escalation", "memory"],
  },
  {
    name: "Billionaire spa",
    prompt: "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mustContainBeat: ["encounter", "escalation", "transformation", "payoff"],
    mustContainMechanic: ["excess", "pampering", "escalation", "indulgence"],
  },
  {
    name: "Haunted uncertainty",
    prompt: "Create a terrifying haunted house experience where every room makes the threat less certain and more dangerous.",
    mustContainBeat: ["threshold", "encounter", "reveal", "payoff"],
    mustContainMechanic: ["uncertainty", "escalation"],
  },
  {
    name: "Emotional reversal",
    prompt: "Build an intimate experience that keeps suspense alive, turns the tables, and ends in catharsis and relief while the moment continues to resonate.",
    mustContainBeat: ["reveal", "transformation", "payoff"],
    mustContainMechanic: ["suspense", "reversal", "catharsis", "relief", "resonance"],
  },
];

for (const probe of probes) {
  const state = understandExperience(probe.prompt, {});
  const trajectory = composeCognitiveTrajectory({
    plan: state.plan,
    prompt: probe.prompt,
  });

  const beats = trajectory.beats;
  const mechanics = trajectory.mechanics
    .filter((signal) => signal.confidence >= 0.7)
    .map((signal) => signal.mechanic);

  const missingBeats = probe.mustContainBeat.filter((beat) => !beats.includes(beat as never));
  const missingMechanics = probe.mustContainMechanic.filter(
    (mechanic) => !mechanics.includes(mechanic as never),
  );

  if (missingBeats.length || missingMechanics.length) {
    throw new Error(
      `${probe.name} produced a thin trajectory. ` +
        `Missing beats: ${missingBeats.join(", ") || "none"}. ` +
        `Missing mechanics: ${missingMechanics.join(", ") || "none"}. ` +
        `Got: ${beats.join(" → ")}`,
    );
  }

  if (trajectory.candidates.length < 2) {
    throw new Error(`${probe.name} did not produce competing trajectories.`);
  }

  const distinctCandidates = new Set(
    trajectory.candidates.map((candidate) => candidate.beats.join(" → ")),
  );

  if (distinctCandidates.size < 2) {
    throw new Error(`${probe.name} produced duplicate trajectory candidates.`);
  }

  if (trajectory.score <= 0) {
    throw new Error(`${probe.name} received a non-positive trajectory score.`);
  }

  console.log(
    `✓ ${probe.name}: ${beats.join(" → ")} | score=${trajectory.score} | candidates=${trajectory.candidates.length}`,
  );
}

console.log("✓ competitive cognitive trajectory acceptance passed.");
