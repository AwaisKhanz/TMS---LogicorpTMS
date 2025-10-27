import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { ConsigneeForm } from "@/components/features/consignees/consignee-form";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewConsigneePage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CONSIGNEE_CREATE}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Add New Consignee
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to create consignees. Please
                contact your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Access denied. Required permission: consignee:create
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
              <Link href="/consignees">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Consignees
              </Link>
            </Button>
          </div>
        </div>

        {/* Form */}
        <Suspense fallback={<div>Loading form...</div>}>
          <ConsigneeForm />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
