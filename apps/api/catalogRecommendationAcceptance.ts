import { db } from "@qre/db";
import {
  deriveCatalogRecommendations,
  getVisitorFavorites,
  recordCatalogFavorite,
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

async function main() {
  const asset = await db.asset.findUnique({
    where: { slug },
    select: { id: true, slug: true, displayName: true },
  });
  if (!asset) fail(`Asset not found: ${slug}`);

  const items = await db.catalogItem.findMany({
    where: { assetId: asset.id },
    select: { id: true, name: true },
  });

  if (items.length < 50) fail(`Expected at least 50 catalog items; found ${items.length}.`);

  const favorite = items.find((item) => item.name === favoriteName);
  if (!favorite) fail(`Favorite item not found: ${favoriteName}`);

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

  const result = await deriveCatalogRecommendations({
    assetId: asset.id,
    favoriteItemId: favorite.id,
    limit: 10,
  });

  if (!result.model.explainable) fail("Recommendation model is not marked explainable.");
  if (result.recommendations.length === 0) fail("No recommendations were produced.");

  const recommendationNames = new Set(result.recommendations.map((recommendation) => recommendation.item.name));
  for (const name of expectedRelatedNames) {
    if (!recommendationNames.has(name)) {
      fail(`Expected related product was not recommended: ${name}`);
    }
  }

  if (recommendationNames.has(unrelatedName)) {
    fail(`Unrelated product was incorrectly recommended: ${unrelatedName}`);
  }

  for (const recommendation of result.recommendations) {
    if (!Number.isFinite(recommendation.score) || recommendation.score <= 0) {
      fail(`Invalid recommendation score for ${recommendation.item.name}.`);
    }
    if (!recommendation.reasons.length) {
      fail(`Recommendation has no reasons: ${recommendation.item.name}.`);
    }
    for (const reason of recommendation.reasons) {
      if (!reason.source) fail(`Missing source for ${recommendation.item.name}.`);
      if (!Number.isFinite(reason.confidence) || reason.confidence <= 0 || reason.confidence > 1) {
        fail(`Invalid confidence for ${recommendation.item.name}.`);
      }
      if (!Array.isArray(reason.evidenceIds)) {
        fail(`Missing evidence list for ${recommendation.item.name}.`);
      }
    }
  }

  const relationshipPatterns = await db.knowledgePattern.findMany({
    where: {
      assetId: asset.id,
      type: "CATALOG_RELATIONSHIP",
      catalogItemId: favorite.id,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      statement: true,
      confidence: true,
      strength: true,
      evidenceIds: true,
    },
  });

  const strawberryKiwiPattern = relationshipPatterns.find((pattern) =>
    pattern.statement.includes("Strawberry Kiwi") && pattern.statement.includes("strawberry"),
  );
  if (!strawberryKiwiPattern) {
    fail("Expected persisted relationship for Strawberry Kiwi was not found.");
  }
  if (!Array.isArray(strawberryKiwiPattern.evidenceIds) || strawberryKiwiPattern.evidenceIds.length === 0) {
    fail("Persisted relationship has no evidence IDs.");
  }

  console.log(JSON.stringify({
    pass: true,
    asset: asset.displayName,
    slug: asset.slug,
    favorite: {
      name: favorite.name,
      visitorId,
      persisted: true,
    },
    recommendations: result.recommendations.map((recommendation) => ({
      name: recommendation.item.name,
      score: recommendation.score,
      reasons: recommendation.reasons,
    })),
    relationship: {
      statement: strawberryKiwiPattern.statement,
      confidence: strawberryKiwiPattern.confidence,
      strength: strawberryKiwiPattern.strength,
      evidenceIds: strawberryKiwiPattern.evidenceIds,
    },
    model: result.model,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      pass: false,
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
