"use client";

import { useParams, useRouter } from "next/navigation";
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customer";
import type { UpdateCustomerRequest } from "@/types/customer.types";
import { CustomerForm } from "@/components/features/customers/customer-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-client";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: customer, isLoading, error } = useCustomer(id);
  const updateCustomer = useUpdateCustomer(id);

  const handleSubmit = async (data: UpdateCustomerRequest) => {
    try {
      await updateCustomer.mutateAsync(data);
      router.push(`/customers/${id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Customer not found</p>
        <Button asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission={PERMISSIONS.CUSTOMER_EDIT}
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/customers/${id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customer
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Edit Customer</h1>
              <p className="text-muted-foreground mt-1">
                Update {customer.data.companyName}&apos;s information
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to edit customers. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col  gap-4">
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/customers/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customer
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Edit Customer
            </h1>
            <p className="text-muted-foreground mt-1">
              Update {customer.data.companyName}&apos;s information
            </p>
          </div>
        </div>

        {/* Form */}
        <CustomerForm
          initialData={customer.data}
          onSubmit={handleSubmit}
          isSubmitting={updateCustomer.isPending}
        />
      </div>
    </PermissionGuard>
  );
}
