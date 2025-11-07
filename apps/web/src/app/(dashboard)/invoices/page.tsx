import { Suspense } from "react";
import { InvoicesDataTable } from "@/components/features/invoices/invoices-data-table";
import { InvoicesHeader } from "@/components/features/invoices/invoices-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";
import { Loader2 } from "lucide-react";

function InvoicesLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.INVOICE_VIEW}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-muted-foreground">
                Track and manage your invoices and payments
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to view invoices. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        <InvoicesHeader />
        <Suspense fallback={<InvoicesLoading />}>
          <InvoicesDataTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
