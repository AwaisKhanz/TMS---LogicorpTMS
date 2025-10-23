"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type {
  RevenueChartData,
  LoadStatusChartData,
  PerformanceChartData,
  CarrierPerformanceChartData,
} from "@tms/shared-types";

interface UseDashboardChartsReturn {
  revenueData: RevenueChartData[] | null;
  loadStatusData: LoadStatusChartData[] | null;
  performanceData: PerformanceChartData[] | null;
  carrierData: CarrierPerformanceChartData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardCharts(): UseDashboardChartsReturn {
  const [revenueData, setRevenueData] = useState<RevenueChartData[] | null>(
    null
  );
  const [loadStatusData, setLoadStatusData] = useState<
    LoadStatusChartData[] | null
  >(null);
  const [performanceData, setPerformanceData] = useState<
    PerformanceChartData[] | null
  >(null);
  const [carrierData, setCarrierData] = useState<
    CarrierPerformanceChartData[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all chart data in parallel
      const [
        revenueResponse,
        loadStatusResponse,
        performanceResponse,
        carrierResponse,
      ] = await Promise.all([
        apiClient.get<{ success: boolean; data: RevenueChartData[] }>(
          "/dashboard/charts/revenue"
        ),
        apiClient.get<{ success: boolean; data: LoadStatusChartData[] }>(
          "/dashboard/charts/load-status"
        ),
        apiClient.get<{ success: boolean; data: PerformanceChartData[] }>(
          "/dashboard/charts/performance"
        ),
        apiClient.get<{
          success: boolean;
          data: CarrierPerformanceChartData[];
        }>("/dashboard/charts/carrier-performance"),
      ]);

      if (revenueResponse.success && revenueResponse.data) {
        setRevenueData(revenueResponse.data);
      }
      if (loadStatusResponse.success && loadStatusResponse.data) {
        setLoadStatusData(loadStatusResponse.data);
      }
      if (performanceResponse.success && performanceResponse.data) {
        setPerformanceData(performanceResponse.data);
      }
      if (carrierResponse.success && carrierResponse.data) {
        setCarrierData(carrierResponse.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch chart data";
      setError(errorMessage);
      console.error("Dashboard charts error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return {
    revenueData,
    loadStatusData,
    performanceData,
    carrierData,
    isLoading,
    error,
    refetch: fetchChartData,
  };
}
