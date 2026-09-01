import "dotenv/config";

import { db } from "@qre/db";
import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function textOfMoment(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const payload = record.payload && typeof record.payload === "object"
    ? (record.payload as Record<string, unknown>)
    : undefined;
  return clean(record.text ?? payload?.text ?? record.content ?? payload?.content);
}

const assetId = clean(process.env.QRE_VISIBLE_ASSET_ID) || "GRIMES";
const lens = "game";
const prompt = clean(process.env.QRE_GAME_BORING_PROMPT) || [
  "Maria cleaned 2 bathrooms and the kitchen at Elm House.",
  "Create the finished customer-facing experience as a short cinematic service receipt film.",
].join(" ");

const sessionId = `acceptance:first-time-game:${assetId}:${Date.now()}`;
const operationId = sessionId;

const asset = await db.asset.findUnique({
  where: { id: assetId },
  select: { id: true, displayName: true, slug: true },
});

if (!asset) throw new Error(`Game first-time asset not found: ${assetId}`);

console.log("--- QRE FIRST-TIME BORING SERVICE / GAME LENS ---");
console.log(`asset=${asset.id}`);
console.log(`slug=${asset.slug}`);
console.log(`lens=${lens}`);
console.log(`prompt=${prompt}`);
console.log("");

const result = await compileExperience({
  assetId: asset.id,
  prompt,
  lens,
  movieMode: true,
  sessionId,
  operationId,
  memoryRepository: createMemoryRepository(),
});

const lines = result.moments
  .slice()
  .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
  .map(textOfMoment)
  .filter(Boolean);

console.log("============================================================");
console.log(`USER SEES · ${clean(asset.displayName) || asset.slug}`);
console.log("LENS · game");
console.log("============================================================");
for (let i = 0; i < lines.length; i += 1) console.log(`${i + 1}. ${lines[i]}`);
console.log("============================================================");
console.log(`moments=${result.momentCount}`);
console.log(`scenes=${result.cinematicScenes.length}`);
console.log("============================================================");

await db.scanSession.delete({ where: { id: sessionId } });
await db.$disconnect();

console.log("PASS · first-time boring-service game output generated and cleaned");
