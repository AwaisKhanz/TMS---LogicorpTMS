"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerAnalytics } from "@tms/shared-types";

interface CustomerAnalyticsChartProps {
  data: CustomerAnalytics;
}

export function CustomerAnalyticsChart({ data }: CustomerAnalyticsChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalCustomers}</div>
          <p className="text-xs text-muted-foreground">
            Active: {data.activeCustomers}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${data.averageRevenuePerCustomer.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Per customer</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.customerRetention.retentionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Customer retention</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topCustomers.slice(0, 10).map((customer, index) => (
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
                    ${customer.totalRevenue.toLocaleString()}
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
