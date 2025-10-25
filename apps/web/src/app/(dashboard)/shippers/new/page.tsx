import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ShipperForm } from "@/components/features/shippers/shipper-form";

export default function NewShipperPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/shippers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shippers
            </Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<div>Loading form...</div>}>
        <ShipperForm />
      </Suspense>
    </div>
  );
}
