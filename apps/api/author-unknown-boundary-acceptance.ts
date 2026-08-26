import { unknownBoundaryAllowsIdentity, unsupportedIdentityClaims } from "./src/services/authorUnknownBoundary.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`UNKNOWN BOUNDARY FAILURE: ${message}`);
}

const base = {
  subject: "Coco",
  subjectTruth: { name: "Coco", species: "dog" },
  facts: ["Coco is a dog.", "Coco was nervous on arrival.", "Coco had blue bows."],
  moments: [],
  memory: [],
};

assert(
  unknownBoundaryAllowsIdentity("Coco is a dog.", base),
  "known species should remain legal",
);
assert(
  unsupportedIdentityClaims("Coco is a dog.", base).length === 0,
  "dog should not be treated as an unknown identity attribute",
);
assert(
  !unknownBoundaryAllowsIdentity("Coco is happy; she looks better now.", base),
  "she must be rejected when gender is unknown",
);
assert(
  unsupportedIdentityClaims("Coco is happy; she looks better now.", base).includes(
    "unsupported feminine identity",
  ),
  "missing feminine identity must be reported explicitly",
);
assert(
  !unknownBoundaryAllowsIdentity("Coco is brave; his blue bows are perfect.", base),
  "his must be rejected when gender is unknown",
);

const femaleEstablished = {
  ...base,
  facts: [...base.facts, "Coco is female."],
};
assert(
  unknownBoundaryAllowsIdentity("She was nervous on arrival.", femaleEstablished),
  "she becomes legal only after supplied evidence establishes female identity",
);

const memoryEstablished = {
  ...base,
  memory: ["Coco is female; this was explicitly supplied by the owner."],
};
assert(
  unknownBoundaryAllowsIdentity("She was nervous on arrival.", memoryEstablished),
  "authorized memory may establish an identity attribute",
);

assert(
  !unknownBoundaryAllowsIdentity("Coco transformed, bath in hand.", base),
  "this harness remains conservative about unsupported identity language only; production physical truth gates remain separate",
);

console.log("AUTHOR UNKNOWN BOUNDARY ACCEPTANCE: PASS");
console.log("Known=dog");
console.log("Unknown=female/she/her");
console.log("ExplicitlyEstablished=female/she/her allowed");
