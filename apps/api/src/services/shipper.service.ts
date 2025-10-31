import {
  CreateShipperRequest,
  UpdateShipperRequest,
  ShipperFilters,
  ShipperExportData,
  Shipper,
  BulkShipperAction,
  BulkShipperResponse,
} from "@tms/shared-types";
import {
  ShipperRepository,
  ShipperFilters as RepoShipperFilters,
} from "../repositories/shipper.repository.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";
import { webSocketService } from "./websocket.service.js";

export class ShipperService {
  private shipperRepo: ShipperRepository;

  constructor() {
    this.shipperRepo = new ShipperRepository();
  }

  async getShippers(organizationId: string, filters: ShipperFilters) {
    const { page = 1, limit = 50, isActive, state, search } = filters;

    const shipperFilters: RepoShipperFilters = {
      isActive,
      state,
      search,
    };

    const { data: shippers, total } = await this.shipperRepo.findWithFilters(
      shipperFilters,
      organizationId,
      page,
      limit
    );

    return {
      data: shippers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getShipperById(id: string, organizationId: string) {
    const shipper = await this.shipperRepo.findByIdWithRelations(
      id,
      organizationId
    );

    if (!shipper) {
      throw new NotFoundError("Shipper");
    }

    return this.transformShipperForApi(shipper);
  }

  private transformShipperForApi(shipper: any): Shipper {
    return {
      ...shipper,
      createdAt: shipper.createdAt.toISOString(),
      updatedAt: shipper.updatedAt.toISOString(),
      deletedAt: shipper.deletedAt?.toISOString(),
      loads: shipper.loads?.map((load: any) => ({
        ...load,
        pickupDate: load.pickupDate.toISOString(),
        deliveryDate: load.deliveryDate.toISOString(),
        createdAt: load.createdAt.toISOString(),
        updatedAt: load.updatedAt.toISOString(),
      })),
    };
  }

  async createShipper(
    data: CreateShipperRequest,
    organizationId: string,
    userId?: string
  ) {
    // Check if shipper with same company and address already exists
    const existingShipper = await this.shipperRepo.findByCompanyAndAddress(
      data.companyName,
      data.streetAddress,
      data.city,
      data.state,
      organizationId
    );

    if (existingShipper) {
      throw new ConflictError(
        "Shipper with this company and address already exists"
      );
    }

    const shipper = await this.shipperRepo.createWithRelations(
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
    try {
      webSocketService.broadcastToOrganization(organizationId, {
        type: "SHIPPER_CREATED",
        data: {
          shipper: this.transformShipperForApi(shipper),
        },
      });
    } catch (error) {
      console.error("Failed to send shipper created notification:", error);
    }

    // Create audit log entry
    if (userId) {
      console.log(`Shipper created by user ${userId}: ${shipper.id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return this.transformShipperForApi(shipper);
  }

  async updateShipper(
    id: string,
    data: UpdateShipperRequest,
    organizationId: string,
    userId?: string
  ) {
    const existingShipper = await this.shipperRepo.findById(id, organizationId);
    if (!existingShipper) {
      throw new NotFoundError("Shipper");
    }

    // Check for duplicate if company/address is being changed
    if (data.companyName || data.streetAddress || data.city || data.state) {
      const duplicateShipper = await this.shipperRepo.findByCompanyAndAddress(
        data.companyName || existingShipper.companyName,
        data.streetAddress || existingShipper.streetAddress,
        data.city || existingShipper.city,
        data.state || existingShipper.state,
        organizationId,
        id
      );

      if (duplicateShipper) {
        throw new ConflictError(
          "Shipper with this company and address already exists"
        );
      }
    }

    const shipper = await this.shipperRepo.updateWithRelations(
      id,
      {
        ...data,
        updatedAt: new Date(),
      },
      organizationId
    );

    if (!shipper) {
      throw new NotFoundError("Shipper");
    }

    // Send real-time notification
    try {
      webSocketService.broadcastToOrganization(organizationId, {
        type: "SHIPPER_UPDATED",
        data: {
          shipper: this.transformShipperForApi(shipper),
        },
      });
    } catch (error) {
      console.error("Failed to send shipper updated notification:", error);
    }

    // Create audit log entry
    if (userId) {
      console.log(`Shipper updated by user ${userId}: ${id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return this.transformShipperForApi(shipper);
  }

  async deleteShipper(id: string, organizationId: string, userId?: string) {
    const success = await this.shipperRepo.softDelete(id, organizationId);

    if (!success) {
      throw new NotFoundError("Shipper");
    }

    // Send real-time notification
    try {
      webSocketService.broadcastToOrganization(organizationId, {
        type: "SHIPPER_DELETED",
        data: {
          shipperId: id,
        },
      });
    } catch (error) {
      console.error("Failed to send shipper deleted notification:", error);
    }

    // Create audit log entry
    if (userId) {
      console.log(`Shipper deleted by user ${userId}: ${id}`);
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return { message: "Shipper deleted successfully" };
  }

  async getShipperStatistics(organizationId: string) {
    const stats = await this.shipperRepo.getStatistics(organizationId);

    return {
      success: true,
      data: {
        totalShippers: stats.total,
        activeShippers: stats.active,
        inactiveShippers: stats.inactive,
        recentShippers: await this.getRecentShippersCount(organizationId),
        topStates: await this.getTopStates(organizationId),
      },
    };
  }

  async exportShippers(
    organizationId: string,
    filters: ShipperFilters,
    format: string = "csv"
  ) {
    const shipperFilters: RepoShipperFilters = {
      isActive: filters.isActive,
      state: filters.state,
      search: filters.search,
    };

    const shippers = await this.shipperRepo.exportShippers(
      organizationId,
      shipperFilters
    );

    const exportData: ShipperExportData[] = shippers.map((shipper) => ({
      companyName: shipper.companyName,
      phone: shipper.phone,
      email: shipper.email || undefined,
      streetAddress: shipper.streetAddress,
      city: shipper.city,
      state: shipper.state,
      zipCode: shipper.zipCode,
      country: shipper.country,
      contactPerson: shipper.contactPerson || undefined,
      isActive: shipper.isActive,
      totalLoads: shipper._count?.loadShippers || 0,
      createdAt: shipper.createdAt.toISOString(),
    }));

    if (format === "csv") {
      return this.convertToCSV(exportData);
    } else if (format === "excel") {
      // Excel export: CSV format is compatible with Excel
      // Future enhancement: Use xlsx library for native Excel format
      return this.convertToCSV(exportData);
    }

    return exportData;
  }

  private convertToCSV(data: ShipperExportData[]): string {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof ShipperExportData];
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
    action: BulkShipperAction,
    organizationId: string,
    userId?: string
  ): Promise<BulkShipperResponse> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (action.action === "activate") {
      updates.isActive = true;
    } else if (action.action === "deactivate") {
      updates.isActive = false;
    }

    const result = await this.shipperRepo.bulkUpdate(
      action.shipperIds,
      updates,
      organizationId
    );

    // Send real-time notification
    try {
      webSocketService.broadcastToOrganization(organizationId, {
        type: "SHIPPERS_BULK_UPDATED",
        data: {
          shipperIds: action.shipperIds,
          updates,
        },
      });
    } catch (error) {
      console.error("Failed to send bulk update notification:", error);
    }

    // Create audit log entry
    if (userId) {
      console.log(
        `Bulk shipper update by user ${userId}: ${action.shipperIds.length} shippers`
      );
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return result;
  }

  async bulkDelete(
    shipperIds: string[],
    organizationId: string,
    userId?: string
  ): Promise<BulkShipperResponse> {
    const result = await this.shipperRepo.bulkDelete(
      shipperIds,
      organizationId
    );

    // Send real-time notification
    try {
      webSocketService.broadcastToOrganization(organizationId, {
        type: "SHIPPERS_BULK_DELETED",
        data: {
          shipperIds,
          result,
        },
      });
    } catch (error) {
      console.error("Failed to send bulk delete notification:", error);
    }

    // Create audit log entry
    if (userId) {
      console.log(
        `Bulk shipper delete by user ${userId}: ${shipperIds.length} shippers`
      );
      // Audit logging is implemented via console.log for now
      // Future: Integrate with dedicated audit service
    }

    return result;
  }

  async searchShippers(
    organizationId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<
    Array<{
      id: string;
      companyName: string;
      phone: string;
      email?: string;
      city: string;
      state: string;
      fullAddress: string;
    }>
  > {
    const { data: shippers } = await this.shipperRepo.findWithFilters(
      {
        search: searchTerm,
        isActive: true,
      },
      organizationId,
      1,
      limit
    );

    return shippers.map((shipper) => ({
      id: shipper.id,
      companyName: shipper.companyName,
      phone: shipper.phone,
      email: shipper.email || undefined,
      city: shipper.city,
      state: shipper.state,
      fullAddress: `${shipper.streetAddress}, ${shipper.city}, ${shipper.state} ${shipper.zipCode}`,
    }));
  }

  private async getRecentShippersCount(
    organizationId: string
  ): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentShippers } = await this.shipperRepo.findWithFilters(
        {
          isActive: true,
        },
        organizationId,
        1,
        1000 // Get all to count recent ones
      );

      return recentShippers.filter(
        (shipper) => new Date(shipper.createdAt) >= thirtyDaysAgo
      ).length;
    } catch (error) {
      console.error("Error calculating recent shippers:", error);
      return 0;
    }
  }

  private async getTopStates(
    organizationId: string
  ): Promise<Array<{ state: string; count: number }>> {
    try {
      const { data: shippers } = await this.shipperRepo.findWithFilters(
        {
          isActive: true,
        },
        organizationId,
        1,
        1000 // Get all to calculate top states
      );

      const stateCounts = shippers.reduce(
        (acc, shipper) => {
          acc[shipper.state] = (acc[shipper.state] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(stateCounts)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 states
    } catch (error) {
      console.error("Error calculating top states:", error);
      return [];
    }
  }
}
