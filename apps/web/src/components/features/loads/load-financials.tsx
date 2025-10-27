"use client";

import { useState } from "react";
import { useLoad, useUpdateLoad } from "@/hooks/use-loads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Receipt, Loader2, Edit, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanEdit } from "@/components/auth/can";

interface LoadFinancialsProps {
  loadId: string;
}

export function LoadFinancials({ loadId }: LoadFinancialsProps) {
  const { data: load, isLoading, error } = useLoad(loadId);
  const updateLoad = useUpdateLoad();
  const [isEditing, setIsEditing] = useState(false);
  const [customerRate, setCustomerRate] = useState("");
  const [carrierRate, setCarrierRate] = useState("");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !load) {
    return null; // Error handling is done at the page level
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

  const handleEdit = () => {
    setCustomerRate(load.customerRate?.toString() || "");
    setCarrierRate(load.carrierRate?.toString() || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCustomerRate("");
    setCarrierRate("");
  };

  const handleSave = async () => {
    try {
      await updateLoad.mutateAsync({
        id: loadId,
        data: {
          customerRate: parseFloat(customerRate),
          carrierRate: carrierRate ? parseFloat(carrierRate) : undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
          {!isEditing && (
            <CanEdit resource="load">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Rates
              </Button>
            </CanEdit>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue */}
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="customerRate">Customer Rate</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  id="customerRate"
                  type="number"
                  step="0.01"
                  value={customerRate}
                  onChange={(e) => setCustomerRate(e.target.value)}
                  placeholder="Enter customer rate"
                  className="flex-1"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Customer Rate
              </span>
              <span className="text-2xl font-bold">
                {formatCurrency(load.customerRate)}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Cost */}
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="carrierRate">Carrier Rate</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                id="carrierRate"
                type="number"
                step="0.01"
                value={carrierRate}
                onChange={(e) => setCarrierRate(e.target.value)}
                placeholder="Enter carrier rate (optional)"
                className="flex-1"
              />
            </div>
          </div>
        ) : load.carrierRate ? (
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
                      load.margin > 0 ? "text-success" : "text-destructive"
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

        {/* Edit Actions */}
        {isEditing && (
          <>
            <Separator />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateLoad.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateLoad.isPending || !customerRate}
              >
                {updateLoad.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
