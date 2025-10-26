"use client";

import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/hooks/use-customer";
import type { CreateCustomerRequest } from "@/types/customer.types";
import { CustomerForm } from "@/components/features/customers/customer-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (data: CreateCustomerRequest) => {
    try {
      const newCustomer = await createCustomer.mutateAsync(data);
      router.push(`/customers/${newCustomer.data.id}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <PermissionGuard
      permission={PERMISSIONS.CUSTOMER_CREATE}
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col w-full gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/customers">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Add New Customer</h1>
              <p className="text-muted-foreground mt-1">
                Create a new customer account in your system
              </p>
            </div>
          </div>
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have permission to create customers. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col w-full gap-4">
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Customers
              </Link>
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Add New Customer
            </h1>
            <p className="text-muted-foreground mt-1">
              Create a new customer account in your system
            </p>
          </div>
        </div>

        {/* Form */}
        <CustomerForm
          onSubmit={handleSubmit}
          isSubmitting={createCustomer.isPending}
        />
      </div>
    </PermissionGuard>
  );
}
