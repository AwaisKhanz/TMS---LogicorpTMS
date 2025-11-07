import { Prisma } from "@prisma/client";
import {
  LoadStatus,
  CreateLoadRequest as CreateLoadDto,
  UpdateLoadRequest as UpdateLoadDto,
  LoadFilters as LoadFiltersDto,
  LoadStatisticsByStatus,
  LoadCreatedEventData,
  LoadUpdatedEventData,
  StatusChangeEventData,
  LoadExportData,
} from "@tms/shared-types";
import type { Address } from "@tms/shared-types";
import {
  LoadRepository,
  LoadWithRelations,
  LoadWithMinimalRelations,
} from "../repositories/load.repository.js";
import { NotFoundError } from "../utils/errors.util.js";
import type { OrganizationDocumentNumbering } from "../types/common.types.js";
import { DocumentGenerationService } from "./document-generation.service.js";
import { NotificationService } from "./notification.service.js";
import prisma from "../config/database.js";

export class LoadService {
  private loadRepo: LoadRepository;
  private documentGenService: DocumentGenerationService;
  private notificationService: NotificationService;

  constructor() {
    this.loadRepo = new LoadRepository();
    this.documentGenService = new DocumentGenerationService();
    this.notificationService = new NotificationService();
  }

  async getLoads(
    organizationId: string,
    filters: LoadFiltersDto,
    userId?: string,
    userPermissions?: string[]
  ) {
    const {
      page = 1,
      limit = 50,
      status,
      customerId,
      carrierId,
      pickupDateFrom,
      pickupDateTo,
      search,
    } = filters;

    const loadFilters: LoadFiltersDto = {
      status,
      customerId,
      carrierId,
      pickupDateFrom: pickupDateFrom
        ? typeof pickupDateFrom === "string"
          ? new Date(pickupDateFrom)
          : pickupDateFrom
        : undefined,
      pickupDateTo: pickupDateTo
        ? typeof pickupDateTo === "string"
          ? new Date(pickupDateTo)
          : pickupDateTo
        : undefined,
      search,
    };

    const { data: loads, total } = await this.loadRepo.findWithFilters(
      loadFilters,
      organizationId,
      page,
      limit,
      userId,
      userPermissions
    );

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

  async getLoadById(id: string, organizationId: string, userId?: string) {
    const load = await this.loadRepo.findByIdWithRelations(
      id,
      organizationId,
      userId
    );

    if (!load) {
      throw new NotFoundError("Load");
    }

    // Hide completed loads from detail page as per requirement
    if (load.status === LoadStatus.COMPLETED) {
      throw new NotFoundError("Load");
    }

    return this.transformLoadForApi(load);
  }

  async updateFinancialAdjustments(
    id: string,
    organizationId: string,
    adjustments: unknown
  ) {
    const updated = await this.loadRepo.updateFinancialAdjustments(
      id,
      organizationId,
      adjustments
    );
    if (!updated) throw new NotFoundError("Load");
    return this.transformLoadForApi(updated);
  }

  private transformLoadForApi(
    load: LoadWithRelations | LoadWithMinimalRelations
  ) {
    // Get primary shipper and consignee for backward compatibility
    const primaryShipper =
      load.loadShippers?.find((ls) => ls.isPrimary) || load.loadShippers?.[0];
    const primaryConsignee =
      load.loadConsignees?.find((lc) => lc.isPrimary) ||
      load.loadConsignees?.[0];

    const baseTransform = {
      ...load,
      createdAt: load.createdAt.toISOString(),
      updatedAt: load.updatedAt.toISOString(),
      // Derive top-level pickup/delivery dates from primary relations for backward compatibility
      pickupDate: primaryShipper?.pickupDate
        ? primaryShipper.pickupDate
        : undefined,
      deliveryDate: primaryConsignee?.deliveryDate
        ? primaryConsignee.deliveryDate
        : undefined,
      bookedAt: load.bookedAt?.toISOString(),
      dispatchedAt: load.dispatchedAt?.toISOString(),
      pickedUpAt: load.pickedUpAt?.toISOString(),
      deliveredAt: load.deliveredAt?.toISOString(),
      invoicedAt: load.invoicedAt?.toISOString(),
      paidAt: load.paidAt?.toISOString(),
      // Backward compatibility - use primary shipper/consignee
      shipper: primaryShipper?.shipper,
      consignee: primaryConsignee?.consignee,
      shipperAddress: primaryShipper?.shipper
        ? (() => {
            const addr = primaryShipper.shipper.address as any;
            return {
              street: addr?.street || "",
              city: addr?.city || "",
              state: addr?.state || "",
              zip: addr?.zip || "",
              country: addr?.country || "",
            } as Address;
          })()
        : null,
      consigneeAddress: primaryConsignee?.consignee
        ? (() => {
            const addr = primaryConsignee.consignee.address as any;
            return {
              street: addr?.street || "",
              city: addr?.city || "",
              state: addr?.state || "",
              zip: addr?.zip || "",
              country: addr?.country || "",
            } as Address;
          })()
        : null,
      customer: {
        id: load.customer.id,
        companyName: load.customer.companyName,
      },
      carrier: load.carrier
        ? {
            id: load.carrier.id,
            companyName: load.carrier.companyName,
            mcNumber: load.carrier.mcNumber,
          }
        : null,
      creator: {
        id: load.creator.id,
        firstName: load.creator.firstName,
        lastName: load.creator.lastName,
      },
      assignee:
        "assignee" in load && load.assignee
          ? {
              id: load.assignee.id,
              firstName: load.assignee.firstName,
              lastName: load.assignee.lastName,
            }
          : null,
      // Transform the many-to-many relationships
      loadShippers:
        load.loadShippers?.map((ls) => ({
          ...ls,
          createdAt: ls.createdAt.toISOString(),
          updatedAt: ls.updatedAt.toISOString(),
          pickupDate: ls.pickupDate?.toISOString(),
          shipper: ls.shipper,
        })) || [],
      loadConsignees:
        load.loadConsignees?.map((lc) => ({
          ...lc,
          createdAt: lc.createdAt.toISOString(),
          updatedAt: lc.updatedAt.toISOString(),
          deliveryDate: lc.deliveryDate?.toISOString(),
          consignee: lc.consignee,
        })) || [],
    };

    // Handle optional fields that only exist in LoadWithRelations
    if ("events" in load) {
      return {
        ...baseTransform,
        events: load.events || [],
      };
    }

    // For LoadWithMinimalRelations, set default values
    return {
      ...baseTransform,
      events: [],
    };
  }

  async createLoad(
    data: CreateLoadDto,
    userId: string,
    organizationId: string
  ) {
    // Validate load data
    this.validateLoadData(data);

    const loadNumber = await this.generateLoadNumber(organizationId);

    // Determine initial status based on carrier assignment
    let initialStatus = LoadStatus.QUOTE;
    if (data.carrierId) {
      initialStatus = LoadStatus.BOOKED;
    }

    // Extract shippers and consignees from the data
    const { shippers, consignees, ...loadData } = data;

    // Remove any legacy root-level pickup/delivery fields if present
    // Only fields valid on Load model should be persisted here
    const {
      pickupDate: _pd,
      pickupStart: _ps,
      pickupEnd: _pe,
      pickupType: _pt,
      deliveryDate: _dd,
      deliveryStart: _ds,
      deliveryEnd: _de,
      deliveryType: _dt,
      pickupNotes: _pn,
      deliveryNotes: _dn,
      ...cleanLoadData
    } = loadData as any;

    const load = await this.loadRepo.createWithRelations(
      {
        loadNumber,
        createdBy: userId,
        status: initialStatus,
        ...(cleanLoadData as Omit<
          Prisma.LoadUncheckedCreateInput,
          "organizationId" | "loadNumber" | "createdBy"
        >),
        margin:
          data.customerRate && data.carrierRate
            ? Number(data.customerRate) - Number(data.carrierRate)
            : null,
      },
      organizationId
    );

    // Add shippers to the load
    if (shippers && shippers.length > 0) {
      await this.loadRepo.updateLoadShippers(
        load.id,
        shippers.map((shipper, index) => ({
          shipperId: shipper.shipperId,
          isPrimary: shipper.isPrimary ?? index === 0,
          sequence: shipper.sequence ?? index + 1,
          pickupDate: shipper.pickupDate
            ? new Date(shipper.pickupDate)
            : undefined,
          pickupStart: shipper.pickupStart,
          pickupEnd: shipper.pickupEnd,
          pickupType: shipper.pickupType,
          pickupNotes: shipper.pickupNotes,
        }))
      );
    }

    // Add consignees to the load
    if (consignees && consignees.length > 0) {
      await this.loadRepo.updateLoadConsignees(
        load.id,
        consignees.map((consignee, index) => ({
          consigneeId: consignee.consigneeId,
          isPrimary: consignee.isPrimary ?? index === 0,
          sequence: consignee.sequence ?? index + 1,
          deliveryDate: consignee.deliveryDate
            ? new Date(consignee.deliveryDate)
            : undefined,
          deliveryStart: consignee.deliveryStart,
          deliveryEnd: consignee.deliveryEnd,
          deliveryType: consignee.deliveryType,
          deliveryNotes: consignee.deliveryNotes,
        }))
      );
    }

    // Create load event
    const eventData: LoadCreatedEventData = {
      status: load.status,
      createdBy: userId,
    };
    await this.loadRepo.createLoadEvent(
      load.id,
      "LOAD_CREATED",
      eventData,
      userId
    );

    // Fetch the complete load with all relations
    const completeLoad = await this.loadRepo.findByIdWithRelations(
      load.id,
      organizationId,
      userId
    );

    return this.transformLoadForApi(completeLoad!);
  }

  async updateLoadStatus(
    id: string,
    newStatus: LoadStatus,
    userId: string,
    organizationId: string,
    reason?: string
  ) {
    const load = await this.loadRepo.findByIdWithRelations(id, organizationId);
    if (!load) {
      throw new NotFoundError("Load");
    }

    // Validate status transition
    this.validateStatusTransition(load.status, newStatus);

    const updatedLoad = await this.loadRepo.updateWithRelations(
      id,
      { status: newStatus },
      organizationId
    );

    // Create status change event
    const eventData: StatusChangeEventData = {
      fromStatus: load.status,
      toStatus: newStatus,
      changedBy: userId,
      reason,
    };
    await this.loadRepo.createLoadEvent(
      id,
      "STATUS_CHANGED",
      eventData,
      userId
    );

    // Handle special status transitions
    if (newStatus === LoadStatus.DISPATCHED) {
      // Generate Rate Confirmation Document when status changes to DISPATCHED
      await this.documentGenService.generateRateConfirmation(
        id,
        organizationId,
        userId
      );
    }

    if (newStatus === LoadStatus.COMPLETED) {
      // Auto-create invoice for the completed load if not already invoiced
      try {
        const existingLine = await prisma.invoiceLineItem.findFirst({
          where: { loadId: id, invoice: { organizationId } },
        });
        if (!existingLine) {
          // Create invoice with a single line item for this load
          const loadForInvoice = await this.loadRepo.findById(
            id,
            organizationId
          );
          if (loadForInvoice) {
            await prisma.invoice.create({
              data: {
                organizationId,
                invoiceNumber: `INV-${loadForInvoice.loadNumber}`,
                customerId: loadForInvoice.customerId,
                carrierId: loadForInvoice.carrierId ?? undefined,
                // Dates
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                // Amount (simple one-line invoice)
                total: loadForInvoice.customerRate,
                status: "DRAFT" as unknown as any,
                createdBy: userId,
                lineItems: {
                  create: {
                    loadId: id,
                    description: `Freight charges for Load ${loadForInvoice.loadNumber}`,
                    quantity: 1,
                    rate: loadForInvoice.customerRate,
                    amount: loadForInvoice.customerRate,
                  },
                },
              },
            });
          }
        }
      } catch (e) {
        // Do not block status update if invoicing fails
        // Consider logging
        // eslint-disable-next-line no-console
        console.error("Failed to auto-create invoice for load", id, e);
      }
    }

    return this.transformLoadForApi(updatedLoad!);
  }

  async getCompletedLoads(
    organizationId: string,
    page: number = 1,
    limit: number = 50,
    userId?: string,
    userPermissions?: string[]
  ) {
    const { data: loads, total } = await this.loadRepo.findCompletedLoads(
      organizationId,
      page,
      limit,
      userId,
      userPermissions
    );

    return {
      data: loads.map((load) => this.transformLoadForApi(load)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      QUOTE: ["BOOKED", "CANCELLED"],
      BOOKED: ["DISPATCHED", "CANCELLED"],
      DISPATCHED: ["IN_TRANSIT", "CANCELLED"],
      IN_TRANSIT: ["DELIVERED", "CANCELLED"],
      DELIVERED: ["POD_RECEIVED", "CANCELLED"],
      POD_RECEIVED: ["COMPLETED", "CANCELLED"],
      COMPLETED: ["PAID"],
      PAID: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  async updateLoad(
    id: string,
    data: UpdateLoadDto,
    userId: string,
    organizationId: string
  ) {
    const existingLoad = await this.loadRepo.findById(id, organizationId);

    if (!existingLoad) {
      throw new NotFoundError("Load");
    }

    // Validate load data
    this.validateLoadData(data);

    // Extract shippers and consignees from the data
    const { shippers, consignees, ...updateData } = data;

    // Strip any legacy root-level pickup/delivery fields
    const {
      pickupDate: _pd,
      pickupStart: _ps,
      pickupEnd: _pe,
      pickupType: _pt,
      deliveryDate: _dd,
      deliveryStart: _ds,
      deliveryEnd: _de,
      deliveryType: _dt,
      pickupNotes: _pn,
      deliveryNotes: _dn,
      ...cleanUpdateData
    } = updateData as any;

    // Recalculate margin if rates changed
    if (data.customerRate !== undefined || data.carrierRate !== undefined) {
      // Margin calculation removed as margin field no longer exists in Load model
      // const customerRate = data.customerRate ?? existingLoad.customerRate;
      // const carrierRate = data.carrierRate ?? existingLoad.carrierRate;
    }

    const load = await this.loadRepo.updateWithRelations(
      id,
      cleanUpdateData,
      organizationId
    );

    if (!load) {
      throw new NotFoundError("Load");
    }

    // Update shippers if provided
    if (shippers !== undefined) {
      await this.loadRepo.updateLoadShippers(
        id,
        shippers.map((shipper, index) => ({
          shipperId: shipper.shipperId,
          isPrimary: shipper.isPrimary ?? index === 0,
          sequence: shipper.sequence ?? index + 1,
          pickupDate: shipper.pickupDate
            ? new Date(shipper.pickupDate)
            : undefined,
          pickupStart: shipper.pickupStart,
          pickupEnd: shipper.pickupEnd,
          pickupType: shipper.pickupType,
          pickupNotes: shipper.pickupNotes,
        }))
      );
    }

    // Update consignees if provided
    if (consignees !== undefined) {
      await this.loadRepo.updateLoadConsignees(
        id,
        consignees.map((consignee, index) => ({
          consigneeId: consignee.consigneeId,
          isPrimary: consignee.isPrimary ?? index === 0,
          sequence: consignee.sequence ?? index + 1,
          deliveryDate: consignee.deliveryDate
            ? new Date(consignee.deliveryDate)
            : undefined,
          deliveryStart: consignee.deliveryStart,
          deliveryEnd: consignee.deliveryEnd,
          deliveryType: consignee.deliveryType,
          deliveryNotes: consignee.deliveryNotes,
        }))
      );
    }

    // Create load event
    const eventData: LoadUpdatedEventData = {
      updatedFields: Object.keys(data),
      updatedBy: userId,
    };
    await this.loadRepo.createLoadEvent(
      load.id,
      "LOAD_UPDATED",
      eventData,
      userId
    );

    // Fetch the complete load with all relations
    const completeLoad = await this.loadRepo.findByIdWithRelations(
      load.id,
      organizationId,
      userId
    );

    return this.transformLoadForApi(completeLoad!);
  }

  async deleteLoad(id: string, organizationId: string) {
    const deleted = await this.loadRepo.softDelete(id, organizationId);

    if (!deleted) {
      throw new NotFoundError("Load");
    }
  }

  private async generateLoadNumber(organizationId: string): Promise<string> {
    const nextNumber = await this.loadRepo.getNextLoadNumber(organizationId);

    // Get organization settings for load numbering prefix
    const org = await this.loadRepo.getOrganizationSettings(organizationId);

    const settings =
      (org?.documentNumbering as OrganizationDocumentNumbering) || {};
    const loadSettings = settings.LOAD || {
      prefix: "LD",
      startNumber: 1,
      currentNumber: 0,
    };

    const loadNumber = `${loadSettings.prefix}${nextNumber.toString().padStart(4, "0")}`;

    // Update current number in organization settings
    await this.loadRepo.updateLoadNumberSequence(organizationId, nextNumber);

    return loadNumber;
  }

  async getLoadStatistics(
    organizationId: string
  ): Promise<LoadStatisticsByStatus> {
    const stats = await this.loadRepo.getStatsByStatus(organizationId);

    return stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.id,
        revenue: Number(stat._sum.customerRate) || 0,
        cost: Number(stat._sum.carrierRate) || 0,
        margin: Number(stat._sum.margin) || 0,
      };
      return acc;
    }, {} as LoadStatisticsByStatus);
  }

  async getLoadEvents(id: string, organizationId: string) {
    const load = await this.loadRepo.findById(id, organizationId);
    if (!load) {
      throw new NotFoundError("Load");
    }

    return this.loadRepo.getLoadEvents(id);
  }

  async getLoadDocuments(
    id: string,
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
    }
  ) {
    const load = await this.loadRepo.findById(id, organizationId);
    if (!load) {
      throw new NotFoundError("Load");
    }

    return this.loadRepo.getLoadDocuments(id, organizationId, options);
  }

  async assignCarrier(
    id: string,
    carrierId: string,
    notes: string | undefined,
    userId: string,
    organizationId: string
  ) {
    const load = await this.loadRepo.findById(id, organizationId);
    if (!load) {
      throw new NotFoundError("Load");
    }

    // Validate carrier exists and is active
    const carrier = await this.loadRepo.getCarrier(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    if (!carrier.isActive) {
      throw new Error("Carrier is not active");
    }

    if (!carrier.isApproved) {
      throw new Error("Carrier is not approved");
    }

    // Check insurance validity
    if (carrier.insuranceExpiry && carrier.insuranceExpiry < new Date()) {
      throw new Error("Carrier insurance has expired");
    }

    // Update load with carrier
    const updatedLoad = await this.loadRepo.updateWithRelations(
      id,
      { carrierId, assignedTo: userId },
      organizationId
    );

    // Create event
    await this.loadRepo.createLoadEvent(
      id,
      "CARRIER_ASSIGNED",
      {
        carrierId,
        carrierName: carrier.companyName,
        notes: notes || "",
        assignedBy: userId,
      },
      userId
    );

    // Send notification for carrier assignment
    if (updatedLoad?.assignedTo) {
      try {
        await this.notificationService.create({
          recipientId: updatedLoad.assignedTo,
          type: "LOAD_ASSIGNED",
          title: "Load Assigned",
          message: `Load #${load.loadNumber} has been assigned to carrier`,
          entityType: "LOAD",
          entityId: id,
          organizationId,
        });
      } catch (error) {
        console.error("Failed to send carrier assignment notification:", error);
      }
    }

    return updatedLoad;
  }

  async duplicateLoad(id: string, userId: string, organizationId: string) {
    const load = await this.loadRepo.findByIdWithRelations(id, organizationId);
    if (!load) {
      throw new NotFoundError("Load");
    }

    // Generate new load number
    const loadNumber = await this.generateLoadNumber(organizationId);

    // Create duplicate with same data but reset status and timestamps
    const duplicateData = {
      loadNumber,
      createdBy: userId,
      status: LoadStatus.QUOTE,
      customerId: load.customerId,
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces,
      dimensions: load.dimensions,
      equipmentType: load.equipmentType,
      loadType: load.loadType,
      customerRate: load.customerRate,
      carrierRate: load.carrierRate,
      accessorials: load.accessorials,
      internalNotes: load.internalNotes,
      referenceNumber: load.referenceNumber,
      // Handle many-to-many relationships
      shippers:
        load.loadShippers?.map((relation) => ({
          shipperId: relation.shipperId,
          isPrimary: relation.isPrimary,
          sequence: relation.sequence,
          pickupDate: relation.pickupDate,
          pickupStart: relation.pickupStart,
          pickupEnd: relation.pickupEnd,
          pickupType: relation.pickupType,
          pickupNotes: relation.pickupNotes,
        })) || [],
      consignees:
        load.loadConsignees?.map((relation) => ({
          consigneeId: relation.consigneeId,
          isPrimary: relation.isPrimary,
          sequence: relation.sequence,
          deliveryDate: relation.deliveryDate,
          deliveryStart: relation.deliveryStart,
          deliveryEnd: relation.deliveryEnd,
          deliveryType: relation.deliveryType,
          deliveryNotes: relation.deliveryNotes,
        })) || [],
    };

    const duplicatedLoad = await this.loadRepo.createWithRelations(
      duplicateData as Omit<Prisma.LoadUncheckedCreateInput, "organizationId">,
      organizationId
    );

    // Create event
    await this.loadRepo.createLoadEvent(
      duplicatedLoad.id,
      "LOAD_DUPLICATED",
      {
        originalLoadId: id,
        originalLoadNumber: load.loadNumber,
        createdBy: userId,
      },
      userId
    );

    return duplicatedLoad;
  }

  async bulkDelete(loadIds: string[], organizationId: string) {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const loadId of loadIds) {
      try {
        const deleted = await this.loadRepo.softDelete(loadId, organizationId);
        if (deleted) {
          results.successful.push(loadId);
        } else {
          results.failed.push({ id: loadId, error: "Load not found" });
        }
      } catch (error) {
        results.failed.push({
          id: loadId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async bulkUpdateStatus(
    loadIds: string[],
    status: LoadStatus,
    userId: string,
    organizationId: string
  ) {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const loadId of loadIds) {
      try {
        await this.updateLoadStatus(loadId, status, userId, organizationId);
        results.successful.push(loadId);
      } catch (error) {
        results.failed.push({
          id: loadId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async exportLoads(
    organizationId: string,
    filters: LoadFiltersDto,
    format: string
  ) {
    // Get all loads without pagination for export
    const { data: loads } = await this.loadRepo.findWithFilters(
      {
        status: filters.status,
        customerId: filters.customerId,
        carrierId: filters.carrierId,
        pickupDateFrom: filters.pickupDateFrom
          ? typeof filters.pickupDateFrom === "string"
            ? new Date(filters.pickupDateFrom)
            : filters.pickupDateFrom
          : undefined,
        pickupDateTo: filters.pickupDateTo
          ? typeof filters.pickupDateTo === "string"
            ? new Date(filters.pickupDateTo)
            : filters.pickupDateTo
          : undefined,
        search: filters.search,
      },
      organizationId,
      1,
      10000 // Large limit for export
    );

    if (format === "csv") {
      return this.formatLoadsAsCsv(loads as unknown as LoadExportData[]);
    } else if (format === "excel") {
      return this.formatLoadsAsExcel(loads as unknown as LoadExportData[]);
    }

    throw new Error("Unsupported export format");
  }

  private formatLoadsAsCsv(loads: LoadExportData[]): string {
    const headers = [
      "Load Number",
      "Status",
      "Customer",
      "Carrier",
      "Shipper City",
      "Shipper State",
      "Consignee City",
      "Consignee State",
      "Pickup Date",
      "Delivery Date",
      "Commodity",
      "Weight",
      "Equipment Type",
      "Customer Rate",
      "Carrier Rate",
      "Margin",
    ];

    const rows = (loads as unknown as LoadWithMinimalRelations[]).map(
      (load) => {
        const primaryShipper =
          load.loadShippers?.find((ls) => ls.isPrimary) ||
          load.loadShippers?.[0];
        const primaryConsignee =
          load.loadConsignees?.find((lc) => lc.isPrimary) ||
          load.loadConsignees?.[0];

        return [
          load.loadNumber,
          load.status,
          load.customer?.companyName || "",
          load.carrier?.companyName || "",
          (primaryShipper?.shipper?.address as any)?.city || "",
          (primaryShipper?.shipper?.address as any)?.state || "",
          (primaryConsignee?.consignee?.address as any)?.city || "",
          (primaryConsignee?.consignee?.address as any)?.state || "",
          primaryShipper?.pickupDate
            ? new Date(primaryShipper.pickupDate).toISOString().split("T")[0]
            : "",
          primaryConsignee?.deliveryDate
            ? new Date(primaryConsignee.deliveryDate)
                .toISOString()
                .split("T")[0]
            : "",
          load.commodity,
          load.weight,
          load.equipmentType,
          Number(load.customerRate),
          load.carrierRate ? Number(load.carrierRate) : "",
          load.margin ? Number(load.margin) : "",
        ];
      }
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return csvContent;
  }

  private formatLoadsAsExcel(loads: LoadExportData[]): string {
    // For now, return CSV format
    // TODO: Implement actual Excel format with a library like exceljs
    return this.formatLoadsAsCsv(loads);
  }

  async getDashboardStats(organizationId: string) {
    const stats = await this.loadRepo.getDashboardStatistics(organizationId);
    return stats;
  }

  private validateLoadData(data: CreateLoadDto | UpdateLoadDto) {
    // Root-level pickup/delivery dates removed; validation handled per relation

    // Validate rates
    if ("customerRate" in data && data.customerRate !== undefined) {
      if (data.customerRate < 0) {
        throw new Error("Customer rate must be positive");
      }
    }

    if ("carrierRate" in data && data.carrierRate !== undefined) {
      if (data.carrierRate < 0) {
        throw new Error("Carrier rate must be positive");
      }
    }
  }

  // Dashboard chart data methods
  async getRevenueChartData(organizationId: string) {
    return this.loadRepo.getRevenueChartData(organizationId);
  }

  async getLoadStatusChartData(organizationId: string) {
    return this.loadRepo.getLoadStatusChartData(organizationId);
  }

  async getPerformanceChartData(organizationId: string) {
    return this.loadRepo.getPerformanceChartData(organizationId);
  }

  async getCarrierPerformanceChartData(organizationId: string) {
    return this.loadRepo.getCarrierPerformanceChartData(organizationId);
  }
}
