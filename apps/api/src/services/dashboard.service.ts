import { LoadService } from "./load.service.js";
import { CarrierService } from "./carrier.service.js";
import { CustomerService } from "./customer.service.js";
import type { DashboardStats } from "../types/dashboard.types.js";

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
}
