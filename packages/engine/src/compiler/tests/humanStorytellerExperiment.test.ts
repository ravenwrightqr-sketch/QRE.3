import { formatHumanStory } from "../../experience/humanStorytellerExperiment.js";

const prompts = [
  "Coco walked into the groomers ready to call her lawyer. Bubbles and foot rubs made it a little better. Chewed a few bows up after shaking them off my head. Walked out ready to paint the town red.",
  "A housekeeper just finished cleaning a client's house after a huge day.",
  "Make a funny birthday memory that the family can keep adding to.",
  "Turn this concert QR into something people will actually remember.",
  "Make this boring product launch fun.",
  "My grandmother gave me this watch.",
];

for (const prompt of prompts) {
  console.log("\n========================================");
  console.log(prompt);
  console.log("========================================");
  console.log(formatHumanStory(prompt));
}
