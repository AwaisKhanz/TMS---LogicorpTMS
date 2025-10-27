"use client";

import { Suspense } from "react";
import { CarrierOverview } from "@/components/features/carriers/carrier-overview";
import { CarrierCompliance } from "@/components/features/carriers/carrier-compliance";
import { CarrierPerformance } from "@/components/features/carriers/carrier-performance";
import { CarrierContacts } from "@/components/features/carriers/carrier-contacts";
import { CarrierDocuments } from "@/components/features/carriers/carrier-documents";
import { CarrierLoads } from "@/components/features/carriers/carrier-loads";
import { CarrierActions } from "@/components/features/carriers/carrier-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { useCarrier } from "@/hooks/use-carriers";

interface CarrierDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CarrierDetailsPage({
  params,
}: CarrierDetailsPageProps) {
  const { data: carrier, isLoading, error } = useCarrier(params.id);

  return (
    <PermissionGuard
      permission={PERMISSIONS.CARRIER_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/carriers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Carriers
                </Link>
              </Button>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view carrier details. Please
              contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      {/* Handle loading state */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/carriers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Carriers
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      ) : error || !carrier ? (
        /* Handle error state (404 or other errors) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/carriers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Carriers
                </Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Carrier Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The carrier with ID &quot;{params.id}&quot; could not be
                  found. This could be because:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>The carrier ID is incorrect</li>
                    <li>The carrier has been deleted</li>
                    <li>You don&apos;t have permission to view this carrier</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <Link href="/carriers">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Carriers
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Normal content when carrier is found */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/carriers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Carriers
                </Link>
              </Button>
            </div>
            <CarrierActions carrierId={params.id} />
          </div>

          {/* Carrier Overview */}
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <CarrierOverview carrierId={params.id} />
          </Suspense>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <CarrierCompliance carrierId={params.id} />
              </Suspense>

              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <CarrierPerformance carrierId={params.id} />
              </Suspense>

              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <CarrierContacts carrierId={params.id} />
              </Suspense>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <CarrierDocuments carrierId={params.id} />
              </Suspense>

              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <CarrierLoads carrierId={params.id} />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
