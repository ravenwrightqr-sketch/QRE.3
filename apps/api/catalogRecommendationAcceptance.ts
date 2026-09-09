import { db } from "@qre/db";
import {
  deriveCatalogRecommendations,
  getVisitorFavorites,
  recordCatalogFavorite,
  recordCatalogTryFeedback,
} from "./src/services/catalogRecommendation.js";

const slug = process.argv[2] ?? "house-of-vape-and-smoke";
const favoriteName = "Fogger — Strawberry Watermelon";
const expectedRelatedNames = [
  "Fogger — Strawberry Banana",
  "Fogger — Strawberry Kiwi",
  "Fogger — Watermelon Ice",
];
const unrelatedName = "Fogger — Coffee";

function fail(message: string): never {
  throw new Error(message);
}

type CatalogState = {
  id: string;
  name: string;
  availability: "available" | "unavailable" | "observed";
};

function availabilityFromValue(value: unknown): CatalogState["availability"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "observed";
  const raw = typeof (value as Record<string, unknown>).value === "string"
    ? String((value as Record<string, unknown>).value).toLowerCase().trim()
    : "";
  if (raw === "unavailable" || raw.includes("sold")) return "unavailable";
  if (raw === "available") return "available";
  return "observed";
}

function rankOf(result: Awaited<ReturnType<typeof deriveCatalogRecommendations>>, name: string): number {
  const index = result.recommendations.findIndex((recommendation) => recommendation.item.name === name);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

async function main() {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: { id: true, slug: true, displayName: true },
  });
  if (!asset) fail(`Asset not found: ${slug}`);

  const items = await db.catalogItem.findMany({
    where: { assetId: asset.id },
    select: {
      id: true,
      name: true,
      observations: {
        orderBy: { observedAt: "desc" },
        take: 1,
        select: { value: true },
      },
    },
  });

  if (items.length < 50) fail(`Expected at least 50 catalog items; found ${items.length}.`);

  const states: CatalogState[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    availability: availabilityFromValue(item.observations[0]?.value),
  }));

  const favorite = states.find((item) => item.name === favoriteName);
  if (!favorite) fail(`Favorite item not found: ${favoriteName}`);

  const expectedStates = expectedRelatedNames.map((name) => {
    const item = states.find((candidate) => candidate.name === name);
    if (!item) fail(`Expected related product missing from catalog: ${name}`);
    return item;
  });

  const visitorId = `catalog-recommendation-acceptance-${Date.now()}`;
  await recordCatalogFavorite({
    assetId: asset.id,
    itemId: favorite.id,
    visitorId,
  });

  const favorites = await getVisitorFavorites(asset.id, visitorId);
  if (favorites.length !== 1 || favorites[0]?.itemId !== favorite.id) {
    fail("Favorite persistence/readback failed.");
  }

  const before = await deriveCatalogRecommendations({
    assetId: asset.id,
    favoriteItemId: favorite.id,
    visitorId,
    limit: 50,
  });

  if (!before.model.explainable) fail("Recommendation model is not marked explainable.");
  if (before.recommendations.length === 0) fail("No recommendations were produced.");

  const recommendationNames = new Set(before.recommendations.map((recommendation) => recommendation.item.name));

  for (const item of expectedStates) {
    if (item.availability === "unavailable") {
      if (recommendationNames.has(item.name)) fail(`Unavailable related product was recommended: ${item.name}`);
    } else if (!recommendationNames.has(item.name)) {
      fail(`Expected eligible related product was not recommended: ${item.name}`);
    }
  }

  if (recommendationNames.has(unrelatedName)) fail(`Unrelated product was incorrectly recommended: ${unrelatedName}`);

  for (const recommendation of before.recommendations) {
    if (!Number.isFinite(recommendation.score) || recommendation.score <= 0) {
      fail(`Invalid recommendation score for ${recommendation.item.name}.`);
    }
    if (!recommendation.reasons.length) fail(`Recommendation has no reasons: ${recommendation.item.name}.`);
    for (const reason of recommendation.reasons) {
      if (!reason.source) fail(`Missing source for ${recommendation.item.name}.`);
      if (!Number.isFinite(reason.confidence) || reason.confidence <= 0 || reason.confidence > 1) {
        fail(`Invalid confidence for ${recommendation.item.name}.`);
      }
      if (!Array.isArray(reason.evidenceIds)) fail(`Missing evidence list for ${recommendation.item.name}.`);
    }
  }

  const strawberryKiwi = expectedStates.find((item) => item.name === "Fogger — Strawberry Kiwi")!;
  const watermelonIce = expectedStates.find((item) => item.name === "Fogger — Watermelon Ice")!;

  const beforeKiwiRank = rankOf(before, strawberryKiwi.name);
  const beforeWatermelonRank = rankOf(before, watermelonIce.name);

  await recordCatalogTryFeedback({
    assetId: asset.id,
    itemId: strawberryKiwi.id,
    visitorId,
    reaction: "negative",
  });
  await recordCatalogTryFeedback({
    assetId: asset.id,
    itemId: watermelonIce.id,
    visitorId,
    reaction: "positive",
  });

  const after = await deriveCatalogRecommendations({
    assetId: asset.id,
    favoriteItemId: favorite.id,
    visitorId,
    limit: 50,
  });

  const afterKiwi = after.recommendations.find((recommendation) => recommendation.item.name === strawberryKiwi.name);
  const afterWatermelon = after.recommendations.find((recommendation) => recommendation.item.name === watermelonIce.name);
  if (!afterKiwi || !afterWatermelon) fail("Feedback targets disappeared from the recommendation set.");

  if (afterWatermelon.score <= before.recommendations.find((recommendation) => recommendation.item.name === watermelonIce.name)!.score) {
    fail("Positive try feedback did not increase Watermelon Ice's recommendation score.");
  }
  if (afterKiwi.score >= before.recommendations.find((recommendation) => recommendation.item.name === strawberryKiwi.name)!.score) {
    fail("Negative try feedback did not decrease Strawberry Kiwi's recommendation score.");
  }

  const afterKiwiRank = rankOf(after, strawberryKiwi.name);
  const afterWatermelonRank = rankOf(after, watermelonIce.name);
  if (afterKiwiRank <= beforeKiwiRank) fail("Negative feedback did not move Strawberry Kiwi down.");
  if (afterWatermelonRank >= beforeWatermelonRank) fail("Positive feedback did not move Watermelon Ice up.");

  const kiwiReasons = afterKiwi.reasons.filter((reason) => reason.relation === "negative_feedback");
  const watermelonReasons = afterWatermelon.reasons.filter((reason) => reason.relation === "positive_feedback");
  if (!kiwiReasons.some((reason) => reason.source === "visitor_try_feedback")) {
    fail("Strawberry Kiwi has no explainable negative-feedback reason.");
  }
  if (!watermelonReasons.some((reason) => reason.source === "visitor_try_feedback")) {
    fail("Watermelon Ice has no explainable positive-feedback reason.");
  }

  const relationshipPatterns = await db.knowledgePattern.findMany({
    where: {
      assetId: asset.id,
      type: "CATALOG_RELATIONSHIP",
      catalogItemId: favorite.id,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { statement: true, confidence: true, strength: true, evidenceIds: true },
  });

  for (const item of expectedStates) {
    const pattern = relationshipPatterns.find((candidate) => candidate.statement.includes(item.name));
    if (item.availability === "unavailable" && !pattern) fail(`Known relationship was not persisted for ${item.name}.`);
    if (item.availability !== "unavailable" && !pattern) fail(`Expected persisted relationship for ${item.name} was not found.`);
    if (pattern && (!Array.isArray(pattern.evidenceIds) || pattern.evidenceIds.length === 0)) {
      fail(`Persisted relationship has no evidence IDs: ${item.name}.`);
    }
  }

  const strawberryKiwiPattern = relationshipPatterns.find((pattern) =>
    pattern.statement.includes("Strawberry Kiwi") && pattern.statement.includes("strawberry"),
  );
  if (!strawberryKiwiPattern) fail("Expected persisted relationship for Strawberry Kiwi was not found.");

  console.log(JSON.stringify({
    pass: true,
    asset: asset.displayName,
    slug: asset.slug,
    favorite: { name: favorite.name, visitorId, persisted: true },
    before: {
      kiwi: { score: before.recommendations.find((recommendation) => recommendation.item.name === strawberryKiwi.name)?.score, rank: beforeKiwiRank },
      watermelonIce: { score: before.recommendations.find((recommendation) => recommendation.item.name === watermelonIce.name)?.score, rank: beforeWatermelonRank },
    },
    feedback: [
      { item: strawberryKiwi.name, reaction: "negative" },
      { item: watermelonIce.name, reaction: "positive" },
    ],
    after: {
      kiwi: { score: afterKiwi.score, rank: afterKiwiRank, reasons: kiwiReasons },
      watermelonIce: { score: afterWatermelon.score, rank: afterWatermelonRank, reasons: watermelonReasons },
    },
    relationship: {
      statement: strawberryKiwiPattern.statement,
      confidence: strawberryKiwiPattern.confidence,
      strength: strawberryKiwiPattern.strength,
      evidenceIds: strawberryKiwiPattern.evidenceIds,
    },
    model: after.model,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ pass: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
