import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service.js";
import {
  CreateReportRequest,
  UpdateReportRequest,
  ReportFilters,
  GenerateReportRequest,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "@tms/shared-types";
import { validateRequest } from "../middleware/validation.middleware.js";
import { z } from "zod";

// Validation schemas
const createReportSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  type: z.enum([
    "LOAD_ANALYTICS",
    "CARRIER_PERFORMANCE",
    "CUSTOMER_ANALYTICS",
    "REVENUE_ANALYSIS",
    "OPERATIONAL_METRICS",
    "TEAM_PERFORMANCE",
    "FINANCIAL_SUMMARY",
    "CUSTOM",
  ]),
  format: z.enum(["PDF", "EXCEL", "CSV", "JSON"]),
  timeRange: z.enum([
    "TODAY",
    "YESTERDAY",
    "THIS_WEEK",
    "LAST_WEEK",
    "THIS_MONTH",
    "LAST_MONTH",
    "THIS_QUARTER",
    "LAST_QUARTER",
    "THIS_YEAR",
    "LAST_YEAR",
    "CUSTOM",
  ]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
  isScheduled: z.boolean().optional(),
  frequency: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"])
    .optional(),
});

const updateReportSchema = createReportSchema.partial();

const generateReportSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  format: z.enum(["PDF", "EXCEL", "CSV", "JSON"]).optional(),
  timeRange: z
    .enum([
      "TODAY",
      "YESTERDAY",
      "THIS_WEEK",
      "LAST_WEEK",
      "THIS_MONTH",
      "LAST_MONTH",
      "THIS_QUARTER",
      "LAST_QUARTER",
      "THIS_YEAR",
      "LAST_YEAR",
      "CUSTOM",
    ])
    .optional(),
  customDateFrom: z.string().optional(),
  customDateTo: z.string().optional(),
});

const reportFiltersSchema = z.object({
  type: z
    .enum([
      "LOAD_ANALYTICS",
      "CARRIER_PERFORMANCE",
      "CUSTOMER_ANALYTICS",
      "REVENUE_ANALYSIS",
      "OPERATIONAL_METRICS",
      "TEAM_PERFORMANCE",
      "FINANCIAL_SUMMARY",
      "CUSTOM",
    ])
    .optional(),
  status: z.enum(["DRAFT", "GENERATED", "SCHEDULED", "FAILED"]).optional(),
  timeRange: z
    .enum([
      "TODAY",
      "YESTERDAY",
      "THIS_WEEK",
      "LAST_WEEK",
      "THIS_MONTH",
      "LAST_MONTH",
      "THIS_QUARTER",
      "LAST_QUARTER",
      "THIS_YEAR",
      "LAST_YEAR",
      "CUSTOM",
    ])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.enum([
    "LOAD_ANALYTICS",
    "CARRIER_PERFORMANCE",
    "CUSTOMER_ANALYTICS",
    "REVENUE_ANALYSIS",
    "OPERATIONAL_METRICS",
    "TEAM_PERFORMANCE",
    "FINANCIAL_SUMMARY",
    "CUSTOM",
  ]),
  format: z.enum(["PDF", "EXCEL", "CSV", "JSON"]),
  timeRange: z.enum([
    "TODAY",
    "YESTERDAY",
    "THIS_WEEK",
    "LAST_WEEK",
    "THIS_MONTH",
    "LAST_MONTH",
    "THIS_QUARTER",
    "LAST_QUARTER",
    "THIS_YEAR",
    "LAST_YEAR",
    "CUSTOM",
  ]),
  parameters: z.record(z.unknown()).optional(),
  template: z.record(z.unknown()).optional(),
  isPublic: z.boolean().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

const createScheduleSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  timezone: z.string().optional(),
  recipients: z
    .array(z.string().email())
    .min(1, "At least one recipient is required"),
});

const updateScheduleSchema = createScheduleSchema.partial();

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  // Report CRUD operations
  async createReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const organizationId = req.auth!.organizationId;
      const data = req.body as CreateReportRequest;

      const report = await this.reportService.createReport(
        data,
        userId,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const filters = req.query as unknown as ReportFilters;

      const result = await this.reportService.getReports(
        organizationId,
        filters
      );

      res.json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: filters.page || 1,
          limit: filters.limit || 50,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.auth!.organizationId;

      const report = await this.reportService.getReportById(id, organizationId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.auth!.organizationId;
      const data = req.body as UpdateReportRequest;

      const report = await this.reportService.updateReport(
        id,
        data,
        organizationId
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.auth!.organizationId;

      await this.reportService.deleteReport(id, organizationId);

      res.json({
        success: true,
        data: { message: "Report deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }

  // Report generation
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const organizationId = req.auth!.organizationId;
      const data = req.body as GenerateReportRequest;

      const result = await this.reportService.generateReport(
        data.reportId,
        organizationId,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Analytics endpoints
  async getReportAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;

      const analytics =
        await this.reportService.getReportAnalytics(organizationId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // Template operations
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.auth!.userId;
      const organizationId = req.auth!.organizationId;
      const data = req.body as CreateReportTemplateRequest;

      const template = await this.reportService.createTemplate(
        data,
        userId,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { type } = req.query;

      const templates = await this.reportService.getTemplates(
        organizationId,
        type as any
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.auth!.organizationId;
      const data = req.body as UpdateReportTemplateRequest;

      const template = await this.reportService.updateTemplate(
        id,
        data,
        organizationId
      );

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.auth!.organizationId;

      await this.reportService.deleteTemplate(id, organizationId);

      res.json({
        success: true,
        data: { message: "Template deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }

  // Schedule operations
  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const organizationId = req.auth!.organizationId;
      const data = req.body as CreateScheduleRequest;

      const schedule = await this.reportService.createSchedule(
        reportId,
        data,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const organizationId = req.auth!.organizationId;
      const data = req.body as UpdateScheduleRequest;

      const schedule = await this.reportService.updateSchedule(
        reportId,
        data,
        organizationId
      );

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;

      await this.reportService.deleteSchedule(reportId);

      res.json({
        success: true,
        data: { message: "Schedule deleted successfully" },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;

      const schedule = await this.reportService.getSchedule(reportId);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  // Analytics data endpoints (for charts and dashboards)
  async getLoadAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      // This would be a public method in the service
      const analytics = await this.reportService.generateLoadAnalytics(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const performance = await this.reportService.generateCarrierPerformance(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const analytics = await this.reportService.generateCustomerAnalytics(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const analysis = await this.reportService.generateRevenueAnalysis(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOperationalMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const metrics = await this.reportService.generateOperationalMetrics(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeamPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const performance = await this.reportService.generateTeamPerformance(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.auth!.organizationId;
      const { timeRange, startDate, endDate } = req.query;

      const summary = await this.reportService.generateFinancialSummary(
        organizationId,
        timeRange as any,
        startDate as string,
        endDate as string
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin operations
  async processScheduledReports(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth || req.auth.role !== "ADMINISTRATOR") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Administrator role required.",
        });
      }

      await this.reportService.processScheduledReports();

      res.json({
        success: true,
        data: { message: "Scheduled reports processed successfully" },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export validation middleware
export const validateCreateReport = validateRequest(createReportSchema);
export const validateUpdateReport = validateRequest(updateReportSchema);
export const validateGenerateReport = validateRequest(generateReportSchema);
export const validateReportFilters = validateRequest(reportFiltersSchema);
export const validateCreateTemplate = validateRequest(createTemplateSchema);
export const validateUpdateTemplate = validateRequest(updateTemplateSchema);
export const validateCreateSchedule = validateRequest(createScheduleSchema);
export const validateUpdateSchedule = validateRequest(updateScheduleSchema);
