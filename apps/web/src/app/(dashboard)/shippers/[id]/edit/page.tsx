"use client";

import { useParams } from "next/navigation";
import { useShipper } from "@/hooks/use-shipper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { ShipperForm } from "@/components/features/shippers/shipper-form";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditShipperPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.SHIPPER_EDIT}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Shipper
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to edit shippers. Please contact
                your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Access denied. Required permission: shipper:edit
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <EditShipperContent />
    </PermissionGuard>
  );
}

function EditShipperContent() {
  const params = useParams();
  const id = params.id as string;

  const { data: shipperData, isLoading, error } = useShipper(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading shipper...</span>
        </div>
      </div>
    );
  }

  if (error || !shipperData?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Shipper not found</h2>
          <p className="text-muted-foreground mb-4">
            The shipper you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/shippers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shippers
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/shippers/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shipper
            </Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <ShipperForm shipper={shipperData.data} mode="edit" />
    </div>
  );
}
