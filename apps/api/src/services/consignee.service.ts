import {
  CreateConsigneeRequest,
  UpdateConsigneeRequest,
  ConsigneeFilters,
  ConsigneeExportData,
} from "@tms/shared-types";
import {
  ConsigneeRepository,
  ConsigneeFilters as RepoConsigneeFilters,
} from "../repositories/consignee.repository.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";
import { webSocketService } from "./websocket.service.js";

export class ConsigneeService {
  private consigneeRepo: ConsigneeRepository;

  constructor() {
    this.consigneeRepo = new ConsigneeRepository();
  }

  async getConsignees(organizationId: string, filters: ConsigneeFilters) {
    const { page = 1, limit = 50, isActive, state, search } = filters;

    const consigneeFilters: RepoConsigneeFilters = {
      isActive,
      state,
      search,
    };

    const { data: consignees, total } =
      await this.consigneeRepo.findWithFilters(
        consigneeFilters,
        organizationId,
        page,
        limit
      );

    return {
      data: consignees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getConsigneeById(id: string, organizationId: string) {
    const consignee = await this.consigneeRepo.findByIdWithRelations(
      id,
      organizationId
    );

    if (!consignee) {
      throw new NotFoundError("Consignee");
    }

    return this.transformConsigneeForApi(consignee);
  }

  private transformConsigneeForApi(consignee: any) {
    return {
      ...consignee,
      createdAt: consignee.createdAt.toISOString(),
      updatedAt: consignee.updatedAt.toISOString(),
      deletedAt: consignee.deletedAt?.toISOString(),
      loads: consignee.loads?.map((load: any) => ({
        ...load,
        pickupDate: load.pickupDate.toISOString(),
        deliveryDate: load.deliveryDate.toISOString(),
        createdAt: load.createdAt.toISOString(),
        updatedAt: load.updatedAt.toISOString(),
      })),
    };
  }

  async createConsignee(
    data: CreateConsigneeRequest,
    organizationId: string,
    userId?: string
  ) {
    // Check if consignee with same company and address already exists
    const existingConsignee = await this.consigneeRepo.findByCompanyAndAddress(
      data.companyName,
      data.streetAddress,
      data.city,
      data.state,
      organizationId
    );

    if (existingConsignee) {
      throw new ConflictError(
        "Consignee with this company and address already exists"
      );
    }

    const consignee = await this.consigneeRepo.createWithRelations(
      {
        companyName: data.companyName,
        phone: data.phone,
        email: data.email,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || "USA",
        contactPerson: data.contactPerson,
        notes: data.notes,
        isActive: true,
      },
      organizationId
    );

    // Send real-time notification
    webSocketService.broadcastToOrganization(organizationId, {
      type: "CONSIGNEE_CREATED",
      data: {
        consignee: this.transformConsigneeForApi(consignee),
      },
    });

    // Create audit log entry
    if (userId) {
      console.log(`Consignee created by user ${userId}: ${consignee.id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return this.transformConsigneeForApi(consignee);
  }

  async updateConsignee(
    id: string,
    data: UpdateConsigneeRequest,
    organizationId: string,
    userId?: string
  ) {
    const existingConsignee = await this.consigneeRepo.findById(
      id,
      organizationId
    );
    if (!existingConsignee) {
      throw new NotFoundError("Consignee");
    }

    // Check for duplicate if company/address is being changed
    if (data.companyName || data.streetAddress || data.city || data.state) {
      const duplicateConsignee =
        await this.consigneeRepo.findByCompanyAndAddress(
          data.companyName || existingConsignee.companyName,
          data.streetAddress || existingConsignee.streetAddress,
          data.city || existingConsignee.city,
          data.state || existingConsignee.state,
          organizationId,
          id
        );

      if (duplicateConsignee) {
        throw new ConflictError(
          "Consignee with this company and address already exists"
        );
      }
    }

    const consignee = await this.consigneeRepo.updateWithRelations(
      id,
      {
        ...data,
        updatedAt: new Date(),
      },
      organizationId
    );

    if (!consignee) {
      throw new NotFoundError("Consignee");
    }

    // Send real-time notification
    webSocketService.broadcastToOrganization(organizationId, {
      type: "CONSIGNEE_UPDATED",
      data: {
        consignee: this.transformConsigneeForApi(consignee),
      },
    });

    // Create audit log entry
    if (userId) {
      console.log(`Consignee updated by user ${userId}: ${id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return this.transformConsigneeForApi(consignee);
  }

  async deleteConsignee(id: string, organizationId: string, userId?: string) {
    const success = await this.consigneeRepo.softDelete(id, organizationId);

    if (!success) {
      throw new NotFoundError("Consignee");
    }

    // Send real-time notification
    webSocketService.broadcastToOrganization(organizationId, {
      type: "CONSIGNEE_DELETED",
      data: {
        consigneeId: id,
      },
    });

    // Create audit log entry
    if (userId) {
      console.log(`Consignee deleted by user ${userId}: ${id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return { message: "Consignee deleted successfully" };
  }

  async getConsigneeStatistics(organizationId: string) {
    const stats = await this.consigneeRepo.getStatistics(organizationId);
    const topConsignees = await this.consigneeRepo.getTopConsignees(
      organizationId,
      5
    );

    return {
      ...stats,
      topConsignees: topConsignees.map((consignee) =>
        this.transformConsigneeForApi(consignee)
      ),
    };
  }

  async exportConsignees(
    organizationId: string,
    filters: ConsigneeFilters,
    format: string = "csv"
  ) {
    const consigneeFilters: RepoConsigneeFilters = {
      isActive: filters.isActive,
      state: filters.state,
      search: filters.search,
    };

    const consignees = await this.consigneeRepo.exportConsignees(
      organizationId,
      consigneeFilters
    );

    const exportData: ConsigneeExportData[] = consignees.map((consignee) => ({
      companyName: consignee.companyName,
      phone: consignee.phone,
      email: consignee.email || undefined,
      streetAddress: consignee.streetAddress,
      city: consignee.city,
      state: consignee.state,
      zipCode: consignee.zipCode,
      country: consignee.country,
      contactPerson: consignee.contactPerson || undefined,
      isActive: consignee.isActive,
      totalLoads: consignee._count?.loads || 0,
      createdAt: consignee.createdAt.toISOString(),
    }));

    if (format === "csv") {
      return this.convertToCSV(exportData);
    } else if (format === "excel") {
      // TODO: Implement Excel export
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  private convertToCSV(data: ConsigneeExportData[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof ConsigneeExportData];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  async bulkUpdate(
    consigneeIds: string[],
    updates: Record<string, unknown>,
    organizationId: string,
    userId?: string
  ) {
    const result = await this.consigneeRepo.bulkUpdate(
      consigneeIds,
      {
        ...updates,
        updatedAt: new Date(),
      },
      organizationId
    );

    // Send real-time notification
    webSocketService.broadcastToOrganization(organizationId, {
      type: "CONSIGNEES_BULK_UPDATED",
      data: {
        consigneeIds,
        updates,
      },
    });

    // Create audit log entry
    if (userId) {
      console.log(
        `Bulk consignee update by user ${userId}: ${consigneeIds.length} consignees`
      );
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return result;
  }

  async bulkDelete(
    consigneeIds: string[],
    organizationId: string,
    userId?: string
  ) {
    const result = await this.consigneeRepo.bulkDelete(
      consigneeIds,
      organizationId
    );

    // Send real-time notification
    webSocketService.broadcastToOrganization(organizationId, {
      type: "CONSIGNEES_BULK_DELETED",
      data: {
        consigneeIds,
        result,
      },
    });

    // Create audit log entry
    if (userId) {
      console.log(
        `Bulk consignee delete by user ${userId}: ${consigneeIds.length} consignees`
      );
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return result;
  }

  async searchConsignees(
    organizationId: string,
    searchTerm: string,
    limit: number = 20
  ) {
    const { data: consignees } = await this.consigneeRepo.findWithFilters(
      {
        search: searchTerm,
        isActive: true,
      },
      organizationId,
      1,
      limit
    );

    return consignees.map((consignee) => ({
      id: consignee.id,
      companyName: consignee.companyName,
      phone: consignee.phone,
      email: consignee.email,
      city: consignee.city,
      state: consignee.state,
      fullAddress: `${consignee.streetAddress}, ${consignee.city}, ${consignee.state} ${consignee.zipCode}`,
    }));
  }
}
