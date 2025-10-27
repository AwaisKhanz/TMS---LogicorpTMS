import { Router } from "express";
import {
  ReportController,
  validateCreateReport,
  validateUpdateReport,
  validateGenerateReport,
  validateReportFilters,
  validateCreateTemplate,
  validateUpdateTemplate,
  validateCreateSchedule,
  validateUpdateSchedule,
} from "../controllers/report.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { rateLimiter } from "../middleware/rate-limit.middleware.js";

const router: Router = Router();
const reportController = new ReportController();

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(rateLimiter);

// Report CRUD operations
router.post(
  "/",
  validateCreateReport,
  reportController.createReport.bind(reportController)
);
router.get(
  "/",
  validateReportFilters,
  reportController.getReports.bind(reportController)
);
router.get(
  "/analytics",
  reportController.getReportAnalytics.bind(reportController)
);
router.get("/:id", reportController.getReportById.bind(reportController));
router.put(
  "/:id",
  validateUpdateReport,
  reportController.updateReport.bind(reportController)
);
router.delete("/:id", reportController.deleteReport.bind(reportController));

// Report generation
router.post(
  "/generate",
  validateGenerateReport,
  reportController.generateReport.bind(reportController)
);

// Analytics data endpoints (for charts and dashboards)
router.get(
  "/analytics/loads",
  reportController.getLoadAnalytics.bind(reportController)
);
router.get(
  "/analytics/carriers",
  reportController.getCarrierPerformance.bind(reportController)
);
router.get(
  "/analytics/customers",
  reportController.getCustomerAnalytics.bind(reportController)
);
router.get(
  "/analytics/revenue",
  reportController.getRevenueAnalysis.bind(reportController)
);
router.get(
  "/analytics/operational",
  reportController.getOperationalMetrics.bind(reportController)
);
router.get(
  "/analytics/team",
  reportController.getTeamPerformance.bind(reportController)
);
router.get(
  "/analytics/financial",
  reportController.getFinancialSummary.bind(reportController)
);

// Template operations
router.post(
  "/templates",
  validateCreateTemplate,
  reportController.createTemplate.bind(reportController)
);
router.get("/templates", reportController.getTemplates.bind(reportController));
router.put(
  "/templates/:id",
  validateUpdateTemplate,
  reportController.updateTemplate.bind(reportController)
);
router.delete(
  "/templates/:id",
  reportController.deleteTemplate.bind(reportController)
);

// Schedule operations
router.post(
  "/:reportId/schedule",
  validateCreateSchedule,
  reportController.createSchedule.bind(reportController)
);
router.put(
  "/:reportId/schedule",
  validateUpdateSchedule,
  reportController.updateSchedule.bind(reportController)
);
router.delete(
  "/:reportId/schedule",
  reportController.deleteSchedule.bind(reportController)
);
router.get(
  "/:reportId/schedule",
  reportController.getSchedule.bind(reportController)
);

// Admin operations
router.post(
  "/admin/process-scheduled",
  reportController.processScheduledReports.bind(reportController)
);

export default router;
