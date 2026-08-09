/**
 * =============================================================
 * QRE SUPER COG — SUBJECT-NATIVE REALIZATION TEST
 * =============================================================
 */

import {
  compileCognitiveExperience,
} from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "Create a memorial for my grandmother",
  "Make a QR experience for a nightclub",
  "Teach someone how to make sourdough",
  "Create a treasure hunt for kids",
  "A luxury watch brand wants something mysterious",
  "Create something completely weird involving aliens and a gas station",
  "Make my surfboard feel like it has traveled more than I have",
  "I run a tattoo shop but I don't want another boring loyalty program",
];

const FORBIDDEN_REALIZATION_PATTERNS = [
  /\bCompletely enters the frame\b/i,
  /\bmake .+ matter through\b/i,
  /\bthe experience puts? into focus\b/i,
  /\bthe subject now means more\b/i,
  /\bthe thing the experience\b/i,
  /\bQRE Experience\b/i,
];

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);
  const direction = result.cognition.selectedHypothesis.kind;

  if (result.cognition.plan.direction !== direction) {
    throw new Error(`Cognitive direction drift for '${prompt}'.`);
  }

  if (result.moments.length !== result.story.beats.length) {
    throw new Error(`Moment/beat count drift for '${prompt}'.`);
  }

  for (const beat of result.story.beats) {
    for (const pattern of FORBIDDEN_REALIZATION_PATTERNS) {
      if (pattern.test(beat.text)) {
        throw new Error(`Legacy/generic realization leaked into '${prompt}': ${beat.text}`);
      }
    }
  }
}

console.log("SUPER COG SUBJECT-NATIVE REALIZATION: PASS");
