import { buildDomainCognition, personalitySignature, strongestDomainOpportunity } from "./src/services/authorDomainCognition.js";

const cases = [
  {
    mode: "pet_social" as const,
    subject: "Coco",
    facts: ["poodle", "fierce", "loves bacon", "long walks at night", "friendly", "loves other dogs"],
  },
  {
    mode: "memory" as const,
    subject: "the relationship",
    facts: ["met at the local bar", "connected", "talked until close", "seen each other every day"],
  },
  {
    mode: "service" as const,
    subject: "the service",
    facts: ["room was cleaned", "fresh towels were placed", "guest returned early", "check-out was at noon"],
  },
];

for (const item of cases) {
  const profile = buildDomainCognition(item.facts, item.subject, item.mode);
  console.log(`MODE ${item.mode}`);
  console.log(`  identity=${JSON.stringify(profile.identitySignals)}`);
  console.log(`  traits=${JSON.stringify(profile.traitSignals)}`);
  console.log(`  preferences=${JSON.stringify(profile.preferenceSignals)}`);
  console.log(`  social=${JSON.stringify(profile.socialSignals)}`);
  console.log(`  activities=${JSON.stringify(profile.activitySignals)}`);
  console.log(`  continuity=${JSON.stringify(profile.continuitySignals)}`);
  console.log(`  tensions=${JSON.stringify(profile.tensions)}`);
  console.log(`  signature=${personalitySignature(profile)}`);
  console.log(`  opportunity=${JSON.stringify(strongestDomainOpportunity(profile))}`);
}

const pet = buildDomainCognition(cases[0]!.facts, "Coco", "pet_social");
if (pet.traitSignals.length !== 2) throw new Error("DOMAIN COGNITION FAILED: expected two pet traits");
if (pet.preferenceSignals.length !== 1) throw new Error("DOMAIN COGNITION FAILED: expected one non-social pet preference");
if (pet.socialSignals.length !== 1) throw new Error("DOMAIN COGNITION FAILED: expected one pet social preference");
if (!pet.activitySignals.includes("long walks at night")) throw new Error("DOMAIN COGNITION FAILED: expected recurring pet activity");
if (pet.tensions.length === 0) throw new Error("DOMAIN COGNITION FAILED: expected pet personality tension");
if (!pet.opportunities.some((item) => item.kind === "social")) throw new Error("DOMAIN COGNITION FAILED: expected social opportunity");

const memory = buildDomainCognition(cases[1]!.facts, cases[1]!.subject, "memory");
if (!memory.tensions.some((item) => item.kind === "meaning_shift")) throw new Error("DOMAIN COGNITION FAILED: expected memory meaning shift");
if (memory.forbiddenExpansions.some((item) => /relationship status/i.test(item))) {
  console.log("  memory relationship-status expansion remains forbidden");
}

console.log("AUTHOR DOMAIN COGNITION ACCEPTANCE: PASS");
