"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Eye,
  Download,
  Send,
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCustomerInvoices } from "@/hooks/use-customer";
import { CustomerInvoice } from "@tms/shared-types";

// Local formatCurrency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface CustomerInvoicesProps {
  customerId: string;
}

export function CustomerInvoices({ customerId }: CustomerInvoicesProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search term (500ms delay) for client-side filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useCustomerInvoices(customerId, page, 20);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<
      string,
      "secondary" | "default" | "success" | "warning" | "destructive"
    > = {
      DRAFT: "secondary",
      SENT: "default",
      VIEWED: "default",
      PAID: "success",
      PARTIAL: "warning",
      OVERDUE: "destructive",
      VOID: "secondary",
    };
    return statusColors[status] || "secondary";
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      DRAFT: <FileText className="h-4 w-4" />,
      SENT: <Send className="h-4 w-4" />,
      VIEWED: <Eye className="h-4 w-4" />,
      PAID: <CheckCircle className="h-4 w-4" />,
      PARTIAL: <Clock className="h-4 w-4" />,
      OVERDUE: <AlertTriangle className="h-4 w-4" />,
      VOID: <FileText className="h-4 w-4" />,
    };
    return statusIcons[status] || <FileText className="h-4 w-4" />;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      SENT: "Sent",
      VIEWED: "Viewed",
      PAID: "Paid",
      PARTIAL: "Partial",
      OVERDUE: "Overdue",
      VOID: "Void",
    };
    return statusLabels[status] || status;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "PAID" || status === "VOID") return false;
    return new Date(dueDate) < new Date();
  };

  const filteredInvoices =
    invoicesData?.data.filter((invoice: CustomerInvoice) => {
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
      const matchesSearch = invoice.invoiceNumber
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Failed to load invoices</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {invoicesData?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoicesData.summary.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(invoicesData.summary.totalAmount)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(invoicesData.summary.paidAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoicesData.summary.totalAmount > 0
                  ? (
                      (invoicesData.summary.paidAmount /
                        invoicesData.summary.totalAmount) *
                      100
                    ).toFixed(1)
                  : 0}
                % paid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {formatCurrency(invoicesData.summary.outstandingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoicesData.summary.totalAmount > 0
                  ? (
                      (invoicesData.summary.outstandingAmount /
                        invoicesData.summary.totalAmount) *
                      100
                    ).toFixed(1)
                  : 0}
                % outstanding
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(invoicesData.summary.overdueAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoicesData.summary.totalAmount > 0
                  ? (
                      (invoicesData.summary.overdueAmount /
                        invoicesData.summary.totalAmount) *
                      100
                    ).toFixed(1)
                  : 0}
                % overdue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="VIEWED">Viewed</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="VOID">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice: CustomerInvoice) => {
                const balance = invoice.total - invoice.paidAmount;
                const isInvoiceOverdue = isOverdue(
                  invoice.dueDate,
                  invoice.status
                );

                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusColor(invoice.status)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                        {isInvoiceOverdue && invoice.status !== "PAID" && (
                          <AlertTriangle className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {formatDate(invoice.dueDate)}
                        {isInvoiceOverdue && invoice.status !== "PAID" && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                    <TableCell>
                      <div
                        className={`font-medium ${balance > 0 ? "text-destructive" : "text-success"}`}
                      >
                        {formatCurrency(balance)}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.paymentMethod || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Invoice
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {invoice.status === "SENT" && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          {balance > 0 && invoice.status !== "PAID" && (
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No invoices found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "This customer hasn't been invoiced yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {invoicesData?.pagination && invoicesData.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to{" "}
            {Math.min(page * 20, invoicesData.pagination.total)} of{" "}
            {invoicesData.pagination.total} invoices
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= invoicesData.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
