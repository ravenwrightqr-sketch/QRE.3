import { authorFast } from "./src/services/authorFastCore.js";

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
    trajectory: ["Chapter 1: Coco resisted the bow and left happy."],
  },
  MARIA: {
    prompt: "Make a short new-world receipt for Maria's cleaning visit.",
    subject: "Maria",
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
    trajectory: ["First presence at this event."],
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
process.env.QRE_AUTHOR_DEBUG_RAW = "true";
const started = Date.now();
console.log("=".repeat(80));
console.log(`QRE AUTHOR FAST · ${requested}`);
console.log("REAL UNIVERSAL AUTHOR · PLAN + DRAFT · NO CRITIQUE/REPAIR");
console.log("CHARACTER-FIRST · EVIDENCE-GATED · CHAMPION-ANGLE LOCK");
console.log("RAW MODEL OUTPUT ENABLED FOR DIAGNOSTICS");
console.log("=".repeat(80));

try {
  const result = await authorFast(test);
  console.log(`TIME: ${((Date.now() - started) / 1000).toFixed(3)}s`);
  console.log(`ANGLE: ${result.plan.angle}`);
  console.log(`TENSION: ${result.plan.tension}`);
  console.log(`PAYOFF: ${result.plan.payoff}`);
  console.log(`BEATS: ${result.scenes.length}`);
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${scene.kind ?? "movement"} · ${scene.text}`));
  if (!result.scenes.length) {
    console.error("FAIL: fast author returned zero scenes");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
