import type { Address } from "./api.types";

// Report Enums
export enum ReportType {
  LOAD_ANALYTICS = "LOAD_ANALYTICS",
  CARRIER_PERFORMANCE = "CARRIER_PERFORMANCE",
  CUSTOMER_ANALYTICS = "CUSTOMER_ANALYTICS",
  REVENUE_ANALYSIS = "REVENUE_ANALYSIS",
  OPERATIONAL_METRICS = "OPERATIONAL_METRICS",
  TEAM_PERFORMANCE = "TEAM_PERFORMANCE",
  FINANCIAL_SUMMARY = "FINANCIAL_SUMMARY",
  CUSTOM = "CUSTOM",
}

export enum ReportStatus {
  DRAFT = "DRAFT",
  GENERATED = "GENERATED",
  SCHEDULED = "SCHEDULED",
  FAILED = "FAILED",
}

export enum ReportFormat {
  PDF = "PDF",
  EXCEL = "EXCEL",
  CSV = "CSV",
  JSON = "JSON",
}

export enum ChartType {
  LINE = "LINE",
  BAR = "BAR",
  PIE = "PIE",
  DOUGHNUT = "DOUGHNUT",
  AREA = "AREA",
  SCATTER = "SCATTER",
  TABLE = "TABLE",
}

export enum TimeRange {
  TODAY = "TODAY",
  YESTERDAY = "YESTERDAY",
  THIS_WEEK = "THIS_WEEK",
  LAST_WEEK = "LAST_WEEK",
  THIS_MONTH = "THIS_MONTH",
  LAST_MONTH = "LAST_MONTH",
  THIS_QUARTER = "THIS_QUARTER",
  LAST_QUARTER = "LAST_QUARTER",
  THIS_YEAR = "THIS_YEAR",
  LAST_YEAR = "LAST_YEAR",
  CUSTOM = "CUSTOM",
}

// Report Sub-Types
export interface ReportFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in"
    | "not_in";
  value: string | number | boolean | string[] | number[];
  label?: string;
}

export interface ReportChart {
  id: string;
  type: ChartType;
  title: string;
  description?: string;
  data: any;
  options?: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  charts: ReportChart[];
  order: number;
}

export interface ReportCreator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ReportSchedule {
  id: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:MM format
  timezone: string;
  recipients: string[]; // Email addresses
  isActive: boolean;
}

// Main Report Interface
export interface Report {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;

  // Configuration
  filters: ReportFilter[];
  sections: ReportSection[];
  timeRange: TimeRange;
  customDateFrom?: string;
  customDateTo?: string;

  // Data
  data?: any;
  generatedAt?: string;
  generatedBy?: string;
  fileUrl?: string;
  fileSize?: number;

  // Schedule
  schedule?: ReportSchedule;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator: ReportCreator;

  // Sharing
  isPublic: boolean;
  sharedWith: string[]; // User IDs
  tags: string[];
}

// Request Types
export interface CreateReportRequest {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  filters: ReportFilter[];
  sections: ReportSection[];
  timeRange: TimeRange;
  customDateFrom?: string;
  customDateTo?: string;
  isPublic?: boolean;
  sharedWith?: string[];
  tags?: string[];
  schedule?: Omit<ReportSchedule, "id">;
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  status?: ReportStatus;
}

export interface ReportFilters {
  type?: ReportType;
  status?: ReportStatus;
  format?: ReportFormat;
  createdBy?: string;
  timeRange?: TimeRange;
  customDateFrom?: string;
  customDateTo?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface GenerateReportRequest {
  reportId: string;
  format?: ReportFormat;
  filters?: ReportFilter[];
  timeRange?: TimeRange;
  customDateFrom?: string;
  customDateTo?: string;
}

// Response Types
export interface CreateReportResponse {
  success: boolean;
  data: Report;
}

export interface UpdateReportResponse {
  success: boolean;
  data: Report;
}

export interface GetReportResponse {
  success: boolean;
  data: Report;
}

export interface GetReportsResponse {
  success: boolean;
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeleteReportResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export interface GenerateReportResponse {
  success: boolean;
  data: {
    reportId: string;
    status: ReportStatus;
    fileUrl?: string;
    message: string;
  };
}

// Analytics Types
export interface LoadAnalytics {
  totalLoads: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  averageMargin: number;
  statusDistribution: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    loads: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    loadCount: number;
    revenue: number;
  }>;
  topCarriers: Array<{
    carrierId: string;
    carrierName: string;
    loadCount: number;
    revenue: number;
  }>;
  equipmentTypeDistribution: Record<string, number>;
  laneAnalysis: Array<{
    lane: string;
    loadCount: number;
    averageRate: number;
    totalRevenue: number;
  }>;
}

export interface CarrierPerformanceReport {
  totalCarriers: number;
  activeCarriers: number;
  averagePerformance: number;
  topPerformers: Array<{
    carrierId: string;
    carrierName: string;
    loadCount: number;
    onTimeDelivery: number;
    averageRating: number;
    totalRevenue: number;
  }>;
  performanceMetrics: {
    onTimeDelivery: number;
    averageRating: number;
    loadCompletionRate: number;
    customerSatisfaction: number;
  };
  carrierUtilization: Array<{
    carrierId: string;
    carrierName: string;
    utilizationRate: number;
    totalCapacity: number;
    usedCapacity: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  averageRevenuePerCustomer: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    loadCount: number;
    totalRevenue: number;
    averageMargin: number;
    lastLoadDate: string;
  }>;
  customerSegmentation: {
    highValue: number;
    mediumValue: number;
    lowValue: number;
  };
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    churnedCustomers: number;
    retentionRate: number;
  };
  creditUtilization: Array<{
    customerId: string;
    customerName: string;
    creditLimit: number;
    creditUsed: number;
    utilizationPercentage: number;
  }>;
}

export interface RevenueAnalysis {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercentage: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    cost: number;
    margin: number;
  }>;
  revenueByCustomer: Array<{
    customerId: string;
    customerName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByCarrier: Array<{
    carrierId: string;
    carrierName: string;
    cost: number;
    percentage: number;
  }>;
  profitMarginTrend: Array<{
    period: string;
    margin: number;
    marginPercentage: number;
  }>;
}

export interface OperationalMetrics {
  totalLoads: number;
  completedLoads: number;
  cancelledLoads: number;
  completionRate: number;
  averageTransitTime: number;
  onTimeDeliveryRate: number;
  loadVolumeByMonth: Array<{
    month: string;
    loads: number;
    completed: number;
    cancelled: number;
  }>;
  equipmentUtilization: Record<string, number>;
  laneEfficiency: Array<{
    lane: string;
    averageTransitTime: number;
    onTimeRate: number;
    loadCount: number;
  }>;
  seasonalTrends: Array<{
    period: string;
    loadCount: number;
    averageRate: number;
  }>;
}

export interface TeamPerformance {
  totalTeamMembers: number;
  activeMembers: number;
  averagePerformance: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    loadCount: number;
    revenue: number;
    customerSatisfaction: number;
  }>;
  performanceByRole: Array<{
    role: string;
    memberCount: number;
    averageLoads: number;
    averageRevenue: number;
  }>;
  workloadDistribution: Array<{
    userId: string;
    userName: string;
    assignedLoads: number;
    completedLoads: number;
    pendingLoads: number;
  }>;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPercentage: number;
  revenueGrowth: number;
  costGrowth: number;
  marginGrowth: number;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    cost: number;
    margin: number;
    growth: number;
  }>;
  profitabilityAnalysis: {
    highMarginLoads: number;
    mediumMarginLoads: number;
    lowMarginLoads: number;
    lossMakingLoads: number;
  };
  cashFlow: Array<{
    period: string;
    inflow: number;
    outflow: number;
    netFlow: number;
  }>;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }>;
}

export interface PieChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}

// Dashboard Types
export interface ReportDashboard {
  summary: {
    totalReports: number;
    scheduledReports: number;
    generatedToday: number;
    pendingGeneration: number;
  };
  recentReports: Report[];
  scheduledReports: Array<{
    report: Report;
    nextRun: string;
    status: "ACTIVE" | "PAUSED" | "FAILED";
  }>;
  quickStats: {
    loadAnalytics: {
      totalLoads: number;
      totalRevenue: number;
      averageMargin: number;
    };
    carrierPerformance: {
      totalCarriers: number;
      activeCarriers: number;
      averageRating: number;
    };
    customerAnalytics: {
      totalCustomers: number;
      activeCustomers: number;
      averageRevenue: number;
    };
  };
}

// Export Types
export interface ReportExportData {
  reportName: string;
  reportType: string;
  generatedAt: string;
  generatedBy: string;
  timeRange: string;
  summary: any;
  data: any;
  [key: string]: unknown;
}

// Template Types
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  sections: ReportSection[];
  defaultFilters: ReportFilter[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Schedule Types

// Request Types for Templates and Schedules
export interface CreateReportTemplateRequest {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  timeRange: TimeRange;
  parameters?: Record<string, unknown>;
  template?: Record<string, unknown>;
  isPublic?: boolean;
}

export interface UpdateReportTemplateRequest
  extends Partial<CreateReportTemplateRequest> {
  isActive?: boolean;
}

export interface CreateScheduleRequest {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone?: string;
  recipients: string[];
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> {
  isActive?: boolean;
}

// Validation Types
export interface ReportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
