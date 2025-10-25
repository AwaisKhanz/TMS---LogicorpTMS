"use client";

import { useLoad } from "@/hooks/use-loads";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LoadQuickStatsProps {
  loadId: string;
}

const statusConfig = {
  QUOTE: {
    label: "Quote",
    variant: "secondary" as const,
    color: "bg-muted",
  },
  BOOKED: {
    label: "Booked",
    variant: "default" as const,
    color: "bg-primary",
  },
  DISPATCHED: {
    label: "Dispatched",
    variant: "default" as const,
    color: "bg-warning",
  },
  IN_TRANSIT: {
    label: "In Transit",
    variant: "default" as const,
    color: "bg-info",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "default" as const,
    color: "bg-success",
  },
  POD_RECEIVED: {
    label: "POD Received",
    variant: "default" as const,
    color: "bg-success",
  },
  COMPLETED: {
    label: "Completed",
    variant: "default" as const,
    color: "bg-info",
  },
  PAID: {
    label: "Paid",
    variant: "default" as const,
    color: "bg-success",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    color: "bg-destructive",
  },
};

export function LoadQuickStats({ loadId }: LoadQuickStatsProps) {
  const { data: load, isLoading } = useLoad(loadId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="p-4">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!load) {
    return null;
  }

  const statusInfo = statusConfig[load.status as keyof typeof statusConfig];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={statusInfo.variant}
                className={cn("mt-1 text-sm", statusInfo.color, "text-white")}
              >
                {statusInfo.label}
              </Badge>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/60" />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Card */}
      <Card className="border-l-4 border-l-success">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Customer Rate
              </p>
              <p className="text-2xl font-bold">
                ${load.customerRate?.toLocaleString() || "N/A"}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-success/60" />
          </div>
        </CardContent>
      </Card>

      {/* Pickup Date Card */}
      <Card className="border-l-4 border-l-warning">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pickup
              </p>
              <p className="text-sm font-medium">
                {load.pickupDate
                  ? format(new Date(load.pickupDate), "MMM d, yyyy")
                  : "N/A"}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-warning/60" />
          </div>
        </CardContent>
      </Card>

      {/* Weight Card */}
      <Card className="border-l-4 border-l-info">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Weight
              </p>
              <p className="text-2xl font-bold">
                {load.weight ? `${load.weight.toLocaleString()} lbs` : "N/A"}
              </p>
            </div>
            <Package className="h-8 w-8 text-info/60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
