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

// Type for UserCustomer with customer relation
export type UserCustomerWithCustomer = Prisma.UserCustomerGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        companyName: true;
        billingEmail: true;
        billingPhone: true;
        isActive: true;
        totalLoads: true;
        totalRevenue: true;
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

  async assignCustomers(userId: string, customerIds: string[]): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!Array.isArray(customerIds)) {
      throw new Error("Customer IDs must be an array");
    }

    // Remove existing assignments
    await this.prisma.userCustomer.deleteMany({
      where: { userId },
    });

    // Create new assignments
    if (customerIds.length > 0) {
      await this.prisma.userCustomer.createMany({
        data: customerIds.map((customerId) => ({
          userId,
          customerId,
        })),
      });
    }
  }

  async getUserCustomers(
    userId: string
  ): Promise<UserCustomerWithCustomer["customer"][]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userCustomers = await this.prisma.userCustomer.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            billingEmail: true,
            billingPhone: true,
            isActive: true,
            totalLoads: true,
            totalRevenue: true,
          },
        },
      },
    });

    return userCustomers.map((uc: UserCustomerWithCustomer) => uc.customer);
  }

  async removeCustomerAssignment(
    userId: string,
    customerId: string
  ): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    await this.prisma.userCustomer.deleteMany({
      where: {
        userId,
        customerId,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    if (!id) {
      throw new Error("User ID is required");
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
