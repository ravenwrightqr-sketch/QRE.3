import {
  learnLatentMovieV6,
  memoryContinuationV6,
  sameEntityMemoryV6,
  type EntityMemoryV6,
} from "../latentMovieLearningV6.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

let coco: EntityMemoryV6 | undefined;
let patty: EntityMemoryV6 | undefined;

const coco1 = learnLatentMovieV6(
  { ownerKey: "bettie-groomer", entityKey: "coco" },
  "Coco is a Pomeranian. She came into the groomer scared. She enjoyed the bath. She stole a bow. She walked out happy.",
);
coco = coco1.memory;

const coco2 = learnLatentMovieV6(
  { ownerKey: "bettie-groomer", entityKey: "coco" },
  "Coco came back today. She loved the bath again. She stole another bow and walked out happy.",
  coco,
);
coco = coco2.memory;

const patty1 = learnLatentMovieV6(
  { ownerKey: "bettie-groomer", entityKey: "patty" },
  "Patty is a golden retriever. She arrived sleepy. She loved the warm towel. She watched the room and left relaxed.",
);
patty = patty1.memory;

const otherBettieCoco = learnLatentMovieV6(
  { ownerKey: "other-groomer", entityKey: "coco" },
  "Coco arrived happy and loved the bath.",
);

console.log("\n===== V6 ENTITY LEARNING =====\n");
console.log("COCO KEY:", coco.key);
console.log("COCO EVENTS:", coco.eventCount);
console.log("COCO RECURRING:", coco.recurringSignals.filter((s) => s.count >= 2).map((s) => `${s.value} x${s.count}`));
console.log("COCO CONTINUATION:", memoryContinuationV6(coco));
console.log("PATTY KEY:", patty.key);
console.log("PATTY EVENTS:", patty.eventCount);
console.log("OTHER COCO KEY:", otherBettieCoco.memory.key);

assert(coco.eventCount === 2, "Coco should have two learned events");
assert(coco.key === "memory:bettie-groomer:coco", "Coco memory must be scoped to Bettie's entity");
assert(patty.key === "memory:bettie-groomer:patty", "Patty must have a distinct memory key");
assert(otherBettieCoco.memory.key !== coco.key, "Coco memories must not cross owners");
assert(!sameEntityMemoryV6(coco, patty), "Coco and Patty must never share entity memory");
assert(coco.facts.some((fact) => /another bow/i.test(fact)), "New Coco facts must be retained");
assert(coco.recurringSignals.some((signal) => signal.count >= 2 && /bath/i.test(signal.value)), "Repeated Coco behavior should become a learned signal");
assert(coco2.novelFacts.length > 0, "Second Coco visit must produce novel facts");
assert(coco2.recurringFacts.length > 0, "Second Coco visit must recognize recurring facts");
assert(coco2.movie.beats.every((beat) => !/mechanic|payoff|compiler|memory thread/i.test(beat.text)), "Internal mechanics must never leak into movie prose");
assert(patty1.movie.beats.every((beat) => !/Coco|bow/i.test(beat.text)), "Patty's movie must not inherit Coco's character details");

console.log("\nV6 ACCEPTANCE: PASS\n");
