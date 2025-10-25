"use client";

import { useRouter } from "next/navigation";
import { useLoad, useUpdateLoad } from "@/hooks/use-loads";
import { LoadForm } from "@/components/features/loads/load-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface LoadEditPageProps {
  params: {
    id: string;
  };
}

export default function LoadEditPage({ params }: LoadEditPageProps) {
  const router = useRouter();
  const { data: load, isLoading, error } = useLoad(params.id);
  const updateLoad = useUpdateLoad();

  // Check if load can be edited based on status
  const canEdit =
    load && !["PAID", "CANCELLED", "COMPLETED"].includes(load.status);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateLoad.mutateAsync({
        id: params.id,
        data,
      });
      router.push(`/loads/${params.id}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Transform load data for the form (convert string dates to Date objects)
  const formInitialData = load
    ? {
        ...load,
        pickupDate: new Date(load.pickupDate),
        deliveryDate: new Date(load.deliveryDate),
        shipperId: load.shipperId,
        consigneeId: load.consigneeId,
      }
    : undefined;

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
            Failed to load load details. Please try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/loads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loads
          </Link>
        </Button>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>Load not found.</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/loads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loads
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/loads/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Load
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Load {load.loadNumber}
          </h1>
          <p className="text-muted-foreground">Update load information</p>
        </div>
      </div>

      {/* Warning if load is in advanced status */}
      {!canEdit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This load cannot be edited because it is in {load.status} status.
            Only loads in earlier stages can be modified.
          </AlertDescription>
        </Alert>
      )}

      {load.status === "DELIVERED" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This load has been delivered. Please be careful when making changes
            as it may affect invoicing and records.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {canEdit && (
        <LoadForm
          initialData={formInitialData}
          onSubmit={handleSubmit}
          isSubmitting={updateLoad.isPending}
        />
      )}
    </div>
  );
}
