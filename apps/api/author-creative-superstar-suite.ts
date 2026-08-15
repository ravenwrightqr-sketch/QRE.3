/// <reference types="node" />

import { authorCinematicSequence } from "./src/services/cinematicAuthor.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";

type Case = {
  name: string;
  prompt: string;
  subject?: string;
  place?: string;
  facts: string[];
  sourceMoments: string[];
  lens?: string;
  creativeLearningContext?: string[];
  round?: number;
};

function assertRuntime(): void {
  if (process.env.QRE_AI_ENABLED !== "true") {
    throw new Error("AUTHOR BENCHMARK NOT RUN: QRE_AI_ENABLED is not true.");
  }
}

const cases: Case[] = [
  {
    name: "DOG-MEMORY",
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows", "loves treats"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, affectionate, slightly fierce; treat Coco as a character, not a generic cute dog",
    creativeLearningContext: [
      "Use personality contrast and status shifts.",
      "Look for negotiation, attitude, recurring quirks, and a memorable payoff.",
      "Do not default to nervous -> comfort -> happy pet-commercial progression.",
    ],
    round: 1,
  },
  {
    name: "DOG-VISIT-2",
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    facts: ["Coco", "poodle", "sweet", "scared at first", "happy after", "hates bows"],
    sourceMoments: ["today Coco tolerated the bath faster", "pink bow was offered again", "Coco walked out proud"],
    lens: "recurring character comedy; chapter two should build on history rather than restart",
    creativeLearningContext: [
      "Permanent identity and historical quirks are callbacks, not fresh exposition.",
      "Today's details should become the new movement and payoff.",
    ],
    round: 2,
  },
  {
    name: "DOG-SERVICE",
    prompt: "Make a short new-world service receipt for today's dog grooming client.",
    subject: "Coco",
    facts: ["Coco", "poodle", "scared at first", "happy after", "hates bows"],
    sourceMoments: ["today's grooming visit", "Coco tried to avoid the pink bow"],
    lens: "service receipt with attitude; celebrate the client without sounding like an advertisement",
    creativeLearningContext: [
      "Make the ordinary service feel specific through personality.",
      "The finished service is the factual anchor; humor comes from the character.",
    ],
    round: 1,
  },
  {
    name: "BOBO-DOG",
    prompt: "Make Bobo's first grooming experience feel like the start of his world.",
    subject: "Bobo",
    facts: ["Bobo", "bulldog", "runs in", "kisses everyone", "scared in water", "happy after", "loves balls"],
    sourceMoments: ["first grooming visit"],
    lens: "high-energy character comedy; do not make Bobo behave like Coco",
    creativeLearningContext: [
      "Use the strongest contradiction: fearless entrance versus water fear.",
      "Love of balls is a character engine and possible payoff object.",
    ],
    round: 1,
  },
  {
    name: "DOG-TAG",
    prompt: "Make this dog tag feel like Coco has a whole world inside it.",
    subject: "Coco dog tag",
    facts: ["dog tag", "Coco", "poodle", "living world"],
    sourceMoments: [],
    lens: "mystery, playful, warm; physical object as doorway",
    creativeLearningContext: [
      "Object-to-world transition.",
      "The artifact can feel mysterious without claiming unsupported physical mechanics.",
    ],
    round: 1,
  },
  {
    name: "SERVICE-RECEIPT-GENERIC",
    prompt: "Make a short new-world receipt for today's service client.",
    facts: ["completed service", "client identity exists", "one memorable detail from today"],
    sourceMoments: ["today's appointment"],
    lens: "universal service receipt; warm, specific, clever, never corporate",
    creativeLearningContext: [
      "Works for groomers, barbers, salons, mechanics, cleaners, tattoo artists, detailers, and contractors.",
      "Do not invent a specific service outcome not supplied.",
    ],
    round: 1,
  },
  {
    name: "REAL-ESTATE",
    prompt: "Make this $50 million Malibu home feel like a living world worth remembering.",
    subject: "Malibu home",
    place: "Malibu, California",
    facts: ["$50 million home", "Malibu", "cliffside", "ocean view", "red door", "family gatherings", "library"],
    sourceMoments: ["family gathered there", "home was restored"],
    lens: "prestige without generic luxury language; history and ownership matter more than price",
    creativeLearningContext: [
      "Price is context, not the story.",
      "Find meaning in provenance, place, architecture, ritual, and memory.",
      "Avoid luxury-cliche vocabulary.",
    ],
    round: 1,
  },
  {
    name: "YACHT",
    prompt: "Make this yacht feel like it has a life of its own.",
    subject: "142-foot yacht",
    facts: ["142 feet", "blue hull", "first voyage 2019", "Mediterranean", "Sardinia", "captain's chair is inherited"],
    sourceMoments: ["voyages through the Mediterranean"],
    lens: "provenance, travel, ownership; object with history rather than brochure copy",
    creativeLearningContext: [
      "Use the inherited chair as the strongest human anchor.",
      "Let geography and voyages create motion.",
      "Do not reduce value to wealth.",
    ],
    round: 1,
  },
  {
    name: "SKATEBOARD",
    prompt: "Turn this beat-up skateboard into a story people care about.",
    subject: "skateboard",
    facts: ["beat-up skateboard", "scratches", "worn wheels", "first board", "used with friends"],
    sourceMoments: ["learned first tricks on it"],
    lens: "nostalgic, funny, rebellious; scars are evidence of a life",
    creativeLearningContext: ["Prefer provenance and lived use over object-description.", "Find what the damage means."],
    round: 1,
  },
  {
    name: "VINTAGE-WATCH",
    prompt: "Make this vintage watch feel like it remembers something.",
    subject: "vintage watch",
    facts: ["vintage watch", "inherited", "scratched case", "still keeps time"],
    sourceMoments: ["passed down in the family"],
    lens: "provenance, memory, quiet mystery",
    creativeLearningContext: [
      "Use the scratches and inheritance as narrative evidence.",
      "Make time itself part of the metaphor without inventing who owned it before.",
    ],
    round: 1,
  },
  {
    name: "VINTAGE-CAR",
    prompt: "Make this old car feel like it has more history than its paint can show.",
    subject: "vintage car",
    facts: ["1970s car", "faded paint", "kept in the family", "still driven on Sundays"],
    sourceMoments: ["family Sunday drives"],
    lens: "nostalgia, motion, provenance, family ritual",
    creativeLearningContext: ["Use recurring ritual and visible wear as anchors."],
    round: 1,
  },
  {
    name: "NEW-OBJECT",
    prompt: "Make this brand-new object feel like the beginning of something.",
    subject: "new object",
    facts: ["brand new", "first day of ownership", "still pristine"],
    sourceMoments: ["first use"],
    lens: "anticipation and possibility; newness should feel like an open chapter",
    creativeLearningContext: ["Do not invent the owner's future. Make possibility itself the creative material."],
    round: 1,
  },
  {
    name: "WEDDING",
    prompt: "Make a living wedding memory for Sandy and Jim.",
    subject: "Sandy and Jim",
    place: "Belmont Shore, Long Beach, CA",
    facts: ["Sandy", "Jim", "Friday January 1 2099", "9 PM", "Belmont Shore", "Long Beach, CA", "beach theme"],
    sourceMoments: [],
    lens: "romantic, intimate, nighttime beach; moonlight and shoreline reality should matter",
    creativeLearningContext: [
      "9 PM means night; exploit night affordances such as moonlight, reflected water, tide, shoreline lights, and night air.",
      "Do not invent sunrise, sunset, altar, crowd, vows, gown, or other wedding events unless supplied.",
    ],
    round: 1,
  },
  {
    name: "RELATIONSHIP",
    prompt: "Make a living relationship memory from a few things that only we would recognize.",
    subject: "relationship",
    facts: ["inside joke", "favorite late-night drive", "one song", "one place we return to"],
    sourceMoments: ["a quiet night together"],
    lens: "intimate, specific, understated; shared meaning over grand declarations",
    creativeLearningContext: ["Favor small private details that gain meaning through repetition."],
    round: 1,
  },
  {
    name: "HORROR-CALM",
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation"],
    sourceMoments: [],
    lens: "calm human behavior while reality breaks",
    creativeLearningContext: [
      "Start ordinary.",
      "Choose one impossible environmental violation and escalate it.",
      "Doors slam, glass breaks, knives fly, chairs move to the ceiling while conversation continues.",
      "Prefer spatial contradiction and calm reactions over ghosts and generic gothic imagery.",
    ],
    round: 1,
  },
  {
    name: "CREATOR",
    prompt: "Turn my life as a creator into something people want to follow.",
    facts: ["I make unusual things", "I keep experimenting", "I care about attention"],
    sourceMoments: ["my creative life"],
    lens: "voice, ambition, contradiction, obsession, point of view",
    creativeLearningContext: [
      "Do not invent an audience, career history, awards, failures, or future success.",
      "Build from the supplied creative identity and the tension of making unusual things.",
    ],
    round: 1,
  },
  {
    name: "ARTIST",
    prompt: "Introduce this artist's work like entering another world.",
    subject: "artist's work",
    facts: ["physical artwork", "strong visual language", "the work feels strange and beautiful"],
    sourceMoments: ["gallery viewing"],
    lens: "mysterious threshold; original visual world rather than stock fantasy gallery language",
    creativeLearningContext: [
      "Use material, texture, signature, and viewer perspective.",
      "Avoid defaulting to gallery-as-portal cliches unless the artwork supports it.",
    ],
    round: 1,
  },
  {
    name: "ARTIFACT",
    prompt: "Make this physical QR wood art feel like it contains a secret.",
    subject: "physical QR wood art",
    facts: ["polished wood", "QR art", "physical object"],
    sourceMoments: ["someone discovers the object"],
    lens: "mystery, tactile discovery, portal",
    creativeLearningContext: [
      "Treat the object as a doorway into a living digital world.",
      "Concept mode may use impossible imagery, but grounded mode must not claim the wood physically opens or vibrates unless supplied.",
    ],
    round: 1,
  },
  {
    name: "DOG-TAG-ARTEFACT",
    prompt: "Make this dog tag feel like a tiny doorway into a life.",
    subject: "dog tag",
    facts: ["metal tag", "pet identity", "scans to a living world"],
    sourceMoments: [],
    lens: "small object, enormous meaning",
    creativeLearningContext: ["Scale contrast: tiny physical artifact, large emotional world."],
    round: 1,
  },
  {
    name: "WILDCARD",
    prompt: "Take this ordinary object and find the reason someone would keep it forever.",
    subject: "ordinary object",
    facts: [],
    sourceMoments: [],
    lens: "meaning, surprise, identity",
    creativeLearningContext: [
      "Do not invent a biography for the owner.",
      "Invent a compelling conceptual question or visual transformation around why ordinary things can matter.",
    ],
    round: 1,
  },
];

assertRuntime();

let failures = 0;

for (const test of cases) {
  const started = Date.now();
  console.log("\n" + "=".repeat(100));
  console.log(test.name);
  console.log("PROMPT:", test.prompt);

  try {
    const cognition = buildAuthorCognitivePlan({
      prompt: test.prompt,
      subject: test.subject,
      place: test.place,
      lens: test.lens,
      facts: test.facts,
      sourceMoments: test.sourceMoments,
      memoryContext: [],
      round: test.round,
    });

    const rhythmRule = cognition.sceneRules.find((rule) => rule.includes("JOLT")) ?? "JOLT → JOLT → JOLT → PAYOFF";

    console.log("ATTENTION:", cognition.chosenAttentionStrategy);
    console.log("CONTRADICTIONS:", cognition.contradictions.join(" | ") || "none");
    console.log("OPERATORS:", cognition.operatorMix.join(", "));
    console.log("RHYTHM:", rhythmRule);

    const learningContext = [
      ...(test.creativeLearningContext ?? []),
      ...cognition.authorBrief,
      ...cognition.antiRepetitionRules,
      ...cognition.sceneRules,
      `ATTENTION RHYTHM: ${rhythmRule}`,
    ];

    const result = await authorCinematicSequence({
      prompt: test.prompt,
      subject: test.subject ?? "",
      place: test.place ?? "",
      facts: test.facts,
      sourceMoments: test.sourceMoments,
      lens: test.lens,
      memoryContext: cognition.permanentTruths,
      creativeLearningContext: learningContext,
      trajectory: [cognition.chosenAttentionStrategy, ...cognition.operatorMix, ...cognition.callbackTargets],
    });

    console.log("TIME:", ((Date.now() - started) / 1000).toFixed(3), "s");
    console.log("SCENES:", result.length);

    if (result.length < 3) {
      failures += 1;
      console.error("FAIL: fewer than 3 scenes returned.");
    }

    for (const [index, scene] of result.entries()) {
      console.log(`[${index + 1}] ${scene.kind ?? "scene"} · ${scene.text}`);
    }
  } catch (error) {
    failures += 1;
    console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  }
}

console.log("\n" + "=".repeat(100));
console.log("CREATIVE SUPERSTAR AUTHOR SUITE COMPLETE");
console.log("FAILURES:", failures);

if (failures > 0) {
  process.exitCode = 1;
}
