"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, UserCheck, UserPlus, Clock } from "lucide-react";

// Mock data - replace with actual API call
const mockStats = {
  total: 156,
  approved: 143,
  active: 128,
  pendingApproval: 13,
};

export function CarrierStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Carriers"
        value={mockStats.total.toString()}
        description="All registered carriers"
        icon={<Users className="h-4 w-4" />}
        variant="primary"
      />
      <StatsCard
        title="Approved"
        value={mockStats.approved.toString()}
        description="Verified and approved"
        icon={<UserCheck className="h-4 w-4" />}
        variant="success"
      />
      <StatsCard
        title="Active"
        value={mockStats.active.toString()}
        description="Currently available"
        icon={<UserPlus className="h-4 w-4" />}
        variant="info"
      />
      <StatsCard
        title="Pending Approval"
        value={mockStats.pendingApproval.toString()}
        description="Awaiting verification"
        icon={<Clock className="h-4 w-4" />}
        variant="warning"
      />
    </div>
  );
}
