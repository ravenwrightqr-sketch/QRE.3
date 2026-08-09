/**
 * ============================================================
 * QRE UNIVERSAL STORY COMPILER — SUBSTRATE ACCEPTANCE
 * ============================================================
 *
 * PURPOSE:
 * Protect the universal compiler substrate independently from the
 * cognitive layer.
 *
 * ARCHITECTURE ROLE:
 * The universal compiler does NOT decide what an experience should
 * become. Cognition supplies that direction. This suite verifies that
 * the substrate can reliably turn a prompt/context into a coherent,
 * experience-specific story, candidates, moments, and cinematic scenes.
 *
 * CANONICAL POSITION:
 * COGNITIVE PLAN → UNIVERSAL COMPILER → BLUEPRINT → FLOW → MOMENTS → SCENES
 *
 * TEST RULE:
 * These are runtime/substrate invariants, not template snapshots.
 *
 * The compiler must:
 * 1. Preserve the substance of the prompt.
 * 2. Realize an experiential hook rather than abstracting it away.
 * 3. Produce progression or transformation where the premise supports it.
 * 4. Avoid generic "meaningful experience" language as a substitute for
 *    actual realization.
 * 5. Preserve the character of the premise — funny, strange, luxurious,
 *    frightening, sentimental, absurd, practical, etc.
 * 6. Remain capable of accepting arbitrary prompts without collapsing into
 *    a fixed narrative template.
 *
 * ============================================================
 */

import { compileStoryExperience } from "../../experience/universalStoryCompiler.js";

type Case = {
  prompt: string;
  mustContain?: string[];
  mustNotContain?: string[];
  context?: Parameters<typeof compileStoryExperience>[1];
  premise?: "dog_grooming" | "cleaning" | "birthday_memory" | "horror" | "luxury";
};

const GENERIC_REALIZATION_PHRASES = [
  "is the thing the experience puts into focus",
  "has become more meaningful through the interaction",
  "something about",
  "deserves a closer look",
  "the experience leaves a meaning behind",
  "the next interaction can change what",
];

const cases: Case[] = [
  {
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    mustContain: ["Max", "poodle", "groomer"],
    mustNotContain: ["dog's Journey", "journey_world"],
    premise: "dog_grooming",
  },
  {
    prompt: "Make something fun for everyone at my wedding tonight.",
    mustContain: ["wedding", "fun"],
  },
  {
    prompt: "Turn this concert QR into something people will remember.",
    mustContain: ["concert"],
  },
  {
    prompt: "My grandmother gave me this watch.",
    mustContain: ["grandmother", "watch"],
  },
  {
    prompt: "Make this boring product launch fun.",
    mustContain: ["product", "launch", "fun"],
  },
  {
    prompt: "Surprise me.",
    mustContain: ["play"],
  },
  {
    prompt: "asdf 123",
    mustContain: [],
    mustNotContain: ["memory_world", "relationship_world", "dog's Journey"],
  },
  {
    prompt: "Max came back to the same groomer and was even more excited this time.",
    context: {
      memories: [
        {
          summary: "Max's earlier grooming visit",
          entities: ["Max", "groomer"],
        },
      ],
    },
    mustContain: ["Max", "groomer", "memory"],
  },
  {
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    mustContain: ["housekeeper", "home", "cleaning"],
    premise: "cleaning",
  },
  {
    prompt: "Create a funny birthday memory that family members can keep adding to.",
    mustContain: ["birthday", "funny"],
    premise: "birthday_memory",
  },
  {
    prompt: "Make a genuinely terrifying haunted-house experience.",
    mustContain: ["haunted"],
    premise: "horror",
  },
  {
    prompt: "Create an absurd luxury spa experience for a billionaire.",
    mustContain: ["spa", "billionaire"],
    premise: "luxury",
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
  const beats = result.story.beats.map((beat) => beat.text).join(" ").toLowerCase();

  if (!result.story.title) {
    throw new Error(`Missing title for: ${testCase.prompt}`);
  }

  if (result.story.beats.length < 2) {
    throw new Error(`Story is too short for: ${testCase.prompt}`);
  }

  if (result.cinematicScenes.length !== result.story.beats.length) {
    throw new Error(`Scene/beat mismatch for: ${testCase.prompt}`);
  }

  if (!result.candidates.length) {
    throw new Error(`No narrative candidates for: ${testCase.prompt}`);
  }

  if (result.candidates[0].score < result.candidates.at(-1)!.score) {
    throw new Error(`Candidates are not ranked for: ${testCase.prompt}`);
  }

  for (const value of testCase.mustContain ?? []) {
    if (!normalized.includes(value.toLowerCase())) {
      throw new Error(`Expected '${value}' in compiler result for: ${testCase.prompt}`);
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

  const premiseChecks: Record<NonNullable<Case["premise"]>, RegExp> = {
    dog_grooming: /spa|bubble|pamper|foot|bow|fluffy|celebrity|suspicious|groom/i,
    cleaning: /room|chaos|forgotten|home|clean|transform|reveal/i,
    birthday_memory: /family|story|legend|version|add|joke|folklore|retell/i,
    horror: /dark|wrong|fear|worse|danger|quiet|terrible|threat|haunt/i,
    luxury: /luxury|excess|ridiculous|pamper|opulent|absurd|escalat|spa/i,
  };

  if (testCase.premise && !premiseChecks[testCase.premise].test(beats)) {
    throw new Error(
      `Premise was not actually realized for "${testCase.prompt}". Beats: ${beats}`,
    );
  }

  console.log(`✓ ${testCase.prompt}`);
  console.log(
    `  ${result.story.title} — ${result.story.beats.map((beat) => beat.kind).join(" → ")}`,
  );
}

console.log("✓ universal any-prompt story compiler substrate acceptance suite passed");
