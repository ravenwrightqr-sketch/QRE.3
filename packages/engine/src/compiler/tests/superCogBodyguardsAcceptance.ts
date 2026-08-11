import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";
import { inferExperienceMechanics, mechanicBrief } from "../../experience/cognitiveMechanics.js";
import { understandExperience } from "../../cognition/cognitiveEngine.js";

const ABSTRACT = [
  /adapt to accumulated history/i,
  /make .* meaningful/i,
  /the experience puts into focus/i,
  /the supplied premise/i,
  /the next concrete condition in the premise/i,
  /gets increasingly over the top/i,
  /make .* matter through/i,
  /allow participants to/i,
  /affect shared state/i,
];

function storyText(prompt: string): string {
  return compileCognitiveExperience(prompt).story.beats.map((beat) => beat.text).join(" ");
}

const sourdough = compileCognitiveExperience("Teach someone how to make sourdough.");
if (sourdough.cognition.subject.value.toLowerCase() !== "sourdough") {
  throw new Error(`Subject authority failed: expected sourdough, got ${sourdough.cognition.subject.value}`);
}

const mundanePrompt = "A housekeeper documents a client's home after a huge cleaning day.";
const mundane = compileCognitiveExperience(mundanePrompt);
const mundaneText = mundane.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

if (!mundaneText.includes(mundane.cognition.subject.value.toLowerCase())) {
  throw new Error("Subject was lost from final story realization.");
}

const creativeEvidence = mundane.cognition.plan.realization?.directives
  .flatMap((directive) => directive.evidence)
  .filter((evidence) => evidence.source === "creative_realization") ?? [];

if (!creativeEvidence.length) {
  throw new Error("Mundane prompt did not receive a provenance-tagged creative realization.");
}

const creativeDetail = creativeEvidence[0]?.detail.split(": ").at(-1)?.toLowerCase() ?? "";
if (!creativeDetail || !mundaneText.includes(creativeDetail)) {
  throw new Error("Creative realization did not survive into final story text.");
}

for (const prompt of [
  mundanePrompt,
  "Create an absurd luxury spa experience for a billionaire that gets increasingly over the top.",
  "Create a terrifying haunted house experience where every room makes the threat less certain and more dangerous.",
]) {
  const text = storyText(prompt);
  const leaked = ABSTRACT.filter((pattern) => pattern.test(text));
  if (leaked.length) {
    throw new Error(`${prompt}: cognitive significance prose leaked into story: ${leaked.map(String).join(", ")}`);
  }
}

const hauntedState = understandExperience(
  "Create a terrifying haunted house experience where every room makes the threat less certain and more dangerous.",
  {},
);
const hauntedMechanics = mechanicBrief(
  inferExperienceMechanics({
    plan: hauntedState.plan,
    premise: hauntedState.plan.premise,
    prompt: hauntedState.prompt,
  }),
);

for (const mechanic of ["uncertainty", "escalation", "suspense"] as const) {
  if (!hauntedMechanics.includes(mechanic)) {
    throw new Error(`Haunted-house mechanic coverage failed: missing ${mechanic}`);
  }
}

console.log("✓ Super Cog bodyguard invariants passed.");
