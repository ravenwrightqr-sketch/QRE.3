import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export type AuthRequest = Request & {
  user?: {
    userId: string;
  };
};

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7);
console.log("AUTH HEADER:", req.headers.authorization);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}