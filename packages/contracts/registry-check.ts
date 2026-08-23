import {
  AnalyticsEventTypes,
  type AnalyticsEventType,
} from "./src/analytics.js";
import {
  ANALYTICS_EVENT_REGISTRY,
  type AnalyticsEventDefinition,
} from "./src/analyticsRegistry.js";

const types =
  Object.values(
    AnalyticsEventTypes,
  ) as AnalyticsEventType[];

const registryTypes =
  Object.keys(
    ANALYTICS_EVENT_REGISTRY,
  ) as AnalyticsEventType[];

const missing = types.filter(
  (type) => !ANALYTICS_EVENT_REGISTRY[type],
);

const extra = registryTypes.filter(
  (type) => !types.includes(type),
);

const invalid: string[] = [];

for (const type of types) {
  const definition =
    ANALYTICS_EVENT_REGISTRY[type];

  if (!definition) continue;

  const requiredStringFields: Array<
    keyof Pick<
      AnalyticsEventDefinition,
      "type" | "category" | "source" | "description"
    >
  > = [
    "type",
    "category",
    "source",
    "description",
  ];

  for (const field of requiredStringFields) {
    const value = definition[field];

    if (
      typeof value !== "string" ||
      !value.trim()
    ) {
      invalid.push(
        `${type}.${field}=invalid`,
      );
    }
  }

  if (
    definition.defaultOutcome !==
      "positive" &&
    definition.defaultOutcome !==
      "negative" &&
    definition.defaultOutcome !==
      "neutral"
  ) {
    invalid.push(
      `${type}.defaultOutcome=invalid`,
    );
  }

  for (const field of [
    "learningRelevant",
    "customerVisible",
    "enterpriseRelevant",
    "investorRelevant",
  ] as const) {
    if (
      typeof definition[field] !==
      "boolean"
    ) {
      invalid.push(
        `${type}.${field}=invalid`,
      );
    }
  }

  if (definition.type !== type) {
    invalid.push(
      `${type}.definition.type=${String(
        definition.type,
      )}`,
    );
  }
}

console.log(
  "ANALYTICS REGISTRY CHECK",
);

console.log(
  `contractEvents=${types.length}`,
);

console.log(
  `registryEvents=${registryTypes.length}`,
);

console.log(
  `missing=${
    missing.length
      ? missing.join(",")
      : "none"
  }`,
);

console.log(
  `extra=${
    extra.length
      ? extra.join(",")
      : "none"
  }`,
);

console.log(
  `invalid=${
    invalid.length
      ? invalid.join(",")
      : "none"
  }`,
);

if (
  missing.length ||
  extra.length ||
  invalid.length
) {
  process.exit(1);
}

console.log(
  "REGISTRY COMPLETE: PASS",
);