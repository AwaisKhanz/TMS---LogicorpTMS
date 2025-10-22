"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useCarriers, useDeleteCarrier } from "@/hooks/use-carriers";
import type { Carrier } from "@tms/shared-types";
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
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  UserCheck,
  Star,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const equipmentConfig = {
  DRY_VAN: { label: "Dry Van", color: "bg-blue-100 text-blue-800" },
  REEFER: { label: "Reefer", color: "bg-cyan-100 text-cyan-800" },
  FLATBED: { label: "Flatbed", color: "bg-yellow-100 text-yellow-800" },
  STEP_DECK: { label: "Step Deck", color: "bg-orange-100 text-orange-800" },
  RGN: { label: "RGN", color: "bg-red-100 text-red-800" },
  POWER_ONLY: { label: "Power Only", color: "bg-purple-100 text-purple-800" },
};

export function CarriersDataTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteCarrierId, setDeleteCarrierId] = useState<string | null>(null);

  const deleteCarrier = useDeleteCarrier();

  const { data: carriersData, isLoading } = useCarriers({
    isActive:
      statusFilter === "all"
        ? undefined
        : statusFilter === "active"
          ? true
          : false,
    isApproved:
      approvalFilter === "all"
        ? undefined
        : approvalFilter === "approved"
          ? true
          : false,
    search: searchTerm || undefined,
    page: currentPage,
    limit: 50,
  });

  const carriers = carriersData?.carriers || [];
  const pagination = carriersData?.pagination;

  const handleDeleteCarrier = async () => {
    if (deleteCarrierId) {
      await deleteCarrier.mutateAsync(deleteCarrierId);
      setDeleteCarrierId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3 w-3",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search carriers, MC numbers, contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>MC/DOT</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Loads</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : carriers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No carriers found
                  </TableCell>
                </TableRow>
              ) : (
                carriers.map((carrier: Carrier) => (
                  <TableRow
                    key={carrier.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/carriers/${carrier.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{carrier.companyName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(carrier.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{carrier.mcNumber}</div>
                        <div className="text-muted-foreground">
                          {carrier.dotNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{carrier.contactName}</div>
                        <div className="text-muted-foreground">
                          {carrier.contactPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {carrier.address?.city}, {carrier.address?.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {carrier.equipment.slice(0, 2).map((eq: string) => (
                          <Badge
                            key={eq}
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              equipmentConfig[
                                eq as keyof typeof equipmentConfig
                              ]?.color
                            )}
                          >
                            {
                              equipmentConfig[
                                eq as keyof typeof equipmentConfig
                              ]?.label
                            }
                          </Badge>
                        ))}
                        {carrier.equipment.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{carrier.equipment.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={carrier.isActive ? "success" : "secondary"}
                          className="text-xs w-fit"
                        >
                          {carrier.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge
                          variant={carrier.isApproved ? "info" : "warning"}
                          className="text-xs w-fit"
                        >
                          {carrier.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {renderStars(carrier.rating)}
                        <div className="text-muted-foreground">
                          {carrier.onTimeDelivery}% OTD
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {carrier.totalLoads}
                      </div>
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
                            onClick={() =>
                              router.push(`/carriers/${carrier.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/carriers/${carrier.id}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Carrier
                          </DropdownMenuItem>
                          {!carrier.isApproved && (
                            <DropdownMenuItem>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Approve Carrier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteCarrierId(carrier.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Carrier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {carriers.length} of {pagination?.total || 0} carriers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination || currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {pagination?.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination || currentPage === pagination.totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCarrierId}
        onOpenChange={() => setDeleteCarrierId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this carrier? This action cannot
              be undone. Carriers with active loads cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCarrier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCarrier.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
