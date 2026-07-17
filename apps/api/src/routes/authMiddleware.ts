import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * =========================
 * ENV SAFETY (STRICT)
 * =========================
 */
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing - server cannot start");
}

/**
 * =========================
 * JWT USER TYPE
 * =========================
 */
export type JwtUser = JwtPayload & {
  userId: string;
  role?: "user" | "admin";
};

/**
 * =========================
 * AUTH REQUEST TYPE
 * =========================
 */
export type AuthRequest = Request & {
  user?: JwtUser;
};

/**
 * =========================
 * AUTH MIDDLEWARE
 * =========================
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  // ✅ ALLOW GUEST SCANS
  if (!header) {
    return next();
  }

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return next(); // treat as guest instead of blocking system
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUser;

    if (decoded?.userId) {
      req.user = {
        userId: decoded.userId,
        role: decoded.role ?? "user",
      };
    }

    return next();
  } catch {
    return next(); // never block scan engine flow
  }
}

/**
 * =========================
 * ADMIN GUARD
 * =========================
 */
export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  next();
}