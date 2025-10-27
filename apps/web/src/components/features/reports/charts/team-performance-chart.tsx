"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamPerformance } from "@tms/shared-types";

interface TeamPerformanceChartProps {
  data: TeamPerformance;
}

export function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalTeamMembers}</div>
          <p className="text-xs text-muted-foreground">
            Active: {data.activeMembers}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Average Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.averagePerformance.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Team performance</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topPerformers.slice(0, 10).map((performer, index) => (
              <div
                key={performer.userId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{performer.userName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {performer.loadCount} loads
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${performer.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
