"use client";

import React from "react";
import { Plus, FileText, BarChart3, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanCreate } from "@/components/auth/can";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";

interface ReportsHeaderProps {
  onCreateReport: () => void;
}

export function ReportsHeader({ onCreateReport }: ReportsHeaderProps) {
  const { data: dashboardStats } = useQuery({
    queryKey: ["reports", "dashboard-stats"],
    queryFn: () => reportService.getDashboardStats(),
  });

  const stats = dashboardStats?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and analyze your business performance
          </p>
        </div>
        <CanCreate resource="report">
          <Button onClick={onCreateReport}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </CanCreate>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary.totalReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time reports created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scheduled Reports
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary.scheduledReports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Generated Today
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary.generatedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports generated today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Generation
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary.pendingGeneration || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      {stats?.quickStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Load Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Loads
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.loadAnalytics.totalLoads}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Revenue
                  </span>
                  <span className="font-medium">
                    $
                    {stats.quickStats.loadAnalytics.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Margin
                  </span>
                  <span className="font-medium">
                    $
                    {stats.quickStats.loadAnalytics.averageMargin.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Carrier Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Carriers
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.carrierPerformance.totalCarriers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Carriers
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.carrierPerformance.activeCarriers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Rating
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.carrierPerformance.averageRating.toFixed(
                      1
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Customer Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Customers
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.customerAnalytics.totalCustomers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Customers
                  </span>
                  <span className="font-medium">
                    {stats.quickStats.customerAnalytics.activeCustomers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Revenue
                  </span>
                  <span className="font-medium">
                    $
                    {stats.quickStats.customerAnalytics.averageRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
