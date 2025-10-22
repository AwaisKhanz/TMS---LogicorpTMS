import type { User, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";

// Type for User with included relations
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    organization: true;
    roles: {
      include: {
        role: {
          include: {
            permissions: true;
          };
        };
      };
    };
  };
}>;

export class UserRepository extends BaseRepository<User> {
  protected modelName = "User";

  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<UserWithRelations | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
