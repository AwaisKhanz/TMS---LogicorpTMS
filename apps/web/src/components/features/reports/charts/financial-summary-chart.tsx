"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialSummary } from "@tms/shared-types";

interface FinancialSummaryChartProps {
  data: FinancialSummary;
}

export function FinancialSummaryChart({ data }: FinancialSummaryChartProps) {
  return (
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
            Growth: {data.revenueGrowth.toFixed(1)}%
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
            Growth: {data.costGrowth.toFixed(1)}%
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
            Growth: {data.marginGrowth.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Margin %</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.marginPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Profit margin</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.monthlyTrends.map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${trend.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin: ${trend.margin.toLocaleString()} (
                    {trend.growth.toFixed(1)}%)
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
