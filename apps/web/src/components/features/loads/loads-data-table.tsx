"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useLoads, useDeleteLoad } from "@/hooks/use-loads";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Truck,
} from "lucide-react";
import {
  CanEdit,
  CanDelete,
  CanCreate,
} from "@/components/auth/can";
import { cn } from "@/lib/utils";
import Link from "next/link";

const statusConfig = {
  QUOTE: { label: "Quote", variant: "secondary" as const },
  BOOKED: { label: "Booked", variant: "info" as const },
  DISPATCHED: { label: "Dispatched", variant: "warning" as const },
  IN_TRANSIT: { label: "In Transit", variant: "default" as const },
  DELIVERED: { label: "Delivered", variant: "success" as const },
  POD_RECEIVED: { label: "POD Received", variant: "success" as const },
  COMPLETED: { label: "Completed", variant: "success" as const },
  PAID: { label: "Paid", variant: "success" as const },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const },
};

export function LoadsDataTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoadId, setDeleteLoadId] = useState<string | null>(null);

  const deleteLoad = useDeleteLoad();

  // Debounce search term (500ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Reset page when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const {
    data: loadsData,
    isLoading,
    error,
  } = useLoads({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
    page: currentPage,
    limit: 50,
  });

  const loads = loadsData?.data || [];
  const pagination = loadsData?.pagination;

  const handleDeleteLoad = async () => {
    if (deleteLoadId) {
      await deleteLoad.mutateAsync(deleteLoadId);
      setDeleteLoadId(null);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat("en-US").format(weight) + " lbs";
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <p>Failed to load loads. Please try again.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Loads Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search loads, commodities, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="QUOTE">Quote</SelectItem>
                    <SelectItem value="BOOKED">Booked</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="POD_RECEIVED">POD Received</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : loads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No loads found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first load or adjust your filters.
              </p>
              <CanCreate resource="load">
                <Button asChild>
                  <Link href="/loads/new">Create Load</Link>
                </Button>
              </CanCreate>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loads.map((load) => (
                      <TableRow
                        key={load.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/loads/${load.id}`)}
                      >
                        <TableCell className="font-medium">
                          {load.loadNumber}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              statusConfig[
                                load.status as keyof typeof statusConfig
                              ]?.variant
                            }
                            className="whitespace-nowrap"
                          >
                            {
                              statusConfig[
                                load.status as keyof typeof statusConfig
                              ]?.label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {load.customer.companyName}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">
                          {load.carrier ? (
                            <div>
                              <div className="font-medium">
                                {load.carrier.companyName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {load.carrier.mcNumber}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not assigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {load.loadShippers && load.loadShippers.length > 0 ? (
                              <>
                                {load.loadShippers
                                  .filter(s => s.isPrimary)
                                  .map(shipperRelation => (
                                    <div key={shipperRelation.id}>
                                      {(shipperRelation.shipper.address as any)?.city || ""}, {(shipperRelation.shipper.address as any)?.state || ""}
                                      {load.loadShippers!.length > 1 && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (+{load.loadShippers!.length - 1})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                <div className="text-muted-foreground">→</div>
                                {load.loadConsignees && load.loadConsignees.length > 0 ? (
                                  load.loadConsignees
                                    .filter(c => c.isPrimary)
                                    .map(consigneeRelation => (
                                      <div key={consigneeRelation.id}>
                                        {(consigneeRelation.consignee.address as any)?.city || ""}, {(consigneeRelation.consignee.address as any)?.state || ""}
                                        {load.loadConsignees!.length > 1 && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            (+{load.loadConsignees!.length - 1})
                                          </span>
                                        )}
                                      </div>
                                    ))
                                ) : (
                                  <div className="text-muted-foreground">No delivery location</div>
                                )}
                              </>
                            ) : (
                              // Fallback for backward compatibility
                              <>
                                <div className="text-muted-foreground">
                                  No pickup location
                                </div>
                                <div className="text-muted-foreground">→</div>
                                <div className="text-muted-foreground">
                                  No delivery location
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {(() => {
                            const ps = load.loadShippers?.find(s => s.isPrimary) || load.loadShippers?.[0];
                            return ps?.pickupDate
                              ? format(new Date(ps.pickupDate), "MMM dd, yyyy")
                              : "-";
                          })()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {(() => {
                            const pc = load.loadConsignees?.find(c => c.isPrimary) || load.loadConsignees?.[0];
                            return pc?.deliveryDate
                              ? format(new Date(pc.deliveryDate), "MMM dd, yyyy")
                              : "-";
                          })()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium">{load.commodity}</div>
                            <div className="text-muted-foreground">
                              {formatWeight(load.weight)} •{" "}
                              {load.equipmentType.replace("_", " ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatCurrency(load.customerRate)}
                            </div>
                            {load.carrierRate && (
                              <div className="text-muted-foreground">
                                Cost: {formatCurrency(load.carrierRate)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {load.margin !== null && load.margin !== undefined ? (
                            <div
                              className={cn(
                                "text-sm font-medium",
                                load.margin > 0
                                  ? "text-success"
                                  : "text-destructive"
                              )}
                            >
                              {formatCurrency(load.margin ?? null)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/loads/${load.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <CanEdit resource="load">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/loads/${load.id}/edit`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Load
                                </DropdownMenuItem>
                              </CanEdit>
                              <CanDelete resource="load">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteLoadId(load.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Load
                                </DropdownMenuItem>
                              </CanDelete>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <p className="text-sm text-muted-foreground">
                Showing {loads.length} of {pagination.total} loads
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteLoadId}
        onOpenChange={() => setDeleteLoadId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this load? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLoad} variant="destructive">
              {deleteLoad.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
