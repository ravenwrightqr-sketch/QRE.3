import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import { localModelGenerate } from "./dist/services/localModelRuntime.js";

dotenv.config({ path: new URL("./.env", import.meta.url), quiet: true });

function cliValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return "";
  }

  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : "";
}

const configPath = cliValue("--config");
const fileConfig = configPath
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : {};

const cliModel = cliValue("--model");
const cliKeyFile = cliValue("--key-file");

const configuredModel =
  cliModel ||
  fileConfig.model ||
  fileConfig.openRouterModel ||
  fileConfig.OPENROUTER_MODEL ||
  fileConfig.QRE_AUTHOR_FAST_MODEL ||
  process.env.OPENROUTER_DIAGNOSTIC_MODEL ||
  "";

const configuredApiKey =
  fileConfig.apiKey ||
  fileConfig.openRouterApiKey ||
  fileConfig.OPENROUTER_API_KEY ||
  (cliKeyFile ? readFileSync(cliKeyFile, "utf8").trim() : "");

const authorSource = readFileSync(
  new URL("./src/services/authorCreative.ts", import.meta.url),
  "utf8",
);

const directAuthorStart = authorSource.indexOf(
  "async function generateDirectAuthorMemoryProductions",
);
const directAuthorEnd = authorSource.indexOf(
  "function buildDeterministicMouthFallback",
  directAuthorStart,
);

if (directAuthorStart < 0 || directAuthorEnd <= directAuthorStart) {
  throw new Error("Direct Creative Author prompt region not found");
}

const authorPromptHash = createHash("sha256")
  .update(authorSource.slice(directAuthorStart, directAuthorEnd))
  .digest("hex");

const expectedAuthorPromptHash =
  "49a18a5ca7c73e6a48e0016bf5bfe17b2d8b5965e1463f13cf9da0436dbac21d";

if (authorPromptHash !== expectedAuthorPromptHash) {
  throw new Error(
    `Direct Creative Author prompt hash changed: ${authorPromptHash}`,
  );
}

process.env.QRE_AI_PROVIDER = "openrouter";

if (configuredModel) {
  process.env.QRE_AUTHOR_FAST_MODEL = configuredModel;
}

if (configuredApiKey) {
  process.env.OPENROUTER_API_KEY = configuredApiKey;
}

const selectedModel =
  process.env.QRE_AUTHOR_FAST_MODEL ||
  process.env.QRE_LOCAL_MODEL ||
  "qwen2.5vl:7b";

if (/gemma/i.test(selectedModel)) {
  throw new Error(
    [
      "Refusing to run Gemma.",
      "Set QRE_AUTHOR_FAST_MODEL or OPENROUTER_DIAGNOSTIC_MODEL to the same non-Gemma OpenRouter model used by the live run.",
    ].join(" "),
  );
}

const claimAuditorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["audits"],
  properties: {
    audits: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["production", "atomicClaimSpans"],
        properties: {
          production: { type: "string", enum: ["A", "B", "C"] },
          atomicClaimSpans: {
            type: "array",
            minItems: 0,
            maxItems: 64,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "exactText",
                "classification",
                "sourceEventIds",
                "atomicity",
              ],
              properties: {
                exactText: { type: "string" },
                classification: {
                  type: "string",
                  enum: [
                    "SUPPORTED_REALITY",
                    "KEEP_EXPRESSION",
                    "UNSUPPORTED_REALITY",
                  ],
                },
                atomicity: {
                  type: "string",
                  enum: ["SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT"],
                },
                sourceEventIds: {
                  type: "array",
                  minItems: 0,
                  maxItems: 32,
                  items: { type: "string", maxLength: 64 },
                },
              },
            },
          },
        },
      },
    },
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function audits(schema) {
  return schema.properties.audits;
}

function auditItem(schema) {
  return audits(schema).items;
}

function auditProperties(schema) {
  return auditItem(schema).properties;
}

function atomicClaimSpans(schema) {
  return auditProperties(schema).atomicClaimSpans;
}

function spanItem(schema) {
  return atomicClaimSpans(schema).items;
}

function spanProperties(schema) {
  return spanItem(schema).properties;
}

function sourceEventIds(schema) {
  return spanProperties(schema).sourceEventIds;
}

function syntheticMessages() {
  return [
    {
      role: "system",
      content: [
        "You are the Claim Auditor.",
        "Return only JSON matching the schema.",
        "Use exact authored spans.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        suppliedReality: [{ id: "event-1", text: "The sample was blue" }],
        productions: [
          { production: "A", text: "The sample was blue." },
          { production: "B", text: "The sample was blue." },
          { production: "C", text: "The sample was blue." },
        ],
      }),
    },
  ];
}

async function runSchemaTest(name, difference, schema) {
  const originalFetch = globalThis.fetch;
  let capturedSchema;
  let httpStatus = "NO_RESPONSE";
  let finishReason;
  let nativeFinishReason;

  globalThis.fetch = async (input, init) => {
    if (typeof init?.body === "string") {
      const body = JSON.parse(init.body);
      capturedSchema = body.response_format?.json_schema?.schema;
    }

    const response = await originalFetch(input, init);
    httpStatus = response.status;

    if (response.ok) {
      const json = await response.clone().json().catch(() => undefined);
      const firstChoice = Array.isArray(json?.choices)
        ? json.choices[0]
        : undefined;
      finishReason = typeof firstChoice?.finish_reason === "string"
        ? firstChoice.finish_reason
        : undefined;
      nativeFinishReason = typeof firstChoice?.native_finish_reason === "string"
        ? firstChoice.native_finish_reason
        : undefined;
    }

    return response;
  };

  try {
    await localModelGenerate(syntheticMessages(), "json", {
      temperature: 0.08,
      numPredict: 750,
      openRouterMaxTokens: 1800,
      jsonSchema: schema,
    });

    return {
      name,
      difference,
      httpStatus,
      finishReason,
      nativeFinishReason,
      accepted: typeof httpStatus === "number" && httpStatus >= 200 && httpStatus < 300,
      schema: capturedSchema,
    };
  } catch (error) {
    return {
      name,
      difference,
      httpStatus,
      finishReason,
      nativeFinishReason,
      accepted: typeof httpStatus === "number" && httpStatus >= 200 && httpStatus < 300,
      error: error instanceof Error ? error.message : String(error),
      schema: capturedSchema,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const testCases = [
  {
    name: "remove atomicClaimSpans maxItems",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.maxItems only.",
    mutate: (schema) => {
      delete atomicClaimSpans(schema).maxItems;
    },
  },
  {
    name: "remove production enum",
    difference:
      "Deleted $.properties.audits.items.properties.production.enum only.",
    mutate: (schema) => {
      delete auditProperties(schema).production.enum;
    },
  },
  {
    name: "remove classification enum",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.classification.enum only.",
    mutate: (schema) => {
      delete spanProperties(schema).classification.enum;
    },
  },
  {
    name: "remove atomicity enum",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.atomicity.enum only.",
    mutate: (schema) => {
      delete spanProperties(schema).atomicity.enum;
    },
  },
  {
    name: "remove sourceEventIds minItems",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.sourceEventIds.minItems only.",
    mutate: (schema) => {
      delete sourceEventIds(schema).minItems;
    },
  },
  {
    name: "remove sourceEventIds maxItems",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.sourceEventIds.maxItems only.",
    mutate: (schema) => {
      delete sourceEventIds(schema).maxItems;
    },
  },
  {
    name: "remove sourceEventIds item maxLength",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.sourceEventIds.items.maxLength only.",
    mutate: (schema) => {
      delete sourceEventIds(schema).items.maxLength;
    },
  },
  {
    name: "remove exactText string type",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.properties.exactText.type only.",
    mutate: (schema) => {
      delete spanProperties(schema).exactText.type;
    },
  },
  {
    name: "remove span additionalProperties false",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.additionalProperties only.",
    mutate: (schema) => {
      delete spanItem(schema).additionalProperties;
    },
  },
  {
    name: "remove audit additionalProperties false",
    difference:
      "Deleted $.properties.audits.items.additionalProperties only.",
    mutate: (schema) => {
      delete auditItem(schema).additionalProperties;
    },
  },
  {
    name: "remove span required array",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.items.required only.",
    mutate: (schema) => {
      delete spanItem(schema).required;
    },
  },
  {
    name: "remove audit required array",
    difference:
      "Deleted $.properties.audits.items.required only.",
    mutate: (schema) => {
      delete auditItem(schema).required;
    },
  },
  {
    name: "remove atomicClaimSpans minItems",
    difference:
      "Deleted $.properties.audits.items.properties.atomicClaimSpans.minItems only.",
    mutate: (schema) => {
      delete atomicClaimSpans(schema).minItems;
    },
  },
];

const results = [];

console.log("OPENROUTER CLAIM AUDITOR SCHEMA DIAGNOSTIC");
console.log(`MODEL: ${selectedModel}`);
console.log(`AUTHOR_PROMPT_HASH: ${authorPromptHash}`);

const baseline = await runSchemaTest(
  "baseline exact final serialized Claim Auditor schema",
  "No diagnostic mutation. This is the production Claim Auditor schema after OpenRouter transport normalization.",
  clone(claimAuditorSchema),
);

results.push(baseline);

console.log("EXACT FINAL SERIALIZED CLAIM AUDITOR SCHEMA");
console.log(JSON.stringify(baseline.schema, null, 2));
console.log("BASELINE RESULT");
console.log(JSON.stringify({
  httpStatus: baseline.httpStatus,
  finishReason: baseline.finishReason,
  nativeFinishReason: baseline.nativeFinishReason,
  accepted: baseline.accepted,
  error: baseline.error,
}, null, 2));

if (!baseline.accepted) {
  for (const testCase of testCases) {
    const schema = clone(claimAuditorSchema);
    testCase.mutate(schema);
    const result = await runSchemaTest(
      testCase.name,
      testCase.difference,
      schema,
    );
    results.push(result);

    console.log("TEST RESULT");
    console.log(JSON.stringify({
      name: result.name,
      difference: result.difference,
      httpStatus: result.httpStatus,
      finishReason: result.finishReason,
      nativeFinishReason: result.nativeFinishReason,
      accepted: result.accepted,
      error: result.error,
    }, null, 2));

    if (result.accepted) {
      break;
    }
  }
}

const accepted = results.find((result, index) => index > 0 && result.accepted);

console.log("MINIMIZATION MATRIX");
console.log(JSON.stringify(
  results.map((result) => ({
    testName: result.name,
    structuralDifference: result.difference,
    httpStatus: result.httpStatus,
    finishReason: result.finishReason,
    nativeFinishReason: result.nativeFinishReason,
    accepted: result.accepted,
    error: result.error,
  })),
  null,
  2,
));

console.log("SMALLEST ACCEPTED CHANGE");
console.log(JSON.stringify(
  accepted
    ? {
        testName: accepted.name,
        structuralDifference: accepted.difference,
      }
    : null,
  null,
  2,
));
