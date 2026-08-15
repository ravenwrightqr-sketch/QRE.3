import { authorFast } from "./src/services/authorFastCore.js";

const cases = {
  COCO: {
    prompt: "Make a living memory story for Coco's dog tag.",
    subject: "Coco",
    subjectTruth: {
      name: "Coco",
      kind: "animal" as const,
      sex: "male" as const,
      pronouns: { subject: "he" as const, object: "him" as const, possessive: "his" as const, reflexive: "himself" as const },
      provenance: "explicit" as const,
      identityFacts: ["Coco is male", "Coco is a poodle"],
    },
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first", "happy after"],
    sourceMoments: ["grooming visit", "pink bow"],
    lens: "funny, affectionate, slightly fierce",
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  },
  "COCO-RETURN": {
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.",
    subject: "Coco",
    subjectTruth: {
      name: "Coco",
      kind: "animal" as const,
      sex: "male" as const,
      pronouns: { subject: "he" as const, object: "him" as const, possessive: "his" as const, reflexive: "himself" as const },
      provenance: "memory" as const,
      identityFacts: ["Coco is male", "Coco is a poodle"],
    },
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first"],
    sourceMoments: ["bath was faster today", "pink bow offered again", "Coco walked out proud"],
    lens: "callback comedy",
    memoryContext: ["Chapter 1: Coco resisted the bow and left happy."],
    trajectory: ["Chapter 1: Coco resisted the bow and left happy."],
    creativeLearningContext: ["Do not replay the first chapter. Make the returning bow mean something new."],
  },
  MARIA: {
    prompt: "Make a short new-world receipt for Maria's cleaning visit.",
    subject: "Maria",
    facts: ["Maria arrived at 9:04 AM", "bathrooms", "kitchen", "laundry", "finished at 11:47 AM"],
    sourceMoments: ["one cleaning visit"],
    lens: "service receipt with attitude",
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  },
  HORROR: {
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation", "doors slam", "glass breaks", "knives fly past us"],
    sourceMoments: ["everyone continued discussing the day prior"],
    lens: "calm human behavior while reality breaks",
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  },
  RAVE: {
    prompt: "Make this rave attendance feel like a living memory.",
    facts: ["rave", "friends dancing", "bass", "late night", "we stayed"],
    sourceMoments: ["attendance at the event"],
    lens: "specific, kinetic, memorable",
    memoryContext: [],
    trajectory: ["First presence at this event."],
    creativeLearningContext: [],
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
console.log(`QRE UNIVERSAL AUTHOR ACCEPTANCE · ${requested}`);
console.log("ONE CANONICAL AUTHOR · ONE SEQUENCE PATH");
console.log("VIEWER MOMENTUM · SOURCE TRUTH · CUT NECESSITY");
console.log("RAW MODEL OUTPUT ENABLED FOR DIAGNOSTICS");
console.log("=".repeat(80));

try {
  const result = await authorFast({
    ...test,
    facts: [...test.facts],
    sourceMoments: [...test.sourceMoments],
    memoryContext: [...test.memoryContext],
    trajectory: [...test.trajectory],
    creativeLearningContext: [...test.creativeLearningContext],
  });

  console.log(`TIME: ${((Date.now() - started) / 1000).toFixed(3)}s`);
  console.log(`ANGLE: ${result.brief.angle}`);
  console.log(`ENGINE: ${result.brief.engine}`);
  console.log(`QUESTION: ${result.brief.question}`);
  console.log(`IMAGE: ${result.brief.strongestImage}`);
  console.log(`PAYOFF: ${result.brief.payoff}`);

  if (result.sequence) {
    console.log("\n--- QRE SEQUENCE PLAY ---");
    console.log(`PREMISE: ${result.sequence.premise}`);
    result.sequence.cuts.forEach((cut) => {
      console.log(`[${cut.order}] ${cut.role} · GAIN: ${cut.informationGain}`);
      console.log(`    ATTENTION: ${cut.attentionDelta}`);
      if (cut.nextPromise) console.log(`    NEXT: ${cut.nextPromise}`);
    });
    console.log("--- END QRE SEQUENCE PLAY ---\n");
  }

  console.log(`DIAGNOSTICS: ${JSON.stringify(result.diagnostics)}`);
  console.log(`BEATS: ${result.scenes.length}`);
  result.scenes.forEach((scene, index) => console.log(`[${index + 1}] ${scene.kind ?? "line"} · ${scene.text}`));

  if (!result.sequence || !result.scenes.length) {
    console.error("FAIL: canonical Universal Author produced no usable sequence/scenes");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
