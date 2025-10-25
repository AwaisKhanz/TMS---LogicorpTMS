"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { useCarrierStatistics } from "@/hooks/use-carriers";
import { Users, UserCheck, UserPlus, Clock, AlertTriangle } from "lucide-react";

export function CarrierStats() {
  const { data: stats, isLoading, error } = useCarrierStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Failed to load carrier statistics
      </div>
    );
  }

  const statsData = {
    total: stats?.total || 0,
    approved: stats?.approved || 0,
    active: stats?.active || 0,
    pending: stats?.pending || 0,
    inactive: stats?.inactive || 0,
    expiringInsurance: stats?.expiringInsurance || 0,
    avgRating: stats?.avgRating || 0,
    avgOnTimeDelivery: stats?.avgOnTimeDelivery || 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Carriers"
        value={String(statsData.total)}
        description="All registered carriers"
        icon={<Users className="h-4 w-4" />}
        variant="primary"
      />
      <StatsCard
        title="Approved"
        value={String(statsData.approved)}
        description="Verified and approved"
        icon={<UserCheck className="h-4 w-4" />}
        variant="success"
      />
      <StatsCard
        title="Active"
        value={String(statsData.active)}
        description="Currently available"
        icon={<UserPlus className="h-4 w-4" />}
        variant="info"
      />
      <StatsCard
        title="Pending Approval"
        value={String(statsData.pending)}
        description="Awaiting verification"
        icon={<Clock className="h-4 w-4" />}
        variant="warning"
      />
      {statsData.expiringInsurance > 0 && (
        <StatsCard
          title="Insurance Expiring"
          value={String(statsData.expiringInsurance)}
          description="Need attention"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="warning"
        />
      )}
    </div>
  );
}
