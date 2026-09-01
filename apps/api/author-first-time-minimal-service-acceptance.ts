import "dotenv/config";

import { db } from "@qre/db";
import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function textOfMoment(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const payload =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : undefined;

  return clean(
    record.text ??
      payload?.text ??
      record.content ??
      payload?.content,
  );
}

const assetId = clean(process.env.QRE_VISIBLE_ASSET_ID) || "GRIMES";
const lenses = [
  clean(process.env.QRE_VISIBLE_LENS_1) || "noir",
  clean(process.env.QRE_VISIBLE_LENS_2) || "funny",
  clean(process.env.QRE_VISIBLE_LENS_3) || "spy",
  clean(process.env.QRE_VISIBLE_LENS_4) || "game",
];

// Deliberately minimal first-time input. No memory instructions, no genre
// vocabulary, no domain template, and no authored punchline.
const prompt =
  clean(process.env.QRE_VISIBLE_MINIMAL_PROMPT) ||
  "Maria cleaned two bathrooms and the kitchen. Geodrop. 11:01 AM. 12:12 PM. Create the customer-facing experience as a short film receipt.";

const memoryRepository = createMemoryRepository();

const asset = await db.asset.findUnique({
  where: { id: assetId },
  select: { id: true, slug: true, displayName: true },
});

if (!asset) {
  throw new Error(`First-time minimal asset not found: ${assetId}`);
}

console.log("--- QRE FIRST-TIME MINIMAL SERVICE ACCEPTANCE ---");
console.log(`asset=${asset.id}`);
console.log(`slug=${asset.slug}`);
console.log(`prompt=${prompt}`);
console.log("memoryMode=production-memory-available");

for (const [index, lens] of lenses.entries()) {
  const sessionId =
    `acceptance:first-time-minimal:${asset.id}:${lens}:${Date.now()}:${index}`;

  const result = await compileExperience({
    assetId: asset.id,
    prompt,
    lens,
    movieMode: true,
    sessionId,
    operationId: sessionId,
    memoryRepository,
  });

  const diagnostics =
    result.authorDiagnostics && typeof result.authorDiagnostics === "object"
      ? (result.authorDiagnostics as Record<string, unknown>)
      : {};

  const lines = result.moments
    .slice()
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map(textOfMoment)
    .filter(Boolean);

  console.log("\n============================================================");
  console.log(`USER SEES · ${lens.toUpperCase()}`);
  console.log("============================================================");
  for (const line of lines) {
    console.log(line);
    console.log();
  }
  console.log("------------------------------------------------------------");
  console.log(`moments=${result.momentCount}`);
  console.log(`scenes=${result.cinematicScenes.length}`);
  console.log(`quality=${clean(diagnostics.qualityStatus)}`);
  console.log(`score=${clean(diagnostics.selectedScore)}`);
  console.log(`renderable=${diagnostics.renderable === true}`);
  console.log(`complete=${diagnostics.complete === true}`);

  await db.scanSession.delete({ where: { id: sessionId } });
}

await db.$disconnect();

console.log("\nPASS · first-time minimal service outputs generated and cleaned");
