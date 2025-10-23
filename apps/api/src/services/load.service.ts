import { LoadStatus, Prisma } from "@prisma/client";
import {
  CreateLoadDto,
  UpdateLoadDto,
  LoadFiltersDto,
  LoadStatisticsByStatus,
  LoadCreatedEventData,
  LoadUpdatedEventData,
  StatusChangeEventData,
  LoadExportData,
} from "../types/load.types.js";
import type { Address } from "../types/common.types.js";
import {
  LoadRepository,
  LoadFilters,
  LoadWithRelations,
  LoadWithMinimalRelations,
} from "../repositories/load.repository.js";
import { NotFoundError } from "../utils/errors.util.js";
import type { OrganizationDocumentNumbering } from "../types/common.types.js";
import { DocumentGenerationService } from "./document-generation.service.js";
import { NotificationService } from "./notification.service.js";

export class LoadService {
  private loadRepo: LoadRepository;
  private documentGenService: DocumentGenerationService;
  private notificationService: NotificationService;

  constructor() {
    this.loadRepo = new LoadRepository();
    this.documentGenService = new DocumentGenerationService();
    this.notificationService = new NotificationService();
  }

  async getLoads(organizationId: string, filters: LoadFiltersDto) {
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

    const loadFilters: LoadFilters = {
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
      limit
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

  async getLoadById(id: string, organizationId: string) {
    const load = await this.loadRepo.findByIdWithRelations(id, organizationId);

    if (!load) {
      throw new NotFoundError("Load");
    }

    return this.transformLoadForApi(load);
  }

  private transformLoadForApi(
    load: LoadWithRelations | LoadWithMinimalRelations
  ) {
    const baseTransform = {
      ...load,
      createdAt: load.createdAt.toISOString(),
      updatedAt: load.updatedAt.toISOString(),
      pickupDate: load.pickupDate.toISOString(),
      deliveryDate: load.deliveryDate.toISOString(),
      bookedAt: load.bookedAt?.toISOString(),
      dispatchedAt: load.dispatchedAt?.toISOString(),
      pickedUpAt: load.pickedUpAt?.toISOString(),
      deliveredAt: load.deliveredAt?.toISOString(),
      invoicedAt: load.invoicedAt?.toISOString(),
      paidAt: load.paidAt?.toISOString(),
      shipperAddress: load.shipperAddress as Address,
      consigneeAddress: load.consigneeAddress as Address,
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

    const loadData = {
      loadNumber,
      createdBy: userId,
      status: LoadStatus.QUOTE,
      ...data,
      margin:
        data.customerRate && data.carrierRate
          ? Number(data.customerRate) - Number(data.carrierRate)
          : null,
    };

    const load = await this.loadRepo.createWithRelations(
      loadData,
      organizationId
    );

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

    return this.transformLoadForApi(load);
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

    const updateData: Record<string, unknown> = { ...data };

    // Recalculate margin if rates changed
    if (data.customerRate !== undefined || data.carrierRate !== undefined) {
      const customerRate = data.customerRate ?? existingLoad.customerRate;
      const carrierRate = data.carrierRate ?? existingLoad.carrierRate;

      if (customerRate && carrierRate) {
        updateData.margin = Number(customerRate) - Number(carrierRate);
      }
    }

    const load = await this.loadRepo.updateWithRelations(
      id,
      updateData,
      organizationId
    );

    if (!load) {
      throw new NotFoundError("Load");
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

    return this.transformLoadForApi(load);
  }

  async updateLoadStatus(
    id: string,
    status: LoadStatus,
    userId: string,
    organizationId: string
  ) {
    const load = await this.loadRepo.findById(id, organizationId);

    if (!load) {
      throw new NotFoundError("Load");
    }

    // Validate status transition
    this.validateStatusTransition(load.status, status);

    const updateData: Record<string, unknown> = { status };
    const now = new Date();

    // Set status timestamps
    switch (status) {
      case LoadStatus.BOOKED:
        updateData.bookedAt = now;
        break;
      case LoadStatus.DISPATCHED:
        updateData.dispatchedAt = now;
        break;
      case LoadStatus.IN_TRANSIT:
        updateData.pickedUpAt = now;
        break;
      case LoadStatus.DELIVERED:
        updateData.deliveredAt = now;
        break;
      case LoadStatus.INVOICED:
        updateData.invoicedAt = now;
        break;
      case LoadStatus.PAID:
        updateData.paidAt = now;
        break;
    }

    const updatedLoad = await this.loadRepo.updateWithRelations(
      id,
      updateData,
      organizationId
    );

    if (!updatedLoad) {
      throw new NotFoundError("Load");
    }

    // Create load event
    const eventData: StatusChangeEventData = {
      oldStatus: load.status,
      newStatus: status,
      updatedBy: userId,
    };
    await this.loadRepo.createLoadEvent(id, "STATUS_CHANGE", eventData, userId);

    // Send notification for status change
    if (updatedLoad.assignedTo) {
      try {
        await this.notificationService.create({
          recipientId: updatedLoad.assignedTo,
          type: "LOAD_STATUS_CHANGE",
          title: "Load Status Updated",
          message: `Load #${load.loadNumber} status changed from ${load.status} to ${status}`,
          entityType: "LOAD",
          entityId: id,
          sendEmail: status === "DELIVERED", // Email for important events
          organizationId,
        });
      } catch (error) {
        console.error("Failed to send load status change notification:", error);
      }
    }

    // Auto-generate documents based on status change
    await this.autoGenerateDocuments(
      updatedLoad,
      status,
      organizationId,
      userId
    );

    return this.transformLoadForApi(updatedLoad);
  }

  private async autoGenerateDocuments(
    load: { id: string; carrierId: string | null },
    newStatus: LoadStatus,
    organizationId: string,
    userId: string
  ) {
    try {
      // Generate Rate Confirmation when BOOKED
      if (newStatus === LoadStatus.BOOKED && load.carrierId) {
        const document = await this.documentGenService.generateRateConfirmation(
          load.id,
          organizationId,
          userId
        );

        if (document) {
          // Document is already saved by the generation service
          console.log(`Rate Confirmation generated: ${document.name}`);

          // Send notification for document generation
          try {
            await this.notificationService.create({
              recipientId: userId,
              type: "DOCUMENT_GENERATED",
              title: "Document Generated",
              message: `${document.name} has been generated for Load #${load.id}`,

              entityType: "LOAD",
              entityId: load.id,
              organizationId,
            });
          } catch (error) {
            console.error(
              "Failed to send document generation notification:",
              error
            );
          }
        }
      }

      // Generate BOL when DISPATCHED
      if (newStatus === LoadStatus.DISPATCHED && load.carrierId) {
        const document = await this.documentGenService.generateBOL(
          load.id,
          organizationId,
          userId
        );

        if (document) {
          // Document is already saved by the generation service
          console.log(`BOL generated: ${document.name}`);

          // Send notification for document generation
          try {
            await this.notificationService.create({
              recipientId: userId,
              type: "DOCUMENT_GENERATED",
              title: "Document Generated",
              message: `${document.name} has been generated for Load #${load.id}`,
              entityType: "LOAD",
              entityId: load.id,
              organizationId,
            });
          } catch (error) {
            console.error(
              "Failed to send document generation notification:",
              error
            );
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the status update
      console.error("Failed to auto-generate document:", error);
    }
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
    const load = await this.loadRepo.findById(id, organizationId);
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
      shipperName: load.shipperName,
      shipperAddress: load.shipperAddress,
      shipperPhone: load.shipperPhone,
      shipperEmail: load.shipperEmail,
      pickupDate: load.pickupDate,
      pickupStart: load.pickupStart,
      pickupEnd: load.pickupEnd,
      consigneeName: load.consigneeName,
      consigneeAddress: load.consigneeAddress,
      consigneePhone: load.consigneePhone,
      consigneeEmail: load.consigneeEmail,
      deliveryDate: load.deliveryDate,
      deliveryStart: load.deliveryStart,
      deliveryEnd: load.deliveryEnd,
      commodity: load.commodity,
      weight: load.weight,
      pieces: load.pieces,
      dimensions: load.dimensions,
      equipmentType: load.equipmentType,
      loadType: load.loadType,
      customerRate: load.customerRate,
      carrierRate: load.carrierRate,
      margin: load.margin,
      accessorials: load.accessorials,
      pickupNotes: load.pickupNotes,
      deliveryNotes: load.deliveryNotes,
      internalNotes: load.internalNotes,
      referenceNumber: load.referenceNumber,
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

    const rows = loads.map((load) => [
      load.loadNumber,
      load.status,
      load.customer?.companyName || "",
      load.carrier?.companyName || "",
      load.shipperAddress?.city || "",
      load.shipperAddress?.state || "",
      load.consigneeAddress?.city || "",
      load.consigneeAddress?.state || "",
      load.pickupDate?.toISOString().split("T")[0] || "",
      load.deliveryDate?.toISOString().split("T")[0] || "",
      load.commodity,
      load.weight,
      load.equipmentType,
      load.customerRate,
      load.carrierRate || "",
      load.margin || "",
    ]);

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
    // Validate dates
    if ("pickupDate" in data && "deliveryDate" in data) {
      if (
        data.pickupDate &&
        data.deliveryDate &&
        new Date(data.pickupDate) > new Date(data.deliveryDate)
      ) {
        throw new Error("Pickup date must be before delivery date");
      }
    }

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

  private validateStatusTransition(
    currentStatus: LoadStatus,
    newStatus: LoadStatus
  ) {
    const validTransitions: Record<LoadStatus, LoadStatus[]> = {
      [LoadStatus.QUOTE]: [LoadStatus.BOOKED, LoadStatus.CANCELLED],
      [LoadStatus.BOOKED]: [
        LoadStatus.DISPATCHED,
        LoadStatus.CANCELLED,
        LoadStatus.QUOTE,
      ],
      [LoadStatus.DISPATCHED]: [
        LoadStatus.IN_TRANSIT,
        LoadStatus.CANCELLED,
        LoadStatus.BOOKED,
      ],
      [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.CANCELLED],
      [LoadStatus.DELIVERED]: [LoadStatus.POD_RECEIVED],
      [LoadStatus.POD_RECEIVED]: [LoadStatus.INVOICED],
      [LoadStatus.INVOICED]: [LoadStatus.PAID],
      [LoadStatus.PAID]: [],
      [LoadStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
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
