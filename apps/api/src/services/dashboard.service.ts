import { LoadService } from "./load.service.js";
import { CarrierService } from "./carrier.service.js";
import { CustomerService } from "./customer.service.js";
import type { DashboardStats } from "../types/dashboard.types.js";
import type {
  RevenueChartData,
  LoadStatusChartData,
  PerformanceChartData,
  CarrierPerformanceChartData,
} from "@tms/shared-types";

export class DashboardService {
  private loadService: LoadService;
  private carrierService: CarrierService;
  private customerService: CustomerService;

  constructor() {
    this.loadService = new LoadService();
    this.carrierService = new CarrierService();
    this.customerService = new CustomerService();
  }

  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    // Fetch all statistics in parallel for better performance
    const [loadStats, carrierStats, customerStats] = await Promise.all([
      this.loadService.getDashboardStats(organizationId),
      this.carrierService.getCarrierStatistics(organizationId),
      this.customerService.getCustomerStatistics(organizationId),
    ]);

    return {
      loads: loadStats,
      carriers: {
        totalCarriers: carrierStats.total,
        activeCarriers: carrierStats.active,
        approvedCarriers: carrierStats.approved,
        pendingApproval: carrierStats.total - carrierStats.approved,
      },
      customers: {
        totalCustomers: customerStats.total,
        activeCustomers: customerStats.active,
        totalRevenue: customerStats.totalRevenue,
        creditUsed: 0, // This would need to be calculated separately
      },
    };
  }

  async getRevenueChartData(
    organizationId: string
  ): Promise<RevenueChartData[]> {
    return this.loadService.getRevenueChartData(organizationId);
  }

  async getLoadStatusChartData(
    organizationId: string
  ): Promise<LoadStatusChartData[]> {
    return this.loadService.getLoadStatusChartData(organizationId);
  }

  async getPerformanceChartData(
    organizationId: string
  ): Promise<PerformanceChartData[]> {
    return this.loadService.getPerformanceChartData(organizationId);
  }

  async getCarrierPerformanceChartData(
    organizationId: string
  ): Promise<CarrierPerformanceChartData[]> {
    // Get top performing carriers by load count from database
    const carrierPerformance =
      await this.loadService.getCarrierPerformanceChartData(organizationId);

    // Get carrier names
    const carrierIds = carrierPerformance
      .map((c: any) => c.carrierId)
      .filter((id: string | null): id is string => id !== null);
    const carriers = await this.carrierService
      .getCarrierRepository()
      .getCarrierNamesByIds(organizationId, carrierIds);

    const carrierMap = new Map(carriers.map((c) => [c.id, c.companyName]));

    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--info))",
      "hsl(var(--success))",
      "hsl(var(--warning))",
    ];

    return carrierPerformance.map((carrier: any, index: number) => ({
      name: carrierMap.get(carrier.carrierId) || "Unknown Carrier",
      value: carrier._count,
      color: colors[index] || "hsl(var(--muted))",
    }));
  }
}
