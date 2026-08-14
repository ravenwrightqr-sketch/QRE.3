import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";

type Case = {
  name: string;
  prompt: string;
  lens: string;
  facts: string[];
  sourceMoments: string[];
};

const cases: Case[] = [
  {
    name: "DOG-SERVICE",
    prompt: "Make a short cinematic experience for a dog groomer's client.",
    lens: "funny",
    facts: ["Coco is a poodle", "nervous at first", "loves treats", "a little fierce", "picked up after grooming"],
    sourceMoments: ["today's grooming visit"],
  },
  {
    name: "HOUSEKEEPER",
    prompt: "Turn Maria's cleaning job into a funny quiet battle for control of the house.",
    lens: "comedy",
    facts: ["Maria arrived at 9:04 AM", "bathroom", "living room", "kitchen", "finished at 11:47 AM"],
    sourceMoments: ["one housecleaning visit"],
  },
  {
    name: "CREATOR",
    prompt: "Turn my life as a creator into something people want to follow.",
    lens: "bold",
    facts: ["I make unusual things", "I keep experimenting", "I care about attention"],
    sourceMoments: ["my creative life"],
  },
  {
    name: "SOCIAL",
    prompt: "Make a social sequence people stop scrolling for.",
    lens: "chaotic",
    facts: ["unexpected reveal", "fast energy", "strong personality"],
    sourceMoments: ["one ordinary moment"],
  },
  {
    name: "ARTIST",
    prompt: "Introduce this artist's work like entering another world.",
    lens: "mysterious",
    facts: ["physical artwork", "strong visual language", "the work feels strange and beautiful"],
    sourceMoments: ["gallery viewing"],
  },
  {
    name: "PERSON",
    prompt: "Make a cinematic portrait of me that feels human rather than like a biography.",
    lens: "intimate",
    facts: ["I chase ideas", "I notice details", "I want to build something unusual"],
    sourceMoments: ["an ordinary day"],
  },
  {
    name: "WEDDING-MEMORY",
    prompt: "Make a wedding memory cinematic.",
    lens: "romantic",
    facts: ["beach wedding", "Long Beach, California", "Tower 3", "people we love"],
    sourceMoments: ["the wedding day"],
  },
  {
    name: "ARTIFACT",
    prompt: "Make this physical QR art feel like it contains a secret.",
    lens: "mysterious",
    facts: ["physical wood art", "it scans", "it opens a living experience"],
    sourceMoments: ["someone discovers the object"],
  },
  {
    name: "STORY",
    prompt: "Turn an ordinary hotel room into a slow, unavoidable horror sequence.",
    lens: "horror",
    facts: ["old photograph", "lights flicker", "ordinary hotel room"],
    sourceMoments: ["late at night"],
  },
  {
    name: "WILDCARD",
    prompt: "Take this ordinary thing and make people care about it.",
    lens: "surprising",
    facts: ["ordinary object", "one strange detail", "no other context"],
    sourceMoments: [],
  },
];

for (const test of cases) {
  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);
  console.time(test.name);

  try {
    const scenes = await authorCinematicSequence({
      prompt: test.prompt,
      lens: test.lens,
      subject: "",
      place: "",
      sourceMoments: test.sourceMoments,
      facts: test.facts,
      memoryContext: [],
      creativeLearningContext: [],
      trajectory: [],
    });

    console.timeEnd(test.name);
    console.log("SCENES:", scenes.length);
    scenes.forEach((scene, index) => {
      console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text}`);
    });
  } catch (error) {
    console.timeEnd(test.name);
    console.error("AUTHOR ERROR:", error);
  }
}

console.log("\nUNIVERSAL AUTHOR CEILING SUITE COMPLETE");
