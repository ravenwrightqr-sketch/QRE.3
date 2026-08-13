import { compileExperienceV12 } from "../experienceCompilerV12.js";

const assert = (ok: unknown, message: string): asserts ok => { if (!ok) throw new Error(`V12 ACCEPTANCE FAILED: ${message}`); };

console.log("\n===== V12 UNIVERSAL MEMORY =====\n");

const first = compileExperienceV12("Coco arrived for grooming, had a bath, stole a bow, and left happy.", { memoryScope: { assetId: "coco-demo" } });
const second = compileExperienceV12("Coco came back for another appointment, saw the bows again, and chewed one.", { memoryScope: { assetId: "coco-demo" }, memory: first.memory });
const couple = compileExperienceV12("John and Jane celebrated their wedding anniversary at the beach with family.", { memoryScope: { assetId: "couple-demo" } });

console.log("COCO EVENTS:", second.memory.events.length);
console.log("COCO ENTITIES:", second.memory.entities.map((x) => x.name));
console.log("COCO CONTINUITY:", second.memoryContinuity);
console.log("COUPLE ENTITIES:", couple.memory.entities.map((x) => x.name));
console.log("COUPLE RELATIONS:", couple.memory.relations.map((x) => x.relation));

assert(second.memory.events.length > first.memory.events.length, "memory accumulates events");
assert(second.memory.entities.some((x) => x.name.toLowerCase() === "coco"), "Coco remains an entity");
assert(second.memoryContinuity.length > 0, "continuity signals exist");
assert(couple.memory.entities.length >= 2, "multiple people are retained");
assert(couple.memory.relations.some((x) => x.relation === "married_to"), "marriage becomes a relationship");
assert(second.movie.beats.every((beat) => !/mechanic|compiler|memory thread|trajectory|experience design/i.test(beat.text)), "internals never leak");

console.log("\nV12 ACCEPTANCE: PASS\n");
