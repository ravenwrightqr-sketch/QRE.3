import express, { Response } from "express";

import type {
  MemoryFactKind,
  MemoryFactStatus,
  MemoryVisibility,
} from "@qre/contracts";

import { requireAuth, type AuthRequest } from "../middleware/requireAuth.js";
import { createMemoryRepository } from "../repositories/memoryRepository.js";

const router = express.Router();
const memory = createMemoryRepository();

const STATUSES: MemoryFactStatus[] = [
  "active",
  "superseded",
  "retracted",
  "quarantined",
];

const VISIBILITIES: MemoryVisibility[] = ["private", "shared", "public"];
const FACT_KINDS: MemoryFactKind[] = [
  "identity",
  "attribute",
  "relationship",
  "preference",
  "history",
  "event",
  "outcome",
  "behavior",
  "context",
];

function bodyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function validStatus(value: unknown): value is MemoryFactStatus {
  return typeof value === "string" && STATUSES.includes(value as MemoryFactStatus);
}

function validVisibility(value: unknown): value is MemoryVisibility {
  return typeof value === "string" && VISIBILITIES.includes(value as MemoryVisibility);
}

function validKind(value: unknown): value is MemoryFactKind {
  return typeof value === "string" && FACT_KINDS.includes(value as MemoryFactKind);
}

router.use(requireAuth);

/**
 * Read the governed memory context for an asset.
 * Only authenticated tenant members can inspect memory.
 */
router.get("/:assetId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const context = await memory.loadContext({
      assetId: req.params.assetId,
      userId,
    });

    return res.json(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory read failed";
    if (message === "Memory access denied") {
      return res.status(403).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

/**
 * Portable memory export. The export is JSON and deliberately contains the
 * governed context shape rather than database rows.
 */
router.get("/:assetId/export", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const context = await memory.loadContext({
      assetId: req.params.assetId,
      userId,
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qre-memory-${req.params.assetId}.json"`,
    );
    return res.json(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory export failed";
    if (message === "Memory access denied") {
      return res.status(403).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

/**
 * Correct a fact without mutating history. The old fact is superseded and a
 * new user-sourced fact is appended with an explicit correction provenance.
 */
router.post("/:assetId/facts/:factId/correct", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const value = bodyString(req.body?.value);
    if (!value) return res.status(400).json({ error: "value required" });

    if (req.body?.kind !== undefined && !validKind(req.body.kind)) {
      return res.status(400).json({ error: "invalid fact kind" });
    }

    if (req.body?.visibility !== undefined && !validVisibility(req.body.visibility)) {
      return res.status(400).json({ error: "invalid visibility" });
    }

    const result = await memory.correctFact({
      assetId: req.params.assetId,
      factId: req.params.factId,
      userId,
      value,
      predicate: bodyString(req.body?.predicate),
      kind: req.body?.kind,
      confidence:
        typeof req.body?.confidence === "number"
          ? Math.max(0, Math.min(1, req.body.confidence))
          : undefined,
      visibility: req.body?.visibility,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory correction failed";
    if (message === "Memory access denied") {
      return res.status(403).json({ error: message });
    }
    if (message === "Memory fact not found") {
      return res.status(404).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

/**
 * Governance mutation for a durable fact. Retraction and quarantine are
 * non-destructive states; restoring a fact is an explicit audited action.
 */
router.patch("/:assetId/facts/:factId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const status = req.body?.status;
    const visibility = req.body?.visibility;

    if (status === undefined && visibility === undefined) {
      return res.status(400).json({ error: "status or visibility required" });
    }

    if (status !== undefined && !validStatus(status)) {
      return res.status(400).json({ error: "invalid fact status" });
    }

    if (visibility !== undefined && !validVisibility(visibility)) {
      return res.status(400).json({ error: "invalid visibility" });
    }

    const result = await memory.setFactGovernance({
      assetId: req.params.assetId,
      factId: req.params.factId,
      userId,
      status,
      visibility,
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Memory governance update failed";
    if (message === "Memory access denied") {
      return res.status(403).json({ error: message });
    }
    if (message === "Memory fact not found") {
      return res.status(404).json({ error: message });
    }
    return res.status(500).json({ error: message });
  }
});

export default router;
