import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

type StressCase = {
  name: string;
  prompt: string;
  required: RegExp;
  forbidden?: RegExp;
};

/**
 * Cognitive stress acceptance.
 *
 * This is intentionally not a style test. It checks whether the compiler can
 * move very different premises through cognition and story realization while
 * preserving concrete evidence and avoiding generic meta-prose.
 */
const cases: StressCase[] = [
  {
    name: "luxury dog spa",
    prompt: "Create an absurd luxury spa experience for Max the suspicious little dog where every treatment makes him more pampered until he becomes a celebrity.",
    required: /max|dog|spa|pampered|celebrity/i,
  },
  {
    name: "terrifying hospital uncertainty",
    prompt: "I'm in a coma and my family is waiting for me. Make the experience truthful to the uncertainty without pretending we know what happens next.",
    required: /coma|family|waiting|uncertainty|next/i,
  },
  {
    name: "haunted house",
    prompt: "Make a genuinely terrifying haunted house where every room makes the threat less certain and more dangerous.",
    required: /terrifying|haunted|room|threat|danger/i,
  },
  {
    name: "alien gas station",
    prompt: "Create something completely weird involving aliens and a gas station where the world gets stranger as the visitor stays longer.",
    required: /alien|gas station|weird|stranger/i,
  },
  {
    name: "tattoo shop",
    prompt: "I run a tattoo shop but I don't want another boring loyalty program. Make the relationship with customers evolve through identity, work, and earned access.",
    required: /tattoo|shop|customer|identity|earned|access/i,
  },
  {
    name: "housekeeper cleaning",
    prompt: "A housekeeper documents a client's home after a huge cleaning day.",
    required: /housekeeper|client|home|cleaning/i,
  },
  {
    name: "sourdough guidance",
    prompt: "Teach someone how to make sourdough with practical steps that adapt to what the learner observes.",
    required: /sourdough|practical|steps|adapt|learner/i,
  },
  {
    name: "family memory",
    prompt: "Create a funny birthday memory that every family member can keep adding to until it becomes family folklore.",
    required: /birthday|family|memory|adding|folklore/i,
  },
  {
    name: "memory artifact",
    prompt: "My grandfather's old truck is the only thing left from his life. Turn it into a living memory that can grow without inventing facts.",
    required: /grandfather|truck|memory|life|grow/i,
  },
  {
    name: "surfboard journey",
    prompt: "Make my surfboard feel like it has traveled more than I have, with places and milestones becoming chapters in its journey.",
    required: /surfboard|traveled|places|milestones|journey/i,
  },
  {
    name: "commercial mystery",
    prompt: "A luxury watch brand wants something mysterious that reveals deeper layers each time someone returns.",
    required: /luxury|watch|mysterious|deeper|returns/i,
  },
  {
    name: "ordinary object transformation",
    prompt: "Turn my broken bicycle into a story about repair, failure, and the moment it finally works again.",
    required: /broken|bicycle|repair|failure|works|again/i,
  },
];

const forbidden = /the experience puts into focus|evidence-aware experience|the subject now means more|what the experience has revealed|another layer of|meaningful point has been reached/i;

for (const testCase of cases) {
  const result = compileCognitiveExperience(testCase.prompt);
  const beatText = result.story.beats.map((beat) => beat.text).join(" ");

  if (!result.cognition.plan) {
    throw new Error(`${testCase.name}: missing cognitive plan`);
  }

  if (result.story.beats.length < 3) {
    throw new Error(`${testCase.name}: story collapsed to ${result.story.beats.length} beats`);
  }

  if (!testCase.required.test(beatText)) {
    throw new Error(`${testCase.name}: salient prompt evidence was lost. Got: ${beatText}`);
  }

  if ((testCase.forbidden ?? forbidden).test(beatText)) {
    throw new Error(`${testCase.name}: generic meta-prose leaked. Got: ${beatText}`);
  }

  console.log(`✓ ${testCase.name}: ${result.cognition.plan.direction} / ${result.story.beats.length} beats`);
}

console.log("✓ Cognitive stress acceptance passed");
