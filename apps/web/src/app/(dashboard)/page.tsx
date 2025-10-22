"use client";

import { useAuth } from "@/contexts/auth-context";
import { useDashboard } from "@/hooks/use-dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { FeatureCard } from "@/components/dashboard/feature-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Building2, DollarSign, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const { stats, isLoading, error } = useDashboard();

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
            Failed to load dashboard data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
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
        <Badge
          variant="outline"
          className="bg-success/10 text-success border-success/20"
        >
          Phase 1 Complete
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Organization"
          value={organization?.name || "N/A"}
          description="Active and ready"
          variant="primary"
        />

        <StatsCard
          title="Active Loads"
          value={stats?.loads.activeLoads || 0}
          description={`${stats?.loads.totalLoads || 0} total loads`}
          icon={<Truck className="h-4 w-4" />}
          variant="info"
        />

        <StatsCard
          title="Total Carriers"
          value={stats?.carriers.totalCarriers || 0}
          description={`${stats?.carriers.activeCarriers || 0} active`}
          icon={<Users className="h-4 w-4" />}
          variant="warning"
        />

        <StatsCard
          title="Revenue (MTD)"
          value={`$${(stats?.loads.monthRevenue || 0).toLocaleString()}`}
          description="This month"
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="Load Management"
          description={`${stats?.loads.totalLoads || 0} total loads, ${stats?.loads.activeLoads || 0} active`}
          icon={<Truck className="h-5 w-5" />}
          iconVariant="primary"
          action={{
            label: stats?.loads.totalLoads
              ? "Manage Loads"
              : "Create First Load",
            href: "/loads",
          }}
        />

        <FeatureCard
          title="Carrier Network"
          description={`${stats?.carriers.totalCarriers || 0} carriers, ${stats?.carriers.activeCarriers || 0} active`}
          icon={<Users className="h-5 w-5" />}
          iconVariant="info"
          action={{
            label: stats?.carriers.totalCarriers
              ? "Manage Carriers"
              : "Add Carriers",
            href: "/carriers",
            variant: "outline",
          }}
        />

        <FeatureCard
          title="Customer Base"
          description={`${stats?.customers.totalCustomers || 0} customers, ${stats?.customers.activeCustomers || 0} active`}
          icon={<Building2 className="h-5 w-5" />}
          iconVariant="success"
          action={{
            label: stats?.customers.totalCustomers
              ? "Manage Customers"
              : "Add Customers",
            href: "/customers",
            variant: "outline",
          }}
        />
      </div>

      {/* Status Banner */}
      <Card className="bg-gradient-to-r from-primary/5 via-info/5 to-success/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Operations Overview
          </CardTitle>
          <CardDescription className="text-base">
            Your transportation operations at a glance:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-info/10 text-info border-info/20 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {stats?.loads.todayPickups || 0}
              </Badge>
              <span className="text-sm">Pickups Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/20 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {stats?.loads.todayDeliveries || 0}
              </Badge>
              <span className="text-sm">Deliveries Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/20 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {stats?.carriers.pendingApproval || 0}
              </Badge>
              <span className="text-sm">Pending Carriers</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                ${(stats?.loads.weekRevenue || 0).toLocaleString()}
              </Badge>
              <span className="text-sm">This Week Revenue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
