import { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { AuthenticationError, NotFoundError } from "../utils/errors.util.js";

export const validateTenant = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Ensure authentication middleware has run first
    if (!req.auth || !req.auth.organizationId) {
      throw new AuthenticationError("Authentication required");
    }

    // Fetch organization to ensure it exists and is active
    const organization = await prisma.organization.findUnique({
      where: {
        id: req.auth.organizationId,
      },
    });

    if (!organization) {
      throw new NotFoundError("Organization");
    }

    if (!organization.isActive) {
      throw new AuthenticationError("Organization is inactive");
    }

    // Attach organization to request for easy access
    req.tenant = organization;

    next();
  } catch (error) {
    next(error);
  }
};
