"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsigneeStatistics } from "@/hooks/use-consignee";
import { Building2, TrendingUp, MapPin, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ConsigneeStats() {
  const { data: statsData, isLoading, error } = useConsigneeStatistics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Failed to load consignee statistics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = statsData.data;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Consignees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Consignees
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active, {stats.inactive} inactive
          </p>
        </CardContent>
      </Card>

      {/* Active Consignees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Consignees
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0
              ? `${Math.round((stats.active / stats.total) * 100)}% of total`
              : "0% of total"}
          </p>
        </CardContent>
      </Card>

      {/* Top Consignee */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Consignee</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.total > 0 && stats.topConsignees?.length > 0
              ? stats.topConsignees[0].companyName
              : "No consignees"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 && stats.topConsignees?.length > 0
              ? `${stats.topConsignees[0]._count?.loads || 0} loads`
              : "0 loads"}
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLoads}</div>
          <p className="text-xs text-muted-foreground">Total loads</p>
        </CardContent>
      </Card>
    </div>
  );
}
