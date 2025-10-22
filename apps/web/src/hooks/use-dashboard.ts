"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { DashboardStats } from "@tms/shared-types";

interface UseDashboardReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        success: boolean;
        data: DashboardStats;
      }>("/dashboard/stats");

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboard stats";
      setError(errorMessage);
      console.error("Dashboard stats error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
