"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarrierPerformanceReport } from "@tms/shared-types";

interface CarrierPerformanceChartProps {
  data: CarrierPerformanceReport;
}

export function CarrierPerformanceChart({
  data,
}: CarrierPerformanceChartProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalCarriers}</div>
          <p className="text-xs text-muted-foreground">
            Active: {data.activeCarriers}
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
          <p className="text-xs text-muted-foreground">
            Overall performance score
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            On-Time Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.performanceMetrics.onTimeDelivery.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Average on-time rate</p>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Performing Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topPerformers.slice(0, 10).map((carrier, index) => (
              <div
                key={carrier.carrierId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{carrier.carrierName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {carrier.loadCount} loads
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rating: {carrier.averageRating.toFixed(1)}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {data.performanceMetrics.onTimeDelivery.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                On-Time Delivery
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {data.performanceMetrics.averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average Rating
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {data.performanceMetrics.loadCompletionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {data.performanceMetrics.customerSatisfaction.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Customer Satisfaction
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carrier Utilization */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Carrier Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.carrierUtilization.slice(0, 10).map((carrier, index) => (
              <div
                key={carrier.carrierId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{carrier.carrierName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {carrier.utilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {carrier.usedCapacity}/{carrier.totalCapacity} capacity
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
