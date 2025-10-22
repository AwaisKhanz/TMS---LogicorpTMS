import type { Load, Prisma, LoadStatus } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";
import type { OrganizationDocumentNumbering } from "../types/common.types.js";
import type { LoadEventData } from "../types/load.types.js";

// Type for Load with included relations
export type LoadWithRelations = Prisma.LoadGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        companyName: true;
      };
    };
    carrier: {
      select: {
        id: true;
        companyName: true;
        mcNumber: true;
      };
    };
    creator: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
    assignee: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
    events: true;
  };
}>;

export type LoadWithMinimalRelations = Prisma.LoadGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        companyName: true;
      };
    };
    carrier: {
      select: {
        id: true;
        companyName: true;
        mcNumber: true;
      };
    };
    creator: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

export interface LoadFilters {
  status?: string;
  customerId?: string;
  carrierId?: string;
  pickupDateFrom?: Date;
  pickupDateTo?: Date;
  search?: string;
}

export class LoadRepository extends BaseRepository<Load> {
  protected modelName = "load";

  async findWithFilters(
    filters: LoadFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: LoadWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.LoadWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status as LoadStatus;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.carrierId) {
      where.carrierId = filters.carrierId;
    }

    if (filters.pickupDateFrom || filters.pickupDateTo) {
      where.pickupDate = {};
      if (filters.pickupDateFrom) {
        where.pickupDate.gte = filters.pickupDateFrom;
      }
      if (filters.pickupDateTo) {
        where.pickupDate.lte = filters.pickupDateTo;
      }
    }

    if (filters.search) {
      where.OR = [
        { loadNumber: { contains: filters.search, mode: "insensitive" } },
        { referenceNumber: { contains: filters.search, mode: "insensitive" } },
        { commodity: { contains: filters.search, mode: "insensitive" } },
        { shipperName: { contains: filters.search, mode: "insensitive" } },
        { consigneeName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
            },
          },
          carrier: {
            select: {
              id: true,
              companyName: true,
              mcNumber: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.load.count({ where }),
    ]);

    return { data: loads, total };
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<LoadWithRelations | null> {
    return this.prisma.load.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        customer: true,
        carrier: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        events: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });
  }

  async createWithRelations(
    data: Omit<Prisma.LoadUncheckedCreateInput, "organizationId">,
    organizationId: string
  ): Promise<LoadWithMinimalRelations> {
    const load = await this.prisma.load.create({
      data: {
        ...data,
        organizationId,
      },
      include: {
        customer: true,
        carrier: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return load;
  }

  async updateWithRelations(
    id: string,
    data: Prisma.LoadUncheckedUpdateInput,
    organizationId: string
  ): Promise<LoadWithMinimalRelations | null> {
    const existingLoad = await this.findById(id, organizationId);
    if (!existingLoad) {
      return null;
    }

    const load = await this.prisma.load.update({
      where: { id },
      data,
      include: {
        customer: true,
        carrier: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return load;
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existingLoad = await this.findById(id, organizationId);
    if (!existingLoad) {
      return false;
    }

    await this.prisma.load.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async findByLoadNumber(
    loadNumber: string,
    organizationId: string
  ): Promise<Load | null> {
    return this.prisma.load.findFirst({
      where: {
        loadNumber,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async getStatsByStatus(organizationId: string) {
    return this.prisma.load.groupBy({
      by: ["status"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        customerRate: true,
        carrierRate: true,
        margin: true,
      },
    });
  }

  async getNextLoadNumber(organizationId: string): Promise<number> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { documentNumbering: true },
    });

    const settings =
      (org?.documentNumbering as OrganizationDocumentNumbering) || {};
    const loadSettings = settings.LOAD || {
      prefix: "LD",
      startNumber: 1,
      currentNumber: 0,
    };

    return loadSettings.currentNumber + 1;
  }

  async updateLoadNumberSequence(
    organizationId: string,
    nextNumber: number
  ): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { documentNumbering: true },
    });

    const settings =
      (org?.documentNumbering as OrganizationDocumentNumbering) || {};
    const loadSettings = settings.LOAD || {
      prefix: "LD",
      startNumber: 1,
      currentNumber: 0,
    };

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        documentNumbering: {
          ...settings,
          LOAD: {
            ...loadSettings,
            currentNumber: nextNumber,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async createLoadEvent(
    loadId: string,
    eventType: string,
    eventData: LoadEventData,
    userId: string
  ): Promise<void> {
    await this.prisma.loadEvent.create({
      data: {
        loadId,
        eventType,
        eventData: eventData as unknown as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });
  }

  async getOrganizationSettings(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { documentNumbering: true },
    });
  }

  async getLoadEvents(loadId: string) {
    return this.prisma.loadEvent.findMany({
      where: { loadId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLoadDocuments(loadId: string, organizationId: string) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        entityType: "LOAD",
        entityId: loadId,
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async getCarrier(carrierId: string, organizationId: string) {
    return this.prisma.carrier.findFirst({
      where: {
        id: carrierId,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async getDashboardStatistics(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [
      totalLoads,
      activeLoads,
      todayPickups,
      todayDeliveries,
      weekRevenue,
      monthRevenue,
      statusCounts,
    ] = await Promise.all([
      // Total loads count
      this.prisma.load.count({
        where: {
          organizationId,
          deletedAt: null,
        },
      }),

      // Active loads (in transit)
      this.prisma.load.count({
        where: {
          organizationId,
          status: "IN_TRANSIT",
          deletedAt: null,
        },
      }),

      // Today's pickups
      this.prisma.load.count({
        where: {
          organizationId,
          pickupDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lt: new Date(now.setHours(23, 59, 59, 999)),
          },
          deletedAt: null,
        },
      }),

      // Today's deliveries
      this.prisma.load.count({
        where: {
          organizationId,
          deliveryDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lt: new Date(now.setHours(23, 59, 59, 999)),
          },
          deletedAt: null,
        },
      }),

      // This week's revenue
      this.prisma.load.aggregate({
        where: {
          organizationId,
          deliveredAt: {
            gte: startOfWeek,
          },
          deletedAt: null,
        },
        _sum: {
          customerRate: true,
          margin: true,
        },
      }),

      // This month's revenue
      this.prisma.load.aggregate({
        where: {
          organizationId,
          deliveredAt: {
            gte: startOfMonth,
          },
          deletedAt: null,
        },
        _sum: {
          customerRate: true,
          margin: true,
        },
      }),

      // Status distribution
      this.prisma.load.groupBy({
        by: ["status"],
        where: {
          organizationId,
          deletedAt: null,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      totalLoads,
      activeLoads,
      todayPickups,
      todayDeliveries,
      weekRevenue: Number(weekRevenue._sum.customerRate) || 0,
      weekMargin: Number(weekRevenue._sum.margin) || 0,
      monthRevenue: Number(monthRevenue._sum.customerRate) || 0,
      monthMargin: Number(monthRevenue._sum.margin) || 0,
      statusDistribution: statusCounts.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
