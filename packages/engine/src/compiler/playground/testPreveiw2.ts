import { compileExperience } from "../index.js";

const prompts = [
  "Create a dog groomer story for Max the poodle",
  "A wedding where two people have been together for 20 years",
  "Make a fun experience for a kid visiting a science museum",
  "Turn this old guitar into a story about the person who owned it",
  "Create something memorable for a restaurant opening tonight",
  "A birthday surprise for my sister who loves astronomy",
  "Make an experience from this photograph",
  "Tell the story of a house that has had five families",
  "Create a mysterious experience for someone finding an old key",
  "Make a fun event experience for people arriving at a festival",
];

for (const prompt of prompts) {
  console.log("\n\n========================================");
  console.log("PROMPT:", prompt);
  console.log("========================================");

  const result = compileExperience(prompt);

  console.dir(
    {
      title: result.title,
      narrative: result.narrative,
      experienceMoments: result.experienceMoments,
      cinematicScenes: result.cinematicScenes,
    },
    { depth: null }
  );
}