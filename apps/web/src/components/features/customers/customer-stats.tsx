"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react";
import { useCustomerStatistics } from "@/hooks/use-customer";
import type { CustomerStatistics } from "@tms/shared-types";

interface CustomerStatsProps {
  className?: string;
}

export function CustomerStats({ className }: CustomerStatsProps) {
  const { data: statsData, isLoading, error } = useCustomerStatistics();

  const stats = statsData?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 md:grid-cols-4 ${className || ""}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`grid gap-4 md:grid-cols-4 ${className || ""}`}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Failed to load stats</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-4 ${className || ""}`}>
      {/* Total Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} active
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
        </CardContent>
      </Card>

      {/* Average Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.avgRevenuePerCustomer || 0)}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Per customer</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.total && stats.total > 0
              ? Math.round((stats.active / stats.total) * 100)
              : 0}
            %
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} of {stats?.total || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats Row */}
      {stats?.breakdown && stats.breakdown.length > 0 && (
        <>
          {/* Customer Status Breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Customer Status
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.breakdown.map(
                  (item: CustomerStatistics["breakdown"][0], index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                      <Badge variant="secondary">{item._count.id}</Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
