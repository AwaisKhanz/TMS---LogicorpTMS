// Import LoadDashboardStats from load.types
import type { LoadDashboardStats } from "./load.types";

// Re-export as LoadStats for convenience
export type LoadStats = LoadDashboardStats;

export interface CarrierStats {
  totalCarriers: number;
  activeCarriers: number;
  approvedCarriers: number;
  pendingApproval: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  creditUsed: number;
}

export interface DashboardStats {
  loads: LoadStats;
  carriers: CarrierStats;
  customers: CustomerStats;
}

// API Response Types
export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}
