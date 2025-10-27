"use client";

import { useRouter } from "next/navigation";
import { useCreateCarrier } from "@/hooks/use-carriers";
import type { CreateCarrierInput } from "@/types/carrier.types";
import { CarrierForm } from "@/components/features/carriers/carrier-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewCarrierPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CARRIER_CREATE}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Add New Carrier
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to create carriers. Please
                contact your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Access denied. Required permission: carrier:create
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <NewCarrierContent />
    </PermissionGuard>
  );
}

function NewCarrierContent() {
  const router = useRouter();
  const createCarrier = useCreateCarrier();

  const handleSubmit = async (data: CreateCarrierInput) => {
    const newCarrier = await createCarrier.mutateAsync(data);
    router.push(`/carriers/${newCarrier.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col w-full gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/carriers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Carriers
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Carrier</h1>
          <p className="text-muted-foreground">
            Register a new carrier to your network
          </p>
        </div>
      </div>

      {/* Form */}
      <CarrierForm
        onSubmit={handleSubmit}
        isSubmitting={createCarrier.isPending}
      />
    </div>
  );
}
