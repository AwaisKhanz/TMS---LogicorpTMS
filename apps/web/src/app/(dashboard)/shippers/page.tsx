import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ShippersDataTable } from "@/components/features/shippers/shippers-data-table";
import { ShipperStats } from "@/components/features/shippers/shipper-stats";
import { CanCreate } from "@/components/auth/can";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function ShippersPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.SHIPPER_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shippers</h1>
              <p className="text-muted-foreground">
                Manage your shipper network and relationships
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view shippers. Please contact your
              administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shippers</h1>
            <p className="text-muted-foreground">
              Manage your shipper network and relationships
            </p>
          </div>
          <CanCreate resource="shipper">
            <Button asChild>
              <Link href="/shippers/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Shipper
              </Link>
            </Button>
          </CanCreate>
        </div>

        {/* Statistics */}
        <Suspense fallback={<div>Loading statistics...</div>}>
          <ShipperStats />
        </Suspense>

        {/* Shippers Table */}
        <Suspense fallback={<div>Loading shippers...</div>}>
          <ShippersDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
