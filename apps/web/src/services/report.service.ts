import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  Report,
  ReportFilters,
  CreateReportRequest,
  UpdateReportRequest,
  GenerateReportRequest,
  ReportDashboard,
  ReportTemplate,
  CreateReportTemplateRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  LoadAnalytics,
  CarrierPerformanceReport,
  CustomerAnalytics,
  RevenueAnalysis,
  OperationalMetrics,
  TeamPerformance,
  FinancialSummary,
} from "@tms/shared-types";

export const reportService = {
  // Report CRUD operations
  async getReports(
    filters?: ReportFilters
  ): Promise<
    ApiResponse<{ data: Report[]; pagination: Record<string, unknown> }>
  > {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiClient.get<
      ApiResponse<{ data: Report[]; pagination: Record<string, unknown> }>
    >(`/reports?${params.toString()}`);
    return response;
  },

  async getReportById(id: string): Promise<ApiResponse<Report>> {
    const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
    return response;
  },

  async createReport(data: CreateReportRequest): Promise<ApiResponse<Report>> {
    const response = await apiClient.post<ApiResponse<Report>>(
      "/reports",
      data
    );
    return response;
  },

  async updateReport(
    id: string,
    data: UpdateReportRequest
  ): Promise<ApiResponse<Report>> {
    const response = await apiClient.put<ApiResponse<Report>>(
      `/reports/${id}`,
      data
    );
    return response;
  },

  async deleteReport(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reports/${id}`
    );
    return response;
  },

  async generateReport(
    data: GenerateReportRequest
  ): Promise<
    ApiResponse<{ reportId: string; status: string; message: string }>
  > {
    const response = await apiClient.post<
      ApiResponse<{ reportId: string; status: string; message: string }>
    >("/reports/generate", data);
    return response;
  },

  // Dashboard and analytics
  async getDashboardStats(): Promise<ApiResponse<ReportDashboard>> {
    const response = await apiClient.get<ApiResponse<ReportDashboard>>(
      "/reports/dashboard-stats"
    );
    return response;
  },

  async getReportAnalytics(
    timeRange?: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    const params = timeRange ? `?timeRange=${timeRange}` : "";
    const response = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      `/reports/analytics${params}`
    );
    return response;
  },

  // Schedule management
  async createSchedule(
    data: CreateScheduleRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/reports/schedule",
      data
    );
    return response;
  },

  async updateSchedule(
    reportId: string,
    data: UpdateScheduleRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/reports/${reportId}/schedule`,
      data
    );
    return response;
  },

  async deleteSchedule(
    reportId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reports/${reportId}/schedule`
    );
    return response;
  },

  // Template management
  async getReportTemplates(
    isPublic?: boolean
  ): Promise<ApiResponse<ReportTemplate[]>> {
    const params = isPublic !== undefined ? `?isPublic=${isPublic}` : "";
    const response = await apiClient.get<ApiResponse<ReportTemplate[]>>(
      `/reports/templates${params}`
    );
    return response;
  },

  async getReportTemplate(id: string): Promise<ApiResponse<ReportTemplate>> {
    const response = await apiClient.get<ApiResponse<ReportTemplate>>(
      `/reports/templates/${id}`
    );
    return response;
  },

  async createReportTemplate(
    data: CreateReportTemplateRequest
  ): Promise<ApiResponse<ReportTemplate>> {
    const response = await apiClient.post<ApiResponse<ReportTemplate>>(
      "/reports/templates",
      data
    );
    return response;
  },

  async updateReportTemplate(
    id: string,
    data: Partial<CreateReportTemplateRequest>
  ): Promise<ApiResponse<ReportTemplate>> {
    const response = await apiClient.put<ApiResponse<ReportTemplate>>(
      `/reports/templates/${id}`,
      data
    );
    return response;
  },

  async deleteReportTemplate(
    id: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reports/templates/${id}`
    );
    return response;
  },

  // Bulk operations
  async bulkDelete(reportIds: string[]): Promise<
    ApiResponse<{
      successful: string[];
      failed: { id: string; error: string }[];
    }>
  > {
    const response = await apiClient.post<
      ApiResponse<{
        successful: string[];
        failed: { id: string; error: string }[];
      }>
    >("/reports/bulk-delete", { reportIds });
    return response;
  },

  // Export functionality
  async exportReports(
    filters?: ReportFilters,
    format: string = "csv"
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("format", format);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await apiClient.get<Blob>(
      `/reports/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response as Blob;
  },

  // Analytics endpoints
  async getLoadAnalytics(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<LoadAnalytics>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<LoadAnalytics>>(
      `/reports/analytics/loads?${params.toString()}`
    );
    return response;
  },

  async getCarrierPerformance(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<CarrierPerformanceReport>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<CarrierPerformanceReport>>(
      `/reports/analytics/carriers?${params.toString()}`
    );
    return response;
  },

  async getCustomerAnalytics(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<CustomerAnalytics>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<CustomerAnalytics>>(
      `/reports/analytics/customers?${params.toString()}`
    );
    return response;
  },

  async getRevenueAnalysis(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<RevenueAnalysis>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<RevenueAnalysis>>(
      `/reports/analytics/revenue?${params.toString()}`
    );
    return response;
  },

  async getOperationalMetrics(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<OperationalMetrics>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<OperationalMetrics>>(
      `/reports/analytics/operational?${params.toString()}`
    );
    return response;
  },

  async getTeamPerformance(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<TeamPerformance>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<TeamPerformance>>(
      `/reports/analytics/team?${params.toString()}`
    );
    return response;
  },

  async getFinancialSummary(
    timeRange?: string,
    customDateFrom?: string,
    customDateTo?: string
  ): Promise<ApiResponse<FinancialSummary>> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    if (customDateFrom) params.append("customDateFrom", customDateFrom);
    if (customDateTo) params.append("customDateTo", customDateTo);

    const response = await apiClient.get<ApiResponse<FinancialSummary>>(
      `/reports/analytics/financial?${params.toString()}`
    );
    return response;
  },

  // Admin endpoints
  async processScheduledReports(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/reports/process-scheduled"
    );
    return response;
  },
};
