"use client";

import { useLoad } from "@/hooks/use-loads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Receipt, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadFinancialsProps {
  loadId: string;
}

export function LoadFinancials({ loadId }: LoadFinancialsProps) {
  const { data: load, isLoading } = useLoad(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!load) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const marginPercentage = load.carrierRate
    ? ((load.margin || 0) / load.customerRate) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Customer Rate</span>
            <span className="text-2xl font-bold">
              {formatCurrency(load.customerRate)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Cost */}
        {load.carrierRate ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Carrier Rate
              </span>
              <span className="text-xl font-semibold">
                {formatCurrency(load.carrierRate)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-muted-foreground">
              No carrier assigned yet
            </p>
          </div>
        )}

        {/* Margin */}
        {load.margin !== undefined && load.margin !== null && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Gross Margin
                </span>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-xl font-bold",
                      load.margin > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatCurrency(load.margin)}
                  </div>
                  <Badge
                    variant={load.margin > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {marginPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Accessorials */}
        {load.accessorials && load.accessorials.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Receipt className="h-4 w-4" />
                Accessorials
              </div>
              {load.accessorials.map((accessorial, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{accessorial.type}</p>
                    {accessorial.description && (
                      <p className="text-xs text-muted-foreground">
                        {accessorial.description}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(accessorial.amount)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total Accessorials</span>
                <span>
                  {formatCurrency(
                    load.accessorials.reduce((sum, acc) => sum + acc.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Metrics */}
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cost per Mile</p>
            <p className="text-sm font-medium">
              {load.carrierRate ? "Calculate with distance" : "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Revenue per Mile</p>
            <p className="text-sm font-medium">Calculate with distance</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
