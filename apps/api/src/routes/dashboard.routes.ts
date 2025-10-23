import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

// Routes
router.get("/stats", dashboardController.getDashboardStats);
router.get("/charts/revenue", dashboardController.getRevenueChartData);
router.get("/charts/load-status", dashboardController.getLoadStatusChartData);
router.get("/charts/performance", dashboardController.getPerformanceChartData);
router.get(
  "/charts/carrier-performance",
  dashboardController.getCarrierPerformanceChartData
);

export default router;
