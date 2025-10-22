import { Request, Response, NextFunction } from "express";
import { LoadService } from "../services/load.service.js";
import { z } from "zod";
import { LoadStatus, EquipmentType, LoadType } from "@prisma/client";
import type { LoadFiltersDto } from "../types/load.types.js";

const loadService = new LoadService();

// Validation schemas
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const createLoadSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional(),
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperAddress: addressSchema,
  shipperPhone: z.string().min(1, "Shipper phone is required"),
  shipperEmail: z.string().email().optional(),
  pickupDate: z.string(),
  pickupStart: z.string().min(1, "Pickup start time is required"),
  pickupEnd: z.string().min(1, "Pickup end time is required"),
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeAddress: addressSchema,
  consigneePhone: z.string().min(1, "Consignee phone is required"),
  consigneeEmail: z.string().email().optional(),
  deliveryDate: z.string(),
  deliveryStart: z.string().min(1, "Delivery start time is required"),
  deliveryEnd: z.string().min(1, "Delivery end time is required"),
  commodity: z.string().min(1, "Commodity is required"),
  weight: z.number().min(0, "Weight must be positive"),
  pieces: z.number().optional(),
  dimensions: z
    .object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  equipmentType: z.nativeEnum(EquipmentType),
  loadType: z.nativeEnum(LoadType).optional(),
  customerRate: z.number().min(0, "Customer rate must be positive"),
  carrierRate: z.number().min(0).optional(),
  accessorials: z
    .array(
      z.object({
        type: z.string(),
        amount: z.number(),
        description: z.string(),
      })
    )
    .optional(),
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const updateLoadSchema = z.object({
  customerId: z.string().optional(),
  carrierId: z.string().optional(),
  shipperName: z.string().optional(),
  shipperAddress: addressSchema.optional(),
  shipperPhone: z.string().optional(),
  shipperEmail: z.string().email().optional(),
  pickupDate: z.string().optional(),
  pickupStart: z.string().optional(),
  pickupEnd: z.string().optional(),
  consigneeName: z.string().optional(),
  consigneeAddress: addressSchema.optional(),
  consigneePhone: z.string().optional(),
  consigneeEmail: z.string().email().optional(),
  deliveryDate: z.string().optional(),
  deliveryStart: z.string().optional(),
  deliveryEnd: z.string().optional(),
  commodity: z.string().optional(),
  weight: z.number().min(0).optional(),
  pieces: z.number().optional(),
  dimensions: z
    .object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  equipmentType: z.nativeEnum(EquipmentType).optional(),
  loadType: z.nativeEnum(LoadType).optional(),
  customerRate: z.number().min(0).optional(),
  carrierRate: z.number().min(0).optional(),
  accessorials: z
    .array(
      z.object({
        type: z.string(),
        amount: z.number(),
        description: z.string(),
      })
    )
    .optional(),
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.nativeEnum(LoadStatus).optional(),
});

export class LoadController {
  async getLoads(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: LoadFiltersDto = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        carrierId: req.query.carrierId as string,
        pickupDateFrom: req.query.pickupDateFrom as string,
        pickupDateTo: req.query.pickupDateTo as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await loadService.getLoads(
        req.auth.organizationId,
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

  async getLoadById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const load = await loadService.getLoadById(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: load,
      });
    } catch (error) {
      next(error);
    }
  }

  async createLoad(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const load = await loadService.createLoad(
        req.body,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: load,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLoad(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const load = await loadService.updateLoad(
        id,
        req.body,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: load,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLoad(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await loadService.deleteLoad(id, req.auth.organizationId);

      res.status(200).json({
        success: true,
        data: {
          message: "Load deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLoadStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(LoadStatus).includes(status)) {
        throw new Error("Invalid load status");
      }

      const load = await loadService.updateLoadStatus(
        id,
        status,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: load,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoadStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await loadService.getLoadStatistics(
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

  async getLoadEvents(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const events = await loadService.getLoadEvents(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoadDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const documents = await loadService.getLoadDocuments(
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

  async assignCarrier(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const { carrierId, notes } = req.body;

      const load = await loadService.assignCarrier(
        id,
        carrierId,
        notes,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: load,
      });
    } catch (error) {
      next(error);
    }
  }

  async duplicateLoad(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const load = await loadService.duplicateLoad(
        id,
        req.auth.userId,
        req.auth.organizationId
      );

      res.status(201).json({
        success: true,
        data: load,
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

      const { loadIds } = req.body;

      if (!Array.isArray(loadIds) || loadIds.length === 0) {
        throw new Error("loadIds must be a non-empty array");
      }

      const result = await loadService.bulkDelete(
        loadIds,
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

  async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { loadIds, status } = req.body;

      if (!Array.isArray(loadIds) || loadIds.length === 0) {
        throw new Error("loadIds must be a non-empty array");
      }

      if (!status || !Object.values(LoadStatus).includes(status)) {
        throw new Error("Invalid load status");
      }

      const result = await loadService.bulkUpdateStatus(
        loadIds,
        status,
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

  async exportLoads(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: LoadFiltersDto = {
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        carrierId: req.query.carrierId as string,
        pickupDateFrom: req.query.pickupDateFrom as string,
        pickupDateTo: req.query.pickupDateTo as string,
        search: req.query.search as string,
      };

      const format = (req.query.format as string) || "csv";

      const exportData = await loadService.exportLoads(
        req.auth.organizationId,
        filters,
        format
      );

      // Set appropriate headers based on format
      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=loads-${Date.now()}.csv`
        );
      } else if (format === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=loads-${Date.now()}.xlsx`
        );
      }

      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await loadService.getDashboardStats(
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
}
