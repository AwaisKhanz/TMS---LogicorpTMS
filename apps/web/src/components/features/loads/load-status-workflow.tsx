"use client";

import { useLoad, useUpdateLoadStatus } from "@/hooks/use-loads";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadStatus } from "@tms/shared-types";
import { LOAD_STATUS_OPTIONS } from "@tms/shared-constants";

// Use shared constants for statuses
const statuses = LOAD_STATUS_OPTIONS;

// For sidebar, show only key statuses
const sidebarStatuses = LOAD_STATUS_OPTIONS;

interface LoadStatusWorkflowProps {
  loadId: string;
  compact?: boolean;
}

export function LoadStatusWorkflow({
  loadId,
  compact = false,
}: LoadStatusWorkflowProps) {
  const { data: load, isLoading } = useLoad(loadId);
  const updateStatus = useUpdateLoadStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!load) {
    return null;
  }

  const statusList = compact ? sidebarStatuses : statuses;
  const currentStatusIndex = statusList.findIndex(
    (s) => s.value === load.status
  );

  // Define valid status transitions (matching backend logic)
  const validTransitions: Record<string, string[]> = {
    [LoadStatus.QUOTE]: [LoadStatus.BOOKED, LoadStatus.CANCELLED],
    [LoadStatus.BOOKED]: [
      LoadStatus.DISPATCHED,
      LoadStatus.CANCELLED,
      LoadStatus.QUOTE,
    ],
    [LoadStatus.DISPATCHED]: [
      LoadStatus.IN_TRANSIT,
      LoadStatus.CANCELLED,
      LoadStatus.BOOKED,
    ],
    [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.CANCELLED],
    [LoadStatus.DELIVERED]: [LoadStatus.POD_RECEIVED, LoadStatus.CANCELLED],
    [LoadStatus.POD_RECEIVED]: [LoadStatus.COMPLETED, LoadStatus.CANCELLED],
    [LoadStatus.COMPLETED]: [LoadStatus.PAID],
    [LoadStatus.PAID]: [],
    [LoadStatus.CANCELLED]: [],
  };

  const isStatusTransitionValid = (
    fromStatus: string,
    toStatus: string
  ): boolean => {
    const allowedTransitions = validTransitions[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-sm text-foreground">
            Status Progress
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Current:{" "}
            <span className="font-medium text-foreground">
              {load.status.replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="space-y-3">
          {statusList.map((status, index) => {
            const isCompleted = index < currentStatusIndex;
            const isCurrent = status.value === load.status;
            const canTransition = isStatusTransitionValid(
              load.status,
              status.value
            );

            return (
              <div key={status.value} className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2",
                    isCompleted
                      ? "border-success bg-success/10"
                      : isCurrent
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30 bg-background"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>

                {/* Status button */}
                <Button
                  variant={
                    isCurrent
                      ? "default"
                      : isCompleted
                        ? "secondary"
                        : "outline"
                  }
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (canTransition && !updateStatus.isPending) {
                      updateStatus.mutate({
                        id: loadId,
                        status: status.value as LoadStatus,
                      });
                    }
                  }}
                  disabled={!canTransition || updateStatus.isPending}
                >
                  <span className="truncate">{status.label}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
