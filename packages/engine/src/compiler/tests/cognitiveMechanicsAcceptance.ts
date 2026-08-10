import { inferExperienceMechanics, mechanicBrief } from "../../experience/cognitiveMechanics.js";
import { understandExperience } from "../../cognition/cognitiveEngine.js";

type Probe = {
  name: string;
  prompt: string;
  mustContain: string[];
};

const probes: Probe[] = [
  {
    name: "Princess returns to the groomer",
    prompt: "Princess the poodle returns to the groomer. She remembers the absurd treatment, has preferences now, and every visit should adapt to what she loved before.",
    mustContain: ["pampering", "adaptation", "memory", "continuation"],
  },
  {
    name: "Birthday folklore",
    prompt: "Make a funny birthday memory where every family member adds a more ridiculous version until one birthday becomes family folklore.",
    mustContain: ["accumulation", "contribution", "memory", "escalation"],
  },
  {
    name: "Absurd billionaire spa",
    prompt: "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
    mustContain: ["excess", "pampering", "escalation", "indulgence"],
  },
  {
    name: "Haunted house",
    prompt: "Create a terrifying haunted house experience where every room makes the threat less certain and more dangerous.",
    mustContain: ["uncertainty", "escalation"],
  },
  {
    name: "Changing scavenger hunt",
    prompt: "Build a playful scavenger hunt where every clue changes the next clue and participants discover something unexpected.",
    mustContain: ["discovery", "participation", "adaptation", "surprise"],
  },
  {
    name: "Superstar experience vocabulary",
    prompt: "Create an exclusive spectacular celebration where participants choose their own path, build mastery, unlock a rare surprise, and leave with a personalized artifact that becomes part of their legacy.",
    mustContain: [
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
  },
  {
    name: "Emotional release",
    prompt: "Build an intimate experience that keeps suspense alive, turns the tables, and ends in catharsis and relief while the moment continues to resonate.",
    mustContain: [
      "intimacy",
      "suspense",
      "reversal",
      "catharsis",
      "relief",
      "resonance",
    ],
  },
];

for (const probe of probes) {
  const state = understandExperience(probe.prompt, {});
  const mechanics = mechanicBrief(
    inferExperienceMechanics({
      plan: state.plan,
      premise: state.plan.premise,
    }),
  );

  const missing = probe.mustContain.filter((mechanic) => !mechanics.includes(mechanic));

  if (missing.length) {
    throw new Error(
      `${probe.name} lost mechanics: ${missing.join(", ")}. Got: ${mechanics.join(", ")}`,
    );
  }

  console.log(`✓ ${probe.name}: ${mechanics.join(", ")}`);
}

console.log("Cognitive mechanics acceptance passed.");
