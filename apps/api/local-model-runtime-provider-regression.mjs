import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { localModelGenerate } from "./dist/services/localModelRuntime.js";

const authorSource = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const groundingVerifierSource = readFileSync(
  new URL("./src/services/authorCreativeGroundingVerifier.ts", import.meta.url),
  "utf8",
);
const directAuthorStart = authorSource.indexOf("export function buildDirectAuthorMemoryMessages");
const directAuthorEnd = authorSource.indexOf("function buildDeterministicMouthFallback", directAuthorStart);
assert.ok(directAuthorStart >= 0 && directAuthorEnd > directAuthorStart, "direct Author prompt region not found");
assert.equal(
  createHash("sha256").update(authorSource.slice(directAuthorStart, directAuthorEnd)).digest("hex"),
  "0d81899c9379fc1268f956d9d60a5a128a40c6ec6b67295c6f1bd42253c1349a",
  "Direct Creative Author prompt region must match the perception/amplification doctrine revision",
);

const claimAuditorStart = authorSource.indexOf("async function editDirectAuthorReality");
const claimAuditorEnd = authorSource.indexOf("async function assignDirectAuthorProductionProvenance", claimAuditorStart);
assert.ok(claimAuditorStart >= 0 && claimAuditorEnd > claimAuditorStart, "claim auditor call region not found");
assert.match(
  authorSource.slice(claimAuditorStart, claimAuditorEnd),
  /numPredict: 750,\r?\n\s+openRouterMaxTokens: 1800,/,
  "Claim Auditor must keep Ollama numPredict=750; OpenRouter runtime lifts the lower caller hint",
);

const provenanceStart = authorSource.indexOf("async function assignDirectAuthorProductionProvenance");
const provenanceEnd = authorSource.indexOf("async function generateDirectAuthorMemoryProductions", provenanceStart);
assert.ok(provenanceStart >= 0 && provenanceEnd > provenanceStart, "provenance call region not found");
assert.match(
  authorSource.slice(provenanceStart, provenanceEnd),
  /numPredict: 520,\r?\n\s+openRouterMaxTokens: 1200,/,
  "Provenance must keep Ollama numPredict=520; OpenRouter runtime lifts the lower caller hint",
);

const groundingVerifierStart = groundingVerifierSource.indexOf("export async function verifyAuthorCreativeGrounding");
assert.ok(groundingVerifierStart >= 0, "final grounding verifier call region not found");
assert.match(
  groundingVerifierSource.slice(groundingVerifierStart),
  /numPredict: Math\.max\(420, atomicClauses\.length \* 90\),\r?\n\s+openRouterMaxTokens: 1200,/,
  "Final grounding verifier must keep Ollama numPredict dynamic limit; OpenRouter runtime lifts the lower caller hint",
);

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalLog = console.log;

const messages = [
  { role: "system", content: "System prompt stays byte-for-byte." },
  { role: "user", content: "User prompt stays byte-for-byte." },
];
const authorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["attempts"],
  properties: {
    attempts: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text"],
        properties: {
          text: { type: "string" },
        },
      },
    },
  },
};
const provenanceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["assignments"],
  properties: {
    assignments: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["production", "lines"],
        properties: {
          production: { type: "string", enum: ["A", "B", "C"] },
          lines: {
            type: "array",
            minItems: 0,
            maxItems: 12,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["order", "sourceEventIds"],
              properties: {
                order: { type: "integer", minimum: 1 },
                sourceEventIds: {
                  type: "array",
                  minItems: 1,
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
              required: ["exactText", "classification", "sourceEventIds", "atomicity"],
              properties: {
                exactText: { type: "string" },
                classification: {
                  type: "string",
                  enum: ["SUPPORTED_REALITY", "KEEP_EXPRESSION", "UNSUPPORTED_REALITY"],
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
const finalGroundingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verifications"],
  properties: {
    verifications: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sceneIndex",
          "clauseIndex",
          "supported",
          "supportKind",
          "sourceEventIds",
          "concreteClaims",
          "unsupportedClaims",
        ],
        properties: {
          sceneIndex: { type: "integer", minimum: 0, maximum: 2 },
          clauseIndex: { type: "integer", minimum: 0, maximum: 11 },
          supported: { type: "boolean" },
          supportKind: {
            type: "string",
            enum: ["DIRECT", "PARAPHRASE", "FIGURATIVE", "CONTEXTUAL_TEXTURE", "UNSUPPORTED"],
          },
          sourceEventIds: {
            type: "array",
            maxItems: 32,
            items: { type: "string", maxLength: 64 },
          },
          concreteClaims: {
            type: "array",
            maxItems: 12,
            items: { type: "string", maxLength: 120 },
          },
          unsupportedClaims: {
            type: "array",
            maxItems: 12,
            items: { type: "string", maxLength: 120 },
          },
        },
      },
    },
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const originalAuthorSchema = clone(authorSchema);
const originalProvenanceSchema = clone(provenanceSchema);
const originalClaimAuditorSchema = clone(claimAuditorSchema);
const originalFinalGroundingSchema = clone(finalGroundingSchema);

const calls = [];
const logs = [];

function restore() {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  console.log = originalLog;
}

function mockFetch(responseJson) {
  globalThis.fetch = async (url, init = {}) => {
    const body = JSON.parse(String(init.body ?? "{}"));
    calls.push({
      url: String(url),
      method: init.method,
      headers: init.headers,
      body,
    });

    return {
      ok: true,
      status: 200,
      async json() {
        return responseJson;
      },
      async text() {
        return JSON.stringify(responseJson);
      },
    };
  };
}

function schemaFromLastCall() {
  return calls.at(-1).body.response_format.json_schema.schema;
}

function collectMinItemsZero(value, path = "$", found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectMinItemsZero(item, `${path}[${index}]`, found));
    return found;
  }

  if (!value || typeof value !== "object") return found;

  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if (key === "minItems" && nested === 0) found.push(nextPath);
    collectMinItemsZero(nested, nextPath, found);
  }

  return found;
}

try {
  console.log = (...args) => {
    logs.push(args.map((arg) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" "));
  };

  process.env = { ...originalEnv };
  process.env.QRE_AI_PROVIDER = "ollama";
  process.env.QRE_LOCAL_MODEL_URL = "http://mock-ollama.local";
  process.env.QRE_AUTHOR_FAST_MODEL = "unchanged-ollama-model";
  process.env.QRE_AUTHOR_FALLBACK_MODEL = "disabled";
  process.env.QRE_LOCAL_MODEL_TEMPERATURE = "";
  process.env.QRE_LOCAL_MODEL_NUM_PREDICT = "";
  process.env.OPENROUTER_API_KEY = "should-not-be-used-by-ollama";
  calls.length = 0;
  logs.length = 0;
  mockFetch({ message: { content: "{\"answer\":\"ollama\"}" }, done: true });

  const ollamaResult = await localModelGenerate(messages, "json", {
    temperature: 0.21,
    numPredict: 55,
    openRouterMaxTokens: 1200,
    jsonSchema: provenanceSchema,
  });

  assert.equal(ollamaResult.provider, "local");
  assert.equal(ollamaResult.model, "unchanged-ollama-model");
  assert.equal(ollamaResult.text, "{\"answer\":\"ollama\"}");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://mock-ollama.local/api/chat");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body.model, "unchanged-ollama-model");
  assert.deepEqual(calls[0].body.messages, messages);
  assert.deepEqual(calls[0].body.format, provenanceSchema);
  assert.equal(calls[0].body.format.properties.assignments.minItems, 3);
  assert.equal(calls[0].body.format.properties.assignments.maxItems, 3);
  assert.equal(
    calls[0].body.format.properties.assignments.items.properties.lines.minItems,
    0,
    "Ollama must preserve minItems:0 exactly",
  );
  assert.equal(calls[0].body.options.temperature, 0.21);
  assert.equal(calls[0].body.options.num_predict, 55);

  calls.length = 0;
  await localModelGenerate(messages, "json", {
    temperature: 0.12,
    numPredict: 520,
    openRouterMaxTokens: 1200,
    jsonSchema: provenanceSchema,
  });
  assert.equal(calls[0].body.options.num_predict, 520, "Ollama Provenance token limit must remain 520");

  calls.length = 0;
  await localModelGenerate(messages, "json", {
    temperature: 0.08,
    numPredict: 750,
    openRouterMaxTokens: 1800,
    jsonSchema: claimAuditorSchema,
  });
  assert.equal(calls[0].body.options.num_predict, 750, "Ollama Claim Auditor token limit must remain 750");
  assert.deepEqual(
    calls[0].body.format,
    claimAuditorSchema,
    "Ollama Claim Auditor schema must remain structurally unchanged",
  );
  assert.equal(
    JSON.stringify(calls[0].body.format),
    JSON.stringify(claimAuditorSchema),
    "Ollama Claim Auditor serialized schema must remain byte-for-byte unchanged",
  );
  assert.equal(
    calls[0].body.format.properties.audits.items.properties.atomicClaimSpans.maxItems,
    64,
    "Ollama Claim Auditor schema must keep atomicClaimSpans.maxItems:64",
  );

  calls.length = 0;
  await localModelGenerate(messages, "json", {
    temperature: 0.06,
    numPredict: 450,
    openRouterMaxTokens: 1200,
    jsonSchema: finalGroundingSchema,
  });
  assert.equal(calls[0].body.options.num_predict, 450, "Ollama final grounding verifier token limit must remain 450");

  process.env = { ...originalEnv };
  process.env.QRE_AI_PROVIDER = "openrouter";
  process.env.OPENROUTER_API_KEY = "or-secret-token-for-test";
  process.env.QRE_AUTHOR_FAST_MODEL = "vendor/model-id:exact";
  process.env.QRE_AUTHOR_FALLBACK_MODEL = "disabled";
  process.env.QRE_LOCAL_MODEL_TEMPERATURE = "";
  process.env.QRE_LOCAL_MODEL_NUM_PREDICT = "";
  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "stop",
      native_finish_reason: "STOP",
      message: { content: "{\"attempts\":[{\"text\":\"A\"},{\"text\":\"B\"},{\"text\":\"C\"}]}" },
    }],
    usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
  });

  const openRouterResult = await localModelGenerate(messages, "json", {
    temperature: 0.34,
    numPredict: 1050,
    jsonSchema: authorSchema,
  });

  assert.equal(openRouterResult.provider, "local");
  assert.equal(openRouterResult.model, "vendor/model-id:exact");
  assert.equal(openRouterResult.text, "{\"attempts\":[{\"text\":\"A\"},{\"text\":\"B\"},{\"text\":\"C\"}]}");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.Authorization, "Bearer or-secret-token-for-test");
  assert.equal(calls[0].headers["Content-Type"], "application/json");
  assert.equal(calls[0].body.model, "vendor/model-id:exact");
  assert.deepEqual(calls[0].body.messages, messages);
  assert.equal(calls[0].body.temperature, 0.34);
  assert.equal(calls[0].body.max_tokens, 3000, "Direct Author OpenRouter max_tokens must use development ceiling 3000");
  assert.deepEqual(calls[0].body.response_format, {
    type: "json_schema",
    json_schema: {
      name: "qre_structured_output",
      strict: true,
      schema: authorSchema,
    },
  });
  assert.equal(collectMinItemsZero(schemaFromLastCall()).length, 0);
  assert.equal(
    logs.some((line) => line.includes("QRE OPENROUTER RESPONSE CHOICES: 1")),
    true,
    "OpenRouter completion metadata must include choices length",
  );
  assert.equal(
    logs.some((line) => line.includes("finish_reason=stop") && line.includes("native_finish_reason=STOP")),
    true,
    "OpenRouter completion metadata must include finish reasons",
  );
  assert.equal(
    logs.some((line) => line.includes("completion=7") && line.includes("max_tokens=3000")),
    true,
    "OpenRouter completion metadata must include usage and max_tokens",
  );
  assert.equal(
    logs.join("\n").includes("or-secret-token-for-test"),
    false,
    "OpenRouter API key must not be logged",
  );

  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "stop",
      native_finish_reason: "STOP",
      message: { content: "{\"assignments\":[]}" },
    }],
    usage: { prompt_tokens: 21, completion_tokens: 5, total_tokens: 26 },
  });

  await localModelGenerate(messages, "json", {
    temperature: 0.12,
    numPredict: 520,
    openRouterMaxTokens: 1200,
    jsonSchema: provenanceSchema,
  });

  const openRouterProvenanceSchema = schemaFromLastCall();
  assert.equal(calls[0].body.model, "vendor/model-id:exact");
  assert.deepEqual(calls[0].body.messages, messages);
  assert.equal(calls[0].body.max_tokens, 3000, "OpenRouter Provenance max_tokens must use development ceiling 3000");
  assert.deepEqual(
    collectMinItemsZero(openRouterProvenanceSchema),
    [],
    "OpenRouter/Google request schema must not contain no-op minItems:0",
  );
  const openRouterAssignments = openRouterProvenanceSchema.properties.assignments;
  const openRouterAssignmentItem = openRouterAssignments.items;
  const openRouterLines = openRouterAssignmentItem.properties.lines;
  const openRouterSourceEventIds = openRouterLines.items.properties.sourceEventIds;
  assert.equal(
    openRouterAssignments.minItems,
    undefined,
    "OpenRouter provenance transport must omit only outer assignments minItems",
  );
  assert.equal(
    openRouterAssignments.maxItems,
    undefined,
    "OpenRouter provenance transport must omit only outer assignments maxItems",
  );
  assert.deepEqual(openRouterAssignmentItem.properties.production.enum, ["A", "B", "C"]);
  assert.equal(openRouterLines.maxItems, 12);
  assert.equal(openRouterLines.items.properties.order.minimum, 1);
  assert.equal(openRouterSourceEventIds.minItems, 1);
  assert.equal(openRouterSourceEventIds.maxItems, 32);
  assert.equal(openRouterSourceEventIds.items.maxLength, 64);
  assert.equal(openRouterAssignmentItem.additionalProperties, false);
  assert.equal(openRouterLines.items.additionalProperties, false);
  assert.equal(
    openRouterLines.minItems,
    undefined,
    "Transport should elide only the no-op lines minItems:0",
  );
  assert.equal(
    openRouterSourceEventIds.minItems,
    1,
    "Semantic sourceEventIds minimum must remain intact",
  );
  assert.equal(
    provenanceSchema.properties.assignments.items.properties.lines.minItems,
    0,
    "Transport normalization must not mutate the caller schema",
  );

  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "stop",
      native_finish_reason: "STOP",
      message: { content: "{\"audits\":[]}" },
    }],
    usage: { prompt_tokens: 31, completion_tokens: 6, total_tokens: 37 },
  });

  await localModelGenerate(messages, "json", {
    temperature: 0.08,
    numPredict: 750,
    openRouterMaxTokens: 1800,
    jsonSchema: claimAuditorSchema,
  });

  const openRouterClaimSchema = schemaFromLastCall();
  assert.equal(calls[0].body.max_tokens, 12000, "OpenRouter Claim Auditor max_tokens must use development ceiling 12000");
  const openRouterAudits = openRouterClaimSchema.properties.audits;
  assert.equal(
    openRouterAudits.minItems,
    undefined,
    "OpenRouter Claim Auditor transport must omit only outer audits minItems",
  );
  assert.equal(
    openRouterAudits.maxItems,
    undefined,
    "OpenRouter Claim Auditor transport must omit only outer audits maxItems",
  );
  const atomicClaimSpans =
    openRouterAudits.items.properties.atomicClaimSpans;
  const expectedOpenRouterClaimSchema = clone(claimAuditorSchema);
  delete expectedOpenRouterClaimSchema.properties.audits.minItems;
  delete expectedOpenRouterClaimSchema.properties.audits.maxItems;
  delete expectedOpenRouterClaimSchema.properties.audits.items.properties.atomicClaimSpans.maxItems;
  assert.deepEqual(
    openRouterClaimSchema,
    expectedOpenRouterClaimSchema,
    "OpenRouter Claim Auditor transport must omit only audits minItems/maxItems and atomicClaimSpans.maxItems",
  );
  assert.deepEqual(
    openRouterAudits.items.required,
    ["production", "atomicClaimSpans"],
    "Claim Auditor schema must still require atomicClaimSpans",
  );
  assert.deepEqual(
    openRouterAudits.items.properties.production.enum,
    ["A", "B", "C"],
    "Claim Auditor production enum must remain intact",
  );
  assert.equal(openRouterAudits.items.additionalProperties, false);
  assert.equal(atomicClaimSpans.minItems, 0);
  assert.equal(
    atomicClaimSpans.maxItems,
    undefined,
    "OpenRouter Claim Auditor transport must omit atomicClaimSpans.maxItems:64",
  );
  assert.deepEqual(
    atomicClaimSpans.items.required,
    ["exactText", "classification", "sourceEventIds", "atomicity"],
    "Claim Auditor atomic span contract must remain intact",
  );
  assert.equal(atomicClaimSpans.items.additionalProperties, false);
  assert.equal(atomicClaimSpans.items.properties.exactText.type, "string");
  assert.deepEqual(
    atomicClaimSpans.items.properties.classification.enum,
    ["SUPPORTED_REALITY", "KEEP_EXPRESSION", "UNSUPPORTED_REALITY"],
    "Claim Auditor classification enum must remain intact",
  );
  assert.deepEqual(
    atomicClaimSpans.items.properties.atomicity.enum,
    ["SMALLEST_INDEPENDENT_CLASSIFIABLE_UNIT"],
    "Claim Auditor atomicity marker must remain intact",
  );
  assert.deepEqual(
    atomicClaimSpans.items.properties.sourceEventIds,
    {
      type: "array",
      minItems: 0,
      maxItems: 32,
      items: { type: "string", maxLength: 64 },
    },
    "Claim Auditor sourceEventIds constraints must remain intact",
  );
  assert.deepEqual(
    collectMinItemsZero(openRouterClaimSchema),
    [
      "$.properties.audits.items.properties.atomicClaimSpans.minItems",
      "$.properties.audits.items.properties.atomicClaimSpans.items.properties.sourceEventIds.minItems",
    ],
    "Claim Auditor OpenRouter transport must preserve semantic nested minItems",
  );

  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "stop",
      native_finish_reason: "STOP",
      message: { content: "{\"verifications\":[]}" },
    }],
    usage: { prompt_tokens: 37, completion_tokens: 9, total_tokens: 46 },
  });

  await localModelGenerate(messages, "json", {
    temperature: 0.06,
    numPredict: 450,
    openRouterMaxTokens: 1200,
    jsonSchema: finalGroundingSchema,
  });

  assert.equal(
    calls[0].body.max_tokens,
    4000,
    "OpenRouter final grounding verifier max_tokens must use development ceiling 4000",
  );
  assert.equal(
    calls[0].body.response_format.json_schema.schema.properties.verifications.maxItems,
    3,
    "Final grounding verifier schema cardinality must stay unchanged",
  );

  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "length",
      native_finish_reason: "MAX_TOKENS",
      message: { content: "{\"verifications\":[]}" },
    }],
    usage: { prompt_tokens: 41, completion_tokens: 77, total_tokens: 118 },
  });

  await assert.rejects(
    () => localModelGenerate(messages, "json", {
      temperature: 0.06,
      numPredict: 450,
      openRouterMaxTokens: 1200,
      jsonSchema: finalGroundingSchema,
    }),
    /OpenRouter structured output truncated: finish_reason=length native_finish_reason=MAX_TOKENS.*max_tokens=4000/,
    "HTTP 200 structured completions with length/max-token finish must fail explicitly",
  );

  calls.length = 0;
  logs.length = 0;
  mockFetch({
    choices: [{
      finish_reason: "stop",
      native_finish_reason: "STOP",
      message: { content: "{\"verifications\"" },
    }],
    usage: { prompt_tokens: 41, completion_tokens: 3, total_tokens: 44 },
  });

  await assert.rejects(
    () => localModelGenerate(messages, "json", {
      temperature: 0.06,
      numPredict: 450,
      openRouterMaxTokens: 1200,
      jsonSchema: finalGroundingSchema,
    }),
    /OpenRouter structured output was not complete JSON/,
    "HTTP 200 structured completions with incomplete JSON must fail explicitly",
  );

  assert.deepEqual(authorSchema, originalAuthorSchema, "Direct Author schema object must not be mutated");
  assert.deepEqual(provenanceSchema, originalProvenanceSchema, "Provenance schema object must not be mutated");
  assert.deepEqual(claimAuditorSchema, originalClaimAuditorSchema, "Claim Auditor schema object must not be mutated");
  assert.deepEqual(finalGroundingSchema, originalFinalGroundingSchema, "Final grounding verifier schema object must not be mutated");

  process.env = { ...originalEnv };
  process.env.QRE_AI_PROVIDER = "openrouter";
  delete process.env.OPENROUTER_API_KEY;
  process.env.QRE_AUTHOR_FAST_MODEL = "vendor/model-id:exact";
  calls.length = 0;
  logs.length = 0;
  globalThis.fetch = async () => {
    throw new Error("fetch should not run without OPENROUTER_API_KEY");
  };

  await assert.rejects(
    () => localModelGenerate(messages, "json", { jsonSchema: authorSchema }),
    /QRE_AI_PROVIDER=openrouter requires OPENROUTER_API_KEY/,
    "missing OpenRouter key must fail clearly",
  );
  assert.equal(calls.length, 0);
} finally {
  restore();
}

console.log("LOCAL MODEL PROVIDER ROUTING GREEN - OLLAMA PRESERVED - OPENROUTER MAPPED - NO LIVE CALLS");
