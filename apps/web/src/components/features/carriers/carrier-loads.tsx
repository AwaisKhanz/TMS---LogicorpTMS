"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarrierLoads } from "@/hooks/use-carriers";
import type { CarrierLoadData } from "@tms/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  QUOTE: { label: "Quote", variant: "secondary" },
  BOOKED: { label: "Booked", variant: "default" },
  DISPATCHED: { label: "Dispatched", variant: "default" },
  IN_TRANSIT: { label: "In Transit", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "default" },
  POD_RECEIVED: { label: "POD Received", variant: "default" },
  COMPLETED: { label: "Completed", variant: "default" },
  PAID: { label: "Paid", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

interface CarrierLoadsProps {
  carrierId: string;
}

export function CarrierLoads({ carrierId }: CarrierLoadsProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data: loadsData, isLoading } = useCarrierLoads(carrierId);

  // Handle both array response and object response
  const loads = loadsData?.data || [];
  const pagination = loadsData?.pagination;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Load History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loads?.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No loads yet</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loads?.map((load: CarrierLoadData) => (
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
                            statusConfig[load.status]?.variant || "secondary"
                          }
                        >
                          {statusConfig[load.status]?.label || load.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {load.customer?.companyName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(load.pickupDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {load.carrierRate
                          ? formatCurrency(Number(load.carrierRate))
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
