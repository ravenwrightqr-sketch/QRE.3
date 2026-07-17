import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET missing - server cannot start"
  );
}

const JWT_SECRET_VALUE: string = JWT_SECRET;



export type JwtUser = {

  userId: string;

  role?:
    | "user"
    | "admin";

};



export type AuthRequest =
  Request & {

    user?: JwtUser;

  };



/**
 * =====================================================
 * OPTIONAL AUTH RESOLVER
 *
 * Used before routes that may be public.
 *
 * - Token exists -> validate user
 * - No token -> continue as guest
 * =====================================================
 */

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {


  const header =
    req.headers.authorization;



  // Public visitor
  if (!header) {

    return next();

  }



  if (
    !header.startsWith("Bearer ")
  ) {

    return res.status(401).json({
      error:
        "Invalid authorization header",
    });

  }



  const token =
    header.substring(7);



  try {


    const decoded =
      jwt.verify(
        token,
          JWT_SECRET_VALUE
      ) as jwt.JwtPayload;



    if (
      typeof decoded.userId !== "string"
    ) {

      return res.status(401).json({
        error:
          "Invalid token payload",
      });

    }



    req.user = {

      userId:
        decoded.userId,

      role:
        decoded.role === "admin"
          ? "admin"
          : "user",

    };



    return next();



  } catch {


    return res.status(401).json({

      error:
        "Invalid token",

    });

  }

}





/**
 * =====================================================
 * REQUIRED AUTH
 *
 * Protected routes use this.
 *
 * Example:
 * /api/user/assets
 * /api/flow/*
 * /api/dashboard/*
 *
 * =====================================================
 */

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {


  if (
    !req.user?.userId
  ) {

    return res.status(401).json({

      error:
        "Authentication required",

    });

  }



  next();

}





export function adminOnly(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {


  if (
    req.user?.role !== "admin"
  ) {

    return res.status(403).json({

      error:
        "Admin only",

    });

  }



  next();

}