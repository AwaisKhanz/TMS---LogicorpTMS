import { Suspense } from "react";
import { LoadsDataTable } from "@/components/features/loads/loads-data-table";
import { LoadsHeader } from "@/components/features/loads/loads-header";
import { LoadsLoading } from "@/components/features/loads/loads-loading";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function LoadsPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.LOAD_VIEW_ALL}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Loads</h1>
              <p className="text-muted-foreground">
                Manage and track your transportation loads
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view loads. Please contact your
              administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        <LoadsHeader />
        <Suspense fallback={<LoadsLoading />}>
          <LoadsDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
