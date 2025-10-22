"use client";

import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/hooks/use-customer";
import type { CreateCustomerRequest } from "@/types/customer.types";
import { CustomerForm } from "@/components/features/customers/customer-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (data: CreateCustomerRequest) => {
    try {
      const newCustomer = await createCustomer.mutateAsync(data);
      toast.success("Customer created successfully!");
      router.push(`/customers/${newCustomer.id}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create customer");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Add New Customer
          </h1>
          <p className="text-muted-foreground">
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
  );
}
