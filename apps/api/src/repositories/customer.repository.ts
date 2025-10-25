import type { Customer, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";
import type { WhereClause } from "../types/common.types.js";
import type { CustomerContactData } from "../types/customer.types.js";

// Type for Customer with included relations
export type CustomerWithRelations = Prisma.CustomerGetPayload<{
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
        margin: true;
        carrier: {
          select: {
            companyName: true;
            mcNumber: true;
          };
        };
      };
    };
    invoices: {
      select: {
        id: true;
        invoiceNumber: true;
        status: true;
        invoiceDate: true;
        dueDate: true;
        total: true;
      };
    };
    _count: {
      select: {
        loads: true;
        invoices: true;
      };
    };
  };
}>;

export type CustomerWithMinimalRelations = Prisma.CustomerGetPayload<{
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
        invoices: true;
      };
    };
  };
}>;

export interface CustomerFilters {
  industry?: string;
  isActive?: boolean;
  paymentTerms?: string;
  state?: string;
  search?: string;
}

export class CustomerRepository extends BaseRepository<Customer> {
  protected modelName = "customer";

  async findWithFilters(
    filters: CustomerFilters,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: CustomerWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.paymentTerms) {
      where.paymentTerms = filters.paymentTerms;
    }

    if (filters.state) {
      where.billingAddress = {
        path: ["state"],
        string_contains: filters.state,
      };
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { dba: { contains: filters.search, mode: "insensitive" } },
        { billingEmail: { contains: filters.search, mode: "insensitive" } },
        { ein: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              loads: true,
              invoices: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data: customers, total };
  }

  async findWithFiltersForUser(
    filters: CustomerFilters,
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: CustomerWithMinimalRelations[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: WhereClause = {
      organizationId,
      deletedAt: null,
      users: {
        some: {
          userId,
        },
      },
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.paymentTerms) {
      where.paymentTerms = filters.paymentTerms;
    }

    if (filters.state) {
      where.billingAddress = {
        path: ["state"],
        string_contains: filters.state,
      };
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { dba: { contains: filters.search, mode: "insensitive" } },
        { billingEmail: { contains: filters.search, mode: "insensitive" } },
        { ein: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              loads: true,
              invoices: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data: customers, total };
  }

  async findByIdWithRelations(
    id: string,
    organizationId: string
  ): Promise<CustomerWithRelations | null> {
    return this.prisma.customer.findFirst({
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
            margin: true,
            carrier: {
              select: {
                companyName: true,
                mcNumber: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            invoiceDate: true,
            dueDate: true,
            total: true,
          },
        },
        _count: {
          select: {
            loads: true,
            invoices: true,
          },
        },
      },
    });
  }

  async findByCompanyName(
    companyName: string,
    organizationId: string,
    excludeId?: string
  ): Promise<Customer | null> {
    const where: WhereClause = {
      organizationId,
      companyName,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    return this.prisma.customer.findFirst({ where });
  }

  async createWithRelations(
    data: Record<string, unknown>,
    organizationId: string
  ): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        ...data,
        organizationId,
      } as unknown as Prisma.CustomerCreateInput,
      include: {
        contacts: true,
      },
    });
  }

  async updateWithRelations(
    id: string,
    data: Record<string, unknown>,
    organizationId: string
  ): Promise<Customer | null> {
    const existingCustomer = await this.findById(id, organizationId);
    if (!existingCustomer) {
      return null;
    }

    return this.prisma.customer.update({
      where: { id },
      data,
      include: {
        contacts: true,
      },
    });
  }

  async softDelete(id: string, organizationId: string): Promise<boolean> {
    const existingCustomer = await this.findById(id, organizationId);
    if (!existingCustomer) {
      return false;
    }

    // Check if customer has outstanding invoices
    const outstandingInvoices = await this.prisma.invoice.count({
      where: {
        customerId: id,
        status: {
          notIn: ["PAID", "VOID"],
        },
      },
    });

    if (outstandingInvoices > 0) {
      throw new Error("Cannot delete customer with outstanding invoices");
    }

    // Check if customer has active loads
    const activeLoads = await this.prisma.load.count({
      where: {
        customerId: id,
        deletedAt: null,
        status: {
          notIn: ["DELIVERED", "PAID", "CANCELLED"],
        },
      },
    });

    if (activeLoads > 0) {
      throw new Error("Cannot delete customer with active loads");
    }

    await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async updateStats(customerId: string, organizationId: string): Promise<void> {
    // Calculate customer statistics
    const stats = await this.prisma.load.aggregate({
      where: {
        customerId,
        organizationId,
        deletedAt: null,
        status: "DELIVERED",
      },
      _count: {
        id: true,
      },
      _sum: {
        customerRate: true,
        margin: true,
      },
      _avg: {
        margin: true,
      },
    });

    const totalLoads = stats._count.id || 0;
    const totalRevenue = stats._sum.customerRate
      ? Number(stats._sum.customerRate)
      : 0;
    const averageMargin = stats._avg.margin ? Number(stats._avg.margin) : 0;

    // Calculate credit used from outstanding invoices
    const creditUsed = await this.prisma.invoice.aggregate({
      where: {
        customerId,
        status: {
          notIn: ["PAID", "VOID"],
        },
      },
      _sum: {
        total: true,
      },
    });

    const creditUsedValue = creditUsed._sum?.total
      ? Number(creditUsed._sum.total)
      : 0;

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalLoads,
        totalRevenue,
        averageMargin,
        creditUsed: creditUsedValue,
      },
    });
  }

  async getStatistics(organizationId: string) {
    const stats = await this.prisma.customer.groupBy({
      by: ["isActive"],
      where: {
        organizationId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        totalRevenue: true,
        creditUsed: true,
      },
    });

    const totalCustomers = await this.prisma.customer.count({
      where: {
        organizationId,
        deletedAt: null,
      },
    });

    const activeCustomers = await this.prisma.customer.count({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
    });

    const totalRevenue = await this.prisma.customer.aggregate({
      where: {
        organizationId,
        deletedAt: null,
      },
      _sum: {
        totalRevenue: true,
      },
    });

    const totalRevenueValue = totalRevenue._sum.totalRevenue
      ? Number(totalRevenue._sum.totalRevenue)
      : 0;
    const avgRevenuePerCustomer =
      totalCustomers > 0 ? totalRevenueValue / totalCustomers : 0;

    return {
      total: totalCustomers,
      active: activeCustomers,
      inactive: totalCustomers - activeCustomers,
      totalRevenue: totalRevenueValue,
      avgRevenuePerCustomer,
      breakdown: stats,
    };
  }

  async getTopCustomers(organizationId: string, limit: number = 10) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        companyName: true,
        totalRevenue: true,
        totalLoads: true,
        averageMargin: true,
        billingAddress: true,
      },
      orderBy: [{ totalRevenue: "desc" }, { totalLoads: "desc" }],
      take: limit,
    });
  }

  async addContact(
    customerId: string,
    contactData: CustomerContactData,
    organizationId: string
  ) {
    // Verify customer belongs to organization
    const customer = await this.findById(customerId, organizationId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // If this is set as primary, remove primary from other contacts
    if (contactData.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerContact.create({
      data: {
        customerId,
        ...contactData,
      },
    });
  }

  async updateContact(
    contactId: string,
    contactData: Partial<CustomerContactData>,
    organizationId: string
  ) {
    // Verify contact belongs to customer in organization
    const contact = await this.prisma.customerContact.findFirst({
      where: {
        id: contactId,
        customer: {
          organizationId,
          deletedAt: null,
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // If this is set as primary, remove primary from other contacts
    if (contactData.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: {
          customerId: contact.customerId,
          id: { not: contactId },
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerContact.update({
      where: { id: contactId },
      data: contactData,
    });
  }

  async deleteContact(contactId: string, organizationId: string) {
    // Verify contact belongs to customer in organization
    const contact = await this.prisma.customerContact.findFirst({
      where: {
        id: contactId,
        customer: {
          organizationId,
          deletedAt: null,
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    await this.prisma.customerContact.delete({
      where: { id: contactId },
    });
  }

  // Enhanced methods for performance metrics and advanced queries
  async getPerformanceMetrics(customerId: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get load trends for the last 12 months
    const loadTrends = await this.prisma.load.groupBy({
      by: ["pickupDate"],
      where: {
        customerId,
        organizationId,
        deletedAt: null,
        status: "DELIVERED",
        pickupDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last 12 months
        },
      },
      _count: { id: true },
      _sum: { customerRate: true },
      orderBy: { pickupDate: "asc" },
    });

    // Get top lanes
    const topLanes = await this.prisma.load.groupBy({
      by: ["shipperId", "consigneeId"],
      where: {
        customerId,
        organizationId,
        deletedAt: null,
        status: "DELIVERED",
      },
      _count: { id: true },
      _sum: { customerRate: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // Calculate payment history
    const paymentHistory = await this.prisma.invoice.aggregate({
      where: {
        customerId,
        organizationId,
        status: { in: ["PAID", "OVERDUE"] },
      },
      _count: {
        id: true,
      },
    });

    const overdueCount = await this.prisma.invoice.count({
      where: {
        customerId,
        organizationId,
        status: "OVERDUE",
      },
    });

    const paidCount = await this.prisma.invoice.count({
      where: {
        customerId,
        organizationId,
        status: "PAID",
      },
    });

    return {
      totalLoads: customer.totalLoads,
      totalRevenue: Number(customer.totalRevenue),
      averageLoadValue:
        customer.totalLoads > 0
          ? Number(customer.totalRevenue) / customer.totalLoads
          : 0,
      averageMargin: Number(customer.averageMargin),
      recentLoads: loadTrends.length,
      paymentHistory: {
        onTime: paidCount,
        late: overdueCount,
        outstanding: paymentHistory._count.id - paidCount - overdueCount,
      },
      creditUtilization: {
        used: Number(customer.creditUsed),
        limit: Number(customer.creditLimit),
        percentage:
          customer.creditLimit.toNumber() > 0
            ? (Number(customer.creditUsed) / Number(customer.creditLimit)) * 100
            : 0,
        status:
          customer.creditLimit.toNumber() > 0 &&
          Number(customer.creditUsed) / Number(customer.creditLimit) > 0.9
            ? "critical"
            : customer.creditLimit.toNumber() > 0 &&
                Number(customer.creditUsed) / Number(customer.creditLimit) >
                  0.75
              ? "warning"
              : "good",
      },
      loadTrends: loadTrends.map((trend) => ({
        period: trend.pickupDate.toISOString().split("T")[0],
        loads: trend._count.id,
        revenue: Number(trend._sum.customerRate || 0),
      })),
      topLanes: topLanes.map((lane) => ({
        lane: `${lane.shipperId} → ${lane.consigneeId}`,
        loads: lane._count.id,
        revenue: Number(lane._sum.customerRate || 0),
      })),
    };
  }

  async getCustomerLoads(
    customerId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [loads, total] = await Promise.all([
      this.prisma.load.findMany({
        where: {
          customerId,
          organizationId,
          deletedAt: null,
        },
        include: {
          carrier: {
            select: {
              companyName: true,
              mcNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.load.count({
        where: {
          customerId,
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

  async getCustomerInvoices(
    customerId: string,
    organizationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          customerId,
          organizationId,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({
        where: {
          customerId,
          organizationId,
        },
      }),
    ]);

    // Calculate summary
    const summary = await this.prisma.invoice.aggregate({
      where: {
        customerId,
        organizationId,
      },
      _count: { id: true },
      _sum: { total: true, paidAmount: true },
    });

    const overdueAmount = await this.prisma.invoice.aggregate({
      where: {
        customerId,
        organizationId,
        status: "OVERDUE",
      },
      _sum: { total: true },
    });

    return {
      data: invoices,
      summary: {
        totalInvoices: summary._count.id,
        totalAmount: Number(summary._sum.total || 0),
        paidAmount: Number(summary._sum.paidAmount || 0),
        outstandingAmount:
          Number(summary._sum.total || 0) -
          Number(summary._sum.paidAmount || 0),
        overdueAmount: Number(overdueAmount._sum.total || 0),
        averagePaymentDays: 0, // TODO: Calculate based on payment history
        recentInvoices: invoices.slice(0, 5),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateCreditUsed(
    customerId: string,
    amount: number,
    organizationId: string
  ) {
    await this.prisma.customer.update({
      where: {
        id: customerId,
        organizationId,
      },
      data: {
        creditUsed: {
          increment: amount,
        },
      },
    });
  }

  async exportCustomers(organizationId: string, filters: CustomerFilters) {
    const where: WhereClause = {
      organizationId,
      deletedAt: null,
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    if (filters.paymentTerms) {
      where.paymentTerms = filters.paymentTerms;
    }

    if (filters.state) {
      where.billingAddress = {
        path: ["state"],
        string_contains: filters.state,
      };
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { dba: { contains: filters.search, mode: "insensitive" } },
        { billingEmail: { contains: filters.search, mode: "insensitive" } },
        { ein: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        dba: true,
        industry: true,
        billingEmail: true,
        billingPhone: true,
        billingAddress: true,
        paymentTerms: true,
        creditLimit: true,
        creditUsed: true,
        totalLoads: true,
        totalRevenue: true,
        averageMargin: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  }

  async bulkUpdate(
    customerIds: string[],
    updates: Record<string, unknown>,
    organizationId: string
  ) {
    const results = await this.prisma.customer.updateMany({
      where: {
        id: { in: customerIds },
        organizationId,
        deletedAt: null,
      },
      data: updates,
    });

    return {
      success: results.count,
      failed: customerIds.length - results.count,
      errors: [],
    };
  }
}
