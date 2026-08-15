import { authorMicroBeats } from "./src/services/microBeatMouth.js";

const cases = {
  COCO: {
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first", "happy after"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, affectionate, slightly fierce",
  },
  "COCO-RETURN": {
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first"],
    sourceMoments: ["bath was faster today", "pink bow offered again", "Coco walked out proud"],
    lens: "callback comedy",
    round: 2,
    presence: { visitNumber: 2, isReturning: true, summary: ["returning visit"], places: ["groomer"], firstSeenAt: null, lastSeenAt: null },
  },
  MARIA: {
    prompt: "Make a short new-world receipt for Maria's cleaning visit.",
    facts: ["Maria arrived at 9:04 AM", "bathrooms", "kitchen", "laundry", "finished at 11:47 AM"],
    sourceMoments: ["one cleaning visit"],
    lens: "service receipt with attitude",
  },
  HORROR: {
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation", "doors slam", "glass breaks", "knives fly past us"],
    sourceMoments: ["everyone continued discussing the day prior"],
    lens: "calm human behavior while reality breaks",
  },
  RAVE: {
    prompt: "Make this rave attendance feel like a living memory.",
    facts: ["rave", "friends dancing", "bass", "late night", "we stayed"],
    sourceMoments: ["attendance at the event"],
    lens: "specific, kinetic, memorable",
    presence: { visitNumber: 1, isReturning: false, summary: ["presence at rave"], places: ["event venue"], firstSeenAt: null, lastSeenAt: null },
  },
} as const;

type CaseName = keyof typeof cases;
const requested = (process.argv[2] || process.env.QRE_AUTHOR_CASE || "COCO").toUpperCase() as CaseName;
const test = cases[requested];

if (!test) {
  console.error(`Unknown case: ${requested}`);
  console.error(`Use one of: ${Object.keys(cases).join(", ")}`);
  process.exit(1);
}

process.env.QRE_AUTHOR_FAST = "true";
const started = Date.now();
console.log("=".repeat(80));
console.log(`QRE AUTHOR FAST · ${requested}`);
console.log("ONE REAL OLLAMA GENERATION · NO REPAIR RETRY");
console.log("=".repeat(80));

try {
  const beats = await authorMicroBeats(test);
  console.log(`TIME: ${((Date.now() - started) / 1000).toFixed(3)}s`);
  console.log(`BEATS: ${beats.length}`);
  beats.forEach((beat, index) => console.log(`[${index + 1}] ${beat.kind} · ${beat.text}`));
} catch (error) {
  console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
