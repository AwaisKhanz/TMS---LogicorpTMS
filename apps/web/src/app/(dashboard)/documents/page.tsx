import { Suspense } from "react";
import { DocumentsDataTable } from "@/components/features/documents/documents-data-table";
import { DocumentsHeader } from "@/components/features/documents/documents-header";
import { DocumentsLoading } from "@/components/features/documents/documents-loading";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <DocumentsHeader />
      <Suspense fallback={<DocumentsLoading />}>
        <DocumentsDataTable />
      </Suspense>
    </div>
  );
}