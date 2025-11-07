import { Request, Response, NextFunction } from "express";
import { ConsigneeService } from "../services/consignee.service.js";
import { z } from "zod";
import type {
  CreateConsigneeDto,
  UpdateConsigneeDto,
  ConsigneeFiltersDto,
} from "../types/consignee.types.js";

const consigneeService = new ConsigneeService();

// Validation schemas
export const createConsigneeSchema = z.object({
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
}) satisfies z.ZodType<CreateConsigneeDto>;

export const updateConsigneeSchema = z.object({
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
}) as z.ZodType<UpdateConsigneeDto>;

export class ConsigneeController {
  async getConsignees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: ConsigneeFiltersDto = {
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

      const result = await consigneeService.getConsignees(
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

  async getConsigneeById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const consignee = await consigneeService.getConsigneeById(
        id,
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data: consignee,
      });
    } catch (error) {
      next(error);
    }
  }

  async createConsignee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const consignee = await consigneeService.createConsignee(
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(201).json({
        success: true,
        data: consignee,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConsignee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      const consignee = await consigneeService.updateConsignee(
        id,
        req.body,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: consignee,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteConsignee(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { id } = req.params;
      await consigneeService.deleteConsignee(
        id,
        req.auth.organizationId,
        req.auth.userId
      );

      res.status(200).json({
        success: true,
        data: {
          message: "Consignee deleted successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConsigneeStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await consigneeService.getConsigneeStatistics(
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

  async searchConsignees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const { search } = req.query;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!search || typeof search !== "string") {
        throw new Error("Search term is required");
      }

      const consignees = await consigneeService.searchConsignees(
        req.auth.organizationId,
        search,
        limit
      );

      res.status(200).json({
        success: true,
        data: consignees,
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

      const { consigneeIds, updates } = req.body;

      if (!Array.isArray(consigneeIds) || consigneeIds.length === 0) {
        throw new Error("consigneeIds must be a non-empty array");
      }

      const result = await consigneeService.bulkUpdate(
        consigneeIds,
        updates,
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

      const { consigneeIds } = req.body;

      if (!Array.isArray(consigneeIds) || consigneeIds.length === 0) {
        throw new Error("consigneeIds must be a non-empty array");
      }

      const result = await consigneeService.bulkDelete(
        consigneeIds,
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

  async exportConsignees(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const filters: ConsigneeFiltersDto = {
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

      const exportData = await consigneeService.exportConsignees(
        req.auth.organizationId,
        filters,
        format
      );

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=consignees-${Date.now()}.csv`
        );
      } else if (format === "excel") {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=consignees-${Date.now()}.xlsx`
        );
      }

      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }
}
