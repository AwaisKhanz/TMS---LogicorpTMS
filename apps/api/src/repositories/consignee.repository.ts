import type { Consignee, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";
import type { WhereClause } from "../types/common.types.js";

// Type for Consignee with included relations
export type ConsigneeWithRelations = Prisma.ConsigneeGetPayload<{
  include: {
    _count: {
      select: {
        loadConsignees: true;
      };
    };
  };
}>;

export type ConsigneeWithMinimalRelations = Prisma.ConsigneeGetPayload<{
  include: {
    _count: {
      select: {
        loadConsignees: true;
      };
    };
  };
}>;

export interface ConsigneeFilters {
  isActive?: boolean;
  state?: string;
  search?: string;
}

export class ConsigneeRepository extends BaseRepository<Consignee> {
  protected modelName = "consignee";

  async findWithFilters(
    filters: ConsigneeFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ConsigneeWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [allConsignees] = await Promise.all([
      this.prisma.consignee.findMany({
        where: {
          organizationId,
          deletedAt: null,
          ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        },
        include: {
          _count: {
            select: {
              loadConsignees: true,
            },
          },
        },
      }),
      this.prisma.consignee.count({
        where: {
          organizationId,
          deletedAt: null,
          ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        },
      }),
    ]);

    // Filter by state and search in memory (since JSON fields are harder to query)
    let filteredConsignees = allConsignees;
    
    if (filters.state) {
      filteredConsignees = filteredConsignees.filter((c) => {
        const addr = c.address as any;
        return addr?.state === filters.state;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredConsignees = filteredConsignees.filter((c) => {
        const addr = c.address as any;
        return (
          c.companyName.toLowerCase().includes(searchLower) ||
          c.phone.toLowerCase().includes(searchLower) ||
          (c.email && c.email.toLowerCase().includes(searchLower)) ||
          (addr?.city && addr.city.toLowerCase().includes(searchLower)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(searchLower))
        );
      });
    }

    // Sort and paginate
    filteredConsignees.sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = filteredConsignees.length;
    const paginatedConsignees = filteredConsignees.slice(skip, skip + limit);

    return { data: paginatedConsignees, total };
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<ConsigneeWithRelations | null> {
    return this.prisma.consignee.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            loadConsignees: true,
          },
        },
      },
    });
  }

  async findByCompanyAndAddress(
    companyName: string,
    address: any,
    organizationId: string,
    excludeId?: string
  ): Promise<Consignee | null> {
    const where: WhereClause = {
      organizationId,
      companyName,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    // Find by company name first, then filter by address in memory
    const consignees = await this.prisma.consignee.findMany({ where });

    // Filter in memory for exact address match
    return (
      consignees.find((c) => {
        const addr = c.address as any;
        return (
          addr?.street === address.street &&
          addr?.city === address.city &&
          addr?.state === address.state
        );
      }) || null
    );
  }

  async createWithRelations(
    data: Omit<Prisma.ConsigneeUncheckedCreateInput, "organizationId">,
    organizationId: string
  ): Promise<Consignee> {
    return this.prisma.consignee.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateWithRelations(
    id: string,
    data: Prisma.ConsigneeUncheckedUpdateInput,
    organizationId: string
  ): Promise<Consignee | null> {
    const existingConsignee = await this.findById(id, organizationId);
    if (!existingConsignee) {
      return null;
    }

    return this.prisma.consignee.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existingConsignee = await this.findById(id, organizationId);
    if (!existingConsignee) {
      return false;
    }

    // Check if consignee has active loads
    const activeLoads = await this.prisma.load.count({
      where: {
        loadConsignees: {
          some: {
            consigneeId: id,
          },
        },
        deletedAt: null,
        status: {
          notIn: ["DELIVERED", "PAID", "CANCELLED"],
        },
      },
    });

    if (activeLoads > 0) {
      throw new Error("Cannot delete consignee with active loads");
    }

    await this.prisma.consignee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async getStatistics(organizationId: string) {
    const stats = await this.prisma.consignee.groupBy({
      by: ["isActive"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const totalConsignees = await this.prisma.consignee.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    });

    const activeConsignees = await this.prisma.consignee.count({
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
      total: totalConsignees,
      active: activeConsignees,
      inactive: totalConsignees - activeConsignees,
      totalLoads,
      breakdown: stats,
    };
  }

  async getTopConsignees(organizationId: string, limit: number = 10) {
    return this.prisma.consignee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            loadConsignees: true,
          },
        },
      },
      orderBy: {
        loadConsignees: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  async exportConsignees(organizationId: string, filters: ConsigneeFilters) {
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

    return this.prisma.consignee.findMany({
      where,
      include: {
        _count: {
          select: {
            loadConsignees: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  }

  async bulkUpdate(
    consigneeIds: string[],
    updates: Record<string, unknown>,
    organizationId: string
  ) {
    const results = await this.prisma.consignee.updateMany({
      where: {
        id: { in: consigneeIds },
        organizationId,
        deletedAt: null,
      },
      data: updates,
    });

    return {
      success: results.count,
      failed: consigneeIds.length - results.count,
      errors: [],
    };
  }

  async bulkDelete(consigneeIds: string[], organizationId: string) {
    const results = [];
    const errors = [];

    for (const consigneeId of consigneeIds) {
      try {
        const success = await this.softDelete(consigneeId, organizationId);
        if (success) {
          results.push(consigneeId);
        } else {
          errors.push({
            consigneeId,
            error: "Consignee not found",
          });
        }
      } catch (error) {
        errors.push({
          consigneeId,
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
