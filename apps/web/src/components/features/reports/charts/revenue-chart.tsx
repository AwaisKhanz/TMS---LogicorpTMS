"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueAnalysis } from "@tms/shared-types";

interface RevenueChartProps {
  data: RevenueAnalysis;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const revenueData = data.revenueByMonth;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {data.marginPercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total margin: ${data.totalMargin.toLocaleString()}
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
              Margin percentage: {data.marginPercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Month */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenueData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="text-sm font-medium">{item.month}</span>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ${item.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cost: ${item.cost.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin: ${item.margin.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Customer */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.revenueByCustomer.slice(0, 10).map((customer, index) => (
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
                    ${customer.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Carrier */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Carrier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.revenueByCarrier.slice(0, 10).map((carrier, index) => (
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
                    ${carrier.cost.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {carrier.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profit Margin Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.profitMarginTrend.map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm font-medium">{trend.period}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${trend.margin.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.marginPercentage.toFixed(1)}%
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
