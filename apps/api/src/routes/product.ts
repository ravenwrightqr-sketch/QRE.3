import { Router, Request, Response } from "express";
import { db } from "@qre/db";

const router = Router();

/**
 * SAFE STRING EXTRACTOR (THIS FIXES YOUR ERROR)
 */
function getSlug(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

router.get("/", async (req: Request, res: Response) => {
  const slug = getSlug(req.query.slug);

  if (!slug) {
    return res.status(400).json({ error: "Missing or invalid slug" });
  }

  const asset = await db.asset.findUnique({
    where: { slug }, // ✅ NOW FULLY SAFE FOR PRISMA
  });

  if (!asset) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({ asset });
});

export default router;