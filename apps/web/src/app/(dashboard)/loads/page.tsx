import { Suspense } from "react";
import { LoadsDataTable } from "@/components/features/loads/loads-data-table";
import { LoadsHeader } from "@/components/features/loads/loads-header";
import { LoadsLoading } from "@/components/features/loads/loads-loading";

export default function LoadsPage() {
  return (
    <div className="space-y-6">
      <LoadsHeader />
      <Suspense fallback={<LoadsLoading />}>
        <LoadsDataTable />
      </Suspense>
    </div>
  );
}