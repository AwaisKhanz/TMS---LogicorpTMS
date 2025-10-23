"use client";

import { useLoad } from "@/hooks/use-loads";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface LoadSummaryProps {
  loadId: string;
}

export function LoadSummary({ loadId }: LoadSummaryProps) {
  const { data: load, isLoading } = useLoad(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!load) {
    return null;
  }

  const calculateMargin = () => {
    if (load.customerRate && load.carrierRate) {
      const margin = load.customerRate - load.carrierRate;
      const percentage = ((margin / load.customerRate) * 100).toFixed(1);
      return { margin, percentage };
    }
    return null;
  };

  const marginData = calculateMargin();

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Load Summary</h3>
        <div className="space-y-3 text-sm">
          {load.weight && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight:</span>
              <span className="font-medium">
                {load.weight.toLocaleString()} lbs
              </span>
            </div>
          )}
          {load.pieces && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pieces:</span>
              <span className="font-medium">
                {load.pieces.toLocaleString()}
              </span>
            </div>
          )}
          {marginData && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margin:</span>
              <span className="font-medium text-success">
                ${marginData.margin.toLocaleString()} ({marginData.percentage}%)
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {format(new Date(load.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
