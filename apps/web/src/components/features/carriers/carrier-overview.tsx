"use client";

import { useCarrier } from "@/hooks/use-carriers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone, MapPin, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/carrier.types";

interface CarrierOverviewProps {
  carrierId: string;
}

/**
 * CarrierOverview Component
 *
 * Displays comprehensive overview of a carrier including:
 * - Company information (MC#, DOT#, SCAC)
 * - Contact details
 * - Address
 * - Status badges (approved, active)
 *
 * @param carrierId - The unique identifier of the carrier
 */
export function CarrierOverview({ carrierId }: CarrierOverviewProps) {
  const { data: carrier, isLoading } = useCarrier(carrierId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!carrier) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{carrier.companyName}</CardTitle>
            {carrier.dba && (
              <p className="text-sm text-muted-foreground">
                DBA: {carrier.dba}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge
              variant={carrier.isApproved ? "default" : "secondary"}
              className={cn(
                carrier.isApproved &&
                  "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              {carrier.isApproved ? "Approved" : "Pending Approval"}
            </Badge>
            <Badge
              variant={carrier.isActive ? "default" : "secondary"}
              className={cn(
                carrier.isActive && "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              {carrier.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identification Numbers */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              MC Number
            </div>
            <p className="text-sm font-medium">{carrier.mcNumber}</p>
          </div>

          {carrier.dotNumber && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                DOT Number
              </div>
              <p className="text-sm font-medium">{carrier.dotNumber}</p>
            </div>
          )}

          {carrier.scac && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                SCAC Code
              </div>
              <p className="text-sm font-medium">{carrier.scac}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Primary Contact</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Contact Person
              </div>
              <p className="text-sm font-medium">{carrier.contactName}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Phone
              </div>
              <a
                href={`tel:${carrier.contactPhone}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {carrier.contactPhone}
              </a>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <a
                href={`mailto:${carrier.contactEmail}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {carrier.contactEmail}
              </a>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                Company Phone
              </div>
              <a
                href={`tel:${carrier.phone}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {carrier.phone}
              </a>
            </div>
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Address
          </div>
          <p className="text-sm">
            {(carrier.address as Address)?.street}
            <br />
            {(carrier.address as Address)?.city}, {(carrier.address as Address)?.state}{" "}
            {(carrier.address as Address)?.zip}
            {(carrier.address as Address)?.country && <>, {(carrier.address as Address)?.country}</>}
          </p>
        </div>

        {/* Equipment */}
        {carrier.equipment && carrier.equipment.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Equipment Types</p>
              <div className="flex flex-wrap gap-2">
                {carrier.equipment.map((equip) => (
                  <Badge key={equip} variant="outline">
                    {equip.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {carrier.notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{carrier.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
