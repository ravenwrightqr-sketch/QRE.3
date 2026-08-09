import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

/**
 * Premise realization acceptance.
 *
 * These cases intentionally cross subject, medium, audience, emotion, and
 * behavior so the compiler cannot pass by selecting a familiar noun.
 */

type Case = {
  prompt: string;
  anchors: string[];
};

const cases: Case[] = [
  {
    prompt: "Turn this concert QR into something people will remember.",
    anchors: ["concert", "qr", "remember"],
  },
  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    anchors: ["birthday", "funny", "family", "adding"],
  },
  {
    prompt: "Build a playful scavenger hunt where every clue changes the next clue.",
    anchors: ["scavenger", "clue", "next"],
  },
  {
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    anchors: ["housekeeper", "home", "cleaning"],
  },
  {
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    anchors: ["spa", "luxury", "billionaire"],
  },
  {
    prompt: "Make a genuinely terrifying haunted-house experience.",
    anchors: ["terrifying", "haunted"],
  },
  {
    prompt: "Turn a forgotten family recipe into a story everyone can add to.",
    anchors: ["recipe", "family", "add"],
  },
  {
    prompt: "Make an interactive museum label for a broken robot from 2087.",
    anchors: ["museum", "robot", "2087"],
  },
];

const legacy = [
  "puts into focus",
  "deserves a closer look",
  "giving the moment a direction",
  "the experience leaves a meaning behind",
  "continues to develop through the interaction",
];

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const beats = result.story.beats.map((beat) => beat.text.trim()).filter(Boolean);
  const storyText = beats.join(" ").toLowerCase();

  if (beats.length < 2) {
    throw new Error(`Too few beats: ${testCase.prompt}`);
  }

  if (new Set(beats.map((beat) => beat.toLowerCase())).size < Math.min(3, beats.length)) {
    throw new Error(`Beat realization collapsed: ${testCase.prompt}`);
  }

  for (const anchor of testCase.anchors) {
    if (!storyText.includes(anchor.toLowerCase())) {
      throw new Error(`Prompt evidence '${anchor}' disappeared from beats: ${testCase.prompt}`);
    }
  }

  for (const phrase of legacy) {
    if (storyText.includes(phrase)) {
      throw new Error(`Legacy generic realization leaked: '${phrase}' for ${testCase.prompt}`);
    }
  }

  console.log(`✓ ${testCase.prompt}`);
}

console.log("✓ semantic premise realization acceptance passed");
