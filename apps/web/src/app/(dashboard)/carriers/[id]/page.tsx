import { Suspense } from "react";
import { CarrierOverview } from "@/components/features/carriers/carrier-overview";
import { CarrierCompliance } from "@/components/features/carriers/carrier-compliance";
import { CarrierPerformance } from "@/components/features/carriers/carrier-performance";
import { CarrierContacts } from "@/components/features/carriers/carrier-contacts";
import { CarrierDocuments } from "@/components/features/carriers/carrier-documents";
import { CarrierLoads } from "@/components/features/carriers/carrier-loads";
import { CarrierActions } from "@/components/features/carriers/carrier-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface CarrierDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CarrierDetailsPage({
  params,
}: CarrierDetailsPageProps) {
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
    </PermissionGuard>
  );
}
