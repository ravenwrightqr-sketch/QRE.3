import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@qre/db";
import { Express, Request, Response } from "express";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/requireAuth.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

export function authRoutes(app: Express) {
  /**
   * =========================
   * REGISTER
   * =========================
   */
  app.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "missing fields" });
      }

      const exists = await db.user.findUnique({
        where: { email },
      });

      if (exists) {
        return res.status(409).json({ error: "user exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await db.user.create({
        data: {
          email,
          password: hashed,
          tier: "BASIC",
          tierActive: true,
        },
      });

      /**
       * 🔥 FIX: include email in JWT (identity consistency layer)
       */
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          tierActive: user.tierActive,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * =========================
   * LOGIN
   * =========================
   */
  app.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "missing fields" });
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: "invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return res.status(401).json({ error: "invalid credentials" });
      }

      /**
       * 🔥 FIX: include email here too (same identity contract)
       */
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          tierActive: user.tierActive,
        },
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * =========================
   * RESTORE SESSION
   * =========================
   */
  app.get(
    "/auth/me",
    requireAuth,
    async (req: AuthRequest, res: Response) => {
      try {
        const user = await db.user.findUnique({
          where: {
            id: req.user!.userId,
          },
          select: {
            id: true,
            email: true,
            tier: true,
            tierActive: true,
          },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.json({ user });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }
  );
}