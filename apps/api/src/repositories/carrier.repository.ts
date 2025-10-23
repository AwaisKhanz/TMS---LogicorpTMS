import type { Carrier, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";
import type { WhereClause } from "../types/common.types.js";

// Type for Carrier with included relations
export type CarrierWithRelations = Prisma.CarrierGetPayload<{
  include: {
    contacts: true;
    loads: {
      select: {
        id: true;
        loadNumber: true;
        status: true;
        pickupDate: true;
        deliveryDate: true;
        customerRate: true;
        carrierRate: true;
        customer: {
          select: {
            companyName: true;
          };
        };
      };
    };
    _count: {
      select: {
        loads: true;
      };
    };
  };
}>;

export type CarrierWithMinimalRelations = Prisma.CarrierGetPayload<{
  include: {
    contacts: {
      where: {
        isPrimary: true;
      };
      take: 1;
    };
    _count: {
      select: {
        loads: true;
      };
    };
  };
}>;

export interface CarrierFilters {
  status?: string;
  isActive?: boolean;
  isApproved?: boolean;
  equipment?: string;
  state?: string;
  search?: string;
}

export class CarrierRepository extends BaseRepository<Carrier> {
  protected modelName = "carrier";

  async findWithFilters(
    filters: CarrierFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: CarrierWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    if (filters.status) {
      where.authorityStatus = filters.status;
    }

    if (filters.equipment) {
      where.equipment = {
        has: filters.equipment,
      };
    }

    if (filters.state) {
      where.address = {
        path: ["state"],
        string_contains: filters.state,
      };
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { mcNumber: { contains: filters.search, mode: "insensitive" } },
        { dotNumber: { contains: filters.search, mode: "insensitive" } },
        { scac: { contains: filters.search, mode: "insensitive" } },
        { contactName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [carriers, total] = await Promise.all([
      this.prisma.carrier.findMany({
        where,
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              loads: true,
            },
          },
        },
        orderBy: [{ isApproved: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.carrier.count({ where }),
    ]);

    return { data: carriers, total };
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<CarrierWithRelations | null> {
    return this.prisma.carrier.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        contacts: {
          orderBy: { isPrimary: "desc" },
        },
        loads: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            loadNumber: true,
            status: true,
            pickupDate: true,
            deliveryDate: true,
            customerRate: true,
            carrierRate: true,
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        },
        _count: {
          select: {
            loads: true,
          },
        },
      },
    });
  }

  async findByMcNumber(
    mcNumber: string,
    organizationId: string,
    excludeId?: string
  ): Promise<Carrier | null> {
    const where: WhereClause = {
      organizationId,
      mcNumber,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.prisma.carrier.findFirst({ where });
  }

  async createWithRelations(
    data: Omit<Prisma.CarrierUncheckedCreateInput, "organizationId">,
    organizationId: string
  ): Promise<Carrier> {
    return this.prisma.carrier.create({
      data: {
        ...data,
        organizationId,
        isApproved: false,
      },
      include: {
        contacts: true,
      },
    });
  }

  async updateWithRelations(
    id: string,
    data: Prisma.CarrierUncheckedUpdateInput,
    organizationId: string
  ): Promise<Carrier | null> {
    const existingCarrier = await this.findById(id, organizationId);
    if (!existingCarrier) {
      return null;
    }

    return this.prisma.carrier.update({
      where: { id },
      data,
      include: {
        contacts: true,
      },
    });
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existingCarrier = await this.findById(id, organizationId);
    if (!existingCarrier) {
      return false;
    }

    // Check if carrier has active loads
    const activeLoads = await this.prisma.load.count({
      where: {
        carrierId: id,
        deletedAt: null,
        status: {
          notIn: ["DELIVERED", "PAID", "CANCELLED"],
        },
      },
    });

    if (activeLoads > 0) {
      throw new Error("Cannot delete carrier with active loads");
    }

    await this.prisma.carrier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async approve(
    id: string,
    userId: string,
    organizationId: string
  ): Promise<Carrier | null> {
    const carrier = await this.findById(id, organizationId);
    if (!carrier) {
      return null;
    }

    return this.prisma.carrier.update({
      where: { id },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });
  }

  async getStatistics(organizationId: string) {
    const stats = await this.prisma.carrier.groupBy({
      by: ["isApproved", "isActive"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const totals = await this.prisma.carrier.aggregate({
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const approved = await this.prisma.carrier.count({
      where: {
        organizationId,
        deletedAt: null,
        isApproved: true,
      },
    });

    const active = await this.prisma.carrier.count({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
    });

    return {
      total: totals._count.id,
      approved,
      active,
      pendingApproval: totals._count.id - approved,
      breakdown: stats,
    };
  }

  async findByLane(
    organizationId: string,
    _pickupState: string,
    _deliveryState: string
  ) {
    // TODO: Implement proper JSON filtering for preferredLanes
    // For now, return all active/approved carriers
    // In production, filter by preferredLanes JSON field
    return this.prisma.carrier.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        isApproved: true,
      },
      select: {
        id: true,
        companyName: true,
        mcNumber: true,
        contactName: true,
        contactPhone: true,
        equipment: true,
        onTimeDelivery: true,
        rating: true,
      },
      orderBy: [{ rating: "desc" }, { onTimeDelivery: "desc" }],
    });
  }

  async updatePerformanceMetrics(
    carrierId: string,
    organizationId: string
  ): Promise<void> {
    // Calculate performance metrics
    const stats = await this.prisma.load.groupBy({
      by: ["status"],
      where: {
        carrierId,
        organizationId,
        deletedAt: null,
        deliveredAt: { not: null },
      },
      _count: {
        id: true,
      },
    });

    const totalDelivered = stats.reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate on-time delivery percentage
    const onTimeDeliveries = await this.prisma.load.count({
      where: {
        carrierId,
        organizationId,
        deletedAt: null,
        status: "DELIVERED",
        deliveredAt: { not: null },
        // TODO: Add logic for on-time delivery based on your requirements
      },
    });

    const onTimePercentage =
      totalDelivered > 0 ? (onTimeDeliveries / totalDelivered) * 100 : 100;

    await this.prisma.carrier.update({
      where: { id: carrierId },
      data: {
        totalLoads: totalDelivered,
        onTimeDelivery: onTimePercentage,
      },
    });
  }

  async getCarrierContacts(carrierId: string) {
    return this.prisma.carrierContact.findMany({
      where: { carrierId },
      orderBy: { isPrimary: "desc" },
    });
  }

  async createCarrierContact(
    carrierId: string,
    contactData: Prisma.CarrierContactCreateInput
  ) {
    return this.prisma.carrierContact.create({
      data: {
        ...contactData,
        carrierId,
      } as Prisma.CarrierContactCreateInput,
    });
  }

  async updateCarrierContact(
    contactId: string,
    contactData: Prisma.CarrierContactUpdateInput
  ) {
    return this.prisma.carrierContact.update({
      where: { id: contactId },
      data: contactData,
    });
  }

  async deleteCarrierContact(contactId: string): Promise<boolean> {
    try {
      await this.prisma.carrierContact.delete({
        where: { id: contactId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async unsetPrimaryContacts(
    carrierId: string,
    excludeContactId?: string
  ): Promise<void> {
    await this.prisma.carrierContact.updateMany({
      where: {
        carrierId,
        id: excludeContactId ? { not: excludeContactId } : undefined,
      },
      data: {
        isPrimary: false,
      },
    });
  }

  async getCarrierDocuments(carrierId: string, organizationId: string) {
    return this.prisma.document.findMany({
      where: {
        organizationId,
        entityType: "CARRIER",
        entityId: carrierId,
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async getCarrierPerformance(carrierId: string, organizationId: string) {
    const carrier = await this.prisma.carrier.findFirst({
      where: { id: carrierId, organizationId },
    });

    if (!carrier) {
      return null;
    }

    const [totalLoads, activeLoads, completedLoads, revenue] =
      await Promise.all([
        this.prisma.load.count({
          where: {
            carrierId,
            organizationId,
            deletedAt: null,
          },
        }),
        this.prisma.load.count({
          where: {
            carrierId,
            organizationId,
            deletedAt: null,
            status: { in: ["DISPATCHED", "IN_TRANSIT"] },
          },
        }),
        this.prisma.load.count({
          where: {
            carrierId,
            organizationId,
            deletedAt: null,
            status: { in: ["DELIVERED", "POD_RECEIVED", "INVOICED", "PAID"] },
          },
        }),
        this.prisma.load.aggregate({
          where: {
            carrierId,
            organizationId,
            deletedAt: null,
          },
          _sum: {
            carrierRate: true,
            margin: true,
          },
        }),
      ]);

    return {
      totalLoads,
      activeLoads,
      completedLoads,
      onTimeDeliveryRate: carrier.onTimeDelivery,
      averageRating: carrier.rating,
      totalRevenue: Number(revenue._sum.carrierRate) || 0,
      averageMargin:
        totalLoads > 0 ? (Number(revenue._sum.margin) || 0) / totalLoads : 0,
    };
  }

  async getCarrierLoads(
    carrierId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where: {
          carrierId,
          organizationId,
          deletedAt: null,
        },
        include: {
          customer: {
            select: {
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.load.count({
        where: {
          carrierId,
          organizationId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: loads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getExpiringInsurance(organizationId: string, days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const carriers = await this.prisma.carrier.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        insuranceExpiry: {
          lte: futureDate,
        },
      },
      select: {
        id: true,
        companyName: true,
        mcNumber: true,
        insuranceExpiry: true,
        insuranceAmount: true,
      },
      orderBy: { insuranceExpiry: "asc" },
    });

    return carriers.map((carrier) => {
      const now = new Date();
      const expiry = carrier.insuranceExpiry!;
      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let alertLevel: "GREEN" | "YELLOW" | "RED" | "EXPIRED";
      if (daysUntilExpiry < 0) {
        alertLevel = "EXPIRED";
      } else if (daysUntilExpiry <= 7) {
        alertLevel = "RED";
      } else if (daysUntilExpiry <= 15) {
        alertLevel = "YELLOW";
      } else {
        alertLevel = "GREEN";
      }

      return {
        carrierId: carrier.id,
        carrierName: carrier.companyName,
        mcNumber: carrier.mcNumber,
        insuranceExpiry: expiry,
        daysUntilExpiry,
        insuranceAmount: Number(carrier.insuranceAmount) || 0,
        alertLevel,
      };
    });
  }

  async addRating(
    carrierId: string,
    rating: number,
    comment: string | undefined,
    userId: string,
    loadId: string | undefined
  ) {
    // Store rating in a separate table (needs to be added to schema)
    // For now, we'll update the carrier's average rating directly
    // In production, create a CarrierRating table to track history

    return {
      carrierId,
      rating,
      comment,
      userId,
      loadId,
      createdAt: new Date(),
    };
  }

  async recalculateAverageRating(_carrierId: string) {
    // In production, calculate from CarrierRating table
    // For now, this is a placeholder
    // The rating will be updated manually or from load feedback
  }

  async getCarrierNamesByIds(organizationId: string, carrierIds: string[]) {
    // Filter out undefined/null values
    const validCarrierIds = carrierIds.filter((id): id is string => id != null);

    if (validCarrierIds.length === 0) {
      return [];
    }

    const carriers = await this.prisma.carrier.findMany({
      where: {
        id: {
          in: validCarrierIds,
        },
        organizationId,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    return carriers;
  }
}
