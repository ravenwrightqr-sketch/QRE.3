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

    // =====================================================
    // AUTH HEADER CHECK
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }


    // =====================================================
    // TEMP DEBUG SECTION
    // REMOVE THIS ENTIRE SECTION AFTER AUTH IS FIXED
    // =====================================================

    console.log(
      "[AUTH DEBUG] Authorization:",
      req.headers.authorization
    );

    // =====================================================
    // END TEMP DEBUG SECTION
    // =====================================================


    const token = authHeader.slice(7);


    // =====================================================
    // JWT VERIFY
    // =====================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      email?: string;
    };


    // =====================================================
    // ATTACH USER TO REQUEST
    // =====================================================

    req.user = {
      userId: decoded.userId,
    };


    next();


  } catch (error) {


    // =====================================================
    // TEMP ERROR DEBUG SECTION
    // REMOVE AFTER AUTH IS STABLE
    // =====================================================

    console.error(
      "[AUTH ERROR]",
      error
    );

    // =====================================================
    // END TEMP ERROR DEBUG SECTION
    // =====================================================


    return res.status(401).json({
      error: "Invalid token",
    });
  }
}