"use client";

import { useRouter } from "next/navigation";
import { useCreateLoad } from "@/hooks/use-loads";
import { LoadForm } from "@/components/features/loads/load-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CreateLoadInput } from "@/types/load.types";

export default function NewLoadPage() {
  const router = useRouter();
  const createLoad = useCreateLoad();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const newLoad = await createLoad.mutateAsync(
      data as unknown as CreateLoadInput
    );
    router.push(`/loads/${newLoad.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/loads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loads
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Load</h1>
          <p className="text-muted-foreground">
            Enter the details for your new shipment
          </p>
        </div>
      </div>

      {/* Form */}
      <LoadForm onSubmit={handleSubmit} isSubmitting={createLoad.isPending} />
    </div>
  );
}
