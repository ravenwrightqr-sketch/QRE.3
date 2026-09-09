import assert from "node:assert/strict";
import {
  fallbackModelForCapability,
  modelForCapability,
} from "./src/services/modelCapabilities.js";
import { localModelConfig } from "./src/services/localModelRuntime.js";

const keys = [
  "QRE_AUTHOR_FAST_MODEL",
  "QRE_AUTHOR_MODEL",
  "QRE_LOCAL_MODEL",
  "QRE_VISION_MODEL",
  "QRE_DOCUMENT_MODEL",
  "QRE_AUTHOR_FALLBACK_MODEL",
  "QRE_VISION_FALLBACK_MODEL",
  "QRE_DOCUMENT_FALLBACK_MODEL",
] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

try {
  process.env.QRE_AUTHOR_FAST_MODEL = "author-benchmark-model";
  process.env.QRE_AUTHOR_MODEL = "author-model";
  process.env.QRE_LOCAL_MODEL = "legacy-default";
  process.env.QRE_VISION_MODEL = "vision-model";
  process.env.QRE_DOCUMENT_MODEL = "document-model";
  process.env.QRE_AUTHOR_FALLBACK_MODEL = "author-fallback";
  process.env.QRE_VISION_FALLBACK_MODEL = "vision-fallback";
  process.env.QRE_DOCUMENT_FALLBACK_MODEL = "document-fallback";

  assert.equal(modelForCapability("author"), "author-benchmark-model");
  assert.equal(modelForCapability("vision"), "vision-model");
  assert.equal(modelForCapability("document"), "document-model");
  assert.equal(fallbackModelForCapability("author"), "author-fallback");
  assert.equal(fallbackModelForCapability("vision"), "vision-fallback");
  assert.equal(fallbackModelForCapability("document"), "document-fallback");

  assert.equal(localModelConfig("author").model, "author-benchmark-model");
  assert.equal(localModelConfig("vision").model, "vision-model");
  assert.equal(localModelConfig("document").model, "document-model");

  const visionCapable = localModelConfig("vision");
  assert.equal(visionCapable.capability, "vision");
  assert.notEqual(visionCapable.model, process.env.QRE_AUTHOR_FAST_MODEL);
  assert.notEqual(visionCapable.fallbackModel, process.env.QRE_AUTHOR_FALLBACK_MODEL);

  process.env.QRE_VISION_MODEL = "";
  assert.equal(modelForCapability("vision"), "qwen2.5vl:7b");
  assert.notEqual(modelForCapability("vision"), process.env.QRE_AUTHOR_FAST_MODEL);

  console.log("CAPABILITY BOUNDARY ACCEPTANCE: PASS");
  console.log(JSON.stringify({
    author: localModelConfig("author"),
    vision: localModelConfig("vision"),
    document: localModelConfig("document"),
  }, null, 2));
} finally {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
