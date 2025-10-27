"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationalMetrics } from "@tms/shared-types";

interface OperationalMetricsChartProps {
  data: OperationalMetrics;
}

export function OperationalMetricsChart({
  data,
}: OperationalMetricsChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalLoads}</div>
          <p className="text-xs text-muted-foreground">
            Completed: {data.completedLoads}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.completionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Success rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            On-Time Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.onTimeDeliveryRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">On-time rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Avg Transit Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.averageTransitTime.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">Days</p>
        </CardContent>
      </Card>
    </div>
  );
}
