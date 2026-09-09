import { db } from "@qre/db";

const RELATIONSHIP_TYPE = "CATALOG_RELATIONSHIP";
const FAVORITE_EVENT = "CATALOG_FAVORITE";
const TRY_FEEDBACK_EVENT = "CATALOG_TRY_FEEDBACK";

const STOP_WORDS = new Set([
  "foger", "fogger", "vape", "vapes", "disposable", "disposables", "device", "puff", "puffs",
  "nicotine", "salt", "edition", "series", "new", "the", "and", "with", "for", "of", "x",
]);

const NON_SEMANTIC_CATEGORIES = new Set(["text"]);

export type CatalogRecommendationReason = {
  relation: "shared_concept" | "same_category" | "same_brand" | "positive_feedback" | "negative_feedback";
  concept?: string;
  source: string;
  confidence: number;
  evidenceIds: string[];
  explanation: string;
};

export type CatalogRecommendation = {
  item: {
    id: string;
    name: string;
    brand: string | null;
    category: string | null;
  };
  score: number;
  reasons: CatalogRecommendationReason[];
};

type CatalogNode = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  description: string | null;
  availability: "available" | "unavailable" | "observed";
  evidenceIds: string[];
};

type TryFeedback = {
  itemId: string;
  reaction: "positive" | "negative";
  createdAt: Date;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\u2014/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function conceptsFor(item: CatalogNode): Set<string> {
  const terms = new Set<string>();
  const nameWords = normalize(item.name).split(" ").filter(Boolean);
  for (const word of nameWords) {
    if (word.length >= 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) terms.add(word);
  }

  if (item.description) {
    for (const word of normalize(item.description).split(" ")) {
      if (word.length >= 4 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) terms.add(word);
    }
  }

  return terms;
}

function availabilityFromObservation(value: unknown): CatalogNode["availability"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "observed";
  const raw = typeof (value as Record<string, unknown>).value === "string"
    ? String((value as Record<string, unknown>).value).toLowerCase().trim()
    : "";
  if (raw === "unavailable" || raw.includes("sold")) return "unavailable";
  if (raw === "available") return "available";
  return "observed";
}

function meaningfulCategory(category: string | null): string | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  return normalized && !NON_SEMANTIC_CATEGORIES.has(normalized) ? normalized : null;
}

async function readCatalogNodes(assetId: string): Promise<CatalogNode[]> {
  const items = await db.catalogItem.findMany({
    where: { assetId },
    orderBy: { name: "asc" },
    include: {
      observations: {
        orderBy: { observedAt: "desc" },
        take: 1,
        select: { value: true, evidenceId: true },
      },
    },
  });

  return items.map((item) => {
    const latest = item.observations[0];
    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: meaningfulCategory(item.category),
      description: item.description,
      availability: availabilityFromObservation(latest?.value),
      evidenceIds: latest?.evidenceId ? [latest.evidenceId] : [],
    };
  });
}

async function readTryFeedback(assetId: string, visitorId: string): Promise<TryFeedback[]> {
  const events = await db.scanEvent.findMany({
    where: { assetId, type: TRY_FEEDBACK_EVENT },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { createdAt: true, meta: true },
  });

  return events.flatMap((event) => {
    const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
      ? event.meta as Record<string, unknown>
      : {};
    if (meta.visitorId !== visitorId || typeof meta.itemId !== "string") return [];
    const reaction = meta.reaction === "positive" || meta.reaction === "negative" ? meta.reaction : null;
    return reaction ? [{ itemId: meta.itemId, reaction, createdAt: event.createdAt }] : [];
  });
}

function feedbackByConcept(nodes: CatalogNode[], feedback: TryFeedback[]) {
  const byItem = new Map(nodes.map((node) => [node.id, conceptsFor(node)]));
  const conceptSignals = new Map<string, { positive: number; negative: number; lastReaction: "positive" | "negative"; lastAt: Date }>();

  for (const event of feedback) {
    const concepts = byItem.get(event.itemId) ?? new Set<string>();
    for (const concept of concepts) {
      const current = conceptSignals.get(concept);
      const next = current ?? { positive: 0, negative: 0, lastReaction: event.reaction, lastAt: event.createdAt };
      if (event.reaction === "positive") next.positive += 1;
      else next.negative += 1;
      if (event.createdAt >= next.lastAt) {
        next.lastReaction = event.reaction;
        next.lastAt = event.createdAt;
      }
      conceptSignals.set(concept, next);
    }
  }

  return conceptSignals;
}

function applyFeedbackReasons(
  candidate: CatalogNode,
  candidateConcepts: Set<string>,
  conceptSignals: Map<string, { positive: number; negative: number; lastReaction: "positive" | "negative"; lastAt: Date }>,
  evidenceIds: string[],
): { score: number; reasons: CatalogRecommendationReason[] } {
  let score = 0;
  const reasons: CatalogRecommendationReason[] = [];

  for (const concept of candidateConcepts) {
    const signal = conceptSignals.get(concept);
    if (!signal) continue;
    const net = signal.positive - signal.negative;
    if (net === 0) continue;
    const magnitude = Math.min(4, Math.abs(net));
    const positive = net > 0;
    score += positive ? magnitude : -magnitude;
    reasons.push({
      relation: positive ? "positive_feedback" : "negative_feedback",
      concept,
      source: "visitor_try_feedback",
      confidence: Math.min(0.99, 0.6 + (signal.positive + signal.negative) * 0.1),
      evidenceIds,
      explanation: positive
        ? `the visitor previously reacted positively to the concept "${concept}"`
        : `the visitor previously reacted negatively to the concept "${concept}"`,
    });
  }

  return { score, reasons };
}

function intersect(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value)).sort();
}

function relationshipStatement(source: CatalogNode, target: CatalogNode, reasons: CatalogRecommendationReason[]): string {
  const concepts = reasons.filter((reason) => reason.relation === "shared_concept").map((reason) => reason.concept).filter(Boolean);
  const details = concepts.length
    ? `share the inferred catalog concept${concepts.length === 1 ? "" : "s"} ${concepts.map((value) => `"${value}"`).join(", ")}`
    : reasons.map((reason) => reason.explanation).join(" ");
  return `${source.name} and ${target.name} are related because they ${details}.`;
}

async function persistRelationship(assetId: string, source: CatalogNode, target: CatalogNode, reasons: CatalogRecommendationReason[], score: number) {
  const statement = relationshipStatement(source, target, reasons);
  const existing = await db.knowledgePattern.findFirst({
    where: { assetId, catalogItemId: source.id, type: RELATIONSHIP_TYPE, statement },
    orderBy: { updatedAt: "desc" },
  });

  const evidenceIds = [...new Set([
    ...source.evidenceIds,
    ...target.evidenceIds,
    ...reasons.flatMap((reason) => reason.evidenceIds),
  ])];
  const confidence = reasons.length
    ? reasons.reduce((sum, reason) => sum + reason.confidence, 0) / reasons.length
    : 0;
  const strength = Math.min(0.99, Math.max(0.05, score / 10));
  const now = new Date();

  if (existing) {
    await db.knowledgePattern.update({
      where: { id: existing.id },
      data: { confidence, strength, evidenceIds, lastObservedAt: now, status: "active" },
    });
    return existing.id;
  }

  const created = await db.knowledgePattern.create({
    data: {
      assetId,
      catalogItemId: source.id,
      type: RELATIONSHIP_TYPE,
      statement,
      confidence,
      strength,
      evidenceIds,
      firstObservedAt: now,
      lastObservedAt: now,
      status: "active",
    },
  });
  return created.id;
}

export async function deriveCatalogRecommendations(input: {
  assetId: string;
  favoriteItemId: string;
  visitorId?: string;
  limit?: number;
}) {
  const nodes = await readCatalogNodes(input.assetId);
  const favorite = nodes.find((item) => item.id === input.favoriteItemId);
  if (!favorite) throw new Error("Favorite catalog item not found.");

  const favoriteConcepts = conceptsFor(favorite);
  const feedback = input.visitorId ? await readTryFeedback(input.assetId, input.visitorId) : [];
  const conceptSignals = feedbackByConcept(nodes, feedback);
  const candidates: CatalogRecommendation[] = [];

  for (const candidate of nodes) {
    if (candidate.id === favorite.id) continue;

    const sharedConcepts = intersect(favoriteConcepts, conceptsFor(candidate));
    const reasons: CatalogRecommendationReason[] = [];
    let score = 0;

    if (sharedConcepts.length) {
      score += sharedConcepts.length * 3;
      for (const concept of sharedConcepts) {
        const evidenceIds = [...new Set([...favorite.evidenceIds, ...candidate.evidenceIds])];
        reasons.push({
          relation: "shared_concept",
          concept,
          source: candidate.description?.toLowerCase().includes(concept)
            ? "catalog_description"
            : "catalog_name",
          confidence: candidate.description?.toLowerCase().includes(concept) ? 0.88 : 0.72,
          evidenceIds,
          explanation: `share the inferred flavor concept "${concept}" from catalog evidence`,
        });
      }
    }

    const favoriteCategory = meaningfulCategory(favorite.category);
    const candidateCategory = meaningfulCategory(candidate.category);
    if (favoriteCategory && candidateCategory && favoriteCategory === candidateCategory) {
      score += 1;
      reasons.push({
        relation: "same_category",
        source: "catalog_category",
        confidence: 0.95,
        evidenceIds: [...new Set([...favorite.evidenceIds, ...candidate.evidenceIds])],
        explanation: `share the catalog category "${candidateCategory}"`,
      });
    }

    if (favorite.brand && candidate.brand && favorite.brand.toLowerCase() === candidate.brand.toLowerCase()) {
      score += 0.5;
      reasons.push({
        relation: "same_brand",
        source: "catalog_brand",
        confidence: 0.99,
        evidenceIds: [...new Set([...favorite.evidenceIds, ...candidate.evidenceIds])],
        explanation: `share the catalog brand "${candidate.brand}"`,
      });
    }

    const feedbackApplied = applyFeedbackReasons(candidate, conceptsFor(candidate), conceptSignals, [...new Set([...favorite.evidenceIds, ...candidate.evidenceIds])]);
    score += feedbackApplied.score;
    reasons.push(...feedbackApplied.reasons);

    if (!reasons.length || score <= 0) continue;

    const recommendation: CatalogRecommendation = {
      item: { id: candidate.id, name: candidate.name, brand: candidate.brand, category: candidate.category },
      score,
      reasons,
    };
    candidates.push(recommendation);
    await persistRelationship(input.assetId, favorite, candidate, reasons.filter((reason) => reason.relation === "shared_concept" || reason.relation === "same_category" || reason.relation === "same_brand"), score);
  }

  candidates.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  const selected = candidates.filter((candidate) => {
    const node = nodes.find((item) => item.id === candidate.item.id);
    return node?.availability !== "unavailable";
  });
  const visibleRecommendations = input.limit === undefined
    ? selected
    : selected.slice(0, Math.max(1, Math.min(50, input.limit)));

  return {
    favorite: {
      id: favorite.id,
      name: favorite.name,
      concepts: [...favoriteConcepts].sort(),
    },
    recommendations: visibleRecommendations,
    model: {
      version: "catalog-relations-v2",
      explainable: true,
      availabilityFiltered: true,
      relationshipsPersistedIndependentlyOfRanking: true,
      recommendationLimitApplied: input.limit !== undefined,
      visitorFeedbackApplied: Boolean(input.visitorId),
    },
  };
}

export async function recordCatalogFavorite(input: {
  assetId: string;
  itemId: string;
  visitorId: string;
}) {
  const item = await db.catalogItem.findFirst({ where: { id: input.itemId, assetId: input.assetId }, select: { id: true, name: true } });
  if (!item) throw new Error("Catalog item not found.");

  await db.scanEvent.create({
    data: {
      assetId: input.assetId,
      type: FAVORITE_EVENT,
      meta: {
        visitorId: input.visitorId,
        itemId: input.itemId,
        itemName: item.name,
      },
    },
  });

  return { success: true, itemId: item.id, itemName: item.name };
}

export async function recordCatalogTryFeedback(input: {
  assetId: string;
  itemId: string;
  visitorId: string;
  reaction: "positive" | "negative";
}) {
  const item = await db.catalogItem.findFirst({ where: { id: input.itemId, assetId: input.assetId }, select: { id: true, name: true } });
  if (!item) throw new Error("Catalog item not found.");

  await db.scanEvent.create({
    data: {
      assetId: input.assetId,
      type: TRY_FEEDBACK_EVENT,
      meta: {
        visitorId: input.visitorId,
        itemId: item.id,
        itemName: item.name,
        reaction: input.reaction,
      },
    },
  });

  return { success: true, itemId: item.id, itemName: item.name, reaction: input.reaction };
}

export async function getVisitorFavorites(assetId: string, visitorId: string) {
  const events = await db.scanEvent.findMany({
    where: { assetId, type: FAVORITE_EVENT },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true, meta: true },
  });

  return events
    .filter((event) => {
      const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta) ? event.meta as Record<string, unknown> : {};
      return meta.visitorId === visitorId;
    })
    .map((event) => {
      const meta = event.meta as Record<string, unknown>;
      return {
        eventId: event.id,
        itemId: String(meta.itemId ?? ""),
        itemName: String(meta.itemName ?? ""),
        createdAt: event.createdAt.toISOString(),
      };
    });
}
