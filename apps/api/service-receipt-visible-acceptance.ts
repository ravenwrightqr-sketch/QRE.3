import "dotenv/config";

import { db } from "@qre/db";
import { buildServiceReceipt, createStoryDelivery } from "@qre/engine";
import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { createStoryDeliveryRepository } from "./src/repositories/storyDeliveryRepository.js";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

const assetId = clean(process.env.QRE_TEST_SERVICE_ASSET_ID);
if (!assetId) throw new Error("Set QRE_TEST_SERVICE_ASSET_ID to an active service/business asset before running this acceptance.");

const asset = await db.asset.findFirst({
  where: { id: assetId, status: "active", category: { in: ["service", "business"] } },
  select: { id: true, slug: true, displayName: true, category: true },
});
if (!asset) throw new Error(`No active service/business asset found for ${assetId}`);

const sessionId = `acceptance:service-receipt:${asset.id}:${Date.now()}`;
const prompt = [
  "Cleaning service completed.",
  "Kitchen cleaned.",
  "Two bathrooms cleaned.",
  "Geodrop captured.",
  "Service time: 11:01 AM to 12:12 PM.",
  "Anything funny: 55 shampoos.",
  "Anything odd: 666 knives out.",
  "Anything different: cats everywhere.",
  "Create the finished customer-facing cinematic service receipt film.",
].join("\n");

const experience = await compileExperience({
  assetId: asset.id,
  prompt,
  sessionId,
  operationId: sessionId,
  memoryRepository: createMemoryRepository(),
  movieMode: true,
});

const receipt = buildServiceReceipt({
  asset: { ...asset, experience: { title: experience.title, sourcePrompt: prompt } },
  sessionId,
  moments: experience.moments,
});

const delivery = await createStoryDelivery({
  assetId: asset.id,
  sessionId,
  userId: null,
  recipient: undefined,
  moments: experience.moments as any,
  geoStory: experience.geoStory as any,
  cinematicScenes: experience.cinematicScenes as any,
}, createStoryDeliveryRepository());

await db.scanSession.update({
  where: { id: sessionId },
  data: {
    status: "completed",
    endedAt: new Date(),
    moments: experience.moments,
    geoStory: experience.geoStory,
    cinematicScenes: experience.cinematicScenes,
    memorySnapshot: experience.memorySnapshot,
    receipt,
  },
});

const lines = experience.moments
  .slice()
  .sort((a: any, b: any) => Number(a.order ?? 0) - Number(b.order ?? 0))
  .map((moment: any) => clean(moment?.payload?.text ?? moment?.text))
  .filter(Boolean);

console.log("--- QRE SERVICE RECEIPT VISIBLE ACCEPTANCE ---");
console.log(`asset=${asset.displayName || asset.slug}`);
console.log(`category=${asset.category}`);
console.log(`shareUrl=${delivery.shareUrl}`);
console.log(`receiptId=${receipt.id}`);
console.log("\nUSER VISIBLE FILM:\n");
for (const line of lines) console.log(line + "\n");
console.log(`moments=${experience.momentCount}`);
console.log(`scenes=${experience.cinematicScenes.length}`);
console.log(`quality=${clean((experience.authorDiagnostics as any)?.qualityStatus)}`);
console.log(`renderable=${Boolean((experience.authorDiagnostics as any)?.renderable)}`);

await db.memorySnapshot.deleteMany({ where: { id: delivery.storyId } });
await db.scanSession.delete({ where: { id: sessionId } });
await db.$disconnect();

console.log("PASS · service receipt film path persisted, rendered, shared, and cleaned up");
