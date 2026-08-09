/**
 * ============================================================
 * QRE UNIVERSAL STORY COMPILER — SUBSTRATE ACCEPTANCE
 * ============================================================
 *
 * PURPOSE:
 *   Protect the universal compiler substrate independently from the
 *   cognitive layer.
 *
 * ARCHITECTURE ROLE:
 *   The universal compiler does NOT decide what an experience should
 *   become. Cognition supplies that direction. This suite verifies that
 *   the substrate can reliably turn a prompt/context into a coherent
 *   story, candidates, moments, and cinematic scenes.
 *
 * CANONICAL POSITION:
 *   COGNITIVE PLAN → UNIVERSAL COMPILER → BLUEPRINT → FLOW → MOMENTS → SCENES
 *
 * TEST RULE:
 *   These are runtime/substrate invariants, not cognitive intelligence
 *   assertions. Do not turn this file into a template snapshot suite.
 *
 * ============================================================
 */

import { compileStoryExperience } from "../../experience/universalStoryCompiler.js";

type Case = {
  prompt: string;
  mustContain?: string[];
  mustNotContain?: string[];
  context?: Parameters<typeof compileStoryExperience>[1];
};

const cases: Case[] = [
  {
    prompt: "Create a dog groomer story for Max the poodle about the experience.",
    mustContain: ["max", "poodle"],
    mustNotContain: ["dog's journey", "journey_world"],
  },
  {
    prompt: "Make something fun for everyone at my wedding tonight.",
    mustContain: ["shared"],
  },
  {
    prompt: "Turn this concert QR into something people will remember.",
    mustContain: ["event", "media"],
  },
  {
    prompt: "My grandmother gave me this watch.",
    mustContain: ["memory", "watch"],
  },
  {
    prompt: "Make this boring product launch fun.",
    mustContain: ["work", "play"],
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
    mustContain: ["memory"],
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

  if (!result.story.title) throw new Error(`Missing title for: ${testCase.prompt}`);
  if (result.story.beats.length < 2) throw new Error(`Story is too short for: ${testCase.prompt}`);
  if (result.cinematicScenes.length !== result.story.beats.length) throw new Error(`Scene/beat mismatch for: ${testCase.prompt}`);
  if (!result.candidates.length) throw new Error(`No narrative candidates for: ${testCase.prompt}`);
  if (result.candidates[0].score < result.candidates.at(-1)!.score) throw new Error(`Candidates are not ranked for: ${testCase.prompt}`);

  for (const value of testCase.mustContain ?? []) {
    if (!observable.toLowerCase().includes(value.toLowerCase())) {
      throw new Error(`Expected '${value}' in compiler result for: ${testCase.prompt}`);
    }
  }
  for (const value of testCase.mustNotContain ?? []) {
    if (observable.toLowerCase().includes(value.toLowerCase())) {
      throw new Error(`Unexpected '${value}' in compiler result for: ${testCase.prompt}`);
    }
  }

  console.log(`✓ ${testCase.prompt}`);
  console.log(`  ${result.story.title} — ${result.story.beats.map((beat) => beat.kind).join(" → ")}`);
}

console.log("✓ universal any-prompt story compiler substrate acceptance suite passed");
