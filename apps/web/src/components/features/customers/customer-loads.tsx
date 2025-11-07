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
  Package,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Search,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useCustomerLoads } from "@/hooks/use-customer";
import { LOAD_STATUS_OPTIONS } from "@tms/shared-constants";
import type { CustomerLoadData } from "@tms/shared-types";

// Local formatCurrency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface CustomerLoadsProps {
  customerId: string;
}

export function CustomerLoads({ customerId }: CustomerLoadsProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");

  // Debounce search term (500ms delay) for client-side filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: loadsData,
    isLoading,
    error,
  } = useCustomerLoads(customerId, page, 20);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<
      string,
      "secondary" | "default" | "success" | "warning" | "destructive"
    > = {
      QUOTE: "secondary",
      BOOKED: "default",
      DISPATCHED: "default",
      IN_TRANSIT: "default",
      DELIVERED: "success",
      POD_RECEIVED: "success",
      COMPLETED: "success",
      PAID: "success",
      CANCELLED: "destructive",
    };
    return statusColors[status] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      QUOTE: "Quote",
      BOOKED: "Booked",
      DISPATCHED: "Dispatched",
      IN_TRANSIT: "In Transit",
      DELIVERED: "Delivered",
      POD_RECEIVED: "POD Received",
      COMPLETED: "Completed",
      PAID: "Paid",
      CANCELLED: "Cancelled",
    };
    return statusLabels[status] || status;
  };

  const filteredLoads =
    loadsData?.data.data.filter((load: CustomerLoadData) => {
      const matchesStatus =
        statusFilter === "all" || load.status === statusFilter;
      const matchesSearch =
        load.loadNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        load.carrier?.companyName
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    }) || [];

  const totalRevenue = filteredLoads.reduce(
    (sum: number, load: CustomerLoadData) => sum + load.customerRate,
    0
  );
  const totalMargin = filteredLoads.reduce(
    (sum: number, load: CustomerLoadData) => {
      const margin = load.customerRate - (load.carrierRate || 0);
      return sum + margin;
    },
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading loads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Package className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Failed to load loads</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLoads.length}</div>
            <p className="text-xs text-muted-foreground">
              {loadsData?.data.pagination.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {filteredLoads.length} loads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {formatCurrency(totalMargin)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0
                ? ((totalMargin / totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search loads or carriers..."
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
                  {LOAD_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loads Table */}
      {filteredLoads.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pickup Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Customer Rate</TableHead>
                <TableHead>Carrier Rate</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoads.map((load: CustomerLoadData) => {
                const margin = load.customerRate - (load.carrierRate || 0);
                const marginPercentage =
                  load.customerRate > 0
                    ? (margin / load.customerRate) * 100
                    : 0;

                return (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">
                      {load.loadNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(load.status)}>
                        {getStatusLabel(load.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(load.pickupDate)}</TableCell>
                    <TableCell>{formatDate(load.deliveryDate)}</TableCell>
                    <TableCell>
                      {load.carrier ? (
                        <div>
                          <div className="font-medium">
                            {load.carrier.companyName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(load.customerRate)}
                    </TableCell>
                    <TableCell>
                      {load.carrierRate
                        ? formatCurrency(load.carrierRate)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(margin)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {marginPercentage.toFixed(1)}%
                        </div>
                      </div>
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
                            <Link href={`/loads/${load.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/loads/${load.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Load
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
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
            <Package className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No loads found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "This customer hasn't had any loads yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {loadsData?.data.pagination && loadsData.data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to{" "}
            {Math.min(page * 20, loadsData.data.pagination.total)} of{" "}
            {loadsData.data.pagination.total} loads
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
              disabled={page >= loadsData.data.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
