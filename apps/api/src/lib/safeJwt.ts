import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET!) as any;
}