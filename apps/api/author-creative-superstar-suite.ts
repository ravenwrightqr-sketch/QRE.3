import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  lens?: string;
};

const cases: Case[] = [
  {
    name: "DOG-MEMORY",
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows", "loves treats"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, affectionate, slightly fierce",
  },
  {
    name: "SERVICE-RECEIPT",
    prompt: "Make a short new-world receipt for today's dog grooming client.",
    subject: "Coco",
    facts: ["Coco", "poodle", "scared at first", "happy after", "hates bows"],
    sourceMoments: ["today's grooming visit"],
    lens: "service receipt with attitude",
  },
  {
    name: "DOG-TAG",
    prompt: "Make this dog tag feel like Coco has a whole world inside it.",
    subject: "Coco",
    facts: ["Coco", "poodle", "dog tag", "living world"],
    sourceMoments: [],
    lens: "mystery, playful, warm",
  },
  {
    name: "REAL-ESTATE",
    prompt: "Make this $50 million Malibu home feel like a living world worth remembering.",
    subject: "Malibu home",
    place: "Malibu, California",
    facts: ["$50 million home", "Malibu", "cliffside", "ocean view", "red door", "family gatherings", "library"],
    sourceMoments: ["family gathered there", "home was restored"],
    lens: "prestige without generic luxury language",
  },
  {
    name: "YACHT",
    prompt: "Make this yacht feel like it has a life of its own.",
    subject: "142-foot yacht",
    facts: ["142 feet", "blue hull", "first voyage 2019", "Mediterranean", "Sardinia", "captain's chair is inherited"],
    sourceMoments: ["voyages through the Mediterranean"],
    lens: "provenance, travel, ownership",
  },
  {
    name: "SKATEBOARD",
    prompt: "Turn this beat-up skateboard into a story people care about.",
    subject: "skateboard",
    facts: ["beat-up skateboard", "scratches", "worn wheels", "first board", "used with friends"],
    sourceMoments: ["learned first tricks on it"],
    lens: "nostalgic, funny, rebellious",
  },
  {
    name: "VINTAGE-WATCH",
    prompt: "Make this vintage watch feel like it remembers something.",
    subject: "vintage watch",
    facts: ["vintage watch", "inherited", "scratched case", "still keeps time"],
    sourceMoments: ["passed down in the family"],
    lens: "provenance, memory, quiet mystery",
  },
  {
    name: "WEDDING",
    prompt: "Make a living wedding memory for Sandy and Jim.",
    subject: "Sandy and Jim",
    place: "Belmont Shore, Long Beach, CA",
    facts: ["Sandy", "Jim", "Friday January 1 2099", "9 PM", "Belmont Shore", "Long Beach, CA", "beach theme"],
    sourceMoments: [],
    lens: "romantic, intimate, nighttime beach",
  },
  {
    name: "HORROR",
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation"],
    sourceMoments: [],
    lens: "calm human behavior while reality breaks: doors slam, glass breaks, knives fly, chairs move to the ceiling",
  },
  {
    name: "CREATOR",
    prompt: "Turn my life as a creator into something people want to follow.",
    facts: [],
    sourceMoments: [],
    lens: "voice, ambition, contradiction, obsession, point of view",
  },
  {
    name: "ARTIFACT",
    prompt: "Make this physical QR wood art feel like it contains a secret.",
    subject: "physical QR wood art",
    facts: ["polished wood", "QR art", "physical object"],
    sourceMoments: [],
    lens: "mystery, portal, tactile discovery",
  },
  {
    name: "WILDCARD",
    prompt: "Take this ordinary object and find the reason someone would keep it forever.",
    subject: "ordinary object",
    facts: [],
    sourceMoments: [],
    lens: "meaning, surprise, identity",
  },
];

for (const test of cases) {
  const started = Date.now();
  const result = await authorCinematicSequence({
    prompt: test.prompt,
    subject: test.subject,
    place: test.place,
    facts: test.facts,
    sourceMoments: test.sourceMoments,
    lens: test.lens,
    memoryContext: [],
    creativeLearningContext: [],
    trajectory: [],
  });

  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);
  console.log("TIME:", ((Date.now() - started) / 1000).toFixed(3), "s");
  console.log("SCENES:", result.length);
  for (const [index, scene] of result.entries()) {
    console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text}`);
  }
}

console.log("\nCREATIVE SUPERSTAR AUTHOR SUITE COMPLETE\n");
