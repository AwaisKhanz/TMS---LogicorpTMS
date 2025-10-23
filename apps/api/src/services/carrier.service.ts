import { Prisma } from "@prisma/client";
import {
  CreateCarrierDto,
  UpdateCarrierDto,
  CarrierFiltersDto,
  CarrierContactDto,
  UpdateCarrierContactDto,
  CarrierRatingDto,
  CarrierExportData,
} from "../types/carrier.types.js";
import {
  CarrierRepository,
  CarrierFilters,
} from "../repositories/carrier.repository.js";
import { NotFoundError, ConflictError } from "../utils/errors.util.js";

export class CarrierService {
  private carrierRepo: CarrierRepository;

  constructor() {
    this.carrierRepo = new CarrierRepository();
  }
  async getCarriers(organizationId: string, filters: CarrierFiltersDto) {
    const {
      page = 1,
      limit = 50,
      status,
      isActive,
      isApproved,
      equipment,
      state,
      search,
    } = filters;

    const carrierFilters: CarrierFilters = {
      status,
      isActive,
      isApproved,
      equipment,
      state,
      search,
    };

    const { data: carriers, total } = await this.carrierRepo.findWithFilters(
      carrierFilters,
      organizationId,
      page,
      limit
    );

    return {
      data: carriers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCarrierById(id: string, organizationId: string) {
    const carrier = await this.carrierRepo.findByIdWithRelations(
      id,
      organizationId
    );

    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return carrier;
  }

  async createCarrier(data: CreateCarrierDto, organizationId: string) {
    // Check if MC number already exists
    const existingCarrier = await this.carrierRepo.findByMcNumber(
      data.mcNumber,
      organizationId
    );

    if (existingCarrier) {
      throw new ConflictError("Carrier with this MC Number already exists");
    }

    const carrier = await this.carrierRepo.createWithRelations(
      {
        ...data,
        address: data.address,
        csa: data.csa ? data.csa : undefined,
        preferredLanes: data.preferredLanes ? data.preferredLanes : undefined,
      },
      organizationId
    );

    return carrier;
  }

  async updateCarrier(
    id: string,
    data: UpdateCarrierDto,
    organizationId: string
  ) {
    const existingCarrier = await this.carrierRepo.findById(id, organizationId);

    if (!existingCarrier) {
      throw new NotFoundError("Carrier");
    }

    // Check if MC number already exists (if updating MC number)
    if (data.mcNumber && data.mcNumber !== existingCarrier.mcNumber) {
      const duplicateCarrier = await this.carrierRepo.findByMcNumber(
        data.mcNumber,
        organizationId,
        id
      );

      if (duplicateCarrier) {
        throw new ConflictError("Carrier with this MC Number already exists");
      }
    }

    const carrier = await this.carrierRepo.updateWithRelations(
      id,
      {
        ...data,
        address: data.address ? data.address : undefined,
        csa: data.csa ? data.csa : undefined,
        preferredLanes: data.preferredLanes ? data.preferredLanes : undefined,
      },
      organizationId
    );

    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return carrier;
  }

  async deleteCarrier(id: string, organizationId: string) {
    const deleted = await this.carrierRepo.softDelete(id, organizationId);

    if (!deleted) {
      throw new NotFoundError("Carrier");
    }
  }

  async approveCarrier(id: string, userId: string, organizationId: string) {
    const carrier = await this.carrierRepo.approve(id, userId, organizationId);

    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return carrier;
  }

  async updateCarrierPerformance(carrierId: string, organizationId: string) {
    await this.carrierRepo.updatePerformanceMetrics(carrierId, organizationId);
  }

  async getCarrierStatistics(organizationId: string) {
    return this.carrierRepo.getStatistics(organizationId);
  }

  getCarrierRepository() {
    return this.carrierRepo;
  }

  async searchCarriersByLane(
    organizationId: string,
    pickupState: string,
    deliveryState: string
  ) {
    return this.carrierRepo.findByLane(
      organizationId,
      pickupState,
      deliveryState
    );
  }

  async getCarrierContacts(id: string, organizationId: string) {
    const carrier = await this.carrierRepo.findById(id, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return this.carrierRepo.getCarrierContacts(id);
  }

  async addCarrierContact(
    carrierId: string,
    contactData: CarrierContactDto,
    organizationId: string
  ) {
    const carrier = await this.carrierRepo.findById(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    // If setting as primary, unset other primary contacts
    if (contactData.isPrimary) {
      await this.carrierRepo.unsetPrimaryContacts(carrierId);
    }

    const contactInput: Prisma.CarrierContactCreateInput = {
      ...contactData,
      carrier: {
        connect: { id: carrierId },
      },
    };

    return this.carrierRepo.createCarrierContact(carrierId, contactInput);
  }

  async updateCarrierContact(
    carrierId: string,
    contactId: string,
    contactData: UpdateCarrierContactDto,
    organizationId: string
  ) {
    const carrier = await this.carrierRepo.findById(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    // If setting as primary, unset other primary contacts
    if (contactData.isPrimary) {
      await this.carrierRepo.unsetPrimaryContacts(carrierId, contactId);
    }

    return this.carrierRepo.updateCarrierContact(contactId, contactData);
  }

  async deleteCarrierContact(
    carrierId: string,
    contactId: string,
    organizationId: string
  ) {
    const carrier = await this.carrierRepo.findById(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    const deleted = await this.carrierRepo.deleteCarrierContact(contactId);
    if (!deleted) {
      throw new NotFoundError("Contact");
    }
  }

  async getCarrierDocuments(id: string, organizationId: string) {
    const carrier = await this.carrierRepo.findById(id, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return this.carrierRepo.getCarrierDocuments(id, organizationId);
  }

  async getCarrierPerformance(id: string, organizationId: string) {
    const carrier = await this.carrierRepo.findById(id, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return this.carrierRepo.getCarrierPerformance(id, organizationId);
  }

  async getCarrierLoads(
    id: string,
    organizationId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const carrier = await this.carrierRepo.findById(id, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    return this.carrierRepo.getCarrierLoads(id, organizationId, page, limit);
  }

  async verifyFMCSA(mcNumber: string) {
    // Mock FMCSA verification - in production, integrate with Highway.com
    // For now, return mock data structure
    return {
      mcNumber,
      verified: true,
      data: {
        legalName: "Example Carrier LLC",
        authorityStatus: "ACTIVE",
        insuranceOnFile: true,
        safetyRating: "SATISFACTORY",
      },
      message:
        "FMCSA verification not yet integrated. Use Highway.com API in production.",
    };
  }

  async bulkApprove(
    carrierIds: string[],
    userId: string,
    organizationId: string
  ) {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const carrierId of carrierIds) {
      try {
        await this.approveCarrier(carrierId, userId, organizationId);
        results.successful.push(carrierId);
      } catch (error) {
        results.failed.push({
          id: carrierId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async bulkDelete(carrierIds: string[], organizationId: string) {
    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const carrierId of carrierIds) {
      try {
        await this.deleteCarrier(carrierId, organizationId);
        results.successful.push(carrierId);
      } catch (error) {
        results.failed.push({
          id: carrierId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  async exportCarriers(
    organizationId: string,
    filters: CarrierFiltersDto,
    format: string
  ) {
    const { data: carriers } = await this.getCarriers(organizationId, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    if (format === "csv") {
      return this.formatCarriersAsCsv(
        carriers as unknown as CarrierExportData[]
      );
    } else if (format === "excel") {
      return this.formatCarriersAsExcel(
        carriers as unknown as CarrierExportData[]
      );
    }

    throw new Error("Unsupported export format");
  }

  private formatCarriersAsCsv(carriers: CarrierExportData[]): string {
    const headers = [
      "MC Number",
      "Company Name",
      "Contact Name",
      "Phone",
      "Email",
      "City",
      "State",
      "Authority Status",
      "Insurance Expiry",
      "Is Active",
      "Is Approved",
      "Rating",
      "Total Loads",
      "On-Time Delivery %",
    ];

    const rows = carriers.map((carrier: CarrierExportData) => [
      carrier.mcNumber,
      carrier.companyName,
      carrier.contactName,
      carrier.phone,
      carrier.email,
      carrier.address?.city || "",
      carrier.address?.state || "",
      carrier.authorityStatus,
      carrier.insuranceExpiry instanceof Date
        ? carrier.insuranceExpiry.toISOString().split("T")[0]
        : typeof carrier.insuranceExpiry === "string"
          ? carrier.insuranceExpiry
          : "",
      carrier.isActive ? "Yes" : "No",
      carrier.isApproved ? "Yes" : "No",
      carrier.rating || "N/A",
      carrier.totalLoads || 0,
      carrier.onTimeDelivery || "N/A",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }

  private formatCarriersAsExcel(carriers: CarrierExportData[]): string {
    // For now, return CSV format
    // TODO: Implement actual Excel format with a library like exceljs
    return this.formatCarriersAsCsv(carriers);
  }

  async getInsuranceAlerts(organizationId: string, days: number = 30) {
    return this.carrierRepo.getExpiringInsurance(organizationId, days);
  }

  async submitRating(
    carrierId: string,
    ratingData: CarrierRatingDto,
    userId: string,
    organizationId: string
  ) {
    const carrier = await this.carrierRepo.findById(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError("Carrier");
    }

    // Update carrier rating
    const newRating = await this.carrierRepo.addRating(
      carrierId,
      ratingData.rating,
      ratingData.comment,
      userId,
      ratingData.loadId
    );

    // Recalculate average rating
    await this.carrierRepo.recalculateAverageRating(carrierId);

    return newRating;
  }
}
