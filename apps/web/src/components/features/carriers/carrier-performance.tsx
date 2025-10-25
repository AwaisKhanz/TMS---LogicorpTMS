"use client";

import { useCarrierPerformance } from "@/hooks/use-carriers";
import type { CarrierPerformance as CarrierPerformanceType } from "@tms/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Loader2 } from "lucide-react";

interface CarrierPerformanceProps {
  carrierId: string;
}

export function CarrierPerformance({ carrierId }: CarrierPerformanceProps) {
  const { data: performance, isLoading } = useCarrierPerformance(carrierId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return null;
  }

  // Type assertion for the performance data
  const performanceData = performance as CarrierPerformanceType;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loads */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              Total Loads
            </div>
            <p className="text-2xl font-bold">{performanceData.totalLoads}</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Active</div>
            <p className="text-2xl font-bold text-info">
              {performanceData.activeLoads}
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Completed</div>
            <p className="text-2xl font-bold text-success">
              {performanceData.completedLoads}
            </p>
          </div>
        </div>

        {/* Revenue & Margin */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </div>
            <span className="text-lg font-bold">
              {formatCurrency(performanceData.totalRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Average Margin per Load
            </span>
            <span className="text-lg font-bold text-success">
              {formatCurrency(performanceData.averageMargin)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
