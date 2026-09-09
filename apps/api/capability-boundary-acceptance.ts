import assert from "node:assert/strict";
import { modelForCapability } from "./src/services/modelCapabilities.js";
import { localModelConfig } from "./src/services/localModelRuntime.js";

const originalAuthorFast = process.env.QRE_AUTHOR_FAST_MODEL;
const originalAuthor = process.env.QRE_AUTHOR_MODEL;
const originalLocal = process.env.QRE_LOCAL_MODEL;
const originalVision = process.env.QRE_VISION_MODEL;
const originalDocument = process.env.QRE_DOCUMENT_MODEL;

try {
  process.env.QRE_AUTHOR_FAST_MODEL = "author-benchmark-model";
  process.env.QRE_AUTHOR_MODEL = "author-model";
  process.env.QRE_LOCAL_MODEL = "legacy-default";
  process.env.QRE_VISION_MODEL = "vision-model";
  process.env.QRE_DOCUMENT_MODEL = "document-model";

  assert.equal(modelForCapability("author"), "author-benchmark-model");
  assert.equal(modelForCapability("vision"), "vision-model");
  assert.equal(modelForCapability("document"), "document-model");
  assert.equal(localModelConfig("author").model, "author-benchmark-model");
  assert.equal(localModelConfig("vision").model, "vision-model");
  assert.equal(localModelConfig("document").model, "document-model");

  const visionMessages = [{ role: "user" as const, content: "inspect", images: ["aGVsbG8="] }];
  const visionCapable = localModelConfig("vision");
  assert.equal(visionCapable.capability, "vision");
  assert.notEqual(visionCapable.model, "author-benchmark-model");

  console.log("CAPABILITY BOUNDARY ACCEPTANCE: PASS");
  console.log(JSON.stringify({ author: localModelConfig("author"), vision: visionCapable, document: localModelConfig("document"), imagePath: "vision" }, null, 2));
  void visionMessages;
} finally {
  for (const [key, value] of [
    ["QRE_AUTHOR_FAST_MODEL", originalAuthorFast],
    ["QRE_AUTHOR_MODEL", originalAuthor],
    ["QRE_LOCAL_MODEL", originalLocal],
    ["QRE_VISION_MODEL", originalVision],
    ["QRE_DOCUMENT_MODEL", originalDocument],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
