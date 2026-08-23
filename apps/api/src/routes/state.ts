import express from "express";
import { db } from "@qre/db";
import { buildTheState } from "@qre/engine";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import type {
  TheStateActor,
  TheStateActorKind,
  TheStateConfiguration,
  TheStatePermission,
} from "@qre/contracts";

const router = express.Router();

const ALL_PERMISSIONS: TheStatePermission[] = [
  "VIEW_STATE",
  "MANAGE_STATE",
  "ACTIVATE_MODE",
  "MANAGE_EXPERIENCES",
  "MANAGE_HISTORY",
];

const MANAGER_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

const ACTOR_KINDS = new Set<TheStateActorKind>([
  "OWNER",
  "MANAGER",
  "RENTER",
  "CARETAKER",
  "STAFF",
  "COLLABORATOR",
  "CUSTOM",
]);

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePermissions(value: unknown): TheStatePermission[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (permission): permission is TheStatePermission =>
      typeof permission === "string" &&
      ALL_PERMISSIONS.includes(permission as TheStatePermission),
  );
}

function normalizeActors(value: unknown): TheStateActor[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item) =>
        item && typeof item === "object" && !Array.isArray(item),
    )
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      userId: stringValue(item.userId) ?? "",
      kind: ACTOR_KINDS.has(item.kind as TheStateActorKind)
        ? (item.kind as TheStateActorKind)
        : "CUSTOM",
      label: stringValue(item.label) ?? undefined,
      permissions: normalizePermissions(item.permissions),
      startsAt: stringValue(item.startsAt),
      endsAt: stringValue(item.endsAt),
      metadata:
        item.metadata &&
        typeof item.metadata === "object" &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : undefined,
    }))
    .filter((actor) => actor.userId && actor.permissions.length > 0);
}

function normalizeConfiguration(value: unknown): TheStateConfiguration {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const capabilities = Array.isArray(input.capabilities)
    ? input.capabilities
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item),
        )
        .map((item) => item as Record<string, unknown>)
        .filter(
          (item) =>
            typeof item.id === "string" &&
            typeof item.label === "string",
        )
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          description:
            typeof item.description === "string"
              ? item.description
              : undefined,
          enabled: item.enabled !== false,
          metadata:
            item.metadata &&
            typeof item.metadata === "object" &&
            !Array.isArray(item.metadata)
              ? (item.metadata as Record<string, unknown>)
              : undefined,
        }))
    : [];

  const modes = Array.isArray(input.modes)
    ? input.modes
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            !Array.isArray(item),
        )
        .map((item) => item as Record<string, unknown>)
        .filter(
          (item) =>
            typeof item.id === "string" &&
            typeof item.label === "string",
        )
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          description:
            typeof item.description === "string"
              ? item.description
              : undefined,
          enabled: item.enabled !== false,
          metadata:
            item.metadata &&
            typeof item.metadata === "object" &&
            !Array.isArray(item.metadata)
              ? (item.metadata as Record<string, unknown>)
              : undefined,
        }))
    : [];

  const currentInput =
    input.current &&
    typeof input.current === "object" &&
    !Array.isArray(input.current)
      ? (input.current as Record<string, unknown>)
      : {};

  return {
    capabilities,
    modes,
    defaultModeId: stringValue(input.defaultModeId),
    current: {
      modeId: stringValue(currentInput.modeId),
      status: stringValue(currentInput.status),
      since: stringValue(currentInput.since),
      context:
        currentInput.context &&
        typeof currentInput.context === "object" &&
        !Array.isArray(currentInput.context)
          ? (currentInput.context as Record<string, unknown>)
          : {},
    },
    authorizedActors: normalizeActors(input.authorizedActors),
  };
}

function toJsonObject(value: TheStateConfiguration): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function activeActor(actor: TheStateActor, now = Date.now()): boolean {
  const startsAt = actor.startsAt ? Date.parse(actor.startsAt) : NaN;
  const endsAt = actor.endsAt ? Date.parse(actor.endsAt) : NaN;

  if (Number.isFinite(startsAt) && now < startsAt) return false;
  if (Number.isFinite(endsAt) && now > endsAt) return false;

  return true;
}

async function loadAsset(assetId: string) {
  return db.asset.findUnique({
    where: { id: assetId },
    include: {
      experiences: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function isPermanentManager(
  asset: NonNullable<Awaited<ReturnType<typeof loadAsset>>>,
  userId: string,
) {
  if (asset.ownerId === userId) return true;
  if (!asset.accountId) return false;

  const membership = await db.accountUser.findFirst({
    where: {
      accountId: asset.accountId,
      userId,
    },
    select: { role: true },
  });

  return Boolean(
    membership?.role && MANAGER_ROLES.has(membership.role),
  );
}

async function canControl(
  asset: NonNullable<Awaited<ReturnType<typeof loadAsset>>>,
  userId: string,
  permission: TheStatePermission,
) {
  if (await isPermanentManager(asset, userId)) return true;

  const config = normalizeConfiguration(asset.stateConfig);
  const actor = config.authorizedActors?.find(
    (candidate) =>
      candidate.userId === userId &&
      activeActor(candidate),
  );

  return Boolean(
    actor?.permissions.includes(permission),
  );
}

function stateResponse(
  asset: NonNullable<Awaited<ReturnType<typeof loadAsset>>>,
) {
  const experiences = asset.experiences.map(
    (experience) => ({
      id: experience.id,
      title: experience.title ?? null,
      createdAt: experience.createdAt.toISOString(),
    }),
  );

  const state = buildTheState({
    id: asset.id,
    slug: asset.slug,
    category: asset.category ?? null,
    stateConfig: normalizeConfiguration(
      asset.stateConfig,
    ),
    experience:
      experiences[experiences.length - 1] ?? null,
    experiences,
  });

  return {
    state,
    authorizedActors:
      normalizeConfiguration(asset.stateConfig)
        .authorizedActors ?? [],
  };
}

async function updatedStateResponse(assetId: string) {
  const asset = await loadAsset(assetId);
  if (!asset) {
    throw new Error("Asset disappeared after State update");
  }
  return stateResponse(asset);
}

router.get("/:assetId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "VIEW_STATE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    return res.json({
      success: true,
      ...stateResponse(asset),
    });
  } catch (error) {
    console.error("State load failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load State.",
    });
  }
});

router.patch("/:assetId/config", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "MANAGE_STATE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    const existing = normalizeConfiguration(
      asset.stateConfig,
    );

    const configuration = normalizeConfiguration({
      ...req.body,
      authorizedActors: existing.authorizedActors,
    });

    if (
      configuration.defaultModeId &&
      !configuration.modes?.some(
        (mode) =>
          mode.id === configuration.defaultModeId &&
          mode.enabled,
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "defaultModeId must reference an enabled mode.",
      });
    }

    const currentModeId =
      configuration.current?.modeId ?? null;

    if (
      currentModeId &&
      !configuration.modes?.some(
        (mode) =>
          mode.id === currentModeId &&
          mode.enabled,
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "current.modeId must reference an enabled mode.",
      });
    }

    await db.asset.update({
      where: { id: asset.id },
      data: {
        stateConfig: toJsonObject(configuration),
      },
    });

    return res.json({
      success: true,
      ...(await updatedStateResponse(asset.id)),
    });
  } catch (error) {
    console.error(
      "State configuration update failed:",
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Failed to update State configuration.",
    });
  }
});

router.post("/:assetId/actors", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "MANAGE_STATE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    const actorUserId = stringValue(req.body?.userId);
    if (!actorUserId) {
      return res.status(400).json({
        success: false,
        error: "userId is required.",
      });
    }

    const kind = ACTOR_KINDS.has(
      req.body?.kind as TheStateActorKind,
    )
      ? (req.body.kind as TheStateActorKind)
      : "CUSTOM";

    const permissions = normalizePermissions(
      req.body?.permissions,
    );

    if (!permissions.length) {
      return res.status(400).json({
        success: false,
        error:
          "At least one valid permission is required.",
      });
    }

    const config = normalizeConfiguration(
      asset.stateConfig,
    );

    const actors = (
      config.authorizedActors ?? []
    ).filter(
      (actor) => actor.userId !== actorUserId,
    );

    const actor: TheStateActor = {
      userId: actorUserId,
      kind,
      label:
        stringValue(req.body?.label) ??
        undefined,
      permissions,
      startsAt: stringValue(req.body?.startsAt),
      endsAt: stringValue(req.body?.endsAt),
      metadata:
        req.body?.metadata &&
        typeof req.body.metadata === "object" &&
        !Array.isArray(req.body.metadata)
          ? req.body.metadata
          : undefined,
    };

    if (
      actor.startsAt &&
      !Number.isFinite(Date.parse(actor.startsAt))
    ) {
      return res.status(400).json({
        success: false,
        error: "startsAt must be a valid ISO date.",
      });
    }

    if (
      actor.endsAt &&
      !Number.isFinite(Date.parse(actor.endsAt))
    ) {
      return res.status(400).json({
        success: false,
        error: "endsAt must be a valid ISO date.",
      });
    }

    const nextConfig: TheStateConfiguration = {
      ...config,
      authorizedActors: [...actors, actor],
    };

    await db.asset.update({
      where: { id: asset.id },
      data: {
        stateConfig: toJsonObject(nextConfig),
      },
    });

    return res.status(201).json({
      success: true,
      ...(await updatedStateResponse(asset.id)),
    });
  } catch (error) {
    console.error("State actor grant failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to grant State control.",
    });
  }
});

router.delete("/:assetId/actors/:userId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "MANAGE_STATE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    const config = normalizeConfiguration(
      asset.stateConfig,
    );
    const targetUserId = String(
      req.params.userId ?? "",
    );

    const updatedActors = (
      config.authorizedActors ?? []
    ).filter(
      (actor) => actor.userId !== targetUserId,
    );

    const nextConfig: TheStateConfiguration = {
      ...config,
      authorizedActors: updatedActors,
    };

    await db.asset.update({
      where: { id: asset.id },
      data: {
        stateConfig: toJsonObject(nextConfig),
      },
    });

    return res.json({
      success: true,
      ...(await updatedStateResponse(asset.id)),
    });
  } catch (error) {
    console.error("State actor revoke failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to revoke State control.",
    });
  }
});

router.post("/:assetId/modes/:modeId/activate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "ACTIVATE_MODE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    const config = normalizeConfiguration(
      asset.stateConfig,
    );
    const modeId = String(
      req.params.modeId ?? "",
    );

    const mode = config.modes?.find(
      (candidate) =>
        candidate.id === modeId &&
        candidate.enabled,
    );

    if (!mode) {
      return res.status(404).json({
        success: false,
        error: "Enabled State mode not found.",
      });
    }

    const nextConfig: TheStateConfiguration = {
      ...config,
      current: {
        ...(config.current ?? {
          modeId: null,
          status: null,
          since: null,
          context: {},
        }),
        modeId,
        status: "active",
        since: new Date().toISOString(),
      },
    };

    await db.asset.update({
      where: { id: asset.id },
      data: {
        stateConfig: toJsonObject(nextConfig),
      },
    });

    return res.json({
      success: true,
      ...(await updatedStateResponse(asset.id)),
    });
  } catch (error) {
    console.error("State mode activation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to activate State mode.",
    });
  }
});

router.post("/:assetId/modes/:modeId/deactivate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId ?? "";
    const asset = await loadAsset(
      String(req.params.assetId ?? ""),
    );

    if (
      !asset ||
      !(await canControl(asset, userId, "ACTIVATE_MODE"))
    ) {
      return res.status(404).json({
        success: false,
        error: "Asset not found.",
      });
    }

    const config = normalizeConfiguration(
      asset.stateConfig,
    );
    const modeId = String(
      req.params.modeId ?? "",
    );

    if (!config.modes?.some((mode) => mode.id === modeId)) {
      return res.status(404).json({
        success: false,
        error: "State mode not found.",
      });
    }

    const nextConfig: TheStateConfiguration = {
      ...config,
      current: {
        ...(config.current ?? {
          modeId: null,
          status: null,
          since: null,
          context: {},
        }),
        modeId: null,
        status: "idle",
        since: null,
      },
    };

    await db.asset.update({
      where: { id: asset.id },
      data: {
        stateConfig: toJsonObject(nextConfig),
      },
    });

    return res.json({
      success: true,
      ...(await updatedStateResponse(asset.id)),
    });
  } catch (error) {
    console.error("State mode deactivation failed:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to deactivate State mode.",
    });
  }
});

export default router;
