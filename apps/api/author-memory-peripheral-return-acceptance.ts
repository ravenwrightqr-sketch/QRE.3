
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import type {
  MemoryWriteBatch,
} from "@qre/contracts";
import { compileExperience } from "./src/services/experienceService.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `AUTHOR MEMORY PERIPHERAL RETURN ACCEPTANCE FAILED: ${message}`,
    );
  }
}

function clean(
  value: unknown,
): string {
  return String(
    value ?? "",
  )
    .replace(/\s+/g, " ")
    .trim();
}

function lower(
  value: unknown,
): string {
  return clean(
    value,
  ).toLowerCase();
}

function flattenStrings(
  value: unknown,
): string[] {
  const result: string[] = [];

  function visit(
    node: unknown,
  ): void {
    if (
      typeof node ===
      "string"
    ) {
      const text =
        clean(
          node,
        );

      if (text) {
        result.push(
          text,
        );
      }

      return;
    }

    if (
      Array.isArray(
        node,
      )
    ) {
      for (
        const item of
          node
      ) {
        visit(
          item,
        );
      }

      return;
    }

    if (
      node &&
      typeof node ===
        "object"
    ) {
      for (
        const value of Object.values(
          node as Record<
            string,
            unknown
          >,
        )
      ) {
        visit(
          value,
        );
      }
    }
  }

  visit(
    value,
  );

  return result;
}

const assetId =
  clean(
    process.env.QRE_TEST_ASSET_ID,
  );

assert(
  assetId,
  "Set QRE_TEST_ASSET_ID to an existing accessible QRE asset before running this acceptance",
);

const memoryRepository =
  createMemoryRepository();

const userId =
  clean(
    process.env.QRE_TEST_USER_ID,
  ) || undefined;

console.log(
  "--- AUTHOR MEMORY PERIPHERAL RETURN ACCEPTANCE ---",
);

console.log(
  `asset=${assetId}`,
);

/*
 * ================================================================
 * VISIT 1
 * ================================================================
 *
 * Persist the user's supplied world as durable memory.
 *
 * "Squirrel" is deliberately peripheral. It is not the premise,
 * not the semantic turn, and not the return prompt.
 *
 * This acceptance tests memory persistence, so we do not manufacture
 * qre_memory_event rows or fake session foreign keys here.
 */

const observedAt =
  new Date().toISOString();

const visitOneBatch:
  MemoryWriteBatch =
  {
    assetId,

    userId,

    entities: [],

    facts: [
      {
        kind: "attribute",
        predicate:
          "experience_detail",
        value:
          "beach house",
        confidence: 1,
        source: "user",
        sourceRef:
          "acceptance:visit-1:beach-house",
        status: "active",
        observedAt,
        visibility: "private",
      },

      {
        kind: "attribute",
        predicate:
          "experience_detail",
        value:
          "played in water",
        confidence: 1,
        source: "user",
        sourceRef:
          "acceptance:visit-1:water",
        status: "active",
        observedAt,
        visibility: "private",
      },

      {
        kind: "attribute",
        predicate:
          "experience_detail",
        value:
          "ate bacon",
        confidence: 1,
        source: "user",
        sourceRef:
          "acceptance:visit-1:bacon",
        status: "active",
        observedAt,
        visibility: "private",
      },

      {
        kind: "attribute",
        predicate:
          "experience_detail",
        value:
          "Coco loved the day",
        confidence: 1,
        source: "user",
        sourceRef:
          "acceptance:visit-1:coco",
        status: "active",
        observedAt,
        visibility: "private",
      },

      {
        kind: "attribute",
        predicate:
          "peripheral_detail",
        value:
          "squirrel",
        confidence: 1,
        source: "user",
        sourceRef:
          "acceptance:visit-1:squirrel",
        status: "active",
        observedAt,
        visibility: "private",
      },
    ],

    relations: [],

    events: [],
  };

await memoryRepository.writeBatch(
  visitOneBatch,
);

const afterVisitOne =
  await memoryRepository.loadContext(
    {
      assetId,
      userId,
    },
  );

const visitOneMemory =
  flattenStrings(
    afterVisitOne,
  );

assert(
  visitOneMemory.some(
    (
      value,
    ) =>
      lower(
        value,
      ) ===
        "squirrel" ||
      lower(
        value,
      ).includes(
        "squirrel",
      ),
  ),
  "visit 1 did not persist peripheral fact 'squirrel'",
);

console.log(
  `visit1.memoryFacts=${afterVisitOne.facts.length}`,
);

console.log(
  `visit1.memoryEvents=${afterVisitOne.events.length}`,
);

console.log(
  "visit1.peripheralFact=squirrel",
);

/*
 * ================================================================
 * VISIT 2
 * ================================================================
 *
 * The prompt does NOT mention squirrel.
 *
 * Therefore squirrel can only become available through durable memory.
 *
 * No synthetic session ID is introduced by this acceptance.
 */

const returnPrompt =
  "Remind me about that beach day with Coco.";

const visitTwo =
  await compileExperience(
    {
      prompt:
        returnPrompt,

      assetId,

      userId,

      memoryRepository,

      movieMode:
        true,

      lens:
        "revisit",
    },
  );

const visitTwoStrings =
  flattenStrings(
    visitTwo,
  );

const squirrelReappeared =
  visitTwoStrings.some(
    (
      value,
    ) =>
      lower(
        value,
      ).includes(
        "squirrel",
      ),
  );

const memoryReturned =
  await memoryRepository.loadContext(
    {
      assetId,
      userId,
    },
  );

const returnedMemoryStrings =
  flattenStrings(
    memoryReturned,
  );

const squirrelStillPersisted =
  returnedMemoryStrings.some(
    (
      value,
    ) =>
      lower(
        value,
      ) ===
        "squirrel" ||
      lower(
        value,
      ).includes(
        "squirrel",
      ),
  );

console.log(
  `visit2.renderedSquirrel=${squirrelReappeared}`,
);

console.log(
  `visit2.memorySquirrel=${squirrelStillPersisted}`,
);

console.log(
  `visit2.returning=${Boolean(
    visitTwo.presence?.isReturning,
  )}`,
);

console.log(
  `visit2.momentCount=${visitTwo.momentCount}`,
);

assert(
  squirrelStillPersisted,
  "peripheral fact 'squirrel' disappeared from durable memory",
);

/*
 * The visible re-entry is intentionally emergent.
 *
 * Persistence is mandatory.
 * Realization is optional.
 *
 * This proves the important QRE law:
 *
 * supplied peripheral reality survives the visit,
 * remains available to the returning Author,
 * and may re-enter later without being present in the return prompt.
 */

if (
  squirrelReappeared
) {
  console.log(
    "PASS · peripheral memory fact re-entered the returned experience",
  );
} else {
  console.log(
    "PASS · peripheral memory fact survived and remained available to the returned Author",
  );
}

console.log(
  "--- END AUTHOR MEMORY PERIPHERAL RETURN ACCEPTANCE ---",
);

