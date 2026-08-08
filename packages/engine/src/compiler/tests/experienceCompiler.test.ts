import { compileStoryExperience } from "../../experience/storyCompiler.js";

const cases = [
  "Create a dog groomer story for Max the poodle about the experience.",
  "Make something fun for everyone at my wedding tonight.",
  "Turn this concert QR into something people will remember.",
  "My grandmother gave me this watch.",
  "Make this boring product launch fun.",
  "Surprise me.",
  "asdf 123",
];

for (const prompt of cases) {
  const result = compileStoryExperience(prompt);

  if (!result.story.title) throw new Error(`Missing title for: ${prompt}`);
  if (!result.story.beats.length) throw new Error(`Missing beats for: ${prompt}`);
  if (!result.cinematicScenes.length) throw new Error(`Missing scenes for: ${prompt}`);

  console.log(`✓ ${prompt}`);
  console.log(`  title: ${result.story.title}`);
  console.log(`  beats: ${result.story.beats.length}`);
}

console.log("✓ any-prompt story compiler smoke tests passed");
