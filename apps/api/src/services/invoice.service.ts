import prisma from "../config/database.js";

export class InvoiceService {
  // Placeholder for future use (PDF generation handled in controller)

  async list(organizationId: string, options?: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (options?.status) where.status = options.status as any;
    if (options?.search) {
      where.OR = [
        { invoiceNumber: { contains: options.search, mode: "insensitive" } },
        { customer: { companyName: { contains: options.search, mode: "insensitive" } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, companyName: true } },
          carrier: { select: { id: true, companyName: true } },
          lineItems: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string, organizationId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: { select: { id: true, companyName: true } },
        carrier: { select: { id: true, companyName: true } },
        lineItems: {
          include: {
            load: {
              include: {
                customer: { select: { id: true, companyName: true } },
                carrier: { select: { id: true, companyName: true } },
                loadShippers: {
                  include: { shipper: true },
                  orderBy: { sequence: "asc" },
                },
                loadConsignees: {
                  include: { consignee: true },
                  orderBy: { sequence: "asc" },
                },
                creator: { select: { id: true, firstName: true, lastName: true } },
                assignee: true,
                events: true,
              },
            },
          },
        },
        payments: true,
      },
    });
    return invoice;
  }

  async addPayment(id: string, organizationId: string, data: { type: string; amount: number; method: string; date?: Date; reference?: string; notes?: string; userId: string }) {
    const invoice = await prisma.invoice.findFirst({ where: { id, organizationId } });
    if (!invoice) return null;
    const payment = await prisma.payment.create({
      data: {
        organizationId,
        invoiceId: id,
        type: data.type as any,
        amount: data.amount as any,
        method: data.method as any,
        date: data.date || new Date(),
        reference: data.reference,
        notes: data.notes,
        createdBy: data.userId,
      },
    });

    // Update paidAmount and status
    const aggreg = await prisma.payment.aggregate({
      where: { organizationId, invoiceId: id, type: "CUSTOMER" as any },
      _sum: { amount: true },
    });
    const paid = aggreg._sum.amount || (0 as any);
    const newStatus = Number(paid) >= Number(invoice.total) ? ("PAID" as any) : ("PARTIAL" as any);
    await prisma.invoice.update({ where: { id }, data: { paidAmount: paid, status: newStatus } });
    return payment;
  }

  async getStatistics(organizationId: string) {
    const totalInvoices = await prisma.invoice.count({
      where: {
        organizationId,
      },
    });

    const paidInvoices = await prisma.invoice.count({
      where: {
        organizationId,
        status: "PAID" as any,
      },
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: {
        organizationId,
      },
      _sum: {
        total: true,
      },
    });

    const totalRevenueValue = totalRevenue._sum.total
      ? Number(totalRevenue._sum.total)
      : 0;

    const avgInvoice = totalInvoices > 0 ? totalRevenueValue / totalInvoices : 0;

    return {
      total: totalInvoices,
      paid: paidInvoices,
      totalRevenue: totalRevenueValue,
      avgInvoice,
    };
  }
}


