"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  MoreHorizontal,
  FileText,
  Download,
  Trash2,
  Edit,
  Eye,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { reportService } from "@/services/report.service";
import {
  Report,
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportFilters,
} from "@tms/shared-types";
import {
  CanEdit,
  CanDelete,
  CanDelete as CanBulkDelete,
} from "@/components/auth/can";
import { DeleteReportDialog } from "./delete-report-dialog";
import { GenerateReportDialog } from "./generate-report-dialog";
import { ReportFilters as ReportFiltersComponent } from "./report-filters";

const reportTypeLabels: Record<ReportType, string> = {
  LOAD_ANALYTICS: "Load Analytics",
  CARRIER_PERFORMANCE: "Carrier Performance",
  CUSTOMER_ANALYTICS: "Customer Analytics",
  REVENUE_ANALYSIS: "Revenue Analysis",
  OPERATIONAL_METRICS: "Operational Metrics",
  TEAM_PERFORMANCE: "Team Performance",
  FINANCIAL_SUMMARY: "Financial Summary",
  CUSTOM: "Custom Report",
};

const reportStatusLabels: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  SCHEDULED: "Scheduled",
  FAILED: "Failed",
};

const reportFormatLabels: Record<ReportFormat, string> = {
  PDF: "PDF",
  EXCEL: "Excel",
  CSV: "CSV",
  JSON: "JSON",
};

const statusColors: Record<ReportStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  GENERATED: "bg-success/10 text-success",
  SCHEDULED: "bg-info/10 text-info",
  FAILED: "bg-destructive/10 text-destructive",
};

interface ReportsDataTableProps {
  initialFilters?: ReportFilters;
}

export function ReportsDataTable({ initialFilters }: ReportsDataTableProps) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters || {});
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [generateReportId, setGenerateReportId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch reports
  const {
    data: reportsData,
    // isLoading,
    error,
  } = useQuery({
    queryKey: ["reports", filters],
    queryFn: () => reportService.getReports(filters),
  });

  // Delete report mutation
  const deleteReport = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted successfully");
      setDeleteReportId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete report");
    },
  });

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: (data: { reportId: string; format?: ReportFormat }) =>
      reportService.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report generation started");
      setGenerateReportId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate report");
    },
  });

  // Bulk delete mutation
  const bulkDelete = useMutation({
    mutationFn: (reportIds: string[]) => reportService.bulkDelete(reportIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      if (result.data.successful.length > 0) {
        toast.success(
          `${result.data.successful.length} reports deleted successfully`
        );
      }
      if (result.data.failed.length > 0) {
        toast.error(`${result.data.failed.length} reports failed to delete`);
      }
      setSelectedReports([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete reports");
    },
  });

  const handleBulkDelete = () => {
    if (selectedReports.length === 0) return;
    bulkDelete.mutate(selectedReports);
  };

  const handleExport = async () => {
    try {
      const blob = await reportService.exportReports(filters, "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Reports exported successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to export reports");
    }
  };

  const columns: ColumnDef<Report>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <CanBulkDelete resource="report">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </CanBulkDelete>
      ),
      cell: ({ row }) => (
        <CanBulkDelete resource="report">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </CanBulkDelete>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{report.name}</div>
              {report.description && (
                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {report.description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as ReportType;
        return (
          <Badge variant="outline">{reportTypeLabels[type] || type}</Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ReportStatus;
        return (
          <Badge className={statusColors[status]}>
            {reportStatusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "format",
      header: "Format",
      cell: ({ row }) => {
        const format = row.getValue("format") as ReportFormat;
        return (
          <Badge variant="secondary">
            {reportFormatLabels[format] || format}
          </Badge>
        );
      },
    },
    {
      accessorKey: "creator",
      header: "Created By",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div>
            <div className="font-medium">
              {report.creator.firstName} {report.creator.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {report.creator.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div>
            <div>{format(date, "MMM dd, yyyy")}</div>
            <div className="text-sm text-muted-foreground">
              {format(date, "HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "generatedAt",
      header: "Generated",
      cell: ({ row }) => {
        const report = row.original;
        if (!report.generatedAt) {
          return <span className="text-muted-foreground">-</span>;
        }
        const date = new Date(report.generatedAt);
        return (
          <div>
            <div>{format(date, "MMM dd, yyyy")}</div>
            <div className="text-sm text-muted-foreground">
              {format(date, "HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(report.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`/reports/${report.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </a>
              </DropdownMenuItem>
              <CanEdit resource="report">
                <DropdownMenuItem asChild>
                  <a
                    href={`/reports/${report.id}/edit`}
                    className="flex items-center"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </a>
                </DropdownMenuItem>
              </CanEdit>
              <DropdownMenuItem
                onClick={() => setGenerateReportId(report.id)}
                className="flex items-center"
              >
                <Play className="mr-2 h-4 w-4" />
                Generate
              </DropdownMenuItem>
              {report.fileUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </a>
                </DropdownMenuItem>
              )}
              <CanDelete resource="report">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteReportId(report.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </CanDelete>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load reports
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["reports"] })
            }
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReportFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        selectedCount={selectedReports.length}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDelete.isPending}
      />

      <DataTable columns={columns} data={reportsData?.data.data || []} />

      <DeleteReportDialog
        reportId={deleteReportId}
        onClose={() => setDeleteReportId(null)}
        onConfirm={() => {
          if (deleteReportId) {
            deleteReport.mutate(deleteReportId);
          }
        }}
        isDeleting={deleteReport.isPending}
      />

      <GenerateReportDialog
        reportId={generateReportId}
        onClose={() => setGenerateReportId(null)}
        onConfirm={(data) => {
          if (generateReportId) {
            generateReport.mutate({ reportId: generateReportId, ...data });
          }
        }}
        isGenerating={generateReport.isPending}
      />
    </div>
  );
}
