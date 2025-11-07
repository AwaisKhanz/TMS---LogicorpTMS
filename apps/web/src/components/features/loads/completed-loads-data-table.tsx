"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletedLoads } from "@/hooks/use-completed-loads";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CanEdit } from "@/components/auth/can";

export function CompletedLoadsDataTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
  } = useCompletedLoads({
    search: debouncedSearchTerm || undefined,
    page: currentPage,
    limit: 50,
  });

  const loads = loadsData?.data || [];
  const pagination = loadsData?.pagination;

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
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load completed loads. Please try again.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Completed Loads
              </h2>
              <p className="text-muted-foreground">
                Loads ready for invoicing and accounting
              </p>
            </div>
          </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loading completed loads...
            </p>
          </div>
        </div>
      ) : loads.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">
              No completed loads
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Completed loads will appear here when loads are marked as
              completed.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Customer Rate</TableHead>
                  <TableHead>Carrier Rate</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/loads/${load.id}`}
                        className="text-primary hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{load.customer?.companyName || "-"}</TableCell>
                    <TableCell>{load.carrier?.companyName || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {load.loadShippers && load.loadShippers.length > 0 ? (
                          <>
                            {load.loadShippers
                              .filter((s) => s.isPrimary)
                              .map((shipperRelation) => (
                                <div
                                  key={shipperRelation.id}
                                  className="font-medium"
                                >
                                  {(shipperRelation.shipper.address as any)?.city || ""},{" "}
                                  {(shipperRelation.shipper.address as any)?.state || ""}
                                  {load.loadShippers!.length > 1 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (+{load.loadShippers!.length - 1})
                                    </span>
                                  )}
                                </div>
                              ))}
                            <div className="text-muted-foreground">
                              {load.loadConsignees &&
                              load.loadConsignees.length > 0
                                ? load.loadConsignees
                                    .filter((c) => c.isPrimary)
                                    .map((consigneeRelation) => (
                                      <div key={consigneeRelation.id}>
                                        {(consigneeRelation.consignee.address as any)?.city || ""},{" "}
                                        {(consigneeRelation.consignee.address as any)?.state || ""}
                                        {load.loadConsignees!.length > 1 && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            (+{load.loadConsignees!.length - 1})
                                          </span>
                                        )}
                                      </div>
                                    ))
                                : "No delivery location"}
                            </div>
                          </>
                        ) : (
                          // Fallback for backward compatibility
                          <>
                            <div className="font-medium text-muted-foreground">
                              No pickup location
                            </div>
                            <div className="text-muted-foreground">
                              No delivery location
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatWeight(load.weight)}</TableCell>
                    <TableCell>{formatCurrency(load.customerRate)}</TableCell>
                    <TableCell>
                      {formatCurrency(load.carrierRate || null)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          load.margin && load.margin > 0
                            ? "text-success"
                            : load.margin && load.margin < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {formatCurrency(load.margin || null)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CanEdit resource="load">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/loads/${load.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </CanEdit>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
