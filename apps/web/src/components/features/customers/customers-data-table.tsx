"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  useCustomers,
  useExportCustomers,
} from "@/hooks/use-customer";
import {
  CanEdit,
  CanDelete,
} from "@/components/auth/can";
import { useToast } from "@/hooks/use-toast";
import type {
  CustomerFilters,
  Customer,
} from "@tms/shared-types";

interface CustomersDataTableProps {
  onDelete?: (id: string) => void;
}

// Using GetCustomersResponse from shared types

export function CustomersDataTable({ onDelete }: CustomersDataTableProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creditStatusFilter, setCreditStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("companyName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounce search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // Build filters object
  const filters: CustomerFilters = {
    search: debouncedSearchTerm,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    creditStatus:
      creditStatusFilter === "all"
        ? undefined
        : (creditStatusFilter as "good" | "warning" | "critical"),
    sort: sortBy as
      | "companyName"
      | "totalRevenue"
      | "totalLoads"
      | "creditLimit"
      | "createdAt"
      | "updatedAt",
    order: sortOrder,
    page,
    limit: 20,
  };

  const { data: customersData, isLoading, error } = useCustomers(filters);
  const { mutate: exportCustomers, isPending: isExporting } =
    useExportCustomers();

  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;

  const handleSort = (
    column:
      | "companyName"
      | "totalRevenue"
      | "totalLoads"
      | "creditLimit"
      | "createdAt"
      | "updatedAt"
  ) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleExport = () => {
    const exportFilters: CustomerFilters = {
      ...filters,
    };

    exportCustomers(exportFilters, {
      onSuccess: () => {
        toast({
          title: "Export Started",
          description: "Customer data export has been initiated",
        });
      },
      onError: () => {
        toast({
          title: "Export Failed",
          description: "Failed to export customer data",
          variant: "destructive",
        });
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCreditStatus = (creditUsed: number, creditLimit: number) => {
    const percentage = (creditUsed / creditLimit) * 100;
    if (percentage >= 90)
      return { status: "critical", color: "destructive" as const };
    if (percentage >= 70)
      return { status: "warning", color: "warning" as const };
    return { status: "good", color: "success" as const };
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading customers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Failed to load customers</p>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg">Customers Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={creditStatusFilter}
                onValueChange={setCreditStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Credit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Credit</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("companyName")}
                  >
                    <div className="flex items-center gap-2">
                      Company
                      <SortIcon column="companyName" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("companyName")}
                  >
                    <div className="flex items-center gap-2">
                      Payment Terms
                      <SortIcon column="paymentTerms" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("creditLimit")}
                  >
                    <div className="flex items-center gap-2">
                      Credit
                      <SortIcon column="creditUsed" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    <div className="flex items-center gap-2">
                      Revenue
                      <SortIcon column="totalRevenue" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("totalLoads")}
                  >
                    <div className="flex items-center gap-2">
                      Loads
                      <SortIcon column="totalLoads" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("companyName")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon column="isActive" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          creditStatusFilter !== "all"
                            ? "No customers found matching your filters"
                            : "No customers yet"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: Customer) => {
                    const creditStatus = getCreditStatus(
                      customer.creditUsed,
                      customer.creditLimit
                    );

                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {customer.companyName}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            <div>{customer.billingEmail}</div>
                            <div className="text-muted-foreground">
                              {customer.billingPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.paymentTerms}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <span>
                                {formatCurrency(customer.creditUsed)} /{" "}
                                {formatCurrency(customer.creditLimit)}
                              </span>
                              <Badge
                                variant={creditStatus.color}
                                className="text-xs"
                              >
                                {creditStatus.status}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {(
                                (customer.creditUsed / customer.creditLimit) *
                                100
                              ).toFixed(0)}
                              % used
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatCurrency(customer.totalRevenue)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.totalLoads}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              customer.isActive ? "default" : "secondary"
                            }
                          >
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <CanEdit resource="customer">
                                <DropdownMenuItem asChild>
                                  <Link href={`/customers/${customer.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              </CanEdit>
                              <DropdownMenuSeparator />
                              {onDelete && (
                                <CanDelete resource="customer">
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => onDelete(customer.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                </CanDelete>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to{" "}
                {Math.min(page * 20, pagination.total)} of {pagination.total}{" "}
                customers
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
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
