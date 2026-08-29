
/** QRE EXPERIENCE ROUTES: authoring, memory, recommendation, cognition, collaboration. */

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { recommendMemories, resolveGeoLabel } from "@qre/engine";
import { ENTITLEMENT_RULES, type AccountPlan } from "@qre/contracts";
import { db } from "@qre/db";
import { requireAuth } from "../middleware/requireAuth.js";
import { compileExperience, type GeoAnchorInput } from "../services/experienceService.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { loadEntityMemory } from "../services/entityMemoryService.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { buildAuthorRealityGraph } from "../services/authorRealityGraph.js";
import { buildExperienceMemoryBatch, memoryContextToCognitiveSummary } from "../services/memoryProjection.js";

const router = Router();
const analyticsRepository = createAnalyticsRepository();

type CollaborationState = {
  enabled: boolean;
  inviteOnly?: boolean;
};

function parseGeoAnchor(raw: unknown): GeoAnchorInput | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const value = raw as Record<string, unknown>;
  const latitude = typeof value.latitude === "number" ? value.latitude : undefined;
  const longitude = typeof value.longitude === "number" ? value.longitude : undefined;

  if (latitude === undefined || longitude === undefined) return undefined;

  const role =
    value.role === "physical_site" ||
    value.role === "experience_place" ||
    value.role === "event_venue" ||
    value.role === "memory_place" ||
    value.role === "reference_place"
      ? value.role
      : "experience_place";

  return {
    latitude,
    longitude,
    label: typeof value.label === "string" ? value.label.trim() : undefined,
    time: typeof value.time === "string" ? value.time.trim() : undefined,
    role,
    source: typeof value.source === "string" ? value.source : "dashboard",
  };
}

async function enrichGeo(anchor: GeoAnchorInput): Promise<GeoAnchorInput> {
  if (anchor.label && anchor.city) return anchor;

  const resolved = await resolveGeoLabel(anchor.latitude!, anchor.longitude!);

  return {
    ...anchor,
    label: anchor.label || resolved.label || undefined,
    city: anchor.city || resolved.city || undefined,
    region: anchor.region || resolved.region || undefined,
    country: anchor.country || resolved.country || undefined,
  };
}

function getCollaboration(asset: any): CollaborationState {
  const data = asset?.templateData;
  const collaboration =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as any).collaboration
      : undefined;

  return {
    enabled: collaboration?.enabled === true,
    inviteOnly: collaboration?.inviteOnly === true,
  };
}

function planForAsset(asset: any): AccountPlan {
  const plan = String(
    asset?.account?.plan ?? asset?.User?.tier ?? "CONSUMER",
  ).toUpperCase();

  return plan === "PRO" || plan === "BUSINESS" ? plan : "CONSUMER";
}

function hasCollaborationEntitlement(asset: any) {
  return Boolean(
    ENTITLEMENT_RULES[planForAsset(asset)]?.collaborativeMemory,
  );
}

async function ownedAsset(assetId: string, userId?: string) {
  if (!userId) return null;

  return db.asset.findFirst({
    where: {
      id: assetId,
      OR: [
        { ownerId: userId },
        {
          account: {
            AccountUser: {
              some: { userId },
            },
          },
        },
      ],
    },
    include: {
      account: {
        select: {
          id: true,
          plan: true,
        },
      },
      User: {
        select: {
          id: true,
          tier: true,
        },
      },
    },
  });
}

router.post("/compile", requireAuth, async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const assetId =
      typeof req.body?.assetId === "string"
        ? req.body.assetId
        : undefined;
    const movieMode = req.body?.movieMode !== false;
    const lens = typeof req.body?.lens === "string" ? req.body.lens.trim() : undefined;
    const rawGeo = parseGeoAnchor(req.body?.geo);

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Experience prompt is required.",
      });
    }

    const geo = rawGeo ? await enrichGeo(rawGeo) : undefined;

    const experience = await compileExperience({
      prompt,
      assetId,
      userId: req.user?.userId,
      memoryRepository: assetId ? createMemoryRepository() : undefined,
      geoAnchor: geo,
      movieMode,
    });

    const warnings = [...(experience.warnings ?? [])];

    if (
      assetId &&
      geo?.latitude !== undefined &&
      geo.longitude !== undefined
    ) {
      try {
        await createPresenceRepository().createGeoProof({
          assetId,
          sessionId: randomUUID(),
          userId: req.user?.userId,
          lat: geo.latitude,
          lng: geo.longitude,
          source: `authoring:${geo.role ?? "experience_place"}`,
          label: geo.label,
          city: geo.city,
          region: geo.region,
          country: geo.country,
        });
      } catch (error) {
        console.warn(
          "[QRE][AUTHORING] GeoProof persistence failed",
          error,
        );
        warnings.push("geo_persistence_failed");
      }
    }

    return res.json({
      success: true,
      experience: {
        ...experience,
        warnings,
      },
      geo: geo ?? null,
    });
  } catch (error) {
    console.error("Experience compile failed:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to compile experience.",
      details:
        process.env.NODE_ENV === "production"
          ? undefined
          : error instanceof Error
            ? error.message
            : String(error),
    });
  }
});

router.get("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();

    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: "Asset id required.",
      });
    }

    const memory = await createMemoryRepository().loadContext({
      assetId,
      userId: req.user?.userId,
    });

    return res.json({
      success: true,
      memory,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Failed to load memory.",
    });
  }
});

router.get(
  "/memory/:assetId/recommendations",
  requireAuth,
  async (req, res) => {
    try {
      const assetId = String(req.params.assetId ?? "").trim();
      const prompt =
        typeof req.query?.prompt === "string"
          ? req.query.prompt
          : "";

      const memory = await createMemoryRepository().loadContext({
        assetId,
        userId: req.user?.userId,
      });

      return res.json({
        success: true,
        recommendations: recommendMemories(memory, prompt),
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error: "Failed to recommend memories.",
      });
    }
  },
);

router.get(
  "/entity/:assetId/:entityName",
  requireAuth,
  async (req, res) => {
    try {
      const assetId = String(req.params.assetId ?? "").trim();
      const entityName = String(req.params.entityName ?? "").trim();

      if (!assetId || !entityName) {
        return res.status(400).json({
          success: false,
          error: "Asset id and entity name required.",
        });
      }

      await createMemoryRepository().loadContext({
        assetId,
        userId: req.user?.userId,
      });

      const entity = await loadEntityMemory({
        assetId,
        entityName,
      });

      if (!entity) {
        return res.status(404).json({
          success: false,
          error: "Entity memory not found.",
        });
      }

      return res.json({
        success: true,
        entity,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error: "Failed to load entity memory.",
      });
    }
  },
);

router.post("/memory/:assetId", requireAuth, async (req, res) => {
  try {
    const assetId = String(req.params.assetId ?? "").trim();
    const prompt =
      typeof req.body?.prompt === "string"
        ? req.body.prompt.trim()
        : "";

    if (!assetId || !prompt) {
      return res.status(400).json({
        success: false,
        error: "Asset id and memory prompt are required.",
      });
    }

    const repository = createMemoryRepository();
    const context = await repository.loadContext({
      assetId,
      userId: req.user?.userId,
    });

    const facts = context.facts
      .filter((fact) => fact.status === "active" && fact.confidence >= 0.7)
      .map((fact) => `${fact.predicate}: ${fact.value}`)
      .slice(0, 80);
    const sourceMoments = [
      prompt,
      ...context.events.slice(0, 20).map((event) => event.summary),
    ];
    const graph = buildAuthorRealityGraph({
      prompt,
      facts,
      sourceMoments,
      memoryContext: memoryContextToCognitiveSummary(context),
    });

    const batch = buildExperienceMemoryBatch({
      assetId,
      userId: req.user?.userId,
      graph,
      source: "user",
    });

    await repository.writeBatch(batch);

    const updated = await repository.loadContext({
      assetId,
      userId: req.user?.userId,
    });

    return res.status(201).json({
      success: true,
      memory: {
        entities: batch.entities.length,
        facts: batch.facts.length,
        relations: batch.relations.length,
        events: batch.events.length,
      },
      recommendations: recommendMemories(updated, prompt),
      interpretation: {
        prompt,
        places: [...new Set(graph.events.map((event) => event.place).filter(Boolean))],
        participants: [...new Set(graph.events.flatMap((event) => event.entities))],
        events: graph.events.length,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Failed to write memory.",
    });
  }
});

router.get("/contribute/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug ?? "").trim();

    const asset = await db.asset.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        status: true,
        templateData: true,
        account: {
          select: { plan: true },
        },
        User: {
          select: { tier: true },
        },
      },
    });

    if (!asset || asset.status !== "active") {
      return res.status(404).json({
        success: false,
        error: "QRE object not found.",
      });
    }

    const entitled = hasCollaborationEntitlement(asset);
    const collaboration = getCollaboration(asset);

    return res.json({
      success: true,
      enabled: entitled && collaboration.enabled,
      inviteOnly: collaboration.inviteOnly === true,
      asset: {
        slug: asset.slug,
        displayName: asset.displayName,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Failed to load contribution settings.",
    });
  }
});

export default router;
