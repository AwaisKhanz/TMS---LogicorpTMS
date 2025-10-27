"use client";

import { useRouter } from "next/navigation";
import { useCarrier, useUpdateCarrier } from "@/hooks/use-carriers";
import type { UpdateCarrierInput } from "@/types/carrier.types";
import { CarrierForm } from "@/components/features/carriers/carrier-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";

interface CarrierEditPageProps {
  params: {
    id: string;
  };
}

export default function CarrierEditPage({ params }: CarrierEditPageProps) {
  return (
    <PermissionGuard
      permission={PERMISSIONS.CARRIER_EDIT}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Carrier
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to edit carriers. Please contact
                your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Access denied. Required permission: carrier:edit
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <CarrierEditContent params={params} />
    </PermissionGuard>
  );
}

function CarrierEditContent({ params }: CarrierEditPageProps) {
  const router = useRouter();
  const { data: carrier, isLoading, error } = useCarrier(params.id);
  const updateCarrier = useUpdateCarrier();

  const handleSubmit = async (data: UpdateCarrierInput) => {
    try {
      await updateCarrier.mutateAsync({
        id: params.id,
        data,
      });
      router.push(`/carriers/${params.id}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load carrier details. Please try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/carriers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Carriers
          </Link>
        </Button>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>Carrier not found.</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/carriers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Carriers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col w-full gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/carriers/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Carrier
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Carrier - {carrier.companyName}
          </h1>
          <p className="text-muted-foreground">Update carrier information</p>
        </div>
      </div>

      {/* Warning if carrier has loads */}
      {carrier.totalLoads > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This carrier has {carrier.totalLoads} load(s). Please be careful
            when editing critical information.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <CarrierForm
        initialData={carrier}
        onSubmit={handleSubmit}
        isSubmitting={updateCarrier.isPending}
      />
    </div>
  );
}
