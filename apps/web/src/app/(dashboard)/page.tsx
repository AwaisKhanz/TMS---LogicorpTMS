"use client";

import { useAuth } from "@/contexts/auth-context";
import { useDashboardStats } from "@/hooks/use-loads";
import { ModernDashboard } from "@/components/dashboard/modern-dashboard";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";

export default function DashboardPage() {
  const { user, organization } = useAuth();

  return (
    <PermissionGuard
      permission={PERMISSIONS.LOAD_VIEW_ALL}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to view the dashboard. Please
                contact your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              Access denied. Required permissions: load:view:all, load:view:own
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <DashboardContent user={user} organization={organization} />
    </PermissionGuard>
  );
}

function DashboardContent({
  user,
  organization,
}: {
  user: any;
  organization: any;
}) {
  const { data: dashboardStats, isLoading, error } = useDashboardStats();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with your transportation
              operations today.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data: {error?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log(dashboardStats);

  return (
    <ModernDashboard
      user={user}
      organization={organization}
      stats={
        dashboardStats || {
          loads: {
            totalLoads: 0,
            activeLoads: 0,
            monthRevenue: 0,
            weekRevenue: 0,
            todayPickups: 0,
            todayDeliveries: 0,
          },
          carriers: {
            totalCarriers: 0,
            activeCarriers: 0,
            pendingApproval: 0,
          },
          customers: {
            totalCustomers: 0,
            activeCustomers: 0,
          },
        }
      }
    />
  );
}
