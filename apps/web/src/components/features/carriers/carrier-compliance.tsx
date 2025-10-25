"use client";

import { useCarrier } from "@/hooks/use-carriers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface CarrierComplianceProps {
  carrierId: string;
}

export function CarrierCompliance({ carrierId }: CarrierComplianceProps) {
  const { data: carrier, isLoading } = useCarrier(carrierId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!carrier) {
    return null;
  }

  const getInsuranceStatus = () => {
    if (!carrier.insuranceExpiry) return { status: "unknown", days: 0 };

    const expiry = new Date(carrier.insuranceExpiry);
    const now = new Date();
    const days = differenceInDays(expiry, now);

    // Debug logging (remove in production)
    console.log("Insurance Debug:", {
      expiry: expiry.toISOString(),
      now: now.toISOString(),
      days,
      expiryDate: format(expiry, "MMM dd, yyyy"),
    });

    if (days < 0) return { status: "expired", days };
    if (days <= 7) return { status: "critical", days };
    if (days <= 30) return { status: "warning", days };
    return { status: "valid", days };
  };

  const insuranceStatus = getInsuranceStatus();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authority Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Authority Status
          </span>
          <Badge
            variant={
              carrier.authorityStatus === "ACTIVE" ? "success" : "secondary"
            }
          >
            {carrier.authorityStatus}
          </Badge>
        </div>

        <Separator />

        {/* Insurance Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Insurance Status
            </span>
            <div className="flex items-center gap-2">
              {insuranceStatus.status === "valid" && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              {insuranceStatus.status === "warning" && (
                <AlertTriangle className="h-4 w-4 text-warning" />
              )}
              {insuranceStatus.status === "critical" && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              {insuranceStatus.status === "expired" && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <Badge
                variant={
                  insuranceStatus.status === "valid"
                    ? "success"
                    : insuranceStatus.status === "expired"
                      ? "destructive"
                      : insuranceStatus.status === "critical"
                        ? "destructive"
                        : insuranceStatus.status === "warning"
                          ? "warning"
                          : "secondary"
                }
              >
                {insuranceStatus.status === "expired"
                  ? "Expired"
                  : insuranceStatus.status === "critical"
                    ? `${insuranceStatus.days}d Left`
                    : insuranceStatus.status === "warning"
                      ? `${insuranceStatus.days}d Left`
                      : "Valid"}
              </Badge>
            </div>
          </div>

          {carrier.insuranceExpiry && (
            <p className="text-xs text-muted-foreground">
              Expires:{" "}
              {format(new Date(carrier.insuranceExpiry), "MMM dd, yyyy")}
            </p>
          )}
        </div>

        {/* Insurance Amounts */}
        {(carrier.insuranceAmount ||
          carrier.cargoInsurance ||
          carrier.liabilityInsurance) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Insurance Coverage</p>
              {carrier.insuranceAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    General Liability
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(carrier.insuranceAmount))}
                  </span>
                </div>
              )}
              {carrier.cargoInsurance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cargo Insurance</span>
                  <span className="font-medium">
                    {formatCurrency(Number(carrier.cargoInsurance))}
                  </span>
                </div>
              )}
              {carrier.liabilityInsurance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Liability Insurance
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(carrier.liabilityInsurance))}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Safety Rating */}
        {carrier.safetyRating && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Safety Rating
              </span>
              <Badge variant="outline">{carrier.safetyRating}</Badge>
            </div>
          </>
        )}

        {/* Payment Terms */}
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Payment Terms</p>
            <p className="text-sm font-medium">{carrier.paymentTerms}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Payment Method</p>
            <p className="text-sm font-medium">{carrier.paymentMethod}</p>
          </div>
        </div>

        {/* W9 Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">W-9 on File</span>
          {carrier.w9OnFile ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              No
            </Badge>
          )}
        </div>

        {/* Factoring */}
        {carrier.factoring && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm font-medium">Factoring Information</p>
              <p className="text-sm text-muted-foreground">
                {carrier.factoringCompany || "Factoring company not specified"}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
