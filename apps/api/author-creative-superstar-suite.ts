import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";
import { strategyContext } from "./src/services/creativeStrategyLibrary.js";

type Case = {
  name: string;
  prompt: string;
  lens?: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments?: string[];
  strategies: string[];
};

const cases: Case[] = [
  {
    name: "COCO-CLIENT-CHAPTER",
    prompt: "Make the next short story for this dog grooming client.",
    lens: "funny, affectionate, a little fierce",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows", "visit 2", "pink bow today"],
    sourceMoments: ["Coco returned for another grooming visit.", "The pink bow came back into the story."],
    strategies: ["character_status", "recurring_client_chapter"],
  },
  {
    name: "SERVICE-RECEIPT",
    prompt: "Turn this completed service into a short cinematic receipt for the client.",
    lens: "witty, specific, not salesy",
    facts: ["dog grooming service", "bath", "trim", "client left happy"],
    strategies: ["ordinary_to_important", "character_status"],
  },
  {
    name: "DOG-TAG",
    prompt: "Make this dog tag feel like it holds a living world.",
    subject: "Coco's dog tag",
    facts: ["engraved dog tag", "belongs to Coco", "physical QR artwork"],
    strategies: ["artifact_portal", "character_status"],
  },
  {
    name: "REAL-ESTATE-HIGH-VALUE",
    prompt: "Make this home feel worth remembering without turning it into luxury ad copy.",
    place: "Malibu, California",
    facts: ["$50 million home", "ocean view", "restored by the owner", "favorite room is the library", "red front door"],
    strategies: ["high_value_provenance", "ordinary_to_important"],
  },
  {
    name: "VINTAGE-OBJECT",
    prompt: "Make this vintage watch feel alive without inventing its provenance.",
    facts: ["vintage mechanical watch", "worn for decades", "scratched case", "still keeps time"],
    strategies: ["vintage_vs_new", "high_value_provenance"],
  },
  {
    name: "SKATEBOARD",
    prompt: "Make this skateboard feel like it has a story worth following.",
    facts: ["old skateboard", "scratched deck", "used at the same neighborhood skate spot for years"],
    strategies: ["ordinary_to_important", "vintage_vs_new"],
  },
  {
    name: "WEDDING-NIGHT",
    prompt: "Make a living wedding memory cinematic.",
    subject: "Sandy and Jim",
    place: "Belmont Shore, Long Beach, CA",
    facts: ["Sandy and Jim", "Friday, January 1, 2099", "9 PM", "Belmont Shore", "Long Beach, CA", "beach theme"],
    strategies: ["night_affordance", "relationship_texture"],
  },
  {
    name: "HORROR-CALM-BREAK",
    prompt: "Turn an ordinary dinner into slow, unavoidable horror while everyone keeps talking normally.",
    facts: ["friends talking over wine", "ordinary dinner", "doors", "glassware", "knives", "chairs"],
    sourceMoments: ["They continue discussing the previous day while impossible things happen around them."],
    strategies: ["calm_reality_break"],
  },
  {
    name: "CREATOR-SPARSE",
    prompt: "Turn my life as a creator into something people want to follow.",
    strategies: ["stop_scroll"],
    facts: [],
  },
  {
    name: "ARTIST-SPARSE",
    prompt: "Introduce this artist's work like entering another world.",
    strategies: ["artist_threshold"],
    facts: [],
  },
  {
    name: "YACHT",
    prompt: "Make this yacht feel like a living object people would want to remember.",
    facts: ["142-foot yacht", "blue hull", "first voyage 2019", "Mediterranean", "owner loves Sardinia", "captain's chair was inherited"],
    strategies: ["high_value_provenance", "vintage_vs_new"],
  },
  {
    name: "WILDCARD",
    prompt: "Take this ordinary thing and make people care about it.",
    facts: ["a battered metal key", "found in an old tool box", "still works"],
    strategies: ["ordinary_to_important", "vintage_vs_new"],
  },
];

process.env.QRE_AI_ENABLED = "true";
process.env.QRE_EXTERNAL_AI_ENABLED = "false";

for (const item of cases) {
  const scenes = await authorCinematicSequence({
    prompt: item.prompt,
    lens: item.lens,
    subject: item.subject,
    place: item.place,
    facts: item.facts,
    sourceMoments: item.sourceMoments ?? [],
    memoryContext: [],
    creativeLearningContext: strategyContext(item.strategies),
  });

  console.log(`\n${"=".repeat(100)}`);
  console.log(item.name);
  console.log(`PROMPT: ${item.prompt}`);
  console.log(`SCENES: ${scenes.length}`);
  for (const [index, scene] of scenes.entries()) {
    console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text}`);
  }
}

console.log(`\n${"=".repeat(100)}\nCREATIVE SUPERSTAR STRATEGY SUITE COMPLETE\n`);
