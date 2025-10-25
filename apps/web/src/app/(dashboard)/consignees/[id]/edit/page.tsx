"use client";

import { useParams } from "next/navigation";
import { useConsignee } from "@/hooks/use-consignee";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ConsigneeForm } from "@/components/features/consignees/consignee-form";

export default function EditConsigneePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: consigneeData, isLoading, error } = useConsignee(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading consignee...</span>
        </div>
      </div>
    );
  }

  if (error || !consigneeData?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Consignee not found</h2>
          <p className="text-muted-foreground mb-4">
            The consignee you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/consignees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consignees
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
            <Link href={`/consignees/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consignee
            </Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <ConsigneeForm consignee={consigneeData.data} mode="edit" />
    </div>
  );
}
