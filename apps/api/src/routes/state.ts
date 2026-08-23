import express from "express";
import { db } from "@qre/db";
import { buildTheState } from "@qre/engine";
import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import type { TheStateConfiguration } from "@qre/contracts";

const router = express.Router();

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeConfiguration(value: unknown): TheStateConfiguration {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const capabilities = Array.isArray(input.capabilities)
    ? input.capabilities
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item) => item as Record<string, unknown>)
        .filter((item) => typeof item.id === "string" && typeof item.label === "string")
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          description: typeof item.description === "string" ? item.description : undefined,
          enabled: item.enabled !== false,
          metadata: item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
            ? item.metadata as Record<string, unknown>
            : undefined,
        }))
    : [];

  const modes = Array.isArray(input.modes)
    ? input.modes
        .filter((item) => item && typeof item === "object" && !Array.isArray(item))
        .map((item) => item as Record<string, unknown>)
        .filter((item) => typeof item.id === "string" && typeof item.label === "string")
        .map((item) => ({
          id: String(item.id),
          label: String(item.label),
          description: typeof item.description === "string" ? item.description : undefined,
          enabled: item.enabled !== false,
          metadata: item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
            ? item.metadata as Record<string, unknown>
            : undefined,
        }))
    : [];

  const currentInput = input.current && typeof input.current === "object" && !Array.isArray(input.current)
    ? input.current as Record<string, unknown>
    : {};

  return {
    capabilities,
    modes,
    defaultModeId: stringValue(input.defaultModeId),
    current: {
      modeId: stringValue(currentInput.modeId),
      status: stringValue(currentInput.status),
      since: stringValue(currentInput.since),
      context: currentInput.context && typeof currentInput.context === "object" && !Array.isArray(currentInput.context)
        ? currentInput.context as Record<string, unknown>
        : {},
    },
  };
}

async function getOwnedAsset(assetId: string, userId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: { experiences: { orderBy: { createdAt: "asc" } } },
  });

  if (!asset) return null;
  if (asset.ownerId === userId) return asset;

  if (!asset.accountId) return null;
  const membership = await db.accountUser.findFirst({
    where: { accountId: asset.accountId, userId },
  });

  return membership ? asset : null;
}

function stateAsset(asset: Awaited<ReturnType<typeof getOwnedAsset>>) {
  if (!asset) return null;
  const experiences = asset.experiences.map((experience) => ({
    id: experience.id,
    title: experience.title ?? null,
    createdAt: experience.createdAt.toISOString(),
  }));

  return buildTheState({
    id: asset.id,
    slug: asset.slug,
    category: asset.category ?? null,
    stateConfig: normalizeConfiguration(asset.stateConfig),
    experience: experiences[experiences.length - 1] ?? null,
    experiences,
  });
}

router.get("/:assetId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const asset = await getOwnedAsset(String(req.params.assetId ?? ""), req.user?.userId ?? "");
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found." });
    return res.json({ success: true, state: stateAsset(asset) });
  } catch (error) {
    console.error("State load failed:", error);
    return res.status(500).json({ success: false, error: "Failed to load State." });
  }
});

router.patch("/:assetId/config", requireAuth, async (req: AuthRequest, res) => {
  try {
    const assetId = String(req.params.assetId ?? "");
    const asset = await getOwnedAsset(assetId, req.user?.userId ?? "");
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found." });

    const configuration = normalizeConfiguration(req.body);
    if (configuration.defaultModeId && !configuration.modes?.some((mode) => mode.id === configuration.defaultModeId && mode.enabled)) {
      return res.status(400).json({ success: false, error: "defaultModeId must reference an enabled mode." });
    }

    const currentModeId = configuration.current?.modeId ?? null;
    if (currentModeId && !configuration.modes?.some((mode) => mode.id === currentModeId && mode.enabled)) {
      return res.status(400).json({ success: false, error: "current.modeId must reference an enabled mode." });
    }

    const updated = await db.asset.update({
      where: { id: asset.id },
      data: { stateConfig: configuration },
      include: { experiences: { orderBy: { createdAt: "asc" } } },
    });

    return res.json({ success: true, state: stateAsset(updated) });
  } catch (error) {
    console.error("State configuration update failed:", error);
    return res.status(500).json({ success: false, error: "Failed to update State configuration." });
  }
});

router.post("/:assetId/modes/:modeId/activate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const asset = await getOwnedAsset(String(req.params.assetId ?? ""), req.user?.userId ?? "");
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found." });

    const config = normalizeConfiguration(asset.stateConfig);
    const modeId = String(req.params.modeId ?? "");
    const mode = config.modes?.find((candidate) => candidate.id === modeId && candidate.enabled);
    if (!mode) return res.status(404).json({ success: false, error: "Enabled State mode not found." });

    const nextConfig: TheStateConfiguration = {
      ...config,
      current: {
        ...(config.current ?? {}),
        modeId,
        status: "active",
        since: new Date().toISOString(),
      },
    };

    const updated = await db.asset.update({
      where: { id: asset.id },
      data: { stateConfig: nextConfig },
      include: { experiences: { orderBy: { createdAt: "asc" } } },
    });

    return res.json({ success: true, state: stateAsset(updated) });
  } catch (error) {
    console.error("State mode activation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to activate State mode." });
  }
});

router.post("/:assetId/modes/:modeId/deactivate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const asset = await getOwnedAsset(String(req.params.assetId ?? ""), req.user?.userId ?? "");
    if (!asset) return res.status(404).json({ success: false, error: "Asset not found." });

    const config = normalizeConfiguration(asset.stateConfig);
    const modeId = String(req.params.modeId ?? "");
    if (!config.modes?.some((mode) => mode.id === modeId)) {
      return res.status(404).json({ success: false, error: "State mode not found." });
    }

    const nextConfig: TheStateConfiguration = {
      ...config,
      current: {
        ...(config.current ?? {}),
        modeId: null,
        status: "idle",
        since: null,
      },
    };

    const updated = await db.asset.update({
      where: { id: asset.id },
      data: { stateConfig: nextConfig },
      include: { experiences: { orderBy: { createdAt: "asc" } } },
    });

    return res.json({ success: true, state: stateAsset(updated) });
  } catch (error) {
    console.error("State mode deactivation failed:", error);
    return res.status(500).json({ success: false, error: "Failed to deactivate State mode." });
  }
});

export default router;
