"use client";

import { useLoad, useUpdateLoadStatus } from "@/hooks/use-loads";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadStatus } from "@tms/shared-types";

const statuses = [
  { value: LoadStatus.QUOTE, label: "Quote" },
  { value: LoadStatus.BOOKED, label: "Booked" },
  { value: LoadStatus.DISPATCHED, label: "Dispatched" },
  { value: LoadStatus.IN_TRANSIT, label: "In Transit" },
  { value: LoadStatus.DELIVERED, label: "Delivered" },
  { value: LoadStatus.POD_RECEIVED, label: "POD" },
  { value: LoadStatus.INVOICED, label: "Invoiced" },
  { value: LoadStatus.PAID, label: "Paid" },
];

interface LoadStatusWorkflowProps {
  loadId: string;
}

export function LoadStatusWorkflow({ loadId }: LoadStatusWorkflowProps) {
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

  const currentStatusIndex = statuses.findIndex((s) => s.value === load.status);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {statuses.map((status, index) => {
            const isCompleted = index < currentStatusIndex;
            const isCurrent = status.value === load.status;
            const isNext = index === currentStatusIndex + 1;

            return (
              <div key={status.value} className="flex items-center gap-2">
                <Button
                  variant={
                    isCurrent
                      ? "default"
                      : isCompleted
                        ? "secondary"
                        : "outline"
                  }
                  size="sm"
                  className={cn(
                    "relative whitespace-nowrap",
                    isCompleted && "bg-green-100 dark:bg-green-900"
                  )}
                  onClick={() => {
                    if (isNext && !updateStatus.isPending) {
                      updateStatus.mutate({ id: loadId, status: status.value });
                    }
                  }}
                  disabled={!isNext || updateStatus.isPending}
                >
                  {isCompleted && <Check className="h-3 w-3 mr-1" />}
                  {status.label}
                </Button>
                {index < statuses.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-4 bg-border",
                      isCompleted && "bg-green-500"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
