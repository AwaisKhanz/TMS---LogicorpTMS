"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useCustomerPerformance } from "@/hooks/use-customer";
import type { CustomerPerformance } from "@tms/shared-types";

interface CustomerPerformanceProps {
  customerId: string;
}

export function CustomerPerformance({ customerId }: CustomerPerformanceProps) {
  const {
    data: performanceData,
    isLoading,
    error,
  } = useCustomerPerformance(customerId);

  const performance = performanceData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCreditStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getCreditStatusBgColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "critical":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Failed to load performance data
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const loadTrendsData = performance.loadTrends.map((trend) => ({
    period: new Date(trend.period).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    loads: trend.loads,
    revenue: trend.revenue,
  }));

  const topLanesData = performance.topLanes.map((lane) => ({
    name:
      lane.lane.length > 20 ? lane.lane.substring(0, 20) + "..." : lane.lane,
    loads: lane.loads,
    revenue: lane.revenue,
  }));

  const paymentHistoryData = [
    {
      name: "On Time",
      value: performance.paymentHistory.onTime,
      color: "#10b981",
    },
    { name: "Late", value: performance.paymentHistory.late, color: "#f59e0b" },
    {
      name: "Outstanding",
      value: performance.paymentHistory.outstanding,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.totalLoads}</div>
            <p className="text-xs text-muted-foreground">
              {performance.recentLoads} recent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(performance.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(performance.averageLoadValue)} avg per load
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Margin
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {performance.averageMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Status</CardTitle>
            <div
              className={`h-4 w-4 rounded-full ${getCreditStatusBgColor(performance.creditUtilization.status)}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getCreditStatusColor(performance.creditUtilization.status)}`}
            >
              {performance.creditUtilization.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(performance.creditUtilization.used)} of{" "}
              {formatCurrency(performance.creditUtilization.limit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credit Used</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(performance.creditUtilization.used)} /{" "}
                {formatCurrency(performance.creditUtilization.limit)}
              </span>
            </div>
            <Progress
              value={performance.creditUtilization.percentage}
              className="h-2"
            />
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  performance.creditUtilization.status === "critical"
                    ? "destructive"
                    : performance.creditUtilization.status === "warning"
                      ? "default"
                      : "secondary"
                }
              >
                {performance.creditUtilization.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(
                  performance.creditUtilization.limit -
                    performance.creditUtilization.used
                )}{" "}
                available
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "revenue" ? formatCurrency(Number(value)) : value,
                    name === "revenue" ? "Revenue" : "Loads",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="revenue"
                />
                <Line
                  type="monotone"
                  dataKey="loads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="loads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">On Time</span>
                </div>
                <span className="font-medium">
                  {performance.paymentHistory.onTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm">Late</span>
                </div>
                <span className="font-medium">
                  {performance.paymentHistory.late}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Outstanding</span>
                </div>
                <span className="font-medium">
                  {performance.paymentHistory.outstanding}
                </span>
              </div>
            </div>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentHistoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentHistoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Lanes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Lanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topLanesData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue"
                        ? formatCurrency(Number(value))
                        : value,
                      name === "revenue" ? "Revenue" : "Loads",
                    ]}
                  />
                  <Bar dataKey="loads" fill="#3b82f6" name="loads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {performance.totalLoads > 0
                  ? (
                      (performance.paymentHistory.onTime /
                        performance.totalLoads) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground">
                On-Time Payment Rate
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {performance.averageLoadValue > 0
                  ? (
                      (performance.averageMargin /
                        performance.averageLoadValue) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground">
                Average Margin Rate
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {performance.totalLoads > 0
                  ? (performance.totalRevenue / performance.totalLoads).toFixed(
                      0
                    )
                  : 0}
              </div>
              <p className="text-sm text-muted-foreground">Revenue per Load</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
