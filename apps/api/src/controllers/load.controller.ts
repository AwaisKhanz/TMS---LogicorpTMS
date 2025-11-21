import { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../utils/errors.util.js";
import { LoadService } from "../services/load.service.js";
import { z } from "zod";
import {
  LoadStatus,
  EquipmentType,
  LoadType,
  LoadFilters as LoadFiltersDto,
} from "@tms/shared-types";

const loadService = new LoadService();

const shipperRelationSchema = z.object({
  shipperId: z.string().min(1, "Shipper ID is required"),
  isPrimary: z.boolean().optional(),
  sequence: z.number().int().min(1).optional(),
  pickupDate: z.string().optional(),
  pickupStart: z.string().optional(),
  pickupEnd: z.string().optional(),
  pickupType: z.enum(["FCFS", "BY_APPOINTMENT"]).optional(),
  pickupNotes: z.string().optional(),
});

const consigneeRelationSchema = z.object({
  consigneeId: z.string().min(1, "Consignee ID is required"),
  isPrimary: z.boolean().optional(),
  sequence: z.number().int().min(1).optional(),
  deliveryDate: z.string().optional(),
  deliveryStart: z.string().optional(),
  deliveryEnd: z.string().optional(),
  deliveryType: z.enum(["FCFS", "BY_APPOINTMENT"]).optional(),
  deliveryNotes: z.string().optional(),
});

export const createLoadSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional(),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  truckNumber: z.string().optional().nullable(),
  trailerNumber: z.string().optional().nullable(),
  // Root-level pickup/delivery fields removed in favor of per-shipper/consignee

  // Multiple shippers and consignees
  shippers: z
    .array(shipperRelationSchema)
    .min(1, "At least one shipper is required"),
  consignees: z
    .array(consigneeRelationSchema)
    .min(1, "At least one consignee is required"),

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
  minTemperature: z.number().int().optional(),
  maxTemperature: z.number().int().optional(),
  temperatureUnit: z.enum(["FAHRENHEIT", "CELSIUS"]).optional(),
  continuousTemperature: z.boolean().optional(),
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
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const updateLoadSchema = z.object({
  customerId: z.string().optional(),
  carrierId: z.string().optional(),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  truckNumber: z.string().optional().nullable(),
  trailerNumber: z.string().optional().nullable(),
  // Root-level pickup/delivery fields removed; managed per-shipper/consignee

  // Multiple shippers and consignees
  shippers: z.array(shipperRelationSchema).optional(),
  consignees: z.array(consigneeRelationSchema).optional(),

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
  minTemperature: z.number().int().optional(),
  maxTemperature: z.number().int().optional(),
  temperatureUnit: z.enum(["FAHRENHEIT", "CELSIUS"]).optional(),
  continuousTemperature: z.boolean().optional(),
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
        filters,
        req.auth.userId,
        req.auth.permissions
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
      const load = await loadService.getLoadById(
        id,
        req.auth.organizationId,
        req.auth.userId
      );

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
      // If load is COMPLETED, only accounting/invoice users can modify
      const existing = await loadService.getLoadById(
        id,
        req.auth.organizationId,
        req.auth.userId
      );
      if (
        existing?.status === LoadStatus.COMPLETED &&
        !req.auth.permissions.includes("invoice:edit")
      ) {
        throw new AuthorizationError(
          "Completed loads can only be modified by accounting users"
        );
      }
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
      const { page, limit, search, type } = req.query;

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        type: type as string,
      };

      const result = await loadService.getLoadDocuments(
        id,
        req.auth.organizationId,
        options
      );

      res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
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

  async updateFinancialAdjustments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const adjustments = req.body?.adjustments ?? [];

      // Restrict financial edits on completed loads to accounting users
      const existing = await loadService.getLoadById(
        id,
        req.auth.organizationId,
        req.auth.userId
      );
      if (
        existing?.status === LoadStatus.COMPLETED &&
        !req.auth.permissions.includes("invoice:edit")
      ) {
        throw new AuthorizationError(
          "Completed loads' financials can only be modified by accounting users"
        );
      }

      const load = await loadService.updateFinancialAdjustments(
        id,
        req.auth.organizationId,
        adjustments
      );

      res.status(200).json({ success: true, data: load });
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

      const loadStats = await loadService.getDashboardStats(
        req.auth.organizationId
      );

      // Return the load stats in the format expected by the frontend
      res.status(200).json({
        success: true,
        data: {
          loads: loadStats,
          carriers: {
            totalCarriers: 0,
            activeCarriers: 0,
            approvedCarriers: 0,
            pendingApproval: 0,
          },
          customers: {
            totalCustomers: 0,
            activeCustomers: 0,
            totalRevenue: 0,
            creditUsed: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompletedLoads(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await loadService.getCompletedLoads(
        req.auth.organizationId,
        page,
        limit,
        req.auth.userId,
        req.auth.permissions
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
}
