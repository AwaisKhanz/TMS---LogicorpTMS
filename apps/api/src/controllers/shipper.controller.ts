import { Request, Response, NextFunction } from "express";
import { ShipperService } from "../services/shipper.service.js";
import { z } from "zod";
import type {
  CreateShipperDto,
  UpdateShipperDto,
  ShipperFiltersDto,
} from "../types/shipper.types.js";

const shipperService = new ShipperService();

// Validation schemas
export const createShipperSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
    country: z.string().optional(),
    formattedAddress: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    placeId: z.string().optional(),
  }),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<CreateShipperDto>;

export const updateShipperSchema = z.object({
  companyName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(2),
      zip: z.string().min(5),
      country: z.string().optional(),
      formattedAddress: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      placeId: z.string().optional(),
    })
    .partial()
    .optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
}) as z.ZodType<UpdateShipperDto>;

export class ShipperController {
  async getShippers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: ShipperFiltersDto = {
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        state: req.query.state as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await shipperService.getShippers(
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

  async getShipperById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const shipper = await shipperService.getShipperById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: shipper,
      });
    } catch (error) {
      next(error);
    }
  }

  async createShipper(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const shipper = await shipperService.createShipper(
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: shipper,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateShipper(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const shipper = await shipperService.updateShipper(
        id,
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: shipper,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteShipper(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await shipperService.deleteShipper(
        id,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: {
          message: "Shipper deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getShipperStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await shipperService.getShipperStatistics(
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

  async searchShippers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { search } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!search || typeof search !== "string") {
        throw new Error("Search term is required");
      }

      const shippers = await shipperService.searchShippers(
        req.auth.organizationId,
        search,
        limit
      );

      res.status(200).json({
        success: true,
        data: shippers,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { shipperIds } = req.body;

      if (!Array.isArray(shipperIds) || shipperIds.length === 0) {
        throw new Error("shipperIds must be a non-empty array");
      }

      const result = await shipperService.bulkUpdate(
        { action: "activate", shipperIds },
        req.auth.organizationId,
        req.auth.userId
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

      const { shipperIds } = req.body;

      if (!Array.isArray(shipperIds) || shipperIds.length === 0) {
        throw new Error("shipperIds must be a non-empty array");
      }

      const result = await shipperService.bulkDelete(
        shipperIds,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportShippers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: ShipperFiltersDto = {
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        state: req.query.state as string,
        search: req.query.search as string,
      };

      const format = (req.query.format as string) || "csv";

      const exportData = await shipperService.exportShippers(
        req.auth.organizationId,
        filters,
        format
      );

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=shippers-${Date.now()}.csv`
        );
      } else if (format === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=shippers-${Date.now()}.xlsx`
        );
      }

      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }
}
