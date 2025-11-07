import { Request, Response, NextFunction } from "express";
import { CarrierService } from "../services/carrier.service.js";
import { z } from "zod";
import type {
  CreateCarrierDto,
  UpdateCarrierDto,
  CarrierFiltersDto,
} from "../types/carrier.types.js";

const carrierService = new CarrierService();

// Validation schemas
export const createCarrierSchema = z.object({
  mcNumber: z.string().min(1, "MC number is required"),
  dotNumber: z.string().optional(),
  scac: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  ein: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  fax: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().optional(),
    formattedAddress: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    placeId: z.string().optional(),
  }),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Invalid contact email"),
  authorityStatus: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  insuranceAmount: z.number().optional(),
  cargoInsurance: z.number().optional(),
  liabilityInsurance: z.number().optional(),
  safetyRating: z.string().optional(),
  csa: z.any().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  w9OnFile: z.boolean().optional(),
  factoring: z.boolean().optional(),
  factoringCompany: z.string().optional(),
  preferredLanes: z.array(z.any()).optional(),
  equipment: z.array(z.string()).optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<CreateCarrierDto>;

export const updateCarrierSchema = z.object({
  mcNumber: z.string().optional(),
  dotNumber: z.string().optional(),
  scac: z.string().optional(),
  companyName: z.string().optional(),
  dba: z.string().optional(),
  ein: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().optional(),
      formattedAddress: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      placeId: z.string().optional(),
    })
    .optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  authorityStatus: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  insuranceAmount: z.number().optional(),
  cargoInsurance: z.number().optional(),
  liabilityInsurance: z.number().optional(),
  safetyRating: z.string().optional(),
  csa: z.any().optional(),
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  w9OnFile: z.boolean().optional(),
  factoring: z.boolean().optional(),
  factoringCompany: z.string().optional(),
  preferredLanes: z.array(z.any()).optional(),
  equipment: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<UpdateCarrierDto>;

export class CarrierController {
  async getCarriers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: CarrierFiltersDto = {
        status: req.query.status as string,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        isApproved:
          req.query.isApproved === "true"
            ? true
            : req.query.isApproved === "false"
              ? false
              : undefined,
        equipment: req.query.equipment as string,
        state: req.query.state as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await carrierService.getCarriers(
        req.auth!.organizationId,
        filters
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const carrier = await carrierService.getCarrierById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: carrier,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCarrier(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const carrier = await carrierService.createCarrier(
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: carrier,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCarrier(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const carrier = await carrierService.updateCarrier(
        id,
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: carrier,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCarrier(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await carrierService.deleteCarrier(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "Carrier deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async approveCarrier(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const carrier = await carrierService.approveCarrier(
        id,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: carrier,
        message: "Carrier approved successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await carrierService.getCarrierStatistics(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchCarriersByLane(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { pickupState, deliveryState } = req.query;

      if (!pickupState || !deliveryState) {
        throw new Error("Both pickupState and deliveryState are required");
      }

      const carriers = await carrierService.searchCarriersByLane(
        req.auth.organizationId,
        pickupState as string,
        deliveryState as string
      );

      res.status(200).json({
        success: true,
        data: carriers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierContacts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const contacts = await carrierService.getCarrierContacts(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      next(error);
    }
  }

  async addCarrierContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const contact = await carrierService.addCarrierContact(
        id,
        req.body,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCarrierContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id, contactId } = req.params;
      const contact = await carrierService.updateCarrierContact(
        id,
        contactId,
        req.body,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCarrierContact(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id, contactId } = req.params;
      await carrierService.deleteCarrierContact(
        id,
        contactId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: { message: "Contact deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const documents = await carrierService.getCarrierDocuments(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const performance = await carrierService.getCarrierPerformance(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierLoads(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await carrierService.getCarrierLoads(
        id,
        req.auth.organizationId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyFMCSA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { mcNumber } = req.body;

      if (!mcNumber) {
        throw new Error("MC Number is required");
      }

      const verificationData = await carrierService.verifyFMCSA(mcNumber);

      res.status(200).json({
        success: true,
        data: verificationData,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkApprove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { carrierIds } = req.body;

      if (!Array.isArray(carrierIds) || carrierIds.length === 0) {
        throw new Error("carrierIds must be a non-empty array");
      }

      const result = await carrierService.bulkApprove(
        carrierIds,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { carrierIds } = req.body;

      if (!Array.isArray(carrierIds) || carrierIds.length === 0) {
        throw new Error("carrierIds must be a non-empty array");
      }

      const result = await carrierService.bulkDelete(
        carrierIds,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCarriers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: CarrierFiltersDto = {
        status: req.query.status as string,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        isApproved:
          req.query.isApproved === "true"
            ? true
            : req.query.isApproved === "false"
              ? false
              : undefined,
        equipment: req.query.equipment as string,
        state: req.query.state as string,
        search: req.query.search as string,
      };

      const format = (req.query.format as string) || "csv";

      const exportData = await carrierService.exportCarriers(
        req.auth.organizationId,
        filters,
        format
      );

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=carriers-${Date.now()}.csv`
        );
      } else if (format === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=carriers-${Date.now()}.xlsx`
        );
      }

      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }

  async getInsuranceAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const days = parseInt(req.query.days as string) || 30;

      const alerts = await carrierService.getInsuranceAlerts(
        req.auth.organizationId,
        days
      );

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  }
}
