/**
 * ============================================================
 * QRE UNIVERSAL STORY COMPILER — SUBSTRATE ACCEPTANCE
 * ============================================================
 *
 * The universal compiler is tested as a substrate, not as a catalog of
 * subject-specific templates. Cognition supplies semantic direction; the
 * compiler must turn that direction plus prompt evidence into an observable
 * experience.
 *
 * Acceptance invariants:
 *   - preserve prompt substance
 *   - realize the premise instead of replacing it with significance prose
 *   - create actual progression when the premise supports it
 *   - preserve distinctive forces such as humor, suspense, absurdity,
 *     participation, accumulation, process, discovery, and transformation
 *   - remain useful for arbitrary input
 *   - never depend on a noun-specific story branch
 *
 * ============================================================
 */

import { compileStoryExperience } from "../../experience/universalStoryCompiler.js";

type Case = {
  prompt: string;
  anchors?: string[];
  mustNotContain?: string[];
  context?: Parameters<typeof compileStoryExperience>[1];
};

const GENERIC_REALIZATION_PHRASES = [
  "is the thing the experience puts into focus",
  "has become more meaningful through the interaction",
  "something about",
  "deserves a closer look",
  "the experience leaves a meaning behind",
  "the next interaction can change what",
  "giving the moment a direction",
  "lands differently because of everything that happened",
  "what the experience has revealed",
  "continues to develop through the interaction",
];

const cases: Case[] = [
  {
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    anchors: ["Max", "poodle", "groomer"],
    mustNotContain: ["dog's Journey", "journey_world"],
  },
  {
    prompt: "Make something fun for everyone at my wedding tonight.",
    anchors: ["wedding", "fun"],
  },
  {
    prompt: "Turn this concert QR into something people will remember.",
    anchors: ["concert"],
  },
  {
    prompt: "My grandmother gave me this watch.",
    anchors: ["grandmother", "watch"],
  },
  {
    prompt: "Make this boring product launch fun.",
    anchors: ["product", "launch", "fun"],
  },
  {
    prompt: "Surprise me.",
    anchors: ["play"],
  },
  {
    prompt: "asdf 123",
    mustNotContain: ["memory_world", "relationship_world", "dog's Journey"],
  },
  {
    prompt: "Max came back to the same groomer and was even more excited this time.",
    anchors: ["Max", "groomer"],
    context: {
      memories: [
        {
          summary: "Max's earlier grooming visit",
          entities: ["Max", "groomer"],
        },
      ],
    },
  },
  {
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    anchors: ["housekeeper", "home", "cleaning"],
  },
  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    anchors: ["birthday", "funny", "family", "adding"],
  },
  {
    prompt: "Make a genuinely terrifying haunted-house experience.",
    anchors: ["haunted", "terrifying"],
  },
  {
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    anchors: ["spa", "billionaire", "absurd", "luxury"],
  },
  {
    prompt: "Build a playful scavenger hunt where every clue changes the next clue.",
    anchors: ["scavenger", "clue", "next"],
  },
  {
    prompt: "Turn a forgotten family recipe into a story everyone can add to.",
    anchors: ["recipe", "family", "add"],
  },
];

for (const testCase of cases) {
  const result = compileStoryExperience(testCase.prompt, testCase.context);

  const observable = JSON.stringify({
    title: result.title,
    story: result.story,
    observation: result.observation,
    situation: result.situation,
  });
  const normalized = observable.toLowerCase();
  const beats = result.story.beats.map((beat) => beat.text.trim());
  const beatText = beats.join(" ").toLowerCase();

  if (!result.story.title) {
    throw new Error(`Missing title for: ${testCase.prompt}`);
  }

  if (beats.length < 2) {
    throw new Error(`Story is too short for: ${testCase.prompt}`);
  }

  if (result.cinematicScenes.length !== beats.length) {
    throw new Error(`Scene/beat mismatch for: ${testCase.prompt}`);
  }

  if (!result.candidates.length) {
    throw new Error(`No narrative candidates for: ${testCase.prompt}`);
  }

  if (result.candidates[0].score < result.candidates.at(-1)!.score) {
    throw new Error(`Candidates are not ranked for: ${testCase.prompt}`);
  }

  const distinctBeatCount = new Set(beats.map((value) => value.toLowerCase())).size;
  if (distinctBeatCount < Math.min(3, beats.length)) {
    throw new Error(`Narrative beats collapsed into repeated prose for: ${testCase.prompt}`);
  }

  for (const anchor of testCase.anchors ?? []) {
    if (!normalized.includes(anchor.toLowerCase())) {
      throw new Error(`Expected '${anchor}' in compiler result for: ${testCase.prompt}`);
    }
  }

  for (const value of testCase.mustNotContain ?? []) {
    if (normalized.includes(value.toLowerCase())) {
      throw new Error(`Unexpected '${value}' in compiler result for: ${testCase.prompt}`);
    }
  }

  for (const phrase of GENERIC_REALIZATION_PHRASES) {
    if (normalized.includes(phrase.toLowerCase())) {
      throw new Error(
        `Generic realization leaked into compiler result for "${testCase.prompt}": "${phrase}"`,
      );
    }
  }

  // The story itself must carry the premise, not merely metadata.
  const beatAnchors = (testCase.anchors ?? []).filter((anchor) =>
    beatText.includes(anchor.toLowerCase()),
  );
  if ((testCase.anchors?.length ?? 0) > 0 && beatAnchors.length === 0) {
    throw new Error(
      `Prompt substance was not realized inside story beats for: ${testCase.prompt}`,
    );
  }

  console.log(`✓ ${testCase.prompt}`);
  console.log(
    `  ${result.story.title} — ${result.story.beats.map((beat) => beat.kind).join(" → ")}`,
  );
}

console.log("✓ universal any-prompt story compiler substrate acceptance suite passed");
