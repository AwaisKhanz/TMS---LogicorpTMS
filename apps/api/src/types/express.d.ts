import type { User, Organization } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        organizationId: string;
        email: string;
        role: string;
        permissions: string[];
        emailVerified: boolean;
      };
      tenant?: Organization;
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
  auth: {
    userId: string;
    organizationId: string;
    email: string;
    role: string;
    permissions: string[];
    emailVerified: boolean;
  };
}

export {};
