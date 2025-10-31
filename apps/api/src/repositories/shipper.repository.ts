import type { Shipper, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";
import type { WhereClause } from "../types/common.types.js";

// Type for Shipper with included relations
export type ShipperWithRelations = Prisma.ShipperGetPayload<{
  include: {
    _count: {
      select: {
        loadShippers: true;
      };
    };
  };
}>;

export type ShipperWithMinimalRelations = Prisma.ShipperGetPayload<{
  include: {
    _count: {
      select: {
        loadShippers: true;
      };
    };
  };
}>;

export interface ShipperFilters {
  isActive?: boolean;
  state?: string;
  search?: string;
}

export class ShipperRepository extends BaseRepository<Shipper> {
  protected modelName = "shipper";

  async findWithFilters(
    filters: ShipperFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ShipperWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { contactPerson: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [shippers, total] = await Promise.all([
      this.prisma.shipper.findMany({
        where,
        include: {
          _count: {
            select: {
              loadShippers: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.shipper.count({ where }),
    ]);

    return { data: shippers, total };
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<ShipperWithRelations | null> {
    return this.prisma.shipper.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            loadShippers: true,
          },
        },
      },
    });
  }

  async findByCompanyAndAddress(
    companyName: string,
    streetAddress: string,
    city: string,
    state: string,
    organizationId: string,
    excludeId?: string
  ): Promise<Shipper | null> {
    const where: WhereClause = {
      organizationId,
      companyName,
      streetAddress,
      city,
      state,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.prisma.shipper.findFirst({ where });
  }

  async createWithRelations(
    data: Omit<Prisma.ShipperUncheckedCreateInput, "organizationId">,
    organizationId: string
  ): Promise<Shipper> {
    return this.prisma.shipper.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateWithRelations(
    id: string,
    data: Prisma.ShipperUncheckedUpdateInput,
    organizationId: string
  ): Promise<Shipper | null> {
    const existingShipper = await this.findById(id, organizationId);
    if (!existingShipper) {
      return null;
    }

    return this.prisma.shipper.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existingShipper = await this.findById(id, organizationId);
    if (!existingShipper) {
      return false;
    }

    // Check if shipper has active loads
    const activeLoads = await this.prisma.load.count({
      where: {
        loadShippers: {
          some: {
            shipperId: id,
          },
        },
        deletedAt: null,
        status: {
          notIn: ["DELIVERED", "PAID", "CANCELLED"],
        },
      },
    });

    if (activeLoads > 0) {
      throw new Error("Cannot delete shipper with active loads");
    }

    await this.prisma.shipper.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async getStatistics(organizationId: string) {
    const stats = await this.prisma.shipper.groupBy({
      by: ["isActive"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const totalShippers = await this.prisma.shipper.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    });

    const activeShippers = await this.prisma.shipper.count({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
    });

    const totalLoads = await this.prisma.load.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    });

    return {
      total: totalShippers,
      active: activeShippers,
      inactive: totalShippers - activeShippers,
      totalLoads,
      breakdown: stats,
    };
  }

  async getTopShippers(organizationId: string, limit: number = 10) {
    return this.prisma.shipper.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            loadShippers: true,
          },
        },
      },
      orderBy: {
        loadShippers: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  async exportShippers(organizationId: string, filters: ShipperFilters) {
    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { contactPerson: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.shipper.findMany({
      where,
      include: {
        _count: {
          select: {
            loadShippers: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  }

  async bulkUpdate(
    shipperIds: string[],
    updates: Record<string, unknown>,
    organizationId: string
  ) {
    const results = await this.prisma.shipper.updateMany({
      where: {
        id: { in: shipperIds },
        organizationId,
        deletedAt: null,
      },
      data: updates,
    });

    return {
      success: results.count,
      failed: shipperIds.length - results.count,
      errors: [],
    };
  }

  async bulkDelete(shipperIds: string[], organizationId: string) {
    const results = [];
    const errors = [];

    for (const shipperId of shipperIds) {
      try {
        const success = await this.softDelete(shipperId, organizationId);
        if (success) {
          results.push(shipperId);
        } else {
          errors.push({
            shipperId,
            error: "Shipper not found",
          });
        }
      } catch (error) {
        errors.push({
          shipperId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      errors,
    };
  }
}
