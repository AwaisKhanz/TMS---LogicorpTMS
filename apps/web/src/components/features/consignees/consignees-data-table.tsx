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
  useConsignees,
  useBulkUpdateConsignees,
  useExportConsignees,
  useDeleteConsignee,
} from "@/hooks/use-consignee";
import { useToast } from "@/hooks/use-toast";
import type { ConsigneeFilters, BulkConsigneeAction } from "@tms/shared-types";
import {
  CanEdit,
  CanDelete,
  CanDelete as CanBulkDelete,
} from "@/components/auth/can";

export function ConsigneesDataTable() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ConsigneeFilters>({
    page: 1,
    limit: 50,
  });
  const [selectedConsignees, setSelectedConsignees] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");

  const { data: consigneesData, isLoading, error } = useConsignees(filters);
  const bulkUpdateMutation = useBulkUpdateConsignees();
  const exportMutation = useExportConsignees();
  const deleteConsignee = useDeleteConsignee();

  const consignees = consigneesData?.data || [];
  const total = consigneesData?.pagination?.total || 0;
  const pages = consigneesData?.pagination?.pages || 0;

  const handleFilterChange = (
    key: keyof ConsigneeFilters,
    value: string | number | boolean | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConsignees(consignees.map((consignee) => consignee.id));
    } else {
      setSelectedConsignees([]);
    }
  };

  const handleSelectConsignee = (consigneeId: string, checked: boolean) => {
    if (checked) {
      setSelectedConsignees((prev) => [...prev, consigneeId]);
    } else {
      setSelectedConsignees((prev) => prev.filter((id) => id !== consigneeId));
    }
  };

  const handleBulkAction = async () => {
    if (selectedConsignees.length === 0) {
      toast({
        title: "No consignees selected",
        description: "Please select consignees to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    const action: BulkConsigneeAction = {
      consigneeIds: selectedConsignees,
      action: bulkAction as "activate" | "deactivate",
    };

    try {
      await bulkUpdateMutation.mutateAsync(action);
      setSelectedConsignees([]);
      setBulkActionDialog(false);
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync(filters);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleDelete = async (consigneeId: string) => {
    try {
      await deleteConsignee.mutateAsync(consigneeId);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">Failed to load consignees</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by company name..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <Input
                placeholder="Filter by state..."
                value={filters.state || ""}
                onChange={(e) => handleFilterChange("state", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.isActive?.toString() || ""}
                onValueChange={(value) =>
                  handleFilterChange(
                    "isActive",
                    value === "" ? undefined : value === "true"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedConsignees.length > 0 && (
        <CanBulkDelete resource="consignee">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedConsignees.length} consignee(s) selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkActionDialog(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConsignees([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CanBulkDelete>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <CanBulkDelete resource="consignee">
                      <Checkbox
                        checked={
                          selectedConsignees.length === consignees.length &&
                          consignees.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </CanBulkDelete>
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Loads</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading consignees...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : consignees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No consignees found
                    </TableCell>
                  </TableRow>
                ) : (
                  consignees.map((consignee) => (
                    <TableRow key={consignee.id}>
                      <TableCell>
                        <CanBulkDelete resource="consignee">
                          <Checkbox
                            checked={selectedConsignees.includes(consignee.id)}
                            onCheckedChange={(checked) =>
                              handleSelectConsignee(
                                consignee.id,
                                checked as boolean
                              )
                            }
                          />
                        </CanBulkDelete>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {consignee.companyName}
                          </div>
                          {consignee.contactPerson && (
                            <div className="text-sm text-muted-foreground">
                              {consignee.contactPerson}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {consignee.phone && (
                            <div className="text-sm">{consignee.phone}</div>
                          )}
                          {consignee.email && (
                            <div className="text-sm text-muted-foreground">
                              {consignee.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {consignee.city}, {consignee.state}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {consignee.zipCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={consignee.isActive ? "default" : "secondary"}
                        >
                          {consignee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {consignee._count?.loads || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/consignees/${consignee.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <CanEdit resource="consignee">
                              <DropdownMenuItem asChild>
                                <Link href={`/consignees/${consignee.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            </CanEdit>
                            <DropdownMenuSeparator />
                            <CanDelete resource="consignee">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(consignee.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </CanDelete>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((filters.page || 1) - 1) * (filters.limit || 50) + 1} to{" "}
            {Math.min((filters.page || 1) * (filters.limit || 50), total)} of{" "}
            {total} consignees
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleFilterChange("page", (filters.page || 1) - 1)
              }
              disabled={filters.page === 1}
            >
              <ChevronUp className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleFilterChange("page", (filters.page || 1) + 1)
              }
              disabled={filters.page === pages}
            >
              <ChevronDown className="h-4 w-4" />
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Select an action to perform on {selectedConsignees.length}{" "}
              selected consignee(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate">Activate</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Apply Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
