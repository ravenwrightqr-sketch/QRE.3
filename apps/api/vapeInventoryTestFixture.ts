import { db } from "@qre/db";
import { enqueueKnowledgeIntake } from "./src/services/knowledgeIntake.js";

const slug = process.argv[2] ?? "house-of-vape-and-smoke";

const flavors = [
  "Strawberry Watermelon",
  "Strawberry Banana",
  "Strawberry Kiwi",
  "Strawberry Mango",
  "Strawberry Ice",
  "Blueberry Watermelon",
  "Blue Razz Ice",
  "Blue Dragon",
  "Pineapple Coconut",
  "Mexico Mango",
  "Hawaiian Punch",
  "Triple Berry Punch",
  "Purple Passion Punch",
  "Sour Raspberry Punch",
  "Sour Blue Dust",
  "Sour Punch",
  "Cherry Bomb",
  "Cherry Slush",
  "Grape Slush",
  "Orange Slush",
  "Peach Slush",
  "Cola Slush",
  "Pink & Blue",
  "Gummy Bear",
  "White Gummy",
  "Blue Rancher B-Pop",
  "Strawberry B-Pop",
  "OMG B-POP",
  "Blueberry Cotton Candy",
  "Strawberry Cotton Candy",
  "Watermelon Cotton Candy",
  "Chocolate Cupcake",
  "Strawberry Cupcake",
  "Red Velvet Cupcake",
  "Vanilla Ice Cream",
  "Strawnana Ice Cream",
  "Watermelon Ice",
  "Juicy Peach Ice",
  "Frozen Banana",
  "Frozen Blackberry",
  "Frozen Blueberry",
  "Frozen Lemon",
  "Frozen Pineapple",
  "Frozen Watermelon",
  "Frozen Strawberry Grapefruit",
  "Frozen Wildberry Mix",
  "Frozen Summer Pear",
  "Frozen Orange & Green",
  "Raspberry Watermelon",
  "Coffee",
];

async function main() {
  const asset = await db.asset.findUnique({ where: { slug }, select: { id: true, slug: true, displayName: true, ownerId: true } });
  if (!asset) throw new Error(`Asset not found: ${slug}`);
  if (!asset.ownerId) throw new Error(`Asset has no owner: ${slug}`);

  const text = flavors.map((flavor) => `Fogger — ${flavor}: available`).join("\n");

  const queued = await enqueueKnowledgeIntake({
    assetId: asset.id,
    userId: asset.ownerId,
    sourceType: "text",
    originalName: "House of Vape & Smoke — handwritten inventory test",
    mimeType: "text/plain",
    text,
    content: text,
  });

  console.log(JSON.stringify({
    ok: true,
    asset: asset.displayName,
    slug: asset.slug,
    fixture: "fogger-50",
    flavorCount: flavors.length,
    duplicate: queued.duplicate,
    jobId: queued.job.id,
    status: queued.job.status,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
