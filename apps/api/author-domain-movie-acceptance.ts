import { selectDomainDrivenMovie } from "./src/services/authorDomainMovieBridge.js";
import type { AuthorBrainTruth } from "@qre/contracts";

function truth(subject: string, facts: string[], prompt: string, lens?: string): AuthorBrainTruth {
  return {
    subject,
    facts,
    sourceMoments: [],
    prompt,
    memoryContext: [],
    presenceSummary: [],
    trajectory: [],
    ...(lens ? { lens } : {}),
  } as AuthorBrainTruth & { lens?: string };
}

const pet = selectDomainDrivenMovie(
  truth("Coco", ["poodle", "fierce", "loves bacon", "long walks at night", "friendly", "loves other dogs"], "Create a 5-line pet social movie."),
  "The rest is Coco.",
  "pet_social",
);

if (pet.profile.tensions.length === 0) throw new Error("DOMAIN MOVIE FAILED: pet tension missing");
if (pet.profile.opportunities.length === 0) throw new Error("DOMAIN MOVIE FAILED: pet opportunity missing");
if (!pet.selected.trajectory.length) throw new Error("DOMAIN MOVIE FAILED: selected pet trajectory missing");
if (pet.domainLift <= 0) throw new Error("DOMAIN MOVIE FAILED: domain lift missing");

const memory = selectDomainDrivenMovie(
  truth("the relationship", ["met at the local bar", "connected", "talked until close", "seen each other every day"], "Create a living memory."),
  "What started there kept going.",
  "memory",
);

if (!memory.profile.tensions.some((item) => item.kind === "meaning_shift")) throw new Error("DOMAIN MOVIE FAILED: memory meaning shift missing");
if (!memory.selected.trajectory.length) throw new Error("DOMAIN MOVIE FAILED: selected memory trajectory missing");

const service = selectDomainDrivenMovie(
  truth("the service", ["room was cleaned", "fresh towels were placed", "guest returned early", "check-out was at noon"], "Create a service completion movie."),
  "Someone was coming back.",
  "service",
);

if (!service.selected.trajectory.length) throw new Error("DOMAIN MOVIE FAILED: selected service trajectory missing");

console.log("DOMAIN-DRIVEN MOVIE ACCEPTANCE: PASS");
console.log(`pet operation=${pet.selected.operation} lift=${pet.domainLift} tension=${pet.profile.tensions[0]?.left}↔${pet.profile.tensions[0]?.right}`);
console.log(`memory operation=${memory.selected.operation} lift=${memory.domainLift}`);
console.log(`service operation=${service.selected.operation} lift=${service.domainLift}`);
