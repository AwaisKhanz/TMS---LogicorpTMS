import jwt, { SignOptions } from "jsonwebtoken";
import { AuthenticationError } from "./errors.util.js";

import { config } from "../config/env.js";

const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

export interface JWTPayload {
  sub: string; // User ID
  org: string; // Organization ID
  email: string;
  role: string; // Primary role
  permissions: string[]; // Array of permissions
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Invalid token");
    }
    throw new AuthenticationError("Token verification failed");
  }
};
