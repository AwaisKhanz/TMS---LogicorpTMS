"use client";

import { useState } from "react";
import { useLoad, useUpdateLoad, useUpdateFinancialAdjustments } from "@/hooks/use-loads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Receipt, Loader2, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CanEdit } from "@/components/auth/can";
import type { FinancialAdjustment, FinancialAdjustmentCategory, FinancialAdjustmentRateSide } from "@tms/shared-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LoadFinancialsProps {
  loadId: string;
}

export function LoadFinancials({ loadId }: LoadFinancialsProps) {
  const { data: load, isLoading, error } = useLoad(loadId);
  const updateLoad = useUpdateLoad();
  const updateAdjustments = useUpdateFinancialAdjustments();
  const [isEditing, setIsEditing] = useState(false);
  const [customerRate, setCustomerRate] = useState("");
  const [carrierRate, setCarrierRate] = useState("");
  const [isAdjDialogOpen, setIsAdjDialogOpen] = useState(false);
  const [adjCategory, setAdjCategory] = useState<FinancialAdjustmentCategory | "">("");
  const [adjSide, setAdjSide] = useState<FinancialAdjustmentRateSide | "">("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjDescription, setAdjDescription] = useState("");

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

  const categories: FinancialAdjustmentCategory[] = [
    "Advance","Bonus","Breakdown","Damage","Deadhead","Detention","Discount","Disposal","Extra Stop","Freeze Protect","Fuel Advance","Gate Fee","General","Handling","Hazmat","Late Fee","Layover","Lumper","Maintenance","Missing Paperwork","On-Time Delivery","Other","Pallets","Permit","Permit Fees","Pilot Car","QuickPay","QuickPay Fee","Redelivery","Reimbursement","Revenue Share","Scale Ticket","Standard Fee","Storage","Team","Temperature Control","Tolls","Trailer Detention",
  ];

  const handleAddAdjustment = async () => {
    if (!adjCategory || !adjSide || !adjAmount) return;
    const newAdjustment: FinancialAdjustment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      category: adjCategory,
      side: adjSide,
      amount: parseFloat(adjAmount),
      description: adjDescription || undefined,
    };

    const next = Array.isArray((load as any).financialAdjustments)
      ? ([...(load as any).financialAdjustments, newAdjustment] as FinancialAdjustment[])
      : ([newAdjustment] as FinancialAdjustment[]);

    await updateAdjustments.mutateAsync({ id: loadId, adjustments: next });
    setIsAdjDialogOpen(false);
    setAdjCategory("");
    setAdjSide("");
    setAdjAmount("");
    setAdjDescription("");
  };

  const handleRemoveAdjustment = async (adjId: string) => {
    const current: FinancialAdjustment[] = Array.isArray((load as any).financialAdjustments)
      ? (load as any).financialAdjustments
      : [];
    const next = current.filter((a) => a.id !== adjId);
    await updateAdjustments.mutateAsync({ id: loadId, adjustments: next });
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAdjDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Change
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Rates
                </Button>
              </div>
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

        {/* Financial Adjustments */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Receipt className="h-4 w-4" />
              Changes
            </div>
            <CanEdit resource="load">
              <Button variant="outline" size="sm" onClick={() => setIsAdjDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Change
              </Button>
            </CanEdit>
          </div>

          {Array.isArray((load as any).financialAdjustments) && (load as any).financialAdjustments.length > 0 ? (
            <div className="space-y-2">
              {(load as any).financialAdjustments.map((adj: FinancialAdjustment) => (
                <div key={adj.id} className="flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{adj.category}</Badge>
                      <Badge variant={adj.side === "customer" ? "default" : "outline"}>
                        {adj.side === "customer" ? "Customer" : "Carrier"}
                      </Badge>
                    </div>
                    {adj.description && (
                      <p className="text-xs text-muted-foreground">{adj.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${adj.amount.toFixed(2)}</span>
                    <CanEdit resource="load">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveAdjustment(adj.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CanEdit>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No changes added yet.</p>
          )}
        </div>

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

      {/* Add Change Dialog */}
      <Dialog open={isAdjDialogOpen} onOpenChange={setIsAdjDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Financial Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={adjCategory} onValueChange={(v) => setAdjCategory(v as FinancialAdjustmentCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select value={adjSide} onValueChange={(v) => setAdjSide(v as FinancialAdjustmentRateSide)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="carrier">Carrier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={adjDescription}
                onChange={(e) => setAdjDescription(e.target.value)}
                placeholder="Enter description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdjustment} disabled={!adjCategory || !adjSide || !adjAmount || updateAdjustments.isPending}>
              {updateAdjustments.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
