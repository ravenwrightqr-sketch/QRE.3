import express from "express";
import { db } from "@qre/db";
import { authMiddleware, type AuthRequest } from "./authMiddleware.js";

const router = express.Router();

router.get(
  "/assets",
  authMiddleware,
  async (req: AuthRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.userId;

    const assets = await db.asset.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json(assets);
  }
);

export default router;