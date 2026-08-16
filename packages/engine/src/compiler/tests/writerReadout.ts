import { compileCognitiveExperience } from "../../cognition/universalMind.js";

const cases = [
  {
    name: "PET / COMEDY",
    prompt: "Coco came in nervous, got a bath, stole a blue bow, and left looking fabulous. Make it funny.",
  },
  {
    name: "WEDDING / ROMANTIC",
    prompt: "The wedding is tonight. Everyone knows the couple, but nobody knows what happens after the vows. Make it romantic and cinematic.",
  },
  {
    name: "MEMORY / RETURN",
    prompt: "We went there again. Huntington. We watched the sunset from the pier and stayed until the lights came on.",
  },
  {
    name: "HORROR",
    prompt: "The hotel room looked ordinary until the old photograph above the desk was noticed. Then the lights flickered.",
  },
  {
    name: "REAL ESTATE",
    prompt: "The realtor opened the front door, and sunlight crossed the empty living room. The family imagined where the couch would go.",
  },
  {
    name: "SERVICE",
    prompt: "Maria arrived at 9:04 AM, cleaned the kitchen and two bathrooms, and finished at 11:47 AM. The homeowner came home to a spotless house.",
  },
  {
    name: "OBJECT / MEMORY",
    prompt: "The blue suitcase survived three airports, one missed train, and a rainy walk home. Ten years later it was still by the door.",
  },
  {
    name: "EVENT",
    prompt: "The concert ended at midnight, but the crowd stayed in the parking lot singing while the road emptied around them.",
  },
  {
    name: "FAMILY",
    prompt: "Dad played the old guitar in the garage while everyone else packed the car. Nobody noticed the song until years later.",
  },
  {
    name: "RESTAURANT",
    prompt: "The chef brought out the final plate just as the birthday candles were being lit. The table went quiet for a second.",
  },
  {
    name: "PET / RETURN MEMORY",
    prompt: "The dog hated the dryer, loved the foot rub, and came back three weeks later as if this place had always belonged to him.",
  },
  {
    name: "MYSTERY",
    prompt: "The camera recorded the first dance, the toast, and the person laughing in the back row. Nobody remembered inviting them.",
  },
  {
    name: "CREATIVE FREEDOM",
    prompt: "A tiny paper ticket was found inside an old coat pocket. Nobody knew where it came from.",
  },
  {
    name: "ESCALATION",
    prompt: "The birthday cake arrived one minute before everyone started singing, then the lights went out, then someone started laughing.",
  },
  {
    name: "TENDER",
    prompt: "The old chair moved to the porch when the baby arrived. It stayed there through three summers and two different dogs.",
  },
];

function printBlock(label: string, value: unknown) {
  console.log(`  ${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
}

console.log("=".repeat(100));
console.log("QRE WRITER READOUT — ACTUAL RETURNED PROSE");
console.log("This is intentionally human-readable. It is not an invariant-only acceptance test.");
console.log("=".repeat(100));

for (const test of cases) {
  const result = compileCognitiveExperience(test.prompt);
  const prose = result.moments.map((moment) => moment.text ?? moment.description ?? "").filter(Boolean).join(" ");
  const moves = result.moments.flatMap((moment) => Array.isArray(moment.payload?.creativeDetails) ? moment.payload.creativeDetails : []);

  console.log(`\n[${test.name}]`);
  printBlock("PROMPT", test.prompt);
  printBlock("LENS", result.world.lens);
  printBlock("TITLE", result.title);
  printBlock("PROSE", prose);
  printBlock("MOMENTS", result.momentCount);
  printBlock("CREATIVE MOVES", Array.from(new Set(moves)));
  printBlock("LEARNING SIGNALS", result.learningSignals);
  printBlock("PLACES", result.world.places);
  printBlock("PARTICIPANTS", result.world.participants);
  printBlock("ENTITIES", result.world.entities);
  printBlock("DISCOVERIES", result.discoveries);
  console.log("-".repeat(100));
}

console.log("\nREADOUT COMPLETE");
