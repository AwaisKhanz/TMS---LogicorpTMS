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
  const { data: load, isLoading, error } = useLoad(loadId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !load) {
    return null; // Error handling is done at the page level
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
          {/* Pickup Locations */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Pickup Locations</p>
            {load.loadShippers && load.loadShippers.length > 0 ? (
              load.loadShippers
                .sort((a, b) => a.sequence - b.sequence)
                .map((shipperRelation, index) => (
                  <div key={shipperRelation.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                        <MapPin className="h-4 w-4 text-success" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {shipperRelation.isPrimary ? "Primary Pickup" : `Pickup ${index + 1}`}
                        </p>
                        {shipperRelation.isPrimary && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">
                        {shipperRelation.shipper.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(shipperRelation.shipper.address as any)?.city || ""}, {(shipperRelation.shipper.address as any)?.state || ""} {(shipperRelation.shipper.address as any)?.zip || ""}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {shipperRelation.pickupDate 
                            ? format(new Date(shipperRelation.pickupDate), "MMM dd, yyyy")
                            : format(new Date(load.pickupDate), "MMM dd, yyyy")
                          } •{" "}
                          {shipperRelation.pickupStart || load.pickupStart} - {shipperRelation.pickupEnd || load.pickupEnd}
                        </span>
                      </div>
                      {shipperRelation.pickupNotes && (
                        <p className="text-xs text-muted-foreground">
                          {shipperRelation.pickupNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              // Fallback for backward compatibility
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <MapPin className="h-4 w-4 text-success" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Pickup</p>
                  <p className="text-sm font-semibold">
                    No shipper selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No pickup location available
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
            )}
          </div>

          {/* Delivery Locations */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Delivery Locations</p>
            {load.loadConsignees && load.loadConsignees.length > 0 ? (
              load.loadConsignees
                .sort((a, b) => a.sequence - b.sequence)
                .map((consigneeRelation, index) => (
                  <div key={consigneeRelation.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                        <MapPin className="h-4 w-4 text-info" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {consigneeRelation.isPrimary ? "Primary Delivery" : `Delivery ${index + 1}`}
                        </p>
                        {consigneeRelation.isPrimary && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold">
                        {consigneeRelation.consignee.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(consigneeRelation.consignee.address as any)?.city || ""}, {(consigneeRelation.consignee.address as any)?.state || ""} {(consigneeRelation.consignee.address as any)?.zip || ""}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {consigneeRelation.deliveryDate 
                            ? format(new Date(consigneeRelation.deliveryDate), "MMM dd, yyyy")
                            : format(new Date(load.deliveryDate), "MMM dd, yyyy")
                          } •{" "}
                          {consigneeRelation.deliveryStart || load.deliveryStart} - {consigneeRelation.deliveryEnd || load.deliveryEnd}
                        </span>
                      </div>
                      {consigneeRelation.deliveryNotes && (
                        <p className="text-xs text-muted-foreground">
                          {consigneeRelation.deliveryNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              // Fallback for backward compatibility
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
                    <MapPin className="h-4 w-4 text-info" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Delivery</p>
                  <p className="text-sm font-semibold">
                    No consignee selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No delivery location available
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
            )}
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
        {load.internalNotes && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Internal Notes</p>
                <p className="text-sm text-muted-foreground">
                  {load.internalNotes}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
