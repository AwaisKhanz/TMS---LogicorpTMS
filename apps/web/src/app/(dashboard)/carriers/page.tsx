import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CarriersDataTable } from "@/components/features/carriers/carriers-data-table";
import { CarrierStats } from "@/components/features/carriers/carrier-stats";
import { CanCreate } from "@/components/auth/can";

export default function CarriersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carriers</h1>
          <p className="text-muted-foreground">
            Manage your carrier network and relationships
          </p>
        </div>
        <CanCreate resource="carrier">
          <Button asChild>
            <Link href="/carriers/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Carrier
            </Link>
          </Button>
        </CanCreate>
      </div>

      {/* Statistics */}
      <Suspense fallback={<div>Loading statistics...</div>}>
        <CarrierStats />
      </Suspense>

      {/* Carriers Table */}
      <Suspense fallback={<div>Loading carriers...</div>}>
        <CarriersDataTable />
      </Suspense>
    </div>
  );
}
