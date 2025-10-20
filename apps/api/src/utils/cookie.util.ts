import { Response } from "express";
import { config } from "../config/env.js";

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
}

/**
 * Set HTTP-only cookie
 */
export const setTokenCookie = (
  res: Response,
  name: string,
  value: string,
  maxAge: number
) => {
  const cookieOptions: CookieOptions = {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: config.env === "production", // HTTPS only in production
    sameSite: config.env === "production" ? "strict" : "lax",
    maxAge, // in milliseconds
    path: "/",
  };

  res.cookie(name, value, cookieOptions);
};

/**
 * Set access token cookie (15 minutes)
 */
export const setAccessTokenCookie = (res: Response, token: string) => {
  setTokenCookie(res, "accessToken", token, 15 * 60 * 1000); // 15 minutes
};

/**
 * Set refresh token cookie (7 days)
 */
export const setRefreshTokenCookie = (res: Response, token: string) => {
  setTokenCookie(res, "refreshToken", token, 7 * 24 * 60 * 60 * 1000); // 7 days
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};

/**
 * Extract token from cookie or Authorization header
 */
export const extractToken = (
  req: any
): { token: string; source: "cookie" | "header" } | null => {
  // Try cookie first (preferred)
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return { token: cookieToken, source: "cookie" };
  }

  // Fallback to Authorization header (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.substring(7), source: "header" };
  }

  return null;
};
