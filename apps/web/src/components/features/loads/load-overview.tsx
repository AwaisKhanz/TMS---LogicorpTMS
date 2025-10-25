"use client";

import { useLoad } from "@/hooks/use-loads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Truck,
  MapPin,
  Calendar,
  Package,
  Weight,
  Ruler,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  PAID: { label: "Paid", variant: "default" as const, color: "bg-success" },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive" as const,
    color: "bg-destructive",
  },
};

const equipmentTypeLabels: Record<string, string> = {
  DRY_VAN: "Dry Van",
  REEFER: "Refrigerated",
  FLATBED: "Flatbed",
  STEP_DECK: "Step Deck",
  RGN: "RGN",
  POWER_ONLY: "Power Only",
  HOTSHOT: "Hotshot",
  BOX_TRUCK: "Box Truck",
  STRAIGHT_TRUCK: "Straight Truck",
  OTHER: "Other",
};

interface LoadOverviewProps {
  loadId: string;
}

/**
 * LoadOverview Component
 *
 * Displays comprehensive overview of a load including:
 * - Load number, status, and reference
 * - Customer and carrier information
 * - Pickup and delivery locations with dates
 * - Load details (commodity, weight, equipment)
 * - Notes and special instructions
 *
 * @param loadId - The unique identifier of the load
 * @example
 * <LoadOverview loadId="clx123abc" />
 */
export function LoadOverview({ loadId }: LoadOverviewProps) {
  const { data: load, isLoading } = useLoad(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!load) {
    return null;
  }

  const statusInfo = statusConfig[load.status as keyof typeof statusConfig];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Load {load.loadNumber}</CardTitle>
            {load.referenceNumber && (
              <p className="text-sm text-muted-foreground">
                Reference: {load.referenceNumber}
              </p>
            )}
          </div>
          <Badge
            variant={statusInfo.variant}
            className={cn("text-sm", statusInfo.color, "text-white")}
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer & Carrier */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Customer
            </div>
            <p className="text-sm font-semibold">{load.customer.companyName}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Carrier
            </div>
            {load.carrier ? (
              <div>
                <p className="text-sm font-semibold">
                  {load.carrier.companyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {load.carrier.mcNumber}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not assigned</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Route Information */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                <MapPin className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm font-semibold">
                {load.shipper.companyName}
              </p>
              <p className="text-sm text-muted-foreground">
                {load.shipper.city}, {load.shipper.state} {load.shipper.zipCode}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(load.pickupDate), "MMM dd, yyyy")} •{" "}
                  {load.pickupStart} - {load.pickupEnd}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                <MapPin className="h-4 w-4 text-info" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Delivery</p>
              <p className="text-sm font-semibold">
                {load.consignee.companyName}
              </p>
              <p className="text-sm text-muted-foreground">
                {load.consignee.city}, {load.consignee.state}{" "}
                {load.consignee.zipCode}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(load.deliveryDate), "MMM dd, yyyy")} •{" "}
                  {load.deliveryStart} - {load.deliveryEnd}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Load Details */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              Commodity
            </div>
            <p className="text-sm font-medium">{load.commodity}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Weight className="h-4 w-4" />
              Weight
            </div>
            <p className="text-sm font-medium">
              {new Intl.NumberFormat().format(load.weight)} lbs
              {load.pieces && (
                <span className="text-muted-foreground">
                  {" "}
                  • {load.pieces} pcs
                </span>
              )}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ruler className="h-4 w-4" />
              Equipment
            </div>
            <p className="text-sm font-medium">
              {equipmentTypeLabels[load.equipmentType] || load.equipmentType}
            </p>
          </div>
        </div>

        {/* Notes */}
        {(load.pickupNotes || load.deliveryNotes || load.internalNotes) && (
          <>
            <Separator />
            <div className="space-y-3">
              {load.pickupNotes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pickup Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {load.pickupNotes}
                  </p>
                </div>
              )}
              {load.deliveryNotes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Delivery Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {load.deliveryNotes}
                  </p>
                </div>
              )}
              {load.internalNotes && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Internal Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {load.internalNotes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
