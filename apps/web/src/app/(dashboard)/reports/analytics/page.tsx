"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { PageHeader } from "@/components/ui/page-header";
import { reportService } from "@/services/report.service";
import { TimeRange } from "@tms/shared-types";
import { LoadAnalyticsChart } from "@/components/features/reports/charts/load-analytics-chart";
import { RevenueChart } from "@/components/features/reports/charts/revenue-chart";
import { CarrierPerformanceChart } from "@/components/features/reports/charts/carrier-performance-chart";
import { CustomerAnalyticsChart } from "@/components/features/reports/charts/customer-analytics-chart";
import { OperationalMetricsChart } from "@/components/features/reports/charts/operational-metrics-chart";
import { TeamPerformanceChart } from "@/components/features/reports/charts/team-performance-chart";
import { FinancialSummaryChart } from "@/components/features/reports/charts/financial-summary-chart";

const timeRangeOptions = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "LAST_WEEK", label: "Last Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_MONTH", label: "Last Month" },
  { value: "THIS_QUARTER", label: "This Quarter" },
  { value: "LAST_QUARTER", label: "Last Quarter" },
  { value: "THIS_YEAR", label: "This Year" },
  { value: "LAST_YEAR", label: "Last Year" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.THIS_MONTH);

  // Fetch analytics data
  const { data: loadAnalytics, isLoading: loadLoading } = useQuery({
    queryKey: ["analytics", "loads", timeRange],
    queryFn: () => reportService.getLoadAnalytics(timeRange),
  });

  const { data: carrierPerformance, isLoading: carrierLoading } = useQuery({
    queryKey: ["analytics", "carriers", timeRange],
    queryFn: () => reportService.getCarrierPerformance(timeRange),
  });

  const { data: customerAnalytics, isLoading: customerLoading } = useQuery({
    queryKey: ["analytics", "customers", timeRange],
    queryFn: () => reportService.getCustomerAnalytics(timeRange),
  });

  const { data: revenueAnalysis, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics", "revenue", timeRange],
    queryFn: () => reportService.getRevenueAnalysis(timeRange),
  });

  const { data: operationalMetrics, isLoading: operationalLoading } = useQuery({
    queryKey: ["analytics", "operational", timeRange],
    queryFn: () => reportService.getOperationalMetrics(timeRange),
  });

  const { data: teamPerformance, isLoading: teamLoading } = useQuery({
    queryKey: ["analytics", "team", timeRange],
    queryFn: () => reportService.getTeamPerformance(timeRange),
  });

  const { data: financialSummary, isLoading: financialLoading } = useQuery({
    queryKey: ["analytics", "financial", timeRange],
    queryFn: () => reportService.getFinancialSummary(timeRange),
  });

  const isLoading =
    loadLoading ||
    carrierLoading ||
    customerLoading ||
    revenueLoading ||
    operationalLoading ||
    teamLoading ||
    financialLoading;

  return (
    <PermissionGuard permission={PERMISSIONS.REPORT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Analytics Dashboard"
          description="Comprehensive analytics and insights for your business"
        />

        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Time Range:</span>
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loads">Load Analytics</TabsTrigger>
            <TabsTrigger value="carriers">Carrier Performance</TabsTrigger>
            <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="operational">Operational Metrics</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="financial">Financial Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Load Analytics Summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Loads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadAnalytics?.data.totalLoads || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total revenue: $
                    {loadAnalytics?.data.totalRevenue.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Carriers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {carrierPerformance?.data.activeCarriers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total carriers:{" "}
                    {carrierPerformance?.data.totalCarriers || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customerAnalytics?.data.activeCustomers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total customers:{" "}
                    {customerAnalytics?.data.totalCustomers || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Margin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${financialSummary?.data.totalMargin.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Margin:{" "}
                    {financialSummary?.data.marginPercentage.toFixed(1) || 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueAnalysis?.data && (
                    <RevenueChart data={revenueAnalysis.data} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Load Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadAnalytics?.data && (
                    <LoadAnalyticsChart data={loadAnalytics.data} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loads" className="space-y-4">
            {loadAnalytics?.data && (
              <LoadAnalyticsChart data={loadAnalytics.data} />
            )}
          </TabsContent>

          <TabsContent value="carriers" className="space-y-4">
            {carrierPerformance?.data && (
              <CarrierPerformanceChart data={carrierPerformance.data} />
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            {customerAnalytics?.data && (
              <CustomerAnalyticsChart data={customerAnalytics.data} />
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            {revenueAnalysis?.data && (
              <RevenueChart data={revenueAnalysis.data} />
            )}
          </TabsContent>

          <TabsContent value="operational" className="space-y-4">
            {operationalMetrics?.data && (
              <OperationalMetricsChart data={operationalMetrics.data} />
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            {teamPerformance?.data && (
              <TeamPerformanceChart data={teamPerformance.data} />
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            {financialSummary?.data && (
              <FinancialSummaryChart data={financialSummary.data} />
            )}
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Loading analytics...
              </p>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
