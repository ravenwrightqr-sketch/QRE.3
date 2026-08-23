
import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  compileCognitiveExperience,
  recommendMemories,
  resolveGeoLabel,
} from "@qre/engine";
import { ENTITLEMENT_RULES, type AccountPlan } from "@qre/contracts";
import { db } from "@qre/db";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  compileExperience,
  type GeoAnchorInput,
} from "../services/experienceService.js";
import { createExperience } from "../services/experienceCreationServices.js";
import { memoryContextToCognitiveSummary } from "../services/memoryProjection.js";
import { persistAuthorLearning } from "../services/authorLearningLoop.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";
import { createAnalyticsRepository } from "../repositories/analyticsRepository.js";
import { createPresenceRepository } from "../repositories/presenceRepository.js";
import { loadEntityMemory } from "../services/entityMemoryService.js";

const router = Router();
const analyticsRepository = createAnalyticsRepository();

type CollaborationState = {
  enabled: boolean;
  inviteOnly?: boolean;
};

function parseGeoAnchor(raw: unknown): GeoAnchorInput | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const value = raw as Record<string, unknown>;

  const latitude =
    typeof value.latitude === "number"
      ? value.latitude
      : undefined;

  const longitude =
    typeof value.longitude === "number"
      ? value.longitude
      : undefined;

  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }

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
    label:
      typeof value.label === "string"
        ? value.label.trim()
        : undefined,
    time:
      typeof value.time === "string"
        ? value.time.trim()
        : undefined,
    role,
    source:
      typeof value.source === "string"
        ? value.source
        : "dashboard",
  };
}

async function enrichGeo(anchor: GeoAnchorInput): Promise<GeoAnchorInput> {
  if (anchor.label && anchor.city) return anchor;

  const resolved = await resolveGeoLabel(
    anchor.latitude!,
    anchor.longitude!,
  );

  return {
    ...anchor,
    label:
      anchor.label ||
      resolved.label ||
      undefined,
    city:
      anchor.city ||
      resolved.city ||
      undefined,
    region:
      anchor.region ||
      resolved.region ||
      undefined,
    country:
      anchor.country ||
      resolved.country ||
      undefined,
  };
}

function getCollaboration(asset: any): CollaborationState {
  const data = asset?.templateData;

  const c =
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
      ? (data as any).collaboration
      : undefined;

  return {
    enabled: c?.enabled === true,
    inviteOnly: c?.inviteOnly === true,
  };
}

function planForAsset(asset: any): AccountPlan {
  const plan = String(
    asset?.account?.plan ??
      asset?.User?.tier ??
      "CONSUMER",
  ).toUpperCase();

  return plan === "PRO" || plan === "BUSINESS"
    ? plan
    : "CONSUMER";
}

function hasCollaborationEntitlement(asset: any) {
  return Boolean(
    ENTITLEMENT_RULES[
      planForAsset(asset)
    ]?.collaborativeMemory,
  );
}

async function ownedAsset(
  assetId: string,
  userId?: string,
) {
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

router.post(
  "/compile",
  requireAuth,
  async (req, res) => {
    try {
      const prompt = req.body?.prompt;

      const assetId =
        typeof req.body?.assetId === "string"
          ? req.body.assetId
          : undefined;

      const rawGeo = parseGeoAnchor(
        req.body?.geo,
      );

      if (
        typeof prompt !== "string" ||
        !prompt.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: "Experience prompt is required.",
        });
      }

      const geo = rawGeo
        ? await enrichGeo(rawGeo)
        : undefined;

      const experience =
        await compileExperience({
          prompt,
          assetId,
          userId: req.user?.userId,
          memoryRepository: assetId
            ? createMemoryRepository()
            : undefined,
          geoAnchor: geo,
        });

      const warnings = [
        ...(experience.warnings ?? []),
      ];

      if (
        assetId &&
        geo?.latitude !== undefined &&
        geo.longitude !== undefined
      ) {
        try {
          await createPresenceRepository()
            .createGeoProof({
              assetId,
              sessionId: randomUUID(),
              userId: req.user?.userId,
              lat: geo.latitude,
              lng: geo.longitude,
              source: `authoring:${
                geo.role ?? "experience_place"
              }`,
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

          warnings.push(
            "geo_persistence_failed",
          );
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
      console.error(
        "Experience compile failed:",
        error,
      );

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
  },
);

router.get(
  "/memory/:assetId",
  requireAuth,
  async (req, res) => {
    try {
      const assetId = String(
        req.params.assetId ?? "",
      ).trim();

      if (!assetId) {
        return res.status(400).json({
          success: false,
          error: "Asset id required.",
        });
      }

      const memory =
        await createMemoryRepository()
          .loadContext({
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
  },
);

router.get(
  "/memory/:assetId/recommendations",
  requireAuth,
  async (req, res) => {
    try {
      const assetId = String(
        req.params.assetId ?? "",
      ).trim();

      const prompt =
        typeof req.query?.prompt === "string"
          ? req.query.prompt
          : "";

      const memory =
        await createMemoryRepository()
          .loadContext({
            assetId,
            userId: req.user?.userId,
          });

      return res.json({
        success: true,
        recommendations:
          recommendMemories(
            memory,
            prompt,
          ),
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
      const assetId = String(
        req.params.assetId ?? "",
      ).trim();

      const entityName = String(
        req.params.entityName ?? "",
      ).trim();

      if (!assetId || !entityName) {
        return res.status(400).json({
          success: false,
          error:
            "Asset id and entity name required.",
        });
      }

      await createMemoryRepository()
        .loadContext({
          assetId,
          userId: req.user?.userId,
        });

      const entity =
        await loadEntityMemory({
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

router.post(
  "/memory/:assetId",
  requireAuth,
  async (req, res) => {
    try {
      const assetId = String(
        req.params.assetId ?? "",
      ).trim();

      const prompt =
        typeof req.body?.prompt === "string"
          ? req.body.prompt.trim()
          : "";

      if (!assetId || !prompt) {
        return res.status(400).json({
          success: false,
          error:
            "Asset id and memory prompt are required.",
        });
      }

      const repository =
        createMemoryRepository();

      const context =
        await repository.loadContext({
          assetId,
          userId: req.user?.userId,
        });

      const compiled =
        compileCognitiveExperience(
          prompt,
          {
            memorySummary:
              memoryContextToCognitiveSummary(
                context,
              ),
            feedback: {
              accepted: [
                "memory-update",
              ],
              rejected: [],
            },
          },
        );

      const learning =
        await persistAuthorLearning(
          {
            assetId,
            userId: req.user?.userId,
            prompt,
            source: "prompt",
            world: compiled.world,
          },
          {
            memoryRepository:
              repository,
            analyticsRepository,
          },
        );

      const updated =
        await repository.loadContext({
          assetId,
          userId: req.user?.userId,
        });

      return res.status(201).json({
        success: true,
        memory: learning.memory,
        recommendations:
          recommendMemories(
            updated,
            prompt,
          ),
        interpretation: {
          prompt,
          places:
            compiled.world.places,
          participants:
            compiled.world.participants,
          events:
            compiled.world.events.length,
        },
        learning: {
          analyticsType:
            learning.analyticsType,
          observedAt:
            learning.observedAt,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error: "Failed to write memory.",
      });
    }
  },
);

router.get(
  "/contribute/:slug",
  async (req, res) => {
    try {
      const slug = String(
        req.params.slug ?? "",
      ).trim();

      const asset =
        await db.asset.findUnique({
          where: { slug },
          select: {
            id: true,
            slug: true,
            displayName: true,
            status: true,
            templateData: true,
            account: {
              select: {
                plan: true,
              },
            },
            User: {
              select: {
                tier: true,
              },
            },
          },
        });

      if (
        !asset ||
        asset.status !== "active"
      ) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      const entitled =
        hasCollaborationEntitlement(
          asset,
        );

      const collaboration =
        getCollaboration(asset);

      return res.json({
        success: true,
        enabled:
          entitled &&
          collaboration.enabled,
        inviteOnly:
          collaboration.inviteOnly === true,
        asset: {
          slug: asset.slug,
          displayName:
            asset.displayName,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Contribution surface unavailable.",
      });
    }
  },
);

router.post(
  "/contribute/:slug",
  async (req, res) => {
    try {
      const slug = String(
        req.params.slug ?? "",
      ).trim();

      const prompt =
        typeof req.body?.prompt === "string"
          ? req.body.prompt.trim()
          : "";

      const contributorName =
        typeof req.body?.contributorName ===
        "string"
          ? req.body.contributorName
              .trim()
              .slice(0, 120)
          : null;

      if (!slug || !prompt) {
        return res.status(400).json({
          success: false,
          error: "Memory is required.",
        });
      }

      const asset =
        await db.asset.findUnique({
          where: { slug },
          select: {
            id: true,
            slug: true,
            displayName: true,
            status: true,
            templateData: true,
            account: {
              select: {
                plan: true,
              },
            },
            User: {
              select: {
                tier: true,
              },
            },
          },
        });

      if (
        !asset ||
        asset.status !== "active"
      ) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      if (
        !hasCollaborationEntitlement(
          asset,
        ) ||
        !getCollaboration(asset).enabled
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Collaborative memory is not unlocked for this QRE object.",
        });
      }

      const collaboration = {
        kind:
          "collaborative_memory_contribution",
        status: "PENDING",
        contributorName,
        prompt,
        createdAt:
          new Date().toISOString(),
        source: "public_scan",
      };

      const pending =
        await db.experience.create({
          data: {
            assetId: asset.id,
            title: contributorName
              ? `Memory from ${contributorName}`
              : "New Memory",
            blueprint: {
              collaboration,
            },
          },
        });

      return res.status(201).json({
        success: true,
        pendingId: pending.id,
        message:
          "Memory sent to the owner for approval.",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Could not save this memory.",
      });
    }
  },
);

router.get(
  "/collaboration/:assetId",
  requireAuth,
  async (req, res) => {
    try {
      const asset = await ownedAsset(
        String(
          req.params.assetId ?? "",
        ),
        req.user?.userId,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      const plan = planForAsset(asset);

      const eligible =
        Boolean(
          ENTITLEMENT_RULES[plan]
            ?.collaborativeMemory,
        );

      const collaboration =
        getCollaboration(asset);

      return res.json({
        success: true,
        eligible,
        plan,
        collaboration,
        addUrl:
          collaboration.enabled
            ? `/add/${(asset as any).slug}`
            : null,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Failed to load collaboration status.",
      });
    }
  },
);

router.post(
  "/collaboration/:assetId/toggle",
  requireAuth,
  async (req, res) => {
    try {
      const asset = await ownedAsset(
        String(
          req.params.assetId ?? "",
        ),
        req.user?.userId,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      if (
        !hasCollaborationEntitlement(asset)
      ) {
        return res.status(402).json({
          success: false,
          error:
            "Collaborative memory requires an eligible subscription tier.",
        });
      }

      const enabled =
        req.body?.enabled === true;

      const current =
        asset.templateData &&
        typeof asset.templateData ===
          "object" &&
        !Array.isArray(
          asset.templateData,
        )
          ? (asset.templateData as Record<
              string,
              unknown
            >)
          : {};

      const templateData = {
        ...current,
        collaboration: {
          ...(current.collaboration as
            | Record<string, unknown>
            | undefined),
          enabled,
          inviteOnly:
            req.body?.inviteOnly === true,
        },
      };

      await db.asset.update({
        where: {
          id: asset.id,
        },
        data: {
          templateData,
        },
      });

      return res.json({
        success: true,
        collaboration:
          templateData.collaboration,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Failed to update collaboration.",
      });
    }
  },
);

function isPendingContribution(
  experience: any,
) {
  return (
    experience?.blueprint
      ?.collaboration?.kind ===
      "collaborative_memory_contribution" &&
    experience?.blueprint
      ?.collaboration?.status ===
      "PENDING"
  );
}

router.get(
  "/collaboration/:assetId/pending",
  requireAuth,
  async (req, res) => {
    try {
      const asset = await ownedAsset(
        String(
          req.params.assetId ?? "",
        ),
        req.user?.userId,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      const experiences =
        await db.experience.findMany({
          where: {
            assetId: asset.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      const pending = experiences
        .filter(
          isPendingContribution,
        )
        .map((experience) => ({
          id: experience.id,
          title: experience.title,
          createdAt:
            experience.createdAt,
          ...(
            experience.blueprint as any
          ).collaboration,
        }));

      return res.json({
        success: true,
        pending,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Failed to load pending memories.",
      });
    }
  },
);

router.post(
  "/collaboration/:assetId/pending/:contributionId/approve",
  requireAuth,
  async (req, res) => {
    try {
      const asset = await ownedAsset(
        String(
          req.params.assetId ?? "",
        ),
        req.user?.userId,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      if (
        !hasCollaborationEntitlement(
          asset,
        )
      ) {
        return res.status(402).json({
          success: false,
          error:
            "Collaborative memory requires an eligible subscription tier.",
        });
      }

      const pending =
        await db.experience.findFirst({
          where: {
            id: String(
              req.params.contributionId,
            ),
            assetId: asset.id,
          },
        });

      if (
        !pending ||
        !isPendingContribution(
          pending,
        )
      ) {
        return res.status(404).json({
          success: false,
          error:
            "Pending memory not found.",
        });
      }

      const collaboration =
        (pending.blueprint as any)
          .collaboration;

      const created =
        await createExperience({
          assetId: asset.id,
          prompt: String(
            collaboration.prompt,
          ),
          title:
            pending.title ??
            "Memory",
          userId:
            req.user?.userId,
        });

      const blueprint = {
        ...(pending.blueprint as Record<
          string,
          unknown
        >),
        collaboration: {
          ...collaboration,
          status: "ACCEPTED",
          reviewedAt:
            new Date().toISOString(),
          reviewedBy:
            req.user?.userId ??
            null,
          generatedExperienceId:
            created.experience.id,
        },
      };

      await db.experience.update({
        where: {
          id: pending.id,
        },
        data: {
          blueprint,
        },
      });

      await analyticsRepository.trackEvent(
        {
          assetId: asset.id,
          type: "MEMORY_CREATED",
          meta: {
            source:
              "public_collaboration",
            contributionId:
              pending.id,
            generatedExperienceId:
              created.experience.id,
          },
        },
      );

      return res.json({
        success: true,
        generatedExperienceId:
          created.experience.id,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Could not approve this memory.",
      });
    }
  },
);

router.post(
  "/collaboration/:assetId/pending/:contributionId/reject",
  requireAuth,
  async (req, res) => {
    try {
      const asset = await ownedAsset(
        String(
          req.params.assetId ?? "",
        ),
        req.user?.userId,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "QRE object not found.",
        });
      }

      const pending =
        await db.experience.findFirst({
          where: {
            id: String(
              req.params.contributionId,
            ),
            assetId: asset.id,
          },
        });

      if (
        !pending ||
        !isPendingContribution(
          pending,
        )
      ) {
        return res.status(404).json({
          success: false,
          error:
            "Pending memory not found.",
        });
      }

      const blueprint = {
        ...(pending.blueprint as Record<
          string,
          unknown
        >),
        collaboration: {
          ...(
            (pending.blueprint as any)
              .collaboration
          ),
          status: "REJECTED",
          reviewedAt:
            new Date().toISOString(),
          reviewedBy:
            req.user?.userId ??
            null,
        },
      };

      await db.experience.update({
        where: {
          id: pending.id,
        },
        data: {
          blueprint,
        },
      });

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error:
          "Could not reject this memory.",
      });
    }
  },
);

export default router;
