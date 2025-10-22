import { Suspense } from "react";
import { DocumentTemplatesDataTable } from "@/components/features/documents/document-templates-data-table";
import { DocumentTemplatesHeader } from "@/components/features/documents/document-templates-header";
import { DocumentsLoading } from "@/components/features/documents/documents-loading";

export default function DocumentTemplatesPage() {
  return (
    <div className="space-y-6">
      <DocumentTemplatesHeader />
      <Suspense fallback={<DocumentsLoading />}>
        <DocumentTemplatesDataTable />
      </Suspense>
    </div>
  );
}