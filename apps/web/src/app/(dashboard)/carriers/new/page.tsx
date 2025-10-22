"use client";

import { useRouter } from "next/navigation";
import { useCreateCarrier } from "@/hooks/use-carriers";
import type { CreateCarrierInput } from "@/types/carrier.types";
import { CarrierForm } from "@/components/features/carriers/carrier-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCarrierPage() {
  const router = useRouter();
  const createCarrier = useCreateCarrier();

  const handleSubmit = async (data: CreateCarrierInput) => {
    const newCarrier = await createCarrier.mutateAsync(data);
    router.push(`/carriers/${newCarrier.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/carriers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Carriers
          </Link>
        </Button>
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
