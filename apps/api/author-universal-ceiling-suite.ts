import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";

const cases = [
  ["SERVICE", "Make a video for my house cleaning clients.", ["Maria", "9:04 AM", "kitchen", "bathroom", "11:47 AM"]],
  ["CREATOR", "Turn my creator life into a cinematic social intro.", ["late nights", "camera", "coffee", "editing", "posting"]],
  ["SOCIAL", "Make a short social sequence about finally leaving a bad summer behind.", ["summer", "car", "last night", "new beginning"]],
  ["ARTIST", "Make an artist teaser that feels like the gallery is waking up.", ["painting", "red", "studio", "gallery", "first show"]],
  ["PERSON", "Make a cinematic introduction to me without sounding like a biography.", ["curious", "restless", "music", "late nights", "building things"]],
  ["MEMORY", "Turn our Long Beach beach wedding into a memory people want to relive.", ["Long Beach", "Tower 3", "beach", "wedding", "vows"]],
  ["EVENT", "Make tonight's birthday feel like the night everyone will talk about tomorrow.", ["birthday", "friends", "cake", "music", "midnight"]],
  ["ARTIFACT", "Make this handmade QR art piece feel like it contains a secret world.", ["wood", "QR art", "handmade", "scan", "hidden world"]],
  ["STORY", "Make an ordinary hotel hallway become a slow, strange horror sequence.", ["hotel", "hallway", "old light", "door", "silence"]],
  ["WILDCARD", "Make something unforgettable from a Tuesday afternoon, a blue umbrella, and a missed train.", ["Tuesday", "blue umbrella", "missed train"]],
] as const;

for (const [label, prompt, facts] of cases) {
  console.log("\n" + "=".repeat(92));
  console.log(`${label}: ${prompt}`);
  console.time(label);
  try {
    const scenes = await authorCinematicSequence({
      prompt,
      lens: "creative",
      subject: "",
      place: "",
      sourceMoments: [prompt],
      facts: [...facts],
      memoryContext: [],
      creativeLearningContext: [],
      trajectory: [],
    });
    console.timeEnd(label);
    console.log("SCENES:", scenes.length);
    scenes.forEach((scene, index) => {
      console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text}`);
    });
  } catch (error) {
    console.timeEnd(label);
    console.error("AUTHOR ERROR:", error);
  }
}
