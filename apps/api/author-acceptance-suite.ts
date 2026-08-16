import { authorBrainUniversal } from "./src/services/authorBrainUniversal.js";
import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

const COUPLE_FACTS = [
  "Mike and Joe recently met",
  "they met at Luigi's Italian Restaurant",
  "they talked until closing",
  "they connected",
  "they both knew it was the start of something great",
];
const COUPLE_MOMENTS = ["first meeting", "Luigi's Italian Restaurant", "talked until closing", "connection"];

const cases = {
  COCO: {
    prompt: "Make a living memory story for Coco's dog tag.", subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first", "happy after"],
    sourceMoments: ["grooming visit", "pink bow"], lens: "funny, affectionate, slightly fierce",
    memoryContext: [], trajectory: [], creativeLearningContext: [],
  },
  "COCO-RETURN": {
    prompt: "Write Coco's second grooming chapter using what we already know plus today's update.", subject: "Coco",
    facts: ["Coco is a poodle", "hates bows", "loves treats", "scared at first"],
    sourceMoments: ["bath was faster today", "pink bow offered again", "Coco walked out proud"], lens: "callback comedy",
    memoryContext: ["Chapter 1: Coco resisted the bow and left happy."],
    trajectory: ["Chapter 1: Coco resisted the bow and left happy."],
    creativeLearningContext: ["Do not replay the first chapter. Make the returning bow mean something new."],
  },
  MARIA: {
    prompt: "Make a short new-world receipt for Maria's cleaning visit.", subject: "Maria",
    facts: ["Maria arrived at 9:04 AM", "bathrooms", "kitchen", "laundry", "finished at 11:47 AM"],
    sourceMoments: ["one cleaning visit"], lens: "service receipt with attitude",
    memoryContext: [], trajectory: [], creativeLearningContext: [],
  },
  HORROR: {
    prompt: "Turn an ordinary dinner into a slow, unavoidable horror sequence while everyone keeps calmly talking.",
    facts: ["dinner", "wine", "conversation", "doors slam", "glass breaks", "knives fly past us"],
    sourceMoments: ["everyone continued discussing the day prior"], lens: "calm human behavior while reality breaks",
    memoryContext: [], trajectory: [], creativeLearningContext: [],
  },
  RAVE: {
    prompt: "Make this rave attendance feel like a living memory.",
    facts: ["rave", "friends dancing", "bass", "late night", "we stayed"],
    sourceMoments: ["attendance at the event"], lens: "specific, kinetic, memorable",
    memoryContext: [], trajectory: ["First presence at this event."], creativeLearningContext: [],
  },
  "COUPLE-FUNNY": {
    prompt: "Make a living memory for a couple who just met. Use only the supplied reality, but find the latent comedy inside it.",
    subject: "Mike and Joe", facts: [...COUPLE_FACTS], sourceMoments: [...COUPLE_MOMENTS],
    lens: "funny, warm, observant, playful", memoryContext: [], trajectory: [], creativeLearningContext: [],
  },
  "COUPLE-HORROR": {
    prompt: "Make a living memory for the same couple and exact same facts, but use a horror lens. Do not invent events.",
    subject: "Mike and Joe", facts: [...COUPLE_FACTS], sourceMoments: [...COUPLE_MOMENTS],
    lens: "slow-burn horror, eerie, restrained", memoryContext: [], trajectory: [], creativeLearningContext: [],
  },
} as const;

function splitReality(value: string): string[] {
  return value
    .split(/[,\n.;•]+/)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((item) => item.length >= 2);
}

const arg = process.argv.slice(2).join(" ").trim();
const raw = (arg || process.env.QRE_AUTHOR_CASE || "COCO").trim();
const requested = raw.toUpperCase();

const test = cases[requested as keyof typeof cases] ?? (() => {
  const facts = splitReality(raw);
  const prompt = process.env.QRE_AUTHOR_PROMPT || "Make a living memory from this reality.";
  const lens = process.env.QRE_AUTHOR_LENS || "natural, specific, emotionally intelligent";
  return {
    prompt,
    subject: undefined,
    facts: facts.length ? facts : [raw],
    sourceMoments: facts.length ? facts : [raw],
    lens,
    memoryContext: [],
    trajectory: [],
    creativeLearningContext: [],
  };
})();

process.env.QRE_AUTHOR_DEBUG_RAW = "true";
const started = Date.now();
console.log("=".repeat(80));
console.log(`QRE UNIVERSAL AUTHOR ACCEPTANCE · ${requested}`);
console.log("ONE MASTER BRAIN · ONE AUTHOR PATH");
console.log("VIEWER MOMENTUM · SOURCE TRUTH · CUT NECESSITY");
console.log("RAW MODEL OUTPUT ENABLED FOR DIAGNOSTICS");
console.log("=".repeat(80));

try {
  const realityGraph = buildAuthorRealityGraph({
    prompt: test.prompt,
    subject: test.subject,
    facts: [...test.facts],
    sourceMoments: [...test.sourceMoments],
    memoryContext: [...test.memoryContext],
    trajectory: [...test.trajectory],
  });

  console.log("\n--- QRE REALITY GRAPH PREVIEW ---");
  console.log(`EVIDENCE: ${realityGraph.evidence.length}`);
  console.log(`EVENTS: ${realityGraph.events.length}`);
  realityGraph.events.slice(0, 12).forEach((event) => console.log(`  ${event.id}: ${event.label} · entities=${event.entities.join(", ")}`));
  console.log(`RELATIONS: ${realityGraph.relations.length}`);
  realityGraph.relations.slice(0, 16).forEach((relation) => console.log(`  ${relation.from} -[${relation.kind} ${relation.strength}]-> ${relation.to}`));
  console.log(`TENSIONS: ${JSON.stringify(realityGraph.unresolvedTensions)}`);
  console.log(`RECURRING: ${JSON.stringify(realityGraph.recurringSignals)}`);
  console.log(`SENSORY: ${JSON.stringify(realityGraph.sensorySignals)}`);
  console.log("--- END QRE REALITY GRAPH PREVIEW ---\n");

  if (!realityGraph.events.length) {
    throw new Error("Reality Graph produced no events from supplied reality");
  }

  const result = await authorBrainUniversal({
    ...test,
    facts: [...test.facts], sourceMoments: [...test.sourceMoments],
    memoryContext: [...test.memoryContext], trajectory: [...test.trajectory],
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
    console.error("FAIL: master Universal Author produced no usable sequence/scenes");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("AUTHOR ERROR:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}