"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Search,
  Download,
  Settings,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  useCustomers,
  useBulkUpdateCustomers,
  useExportCustomers,
} from "@/hooks/use-customer";
import {
  CanEdit,
  CanDelete,
  CanDelete as CanBulkDelete,
} from "@/components/auth/can";
import { useToast } from "@/hooks/use-toast";
import { CUSTOMER_BULK_ACTIONS } from "@tms/shared-constants";
import type {
  CustomerFilters,
  Customer,
  BulkCustomerAction,
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
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkNote, setBulkNote] = useState("");

  // Build filters object
  const filters: CustomerFilters = {
    search: searchTerm,
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
  const { mutate: bulkUpdateCustomers, isPending: isBulkUpdating } =
    useBulkUpdateCustomers();
  const { mutate: exportCustomers, isPending: isExporting } =
    useExportCustomers();

  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map((customer: Customer) => customer.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers((prev) => [...prev, customerId]);
    } else {
      setSelectedCustomers((prev) => prev.filter((id) => id !== customerId));
    }
  };

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

  const handleBulkAction = () => {
    if (!bulkAction || selectedCustomers.length === 0) return;

    const bulkActionData: BulkCustomerAction = {
      customerIds: selectedCustomers,
      action: bulkAction as "activate" | "deactivate" | "export" | "delete",
    };

    bulkUpdateCustomers(bulkActionData, {
      onSuccess: () => {
        toast({
          title: "Bulk Action Completed",
          description: `Action "${bulkAction}" applied to ${selectedCustomers.length} customers`,
        });
        setShowBulkDialog(false);
        setBulkAction("");
        setBulkNote("");
        setSelectedCustomers([]);
      },
      onError: () => {
        toast({
          title: "Action Failed",
          description: "Failed to apply bulk action",
          variant: "destructive",
        });
      },
    });
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
            {selectedCustomers.length > 0 && (
              <CanBulkDelete resource="customer">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDialog(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Bulk Actions ({selectedCustomers.length})
                </Button>
              </CanBulkDelete>
            )}
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
              <Button
                variant="outline"
                onClick={() => setShowBulkDialog(true)}
                disabled={selectedCustomers.length === 0}
              >
                <Settings className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedCustomers.length})
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <CanBulkDelete resource="customer">
                      <Checkbox
                        checked={
                          selectedCustomers.length === customers.length &&
                          customers.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </CanBulkDelete>
                  </TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8">
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
                    const isSelected = selectedCustomers.includes(customer.id);

                    return (
                      <TableRow
                        key={customer.id}
                        className={isSelected ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <CanBulkDelete resource="customer">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectCustomer(
                                  customer.id,
                                  checked as boolean
                                )
                              }
                            />
                          </CanBulkDelete>
                        </TableCell>
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

          {/* Bulk Actions Dialog */}
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Actions</DialogTitle>
                <DialogDescription>
                  Apply actions to {selectedCustomers.length} selected customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an action" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_BULK_ACTIONS.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Note (Optional)</label>
                  <Input
                    placeholder="Add a note for this action..."
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || isBulkUpdating}
                >
                  {isBulkUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply Action
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
