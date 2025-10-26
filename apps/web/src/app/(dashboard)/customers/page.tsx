import { Suspense } from "react";
import { CustomersDataTable } from "@/components/features/customers/customers-data-table";
import { CustomersHeader } from "@/components/features/customers/customers-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function CustomersPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CUSTOMER_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground">
                Manage your customer relationships and accounts
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view customers. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        <CustomersHeader />
        <Suspense fallback={<div>Loading customers...</div>}>
          <CustomersDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
