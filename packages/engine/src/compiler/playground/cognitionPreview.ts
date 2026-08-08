import {
  understandPrompt,
  buildExperienceUnderstanding,
  buildCognitiveExperiencePlan,
} from "@qre/cognition-v2";

const prompt = `
Create a memory for a wedding held at the beach.
`;

const cognition = understandPrompt(prompt);
const understanding = buildExperienceUnderstanding(cognition);
const plan = buildCognitiveExperiencePlan(cognition);

console.log(JSON.stringify({
  prompt,
  understanding,
  experiencePlan: plan,
}, null, 2));
