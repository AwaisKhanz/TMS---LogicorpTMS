import type { Load, Prisma } from "@prisma/client";
import { LoadStatus, LoadFilters } from "@tms/shared-types";
import { BaseRepository } from "./base.repository.js";
import type { OrganizationDocumentNumbering } from "../types/common.types.js";
import type { LoadEventData } from "@tms/shared-types";

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
    shipper: {
      select: {
        id: true;
        companyName: true;
        phone: true;
        email: true;
        streetAddress: true;
        city: true;
        state: true;
        zipCode: true;
        country: true;
        contactPerson: true;
      };
    };
    consignee: {
      select: {
        id: true;
        companyName: true;
        phone: true;
        email: true;
        streetAddress: true;
        city: true;
        state: true;
        zipCode: true;
        country: true;
        contactPerson: true;
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
    shipper: {
      select: {
        id: true;
        companyName: true;
        phone: true;
        email: true;
        streetAddress: true;
        city: true;
        state: true;
        zipCode: true;
        country: true;
        contactPerson: true;
      };
    };
    consignee: {
      select: {
        id: true;
        companyName: true;
        phone: true;
        email: true;
        streetAddress: true;
        city: true;
        state: true;
        zipCode: true;
        country: true;
        contactPerson: true;
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

export class LoadRepository extends BaseRepository<Load> {
  protected modelName = "load";

  async findWithFilters(
    filters: LoadFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50,
    userId?: string,
    userPermissions?: string[]
  ): Promise<{ data: LoadWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.LoadWhereInput = {
      organizationId,
      deletedAt: null,
      // Exclude completed loads from regular load queries
      status: {
        not: LoadStatus.COMPLETED,
      },
    };

    // If userId is provided, filter by assigned customers unless user has load:view:all permission
    if (userId && userPermissions) {
      // Check if user has load:view:all permission
      const hasViewAllPermission = userPermissions.includes("load:view:all");

      // If user doesn't have view:all permission, filter by assigned customers
      if (!hasViewAllPermission) {
        const userCustomers = await this.prisma.userCustomer.findMany({
          where: { userId },
          select: { customerId: true },
        });

        const customerIds = userCustomers.map((uc) => uc.customerId);

        if (customerIds.length === 0) {
          // User has no assigned customers, return empty result
          return { data: [], total: 0 };
        }

        where.customerId = { in: customerIds };
      }
    }

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
        {
          shipper: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          consignee: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
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
          shipper: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              email: true,
              streetAddress: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              contactPerson: true,
            },
          },
          consignee: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              email: true,
              streetAddress: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              contactPerson: true,
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

  async findCompletedLoads(
    organizationId: string,
    page: number = 1,
    limit: number = 50,
    userId?: string,
    userPermissions?: string[]
  ): Promise<{ data: LoadWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.LoadWhereInput = {
      organizationId,
      deletedAt: null,
      status: LoadStatus.COMPLETED,
    };

    // If userId is provided, filter by assigned customers unless user has load:view:all permission
    if (userId && userPermissions) {
      // Check if user has load:view:all permission
      const hasViewAllPermission = userPermissions.includes("load:view:all");

      // If user doesn't have view:all permission, filter by assigned customers
      if (!hasViewAllPermission) {
        const userCustomers = await this.prisma.userCustomer.findMany({
          where: { userId },
          select: { customerId: true },
        });

        const customerIds = userCustomers.map((uc) => uc.customerId);

        if (customerIds.length === 0) {
          // User has no assigned customers, return empty result
          return { data: [], total: 0 };
        }

        where.customerId = { in: customerIds };
      }
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
          shipper: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              email: true,
              streetAddress: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              contactPerson: true,
            },
          },
          consignee: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              email: true,
              streetAddress: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              contactPerson: true,
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
    organizationId: string,
    userId?: string
  ): Promise<LoadWithRelations | null> {
    const where: Prisma.LoadWhereInput = {
      id,
      organizationId,
      deletedAt: null,
    };

    // If userId is provided, filter by assigned customers
    if (userId) {
      // Check if user is administrator
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user has administrator role
      const isAdmin = user.roles.some(
        (userRole) => userRole.role.name === "ADMINISTRATOR"
      );

      // If not admin, filter by assigned customers
      if (!isAdmin) {
        const userCustomers = await this.prisma.userCustomer.findMany({
          where: { userId },
          select: { customerId: true },
        });

        const customerIds = userCustomers.map((uc) => uc.customerId);

        if (customerIds.length === 0) {
          // User has no assigned customers, return null
          return null;
        }

        where.customerId = { in: customerIds };
      }
    }

    return this.prisma.load.findFirst({
      where,
      include: {
        customer: true,
        carrier: true,
        shipper: true,
        consignee: true,
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
        shipper: true,
        consignee: true,
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
        shipper: true,
        consignee: true,
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
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async getLoadDocuments(
    loadId: string,
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const search = options?.search?.trim();
    const type = options?.type;

    // Build where clause
    const where: any = {
      organizationId,
      entityType: "LOAD",
      entityId: loadId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        // Only search type if it's a string field, otherwise skip
        // { type: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add type filter
    if (type) {
      where.type = type;
    }

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
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

    // Create proper date ranges without mutating the original date
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

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
            gte: startOfToday,
            lt: endOfToday,
          },
          deletedAt: null,
        },
      }),

      // Today's deliveries
      this.prisma.load.count({
        where: {
          organizationId,
          deliveryDate: {
            gte: startOfToday,
            lt: endOfToday,
          },
          deletedAt: null,
        },
      }),

      // This week's revenue (from loads created this week)
      this.prisma.load.aggregate({
        where: {
          organizationId,
          createdAt: {
            gte: startOfWeek,
          },
          deletedAt: null,
        },
        _sum: {
          customerRate: true,
          margin: true,
        },
      }),

      // This month's revenue (from loads created this month)
      this.prisma.load.aggregate({
        where: {
          organizationId,
          createdAt: {
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

  async getRevenueChartData(organizationId: string, months: number = 6) {
    const currentDate = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        1
      );
      const monthName = date.toLocaleDateString("en-US", { month: "short" });

      const [revenueData, loadCount] = await Promise.all([
        this.prisma.load.aggregate({
          where: {
            organizationId,
            deliveredAt: {
              gte: date,
              lt: nextMonth,
            },
            deletedAt: null,
          },
          _sum: {
            customerRate: true,
          },
        }),
        this.prisma.load.count({
          where: {
            organizationId,
            createdAt: {
              gte: date,
              lt: nextMonth,
            },
            deletedAt: null,
          },
        }),
      ]);

      results.push({
        month: monthName,
        revenue: Number(revenueData._sum.customerRate) || 0,
        loads: loadCount,
      });
    }

    return results;
  }

  async getLoadStatusChartData(organizationId: string) {
    const statusCounts = await this.prisma.load.groupBy({
      by: ["status"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    return statusCounts.map((status) => ({
      status: status.status,
      count: status._count.id,
    }));
  }

  async getPerformanceChartData(organizationId: string, weeks: number = 4) {
    const currentDate = new Date();
    const results = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const [pickups, deliveries] = await Promise.all([
        this.prisma.load.count({
          where: {
            organizationId,
            pickupDate: {
              gte: weekStart,
              lte: weekEnd,
            },
            deletedAt: null,
          },
        }),
        this.prisma.load.count({
          where: {
            organizationId,
            deliveryDate: {
              gte: weekStart,
              lte: weekEnd,
            },
            deletedAt: null,
          },
        }),
      ]);

      results.push({
        week: `Week ${weeks - i}`,
        pickups,
        deliveries,
      });
    }

    return results;
  }

  async getCarrierPerformanceChartData(
    organizationId: string,
    limit: number = 4
  ) {
    const carrierPerformance = await this.prisma.load.groupBy({
      by: ["carrierId"],
      where: {
        organizationId,
        carrierId: {
          not: null,
        },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    // Transform the data to ensure _count is a number
    return carrierPerformance.map((item) => ({
      ...item,
      _count: typeof item._count === "object" ? item._count.id : item._count,
    }));
  }

  async groupByStatus(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const results = await this.prisma.load.groupBy({
      by: ["status"],
      where: {
        organizationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    return results.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.id }),
      {}
    );
  }

  async aggregate(organizationId: string, where: any) {
    return this.prisma.load.aggregate({
      where: {
        organizationId,
        ...where,
      },
      _sum: {
        customerRate: true,
        carrierRate: true,
        margin: true,
      },
    });
  }
}
