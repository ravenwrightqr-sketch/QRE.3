import { compileCognitiveExperience } from "../../experience/cognitiveExperienceCompiler.js";

const prompts = [
  "Create a memorial for my grandmother",
  "Make a QR experience for a nightclub",
  "Teach someone how to make sourdough",
  "Create a treasure hunt for kids",
  "A luxury watch brand wants something mysterious",
  "I want to preserve my wedding day forever",
  "My dog is missing",
  "Create something completely weird involving aliens and a gas station",
  "My grandfather's old truck is the only thing left from his life",
  "Make my surfboard feel like it has traveled more than I have",
  "I run a tattoo shop but I don't want another boring loyalty program",
  "Turn a musician's guitar pick into a portal into their universe",
  "My dog just turned ten and I want her story to keep growing after I'm gone",
];

for (const prompt of prompts) {
  const result = compileCognitiveExperience(prompt);
  const cognition = result.cognition;

  console.log("\n========================================");
  console.log("PROMPT:", prompt);
  console.log("SUBJECT:", cognition.subject);
  console.log("PARTICIPANTS:", cognition.participants);
  console.log("SELECTED HYPOTHESIS:", cognition.selectedHypothesis);
  console.log("OPPORTUNITIES:", {
    memory: cognition.memoryOpportunities,
    geographic: cognition.geographicOpportunities,
    social: cognition.socialOpportunities,
    discovery: cognition.discoveryOpportunities,
    temporal: cognition.temporalOpportunities,
    commercial: cognition.commercialOpportunities,
  });
  console.log("ASSUMPTIONS:", cognition.assumptions);
  console.log("BLUEPRINT:", {
    title: result.blueprint.title,
    type: result.blueprint.type,
    moments: result.blueprint.moments.length,
    dna: result.blueprint.metadata?.dna,
  });
}
