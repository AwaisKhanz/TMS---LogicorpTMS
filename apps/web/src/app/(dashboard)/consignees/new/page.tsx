import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ConsigneeForm } from "@/components/features/consignees/consignee-form";

export default function NewConsigneePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/consignees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Consignees
            </Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<div>Loading form...</div>}>
        <ConsigneeForm />
      </Suspense>
    </div>
  );
}
