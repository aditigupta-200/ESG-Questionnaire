import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  user?: { id: number; email: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "JWT secret not configured" });
    const payload = jwt.verify(token, secret) as unknown as { id: number; email: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
