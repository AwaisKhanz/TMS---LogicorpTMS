"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsHeader } from "@/components/features/reports/reports-header";
import { ReportsDataTable } from "@/components/features/reports/reports-data-table";
import { ReportFilters } from "@tms/shared-types";

export default function ReportsPage() {
  const router = useRouter();
  const [filters] = useState<ReportFilters>({
    page: 1,
    limit: 50,
  });

  const handleCreateReport = () => {
    router.push("/reports/new");
  };

  return (
    <PermissionGuard permission={PERMISSIONS.REPORT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Reports & Analytics"
          description="Generate comprehensive reports and analyze your business performance"
        />

        <ReportsHeader onCreateReport={handleCreateReport} />

        <ReportsDataTable initialFilters={filters} />
      </div>
    </PermissionGuard>
  );
}
