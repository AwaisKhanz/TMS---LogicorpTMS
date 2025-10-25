"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
} from "lucide-react";
import { ModernStatsCard } from "./modern-stats-card";
import { RevenueChart } from "./charts/revenue-chart";
import { LoadStatusChart } from "./charts/load-status-chart";
import { PerformanceChart } from "./charts/performance-chart";
import { CarrierPerformance } from "./charts/carrier-performance";
import { useDashboardCharts } from "@/hooks/use-dashboard-charts";
import { useRouter } from "next/navigation";
import { CanCreate } from "@/components/auth/can";

interface ModernDashboardProps {
  user: {
    firstName?: string;
    lastName?: string;
  } | null;
  organization?: {
    name?: string;
  } | null;
  stats: {
    loads: {
      totalLoads: number;
      activeLoads: number;
      monthRevenue: number;
      weekRevenue: number;
      todayPickups: number;
      todayDeliveries: number;
    };
    carriers: {
      totalCarriers: number;
      activeCarriers: number;
      pendingApproval: number;
    };
    customers: {
      totalCustomers: number;
      activeCustomers: number;
    };
  };
}

export function ModernDashboard({
  user,
  organization: _organization,
  stats,
}: ModernDashboardProps) {
  const router = useRouter();
  const {
    revenueData,
    loadStatusData,
    performanceData,
    carrierData,
    isLoading: chartsLoading,
    error: chartsError,
  } = useDashboardCharts();

  // Navigation handlers
  const handleCreateLoad = () => {
    router.push("/loads");
  };

  const handleManageCarriers = () => {
    router.push("/carriers");
  };

  const handleManageCustomers = () => {
    router.push("/customers");
  };

  const handleQuickActions = () => {
    // Could open a modal with quick actions or navigate to a specific page
    router.push("/loads/new");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your transportation
            operations today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CanCreate resource="load">
            <Button size="sm" onClick={handleQuickActions}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </CanCreate>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModernStatsCard
          title="Total Revenue"
          value={`$${stats.loads.monthRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
          description="This month"
        />
        <ModernStatsCard
          title="Active Loads"
          value={stats.loads.activeLoads}
          icon={<Truck className="h-4 w-4" />}
          description={`${stats.loads.totalLoads} total loads`}
        />
        <ModernStatsCard
          title="Active Carriers"
          value={stats.carriers.activeCarriers}
          icon={<Users className="h-4 w-4" />}
          description={`${stats.carriers.totalCarriers} total carriers`}
        />
        <ModernStatsCard
          title="Customers"
          value={stats.customers.activeCustomers}
          icon={<Building2 className="h-4 w-4" />}
          description={`${stats.customers.totalCustomers} total customers`}
        />
      </div>

      {/* Today's Operations */}
      <Card className="bg-gradient-to-r from-primary/5 via-info/5 to-success/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Operations
          </CardTitle>
          <CardDescription>
            Real-time overview of today&apos;s transportation activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pickups
                </p>
                <p className="text-2xl font-bold">{stats.loads.todayPickups}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Deliveries
                </p>
                <p className="text-2xl font-bold">
                  {stats.loads.todayDeliveries}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold">
                  {stats.carriers.pendingApproval}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Revenue
                </p>
                <p className="text-2xl font-bold">
                  ${stats.loads.weekRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      {chartsLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      ) : chartsError ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Failed to load chart data</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {revenueData && <RevenueChart data={revenueData} />}
            {loadStatusData && <LoadStatusChart data={loadStatusData} />}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {performanceData && <PerformanceChart data={performanceData} />}
            {carrierData && <CarrierPerformance data={carrierData} />}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for efficient operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <CanCreate resource="load">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={handleCreateLoad}
              >
                <Truck className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Load Management </p>
                  <p className="text-sm text-muted-foreground">
                    View and manage loads
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CanCreate>
            <CanCreate resource="carrier">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={handleManageCarriers}
              >
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Manage Carriers</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage carriers
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CanCreate>
            <CanCreate resource="customer">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={handleManageCustomers}
              >
                <Building2 className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Manage Customers</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage customers
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CanCreate>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
