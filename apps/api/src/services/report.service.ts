import { Prisma } from "@prisma/client";
import {
  ReportType,
  ReportStatus,
  ReportFormat,
  TimeRange,
  CreateReportRequest,
  UpdateReportRequest,
  ReportFilters,
  LoadAnalytics,
  CarrierPerformanceReport,
  CustomerAnalytics,
  RevenueAnalysis,
  OperationalMetrics,
  TeamPerformance,
  FinancialSummary,
  ReportDashboard,
  ReportExportData,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from "@tms/shared-types";
import {
  ReportRepository,
  ReportWithMinimalRelations,
  ReportWithRelations,
} from "../repositories/report.repository.js";
import { NotFoundError } from "../utils/errors.util.js";
import { NotificationService } from "./notification.service.js";
import { DocumentGenerationService } from "./document-generation.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { LoadRepository } from "../repositories/load.repository.js";
import { CarrierRepository } from "../repositories/carrier.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";

export class ReportService {
  private reportRepo: ReportRepository;
  private notificationService: NotificationService;
  private documentGenService: DocumentGenerationService;
  private userRepo: UserRepository;
  private loadRepo: LoadRepository;
  private carrierRepo: CarrierRepository;
  private customerRepo: CustomerRepository;

  constructor() {
    this.reportRepo = new ReportRepository();
    this.notificationService = new NotificationService();
    this.documentGenService = new DocumentGenerationService();
    this.userRepo = new UserRepository();
    this.loadRepo = new LoadRepository();
    this.carrierRepo = new CarrierRepository();
    this.customerRepo = new CustomerRepository();
  }

  async createReport(
    data: CreateReportRequest,
    userId: string,
    organizationId: string
  ): Promise<ReportWithMinimalRelations> {
    const reportData: Prisma.ReportUncheckedCreateInput = {
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      timeRange: data.timeRange,
      customDateFrom: data.customDateFrom
        ? new Date(data.customDateFrom)
        : null,
      customDateTo: data.customDateTo ? new Date(data.customDateTo) : null,
      userId,
      organizationId,
      status: ReportStatus.DRAFT,
      parameters: {} as Prisma.InputJsonValue,
      isPublic: data.isPublic || false,
      sharedWith: data.sharedWith || [],
      tags: data.tags || [],
      // Set initial nextGenerationAt if scheduled
      nextGenerationAt: data.schedule
        ? this.calculateNextGenerationTime(data.schedule.frequency)
        : null,
    };

    const report = await this.reportRepo.createReport(reportData);

    // Notify user about report creation
    await this.notificationService.create({
      recipientId: userId,
      type: "SYSTEM_ALERT",
      title: "Report Created",
      message: `Your report "${report.name}" has been created.`,
      entityType: "REPORT",
      entityId: report.id,
      organizationId,
    });

    // If not scheduled, generate immediately
    if (!data.schedule) {
      this.generateReport(report.id, organizationId, userId).catch(
        console.error
      );
    }

    return report;
  }

  async getReports(
    organizationId: string,
    filters: ReportFilters
  ): Promise<{ data: ReportWithMinimalRelations[]; total: number }> {
    const { page = 1, limit = 50 } = filters;
    return this.reportRepo.findWithFilters(
      filters,
      organizationId,
      page,
      limit
    );
  }

  async getReportById(
    id: string,
    organizationId: string
  ): Promise<ReportWithRelations> {
    const report = await this.reportRepo.findByIdWithRelations(
      id,
      organizationId
    );
    if (!report) {
      throw new NotFoundError("Report");
    }
    return report;
  }

  async updateReport(
    id: string,
    data: UpdateReportRequest,
    organizationId: string
  ): Promise<ReportWithMinimalRelations> {
    const existingReport = await this.reportRepo.findByIdWithRelations(
      id,
      organizationId
    );
    if (!existingReport) {
      throw new NotFoundError("Report");
    }

    const updateData: Prisma.ReportUpdateInput = {
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      timeRange: data.timeRange,
      customDateFrom: data.customDateFrom
        ? new Date(data.customDateFrom)
        : undefined,
      customDateTo: data.customDateTo ? new Date(data.customDateTo) : undefined,
      status: data.status,
      isPublic: data.isPublic,
      sharedWith: data.sharedWith,
      tags: data.tags,
    };

    // Recalculate nextGenerationAt if schedule changes
    if (data.schedule !== undefined) {
      updateData.nextGenerationAt = data.schedule
        ? this.calculateNextGenerationTime(data.schedule.frequency)
        : null;
    }

    const updatedReport = await this.reportRepo.updateReport(id, updateData);

    // Notify user about report update
    await this.notificationService.create({
      recipientId: updatedReport.userId,
      type: "SYSTEM_ALERT",
      title: "Report Updated",
      message: `Your report "${updatedReport.name}" has been updated.`,
      entityType: "REPORT",
      entityId: updatedReport.id,
      organizationId,
    });

    return updatedReport;
  }

  async deleteReport(id: string, organizationId: string): Promise<void> {
    const existingReport = await this.reportRepo.findByIdWithRelations(
      id,
      organizationId
    );
    if (!existingReport) {
      throw new NotFoundError("Report");
    }

    await this.reportRepo.deleteReport(id);

    // Notify user about report deletion
    await this.notificationService.create({
      recipientId: existingReport.userId,
      type: "SYSTEM_ALERT",
      title: "Report Deleted",
      message: `Your report "${existingReport.name}" has been deleted.`,
      entityType: "REPORT",
      entityId: existingReport.id,
      organizationId,
    });
  }

  async generateReport(
    reportId: string,
    organizationId: string,
    userId: string
  ): Promise<{ fileUrl?: string; message: string }> {
    const report = await this.reportRepo.findByIdWithRelations(
      reportId,
      organizationId,
      userId
    );
    if (!report) {
      throw new NotFoundError("Report");
    }

    if (report.status === ReportStatus.GENERATED) {
      return { message: "Report is already being generated." };
    }

    await this.reportRepo.updateReportStatus(
      reportId,
      ReportStatus.GENERATED,
      new Date()
    );

    try {
      let fileUrl: string | undefined;
      let reportData:
        | LoadAnalytics
        | CarrierPerformanceReport
        | CustomerAnalytics
        | RevenueAnalysis
        | OperationalMetrics
        | TeamPerformance
        | FinancialSummary
        | ReportDashboard
        | ReportExportData;

      switch (report.type) {
        case ReportType.LOAD_ANALYTICS:
          reportData = await this.generateLoadAnalytics(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.REVENUE_ANALYSIS:
          reportData = await this.generateRevenueAnalysis(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.CARRIER_PERFORMANCE:
          reportData = await this.generateCarrierPerformance(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.CUSTOMER_ANALYTICS:
          reportData = await this.generateCustomerAnalytics(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.OPERATIONAL_METRICS:
          reportData = await this.generateOperationalMetrics(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.TEAM_PERFORMANCE:
          reportData = await this.generateTeamPerformance(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        case ReportType.FINANCIAL_SUMMARY:
          reportData = await this.generateFinancialSummary(
            organizationId,
            report.timeRange,
            report.customDateFrom || undefined,
            report.customDateTo || undefined
          );
          break;
        default:
          throw new Error(`Unknown report type: ${report.type}`);
      }

      // Generate document based on format
      switch (report.format) {
        case ReportFormat.PDF:
          fileUrl = await this.documentGenService.generateReportPdf(
            report.id,
            report.name,
            reportData,
            organizationId,
            userId
          );
          break;
        case ReportFormat.EXCEL:
          fileUrl = await this.documentGenService.generateReportExcel(
            report.id,
            report.name,
            reportData,
            organizationId,
            userId
          );
          break;
        case ReportFormat.CSV:
          fileUrl = await this.documentGenService.generateReportCsv(
            report.id,
            report.name,
            reportData,
            organizationId,
            userId
          );
          break;
        case ReportFormat.JSON:
          // For JSON, we might just return the data directly or save it as a JSON file
          fileUrl = await this.documentGenService.generateReportJson(
            report.id,
            report.name,
            reportData,
            organizationId,
            userId
          );
          break;
        default:
          throw new Error(`Unsupported report format: ${report.format}`);
      }

      await this.reportRepo.updateReportGeneration(reportId, {
        status: ReportStatus.GENERATED,
        fileUrl,
        _generatedAt: new Date(),
        lastGeneratedAt: new Date(),
        nextGenerationAt: report.schedule
          ? this.calculateNextGenerationTime(report.schedule.frequency)
          : undefined,
      });

      await this.notificationService.create({
        recipientId: userId,
        type: "REPORT_GENERATED",
        title: "Report Generated",
        message: `Your report "${report.name}" has been generated.`,
        entityType: "REPORT",
        entityId: report.id,
        organizationId,
        // fileUrl, // TODO: Add fileUrl to notification schema
      });

      return { fileUrl, message: "Report generated successfully." };
    } catch (error) {
      console.error(`Error generating report ${reportId}:`, error);
      await this.reportRepo.updateReportStatus(reportId, ReportStatus.FAILED);
      await this.notificationService.create({
        recipientId: userId,
        type: "REPORT_FAILED",
        title: "Report Generation Failed",
        message: `Failed to generate report "${report.name}".`,
        entityType: "REPORT",
        entityId: report.id,
        organizationId,
      });
      throw error;
    }
  }

  private resolveDateRange(
    timeRange: TimeRange,
    startDate?: Date | string,
    endDate?: Date | string
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (timeRange) {
      case TimeRange.TODAY:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      case TimeRange.THIS_WEEK:
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Sunday
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6); // Saturday
        end.setHours(23, 59, 59, 999);
        break;
      case TimeRange.THIS_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case TimeRange.THIS_YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case TimeRange.CUSTOM:
        if (!startDate || !endDate) {
          throw new Error("Custom time range requires start and end dates.");
        }
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure end of day
        break;
      default:
        throw new Error(`Invalid time range: ${timeRange}`);
    }

    return { startDate: start, endDate: end };
  }

  private calculateNextGenerationTime(frequency: string): Date {
    const now = new Date();
    let nextDate = new Date(now);

    switch (frequency) {
      case "DAILY":
        nextDate.setDate(now.getDate() + 1);
        break;
      case "WEEKLY":
        nextDate.setDate(now.getDate() + 7);
        break;
      case "MONTHLY":
        nextDate.setMonth(now.getMonth() + 1);
        break;
      case "QUARTERLY":
        nextDate.setMonth(now.getMonth() + 3);
        break;
      case "YEARLY":
        nextDate.setFullYear(now.getFullYear() + 1);
        break;
      default:
        throw new Error(`Invalid frequency: ${frequency}`);
    }
    // Set to a specific time, e.g., 2 AM UTC
    nextDate.setUTCHours(2, 0, 0, 0);
    return nextDate;
  }

  // Analytics data generation methods
  async generateLoadAnalytics(
    organizationId: string,
    timeRange: TimeRange,
    customDateFrom?: Date | string,
    customDateTo?: Date | string
  ): Promise<LoadAnalytics> {
    const dateRange = this.getDateRange(
      timeRange,
      customDateFrom,
      customDateTo
    );

    const [totalLoads, loadsByStatus, topCustomers, topCarriers] =
      await Promise.all([
        this.loadRepo.count(
          {
            createdAt: { gte: dateRange.start, lte: dateRange.end },
          },
          organizationId
        ),
        this.loadRepo.groupByStatus(
          organizationId,
          dateRange.start,
          dateRange.end
        ),
        this.getTopCustomers(organizationId, dateRange),
        this.getTopCarriers(organizationId, dateRange),
      ]);

    return {
      totalLoads,
      totalRevenue: 0,
      totalCost: 0,
      totalMargin: 0,
      averageMargin: 0,
      statusDistribution: loadsByStatus,
      revenueByMonth: [],
      topCustomers,
      topCarriers,
      equipmentTypeDistribution: {},
      laneAnalysis: [],
    };
  }

  async generateCarrierPerformance(
    organizationId: string,
    _timeRange: TimeRange,
    _customDateFrom?: Date | string,
    _customDateTo?: Date | string
  ): Promise<CarrierPerformanceReport> {
    const [totalCarriers, activeCarriers] = await Promise.all([
      this.carrierRepo.count({}, organizationId),
      this.carrierRepo.count(
        {
          isActive: true,
        },
        organizationId
      ),
    ]);

    return {
      totalCarriers,
      activeCarriers,
      averagePerformance: 0,
      topPerformers: [],
      performanceMetrics: {
        onTimeDelivery: 0,
        averageRating: 0,
        loadCompletionRate: 0,
        customerSatisfaction: 0,
      },
      carrierUtilization: [],
    };
  }

  async generateCustomerAnalytics(
    organizationId: string,
    _timeRange: TimeRange,
    _customDateFrom?: Date | string,
    _customDateTo?: Date | string
  ): Promise<CustomerAnalytics> {
    const [totalCustomers, activeCustomers] = await Promise.all([
      this.customerRepo.count({}, organizationId),
      this.customerRepo.count(
        {
          isActive: true,
        },
        organizationId
      ),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      customerRetention: {
        newCustomers: 0,
        returningCustomers: 0,
        churnedCustomers: 0,
        retentionRate: 0,
      },
      averageRevenuePerCustomer: 0,
      topCustomers: [],
      customerSegmentation: {
        highValue: 0,
        mediumValue: 0,
        lowValue: 0,
      },
      creditUtilization: [],
    };
  }

  async generateRevenueAnalysis(
    organizationId: string,
    timeRange: TimeRange,
    customDateFrom?: Date | string,
    customDateTo?: Date | string
  ): Promise<RevenueAnalysis> {
    const dateRange = this.getDateRange(
      timeRange,
      customDateFrom,
      customDateTo
    );

    const revenueData = await this.loadRepo.aggregate(organizationId, {
      deliveredAt: { gte: dateRange.start, lte: dateRange.end },
    });

    const revenueByMonth = await this.getRevenueByMonth(
      organizationId,
      dateRange
    );

    return {
      totalRevenue: Number(revenueData._sum.customerRate || 0),
      totalCost: Number(revenueData._sum.carrierRate || 0),
      totalMargin: Number(revenueData._sum.margin || 0),
      marginPercentage: 0,
      revenueByMonth,
      revenueByCustomer: [],
      revenueByCarrier: [],
      profitMarginTrend: [],
    };
  }

  async generateOperationalMetrics(
    organizationId: string,
    timeRange: TimeRange,
    customDateFrom?: Date | string,
    customDateTo?: Date | string
  ): Promise<OperationalMetrics> {
    const dateRange = this.getDateRange(
      timeRange,
      customDateFrom,
      customDateTo
    );

    const [loadsCompleted, loadsCancelled] = await Promise.all([
      this.loadRepo.count(
        {
          status: "COMPLETED",
          deliveredAt: { gte: dateRange.start, lte: dateRange.end },
        },
        organizationId
      ),
      this.loadRepo.count(
        {
          status: "CANCELLED",
          updatedAt: { gte: dateRange.start, lte: dateRange.end },
        },
        organizationId
      ),
    ]);

    return {
      totalLoads: loadsCompleted + loadsCancelled,
      completedLoads: loadsCompleted,
      cancelledLoads: loadsCancelled,
      completionRate: 0,
      averageTransitTime: 0,
      onTimeDeliveryRate: 0,
      loadVolumeByMonth: [],
      equipmentUtilization: {},
      laneEfficiency: [],
      seasonalTrends: [],
    };
  }

  async generateTeamPerformance(
    organizationId: string,
    _timeRange: TimeRange,
    _customDateFrom?: Date | string,
    _customDateTo?: Date | string
  ): Promise<TeamPerformance> {
    const users = await this.userRepo.findWithFilters(organizationId, {
      page: 1,
      limit: 1000,
    });

    const totalTeamMembers = users.total;
    const activeMembers = users.data.filter((u) => u.isActive).length;

    return {
      totalTeamMembers,
      activeMembers,
      averagePerformance: 0,
      topPerformers: [],
      performanceByRole: [],
      workloadDistribution: [],
    };
  }

  async generateFinancialSummary(
    organizationId: string,
    timeRange: TimeRange,
    customDateFrom?: Date | string,
    customDateTo?: Date | string
  ): Promise<FinancialSummary> {
    const dateRange = this.getDateRange(
      timeRange,
      customDateFrom,
      customDateTo
    );

    const revenueData = await this.loadRepo.aggregate(organizationId, {
      deliveredAt: { gte: dateRange.start, lte: dateRange.end },
    });

    const totalExpenses = revenueData._sum.carrierRate || 0;
    const netProfit = revenueData._sum.margin || 0;
    const profitMargin = revenueData._sum.customerRate
      ? (Number(netProfit) / Number(revenueData._sum.customerRate)) * 100
      : 0;

    return {
      totalRevenue: Number(revenueData._sum.customerRate || 0),
      totalCost: Number(totalExpenses),
      totalMargin: Number(netProfit),
      marginPercentage: profitMargin,
      revenueGrowth: 0,
      costGrowth: 0,
      marginGrowth: 0,
      monthlyTrends: [],
      profitabilityAnalysis: {
        highMarginLoads: 0,
        mediumMarginLoads: 0,
        lowMarginLoads: 0,
        lossMakingLoads: 0,
      },
      cashFlow: [],
    };
  }

  private getDateRange(
    timeRange: TimeRange,
    customDateFrom?: Date | string,
    customDateTo?: Date | string
  ): { start: Date; end: Date } {
    const dateRange = this.resolveDateRange(
      timeRange,
      customDateFrom,
      customDateTo
    );
    return { start: dateRange.startDate, end: dateRange.endDate };
  }

  // Helper methods
  private async getTopCustomers(
    _organizationId: string,
    _dateRange: { start: Date; end: Date }
  ) {
    // Implementation for getting top customers
    return [];
  }

  private async getTopCarriers(
    _organizationId: string,
    _dateRange: { start: Date; end: Date }
  ) {
    // Implementation for getting top carriers
    return [];
  }

  private async getRevenueByMonth(
    _organizationId: string,
    _dateRange: { start: Date; end: Date }
  ) {
    // Implementation for getting revenue by month
    return [];
  }

  // Scheduled report processing
  async processScheduledReports() {
    const reports = await this.reportRepo.getReportsDueForGeneration();

    for (const report of reports) {
      try {
        // Generate the report
        await this.generateReport(
          report.id,
          report.organizationId,
          report.userId
        );
      } catch (error) {
        console.error(
          `Failed to process scheduled report ${report.id}:`,
          error
        );
        await this.reportRepo.updateReportStatus(
          report.id,
          ReportStatus.FAILED
        );
        await this.notificationService.create({
          recipientId: report.userId,
          type: "REPORT_FAILED",
          title: "Scheduled Report Failed",
          message: `Your scheduled report "${report.name}" failed to generate.`,
          entityType: "REPORT",
          entityId: report.id,
          organizationId: report.organizationId,
        });
      }
    }
  }

  // Template methods
  async createTemplate(
    data: CreateReportTemplateRequest,
    userId: string,
    organizationId: string
  ) {
    const templateData: Prisma.ReportTemplateUncheckedCreateInput = {
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      timeRange: data.timeRange,
      parameters: (data.parameters || {}) as Prisma.InputJsonValue,
      template: (data.template || {}) as Prisma.InputJsonValue,
      isPublic: data.isPublic || false,
      userId,
      organizationId,
    };

    return this.reportRepo.createTemplate(templateData);
  }

  async getTemplates(organizationId: string, type?: ReportType) {
    return this.reportRepo.getTemplates(organizationId, type);
  }

  async updateTemplate(
    id: string,
    data: UpdateReportTemplateRequest,
    _organizationId: string
  ) {
    const updateData: Prisma.ReportTemplateUpdateInput = {
      name: data.name,
      description: data.description,
      type: data.type,
      format: data.format,
      timeRange: data.timeRange,
      parameters: data.parameters
        ? (data.parameters as Prisma.InputJsonValue)
        : undefined,
      template: data.template
        ? (data.template as Prisma.InputJsonValue)
        : undefined,
      isPublic: data.isPublic,
    };

    return this.reportRepo.updateTemplate(id, updateData);
  }

  async deleteTemplate(id: string, organizationId: string) {
    return this.reportRepo.deleteTemplate(id, organizationId);
  }

  // Schedule methods
  async createSchedule(
    reportId: string,
    data: CreateScheduleRequest,
    organizationId: string
  ) {
    const scheduleData: Omit<
      Prisma.ReportScheduleUncheckedCreateInput,
      "reportId" | "organizationId"
    > = {
      frequency: data.frequency,
      time: data.time,
      timezone: data.timezone || "UTC",
      recipients: data.recipients,
      isActive: true,
    };

    return this.reportRepo.createSchedule(
      reportId,
      organizationId,
      scheduleData
    );
  }

  async updateSchedule(
    reportId: string,
    data: UpdateScheduleRequest,
    _organizationId: string
  ) {
    const scheduleData: Prisma.ReportScheduleUpdateInput = {
      ...data,
    };

    return this.reportRepo.updateSchedule(reportId, scheduleData);
  }

  async deleteSchedule(reportId: string) {
    return this.reportRepo.deleteSchedule(reportId);
  }

  async getSchedule(reportId: string) {
    return this.reportRepo.getSchedule(reportId);
  }

  // Analytics methods
  async getReportAnalytics(organizationId: string) {
    return this.reportRepo.getAnalytics(organizationId);
  }

  // Validation methods
  validateReportData(data: Partial<CreateReportRequest>): string[] {
    const errors: string[] = [];

    if (data.type && !Object.values(ReportType).includes(data.type)) {
      errors.push("Invalid report type");
    }

    if (data.format && !Object.values(ReportFormat).includes(data.format)) {
      errors.push("Invalid report format");
    }

    if (data.timeRange && !Object.values(TimeRange).includes(data.timeRange)) {
      errors.push("Invalid time range");
    }

    if (data.schedule && !data.schedule.frequency) {
      errors.push("Frequency is required for scheduled reports");
    }

    return errors;
  }

  // Helper method for getting user
  async getUser(userId: string, organizationId: string) {
    return this.userRepo.findById(userId, organizationId);
  }
}
