import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CarriersDataTable } from "@/components/features/carriers/carriers-data-table";
import { CarrierStats } from "@/components/features/carriers/carrier-stats";
import { CanCreate } from "@/components/auth/can";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function CarriersPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CARRIER_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Carriers</h1>
              <p className="text-muted-foreground">
                Manage your carrier network and relationships
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view carriers. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carriers</h1>
            <p className="text-muted-foreground">
              Manage your carrier network and relationships
            </p>
          </div>
          <CanCreate resource="carrier">
            <Button asChild>
              <Link href="/carriers/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Carrier
              </Link>
            </Button>
          </CanCreate>
        </div>

        {/* Statistics */}
        <Suspense fallback={<div>Loading statistics...</div>}>
          <CarrierStats />
        </Suspense>

        {/* Carriers Table */}
        <Suspense fallback={<div>Loading carriers...</div>}>
          <CarriersDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
