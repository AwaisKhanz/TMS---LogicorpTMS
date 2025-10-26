import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ConsigneesDataTable } from "@/components/features/consignees/consignees-data-table";
import { ConsigneeStats } from "@/components/features/consignees/consignee-stats";
import { CanCreate } from "@/components/auth/can";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function ConsigneesPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CONSIGNEE_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Consignees</h1>
              <p className="text-muted-foreground">
                Manage your consignee network and relationships
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view consignees. Please contact
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
            <h1 className="text-3xl font-bold tracking-tight">Consignees</h1>
            <p className="text-muted-foreground">
              Manage your consignee network and relationships
            </p>
          </div>
          <CanCreate resource="consignee">
            <Button asChild>
              <Link href="/consignees/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Consignee
              </Link>
            </Button>
          </CanCreate>
        </div>

        {/* Statistics */}
        <Suspense fallback={<div>Loading statistics...</div>}>
          <ConsigneeStats />
        </Suspense>

        {/* Consignees Table */}
        <Suspense fallback={<div>Loading consignees...</div>}>
          <ConsigneesDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
