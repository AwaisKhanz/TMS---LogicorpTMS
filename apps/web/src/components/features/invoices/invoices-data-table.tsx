"use client";

import { useState, useEffect } from "react";
import { useInvoices } from "@/hooks/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Eye,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info";
    icon: React.ReactNode;
  }
> = {
  DRAFT: {
    label: "Draft",
    variant: "secondary",
    icon: <FileText className="h-4 w-4" />,
  },
  SENT: {
    label: "Sent",
    variant: "default",
    icon: <Send className="h-4 w-4" />,
  },
  VIEWED: {
    label: "Viewed",
    variant: "default",
    icon: <Eye className="h-4 w-4" />,
  },
  PAID: {
    label: "Paid",
    variant: "success",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  PARTIAL: {
    label: "Partial",
    variant: "warning",
    icon: <Clock className="h-4 w-4" />,
  },
  OVERDUE: {
    label: "Overdue",
    variant: "destructive",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  VOID: {
    label: "Void",
    variant: "secondary",
    icon: <FileText className="h-4 w-4" />,
  },
};

export function InvoicesDataTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  // Debounce search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset page when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
    page: currentPage,
    limit,
  });

  const invoices = invoicesData?.data ?? [];
  const pagination = invoicesData?.pagination;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          Error loading invoices. Please try again.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="VIEWED">Viewed</SelectItem>
              <SelectItem value="PARTIAL">Partially Paid</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="VOID">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading invoices...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv: any) => {
                  const balance = Number(inv.total) - Number(inv.paidAmount || 0);
                  const status = statusConfig[inv.status] || {
                    label: inv.status,
                    variant: "secondary" as const,
                    icon: <FileText className="h-4 w-4" />,
                  };

                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>{inv.customer?.companyName || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="flex items-center gap-1.5 w-fit"
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.invoiceDate ? formatDate(inv.invoiceDate) : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(inv.total))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(inv.paidAmount || 0))}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          balance > 0 && "text-destructive"
                        )}
                      >
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/invoices/${inv.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Showing page {pagination.page} of {pagination.pages} (
              {pagination.total} total invoices)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pagination.pages || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

