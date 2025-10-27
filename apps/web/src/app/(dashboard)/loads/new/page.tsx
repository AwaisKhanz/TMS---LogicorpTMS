"use client";

import { useRouter } from "next/navigation";
import { useCreateLoad } from "@/hooks/use-loads";
import { LoadForm } from "@/components/features/loads/load-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CreateLoadRequest as CreateLoadInput } from "@tms/shared-types";

export default function NewLoadPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.LOAD_CREATE}
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create New Load
              </h1>
              <p className="text-muted-foreground mt-1">
                You don&apos;t have permission to create loads. Please contact
                your administrator.
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Access denied. Required permission: load:create
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <NewLoadContent />
    </PermissionGuard>
  );
}

function NewLoadContent() {
  const router = useRouter();
  const createLoad = useCreateLoad();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const newLoad = await createLoad.mutateAsync(
      data as unknown as CreateLoadInput
    );
    router.push(`/loads/${newLoad.id}`);
  };

  return (
    <div className="h-full bg-background">
      <div className="w-full ">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/loads">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Loads
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create New Load
              </h1>
              <p className="text-muted-foreground mt-1">
                Enter all the details for your new shipment
              </p>
            </div>
          </div>
        </div>

        {/* Single Form */}
        <LoadForm onSubmit={handleSubmit} isSubmitting={createLoad.isPending} />
      </div>
    </div>
  );
}
