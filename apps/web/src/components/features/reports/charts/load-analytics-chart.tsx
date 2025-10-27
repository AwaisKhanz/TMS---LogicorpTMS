"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadAnalytics } from "@tms/shared-types";

interface LoadAnalyticsChartProps {
  data: LoadAnalytics;
}

export function LoadAnalyticsChart({ data }: LoadAnalyticsChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalLoads}</div>
          <p className="text-xs text-muted-foreground">
            Total revenue: ${data.totalRevenue.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Average margin: ${data.averageMargin.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.totalMargin.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Margin percentage:{" "}
            {((data.totalMargin / data.totalRevenue) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Load Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.statusDistribution).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="text-sm font-medium">{status}</span>
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topCustomers.slice(0, 5).map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{customer.customerName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {customer.loadCount} loads
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${customer.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Carriers */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topCarriers.slice(0, 5).map((carrier, index) => (
              <div
                key={carrier.carrierId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{carrier.carrierName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {carrier.loadCount} loads
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${carrier.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Type Distribution */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Equipment Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.equipmentTypeDistribution).map(
              ([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm font-medium">{type}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lane Analysis */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Lane Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.laneAnalysis.slice(0, 10).map((lane, index) => (
              <div
                key={lane.lane}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{lane.lane}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {lane.loadCount} loads
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: ${lane.averageRate.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
