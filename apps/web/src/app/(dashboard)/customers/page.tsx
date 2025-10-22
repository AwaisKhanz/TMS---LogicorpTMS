import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CustomersDataTable } from "@/components/features/customers/customers-data-table";
import { CustomerStats } from "@/components/features/customers/customer-stats";
import { CanCreate } from "@/components/auth/can";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and accounts
          </p>
        </div>
        <CanCreate resource="customer">
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </CanCreate>
      </div>

      {/* Statistics */}
      <Suspense fallback={<div>Loading statistics...</div>}>
        <CustomerStats />
      </Suspense>

      {/* Customers Table */}
      <Suspense fallback={<div>Loading customers...</div>}>
        <CustomersDataTable />
      </Suspense>
    </div>
  );
}
