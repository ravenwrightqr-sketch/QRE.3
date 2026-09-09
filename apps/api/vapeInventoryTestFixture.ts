import { db } from "@qre/db";
import { enqueueKnowledgeIntake } from "./src/services/knowledgeIntake.js";

const slug = process.argv[2] ?? "house-of-vape-and-smoke";
const TIMEOUT_MS = 90_000;

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function resolveIntakeUser(asset: {
  ownerId: string | null;
  accountId: string | null;
  ownership: { userId: string | null; accountId: string | null } | null;
}) {
  if (asset.ownerId) return asset.ownerId;
  if (asset.ownership?.userId) return asset.ownership.userId;

  const accountId = asset.accountId ?? asset.ownership?.accountId;
  if (!accountId) return null;

  const membership = await db.accountUser.findFirst({
    where: { accountId },
    orderBy: { role: "asc" },
    select: { userId: true },
  });

  return membership?.userId ?? null;
}

async function main() {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      displayName: true,
      ownerId: true,
      accountId: true,
      ownership: { select: { userId: true, accountId: true } },
    },
  });
  if (!asset) throw new Error(`Asset not found: ${slug}`);

  const intakeUserId = await resolveIntakeUser(asset);
  if (!intakeUserId) {
    throw new Error(`No user membership/ownership found for asset: ${slug}`);
  }

  const text = flavors.map((flavor) => `Fogger — ${flavor}: available`).join("\n");

  const queued = await enqueueKnowledgeIntake({
    assetId: asset.id,
    userId: intakeUserId,
    sourceType: "text",
    originalName: "House of Vape & Smoke — handwritten inventory test",
    mimeType: "text/plain",
    text,
    content: text,
  });

  const startedAt = Date.now();
  let status = "queued";
  let error: string | null = null;

  while (Date.now() - startedAt < TIMEOUT_MS) {
    const job = await db.knowledgeIntakeJob.findUnique({ where: { id: queued.job.id }, select: { status: true, error: true } });
    status = job?.status ?? "missing";
    error = job?.error ?? null;
    if (status === "completed" || status === "failed") break;
    await sleep(1200);
  }

  const products = await db.catalogItem.findMany({
    where: { assetId: asset.id, name: { startsWith: "Fogger — " } },
    select: { id: true, name: true },
  });

  const uniqueNames = new Set(products.map((product) => product.name));
  const pass = status === "completed" && uniqueNames.size >= flavors.length;

  console.log(JSON.stringify({
    pass,
    asset: asset.displayName,
    slug: asset.slug,
    fixture: "fogger-50",
    expectedFlavors: flavors.length,
    catalogProducts: uniqueNames.size,
    duplicate: queued.duplicate,
    jobId: queued.job.id,
    status,
    error,
  }, null, 2));

  if (!pass) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
