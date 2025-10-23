import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service.js";

const dashboardService = new DashboardService();

export class DashboardController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const stats = await dashboardService.getDashboardStats(
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

  async getRevenueChartData(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const data = await dashboardService.getRevenueChartData(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoadStatusChartData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const data = await dashboardService.getLoadStatusChartData(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceChartData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const data = await dashboardService.getPerformanceChartData(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCarrierPerformanceChartData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.auth) {
        throw new Error("Authentication required");
      }

      const data = await dashboardService.getCarrierPerformanceChartData(
        req.auth.organizationId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
