import type { User, Organization } from "@tms/database";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        organizationId: string;
        email: string;
        role: string;
        permissions: string[];
      };
      tenant?: Organization;
      user?: User;
    }
  }
}

export {};
