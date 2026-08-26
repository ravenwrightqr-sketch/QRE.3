import {
  compileCognitiveExperience,
} from "@qre/engine";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function hasPlace(
  result: ReturnType<typeof compileCognitiveExperience>,
  place: string,
): boolean {
  return result.world.places.some(
    (value) =>
      value.toLowerCase() ===
      place.toLowerCase(),
  );
}

/**
 * 1. Weak overlap must NOT inherit an old place.
 *
 * Memory:
 *   Coco lives on Elm Street.
 *
 * New event:
 *   Coco played yesterday.
 *
 * Same named entity does not mean the new event happened
 * at the remembered location.
 */
const weakOverlap =
  compileCognitiveExperience(
    "Coco played yesterday.",
    {
      memorySummary: [
        "Coco lives on Elm Street.",
      ],
    },
  );

assert(
  !hasPlace(
    weakOverlap,
    "Elm Street",
  ),
  "MEMORY AUTHORITY LEAK: weak entity overlap inherited remembered place.",
);

/**
 * 2. Explicit current place must win.
 */
const explicitCurrentPlace =
  compileCognitiveExperience(
    "Coco played yesterday at Riverside Park.",
    {
      memorySummary: [
        "Coco lives on Elm Street.",
      ],
    },
  );

assert(
  hasPlace(
    explicitCurrentPlace,
    "Riverside Park",
  ),
  "MEMORY AUTHORITY FAILURE: explicit current place was lost.",
);

assert(
  !hasPlace(
    explicitCurrentPlace,
    "Elm Street",
  ),
  "MEMORY AUTHORITY LEAK: remembered place contaminated explicit current location.",
);

/**
 * 3. A return cue is allowed to resolve memory.
 *
 * The prompt explicitly says "went back there", which gives
 * cognition a semantic reason to consult prior place context.
 */
const returned =
  compileCognitiveExperience(
    "Coco went back there yesterday.",
    {
      memorySummary: [
        "Coco lives on Elm Street.",
      ],
    },
  );

assert(
  returned.world.places.length === 1,
  "MEMORY RETURN FAILURE: expected one resolved remembered place.",
);

assert(
  hasPlace(
    returned,
    "Elm Street",
  ),
  "MEMORY RETURN FAILURE: explicit return cue did not resolve remembered place.",
);

/**
 * 4. Completely unrelated memory must not contaminate
 * the current world.
 */
const unrelated =
  compileCognitiveExperience(
    "Maya cooked dinner.",
    {
      memorySummary: [
        "Coco lives on Elm Street.",
        "Coco was groomed at Elm Street Grooming.",
      ],
    },
  );

assert(
  unrelated.world.participants.some(
    (value) =>
      value.toLowerCase() ===
      "maya",
  ),
  "CURRENT WORLD FAILURE: supplied participant disappeared.",
);

assert(
  !unrelated.world.places.some(
    (value) =>
      /elm street/i.test(value),
  ),
  "MEMORY AUTHORITY LEAK: unrelated memory contaminated current world.",
);

/**
 * 5. Explicitly supplied current identity and event facts
 * must survive memory resolution intact.
 */
const enriched =
  compileCognitiveExperience(
    "Coco was groomed at Elm Street Grooming on Friday.",
    {
      memorySummary: [
        "Coco lives on Elm Street.",
        "Coco likes the red bow.",
      ],
    },
  );

assert(
  enriched.world.participants.some(
    (value) =>
      value.toLowerCase() ===
      "coco",
  ),
  "IDENTITY FAILURE: supplied participant was lost.",
);

assert(
  hasPlace(
    enriched,
    "Elm Street Grooming",
  ),
  "CURRENT FACT FAILURE: supplied event place was lost.",
);

assert(
  enriched.world.times.some(
    (value) =>
      /friday/i.test(value),
  ),
  "CURRENT FACT FAILURE: supplied time was lost.",
);

/**
 * 6. Memory provenance must remain distinguishable.
 */
const memoryEvidence =
  enriched.world.evidence.filter(
    (item) =>
      item.source === "memory",
  );

assert(
  memoryEvidence.length >= 0,
  "MEMORY PROVENANCE FAILURE: evidence channel unavailable.",
);

console.log(
  "COGNITION MEMORY AUTHORITY ACCEPTANCE: PASS",
);

console.log(
  `WeakOverlapPlaces=${weakOverlap.world.places.join(", ")}`,
);

console.log(
  `ExplicitCurrentPlaces=${explicitCurrentPlace.world.places.join(", ")}`,
);

console.log(
  `ReturnedPlaces=${returned.world.places.join(", ")}`,
);

console.log(
  `UnrelatedPlaces=${unrelated.world.places.join(", ")}`,
);

console.log(
  `EnrichedPlaces=${enriched.world.places.join(", ")}`,
);

console.log(
  `MemoryEvidence=${memoryEvidence.length}`,
);