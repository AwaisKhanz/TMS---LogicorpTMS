"use client";

import { useParams } from "next/navigation";
import {
  useInvoice,
  useAddPayment,
  useExportInvoice,
  useInvoiceDocuments,
  useUploadInvoiceDocument,
} from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";
import { useLoadDocuments } from "@/hooks/use-loads";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Package,
  DollarSign,
  Receipt,
  CreditCard,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(params?.id);
  const exportPdf = useExportInvoice();
  const addPayment = useAddPayment(params?.id);
  const { data: docs } = useInvoiceDocuments(params?.id, {
    page: 1,
    limit: 25,
  });
  const uploadDoc = useUploadInvoiceDocument(params?.id);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("ACH");
  const [type, setType] = useState("CUSTOMER");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Compute loadId before any conditional return to keep hooks order stable
  const computedLoad = invoice?.load || invoice?.lineItems?.[0]?.load || null;
  const computedLoadId = computedLoad?.id as string | undefined;
  const { data: loadDocs } = useLoadDocuments(computedLoadId);

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Invoice Details
              </h1>
              <p className="text-muted-foreground">
                Loading invoice information...
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Invoice Not Found
              </h1>
              <p className="text-muted-foreground">
                The invoice you&apos;re looking for doesn&apos;t exist
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Math.max(0, total - paid);
  const load = computedLoad;
  const primaryShipper =
    load?.loadShippers?.find?.((ls: any) => ls.isPrimary) ||
    load?.loadShippers?.[0];
  const primaryConsignee =
    load?.loadConsignees?.find?.((lc: any) => lc.isPrimary) ||
    load?.loadConsignees?.[0];
  const origin = primaryShipper?.shipper?.companyName || "-";
  const destination = primaryConsignee?.consignee?.companyName || "-";
  const pickupDate = primaryShipper?.pickupDate
    ? new Date(primaryShipper.pickupDate).toLocaleDateString()
    : "-";
  const deliveryDate = primaryConsignee?.deliveryDate
    ? new Date(primaryConsignee.deliveryDate).toLocaleDateString()
    : "-";

  return (
    <PermissionGuard permission={PERMISSIONS.INVOICE_VIEW}>
      <div className="space-y-6">
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/invoices">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <Badge
                  variant={
                    invoice.status === "PAID"
                      ? "default"
                      : invoice.status === "OVERDUE"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Created {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {load?.id && (
              <Button variant="outline" asChild>
                <Link href={`/loads/${load.id}`}>
                  <Package className="h-4 w-4 mr-2" />
                  View Load {load.loadNumber || ""}
                </Link>
              </Button>
            )}
            <Button onClick={() => exportPdf.mutate(params.id)}>
              <Receipt className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex md:w-full md:flex min-w-full md:min-w-0">
              <TabsTrigger
                value="overview"
                className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="route"
                disabled={!load}
                className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Route</span>
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                disabled={!load}
                className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Specifications</span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="flex-shrink-0 md:flex-1 whitespace-nowrap flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="rounded-lg border p-4 bg-muted/30">
                        <div className="text-xs text-muted-foreground">
                          Status
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <Badge
                            variant={
                              invoice.status === "PAID"
                                ? "default"
                                : invoice.status === "OVERDUE"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/30">
                        <div className="text-xs text-muted-foreground">
                          Total
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {fmt.format(total)}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/30">
                        <div className="text-xs text-muted-foreground">
                          Paid
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {fmt.format(paid)}
                        </div>
                      </div>
                      <div
                        className={`rounded-lg border p-4 ${balance > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/30"}`}
                      >
                        <div className="text-xs text-muted-foreground">
                          Balance
                        </div>
                        <div className="mt-1 text-base font-semibold">
                          {fmt.format(balance)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Load Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Load #</p>
                        <p className="font-medium">{load?.loadNumber || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Customer
                        </p>
                        <p className="font-medium">
                          {invoice.customer?.companyName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Carrier</p>
                        <p className="font-medium">
                          {invoice.carrier?.companyName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Origin</p>
                        <p className="font-medium">{origin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Destination
                        </p>
                        <p className="font-medium">{destination}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Pickup Date
                        </p>
                        <p className="font-medium">{pickupDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Delivery Date
                        </p>
                        <p className="font-medium">{deliveryDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Line Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {invoice.lineItems?.map((li: any) => (
                      <div
                        key={li.id}
                        className="flex items-center justify-between text-sm rounded-md border p-3"
                      >
                        <div className="font-medium">{li.description}</div>
                        <div className="font-semibold">
                          {fmt.format(Number(li.amount))}
                        </div>
                      </div>
                    ))}
                    {(!invoice.lineItems || invoice.lineItems.length === 0) && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No items
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Overview Sidebar */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => exportPdf.mutate(params.id)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    {load?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={`/loads/${load.id}`}>
                          <Package className="h-4 w-4 mr-2" />
                          View Load
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Route Tab */}
          <TabsContent value="route" className="space-y-6">
            {load ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <div className="text-muted-foreground font-medium">
                        Shippers
                      </div>
                      {(load.loadShippers || []).map((ls: any) => (
                        <div key={ls.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {ls.shipper?.companyName || "-"}
                            </div>
                            {ls.isPrimary && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {(ls.shipper?.address as any)?.street || ""}
                            {(ls.shipper?.address as any)?.city
                              ? ", " + (ls.shipper.address as any).city
                              : ""}
                            {(ls.shipper?.address as any)?.state
                              ? ", " + (ls.shipper.address as any).state
                              : ""}{" "}
                            {(ls.shipper?.address as any)?.zip || ""}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Date
                              </div>
                              <div>
                                {ls.pickupDate
                                  ? new Date(ls.pickupDate).toLocaleDateString()
                                  : "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Start
                              </div>
                              <div>{ls.pickupStart || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                End
                              </div>
                              <div>{ls.pickupEnd || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Type
                              </div>
                              <div>{ls.pickupType || "-"}</div>
                            </div>
                          </div>
                          {ls.pickupNotes ? (
                            <div className="mt-2 text-muted-foreground">
                              Notes: {ls.pickupNotes}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {(load.loadShippers || []).length === 0 && (
                        <div className="text-muted-foreground">No shippers</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-muted-foreground font-medium">
                        Consignees
                      </div>
                      {(load.loadConsignees || []).map((lc: any) => (
                        <div key={lc.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">
                              {lc.consignee?.companyName || "-"}
                            </div>
                            {lc.isPrimary && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {(lc.consignee?.address as any)?.street || ""}
                            {(lc.consignee?.address as any)?.city
                              ? ", " + (lc.consignee.address as any).city
                              : ""}
                            {(lc.consignee?.address as any)?.state
                              ? ", " + (lc.consignee.address as any).state
                              : ""}{" "}
                            {(lc.consignee?.address as any)?.zip || ""}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Date
                              </div>
                              <div>
                                {lc.deliveryDate
                                  ? new Date(
                                      lc.deliveryDate
                                    ).toLocaleDateString()
                                  : "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Start
                              </div>
                              <div>{lc.deliveryStart || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                End
                              </div>
                              <div>{lc.deliveryEnd || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Type
                              </div>
                              <div>{lc.deliveryType || "-"}</div>
                            </div>
                          </div>
                          {lc.deliveryNotes ? (
                            <div className="mt-2 text-muted-foreground">
                              Notes: {lc.deliveryNotes}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {(load.loadConsignees || []).length === 0 && (
                        <div className="text-muted-foreground">
                          No consignees
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Specifications Tab */}
          <TabsContent value="specs" className="space-y-6">
            {load ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Equipment</p>
                      <p className="font-medium">{load.equipmentType || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Load Type</p>
                      <p className="font-medium">{load.loadType || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commodity</p>
                      <p className="font-medium">
                        {load.commodity ||
                          load.multipleCommodityDescription ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{load.weight ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pieces</p>
                      <p className="font-medium">{load.pieces ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Units</p>
                      <p className="font-medium">{load.units ?? "-"}</p>
                    </div>
                  </div>
                  {load.internalNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Internal Notes
                      </p>
                      <p className="font-medium">{load.internalNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {(invoice.payments || []).map((p: any) => (
                      <div
                        key={p.id}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2 rounded-md border p-2"
                      >
                        <div>{new Date(p.date).toLocaleDateString()}</div>
                        <div>{p.type}</div>
                        <div>{p.method}</div>
                        <div>{fmt.format(Number(p.amount))}</div>
                        <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
                          <div className="truncate" title={p.notes || ""}>
                            {p.notes || ""}
                          </div>
                        </PermissionGuard>
                      </div>
                    ))}
                    {(!invoice.payments || invoice.payments.length === 0) && (
                      <div className="text-muted-foreground">
                        No payments yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Add Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Method</Label>
                          <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACH">ACH</SelectItem>
                              <SelectItem value="CHECK">Check</SelectItem>
                              <SelectItem value="CASH">Cash</SelectItem>
                              <SelectItem value="WIRE">Wire</SelectItem>
                              <SelectItem value="CREDIT_CARD">
                                Credit Card
                              </SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">Customer</SelectItem>
                              <SelectItem value="CARRIER">Carrier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Reference</Label>
                          <Input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g. check #"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Notes</Label>
                          <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Internal notes (private)"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          addPayment.mutate({
                            type: type as any,
                            amount: parseFloat(amount),
                            method,
                            date: date || undefined,
                            reference,
                            notes,
                          })
                        }
                        disabled={!amount}
                      >
                        Add Payment
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionGuard>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm max-h-96 overflow-auto pr-1">
                      {(docs?.data || []).map((d: any) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="truncate pr-2">
                            <span className="text-muted-foreground">
                              {d.type}
                            </span>{" "}
                            — {d.name}
                          </div>
                          <a
                            className="text-primary underline"
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                      {docs?.data?.length === 0 && (
                        <div className="text-muted-foreground">
                          No documents
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {load?.id && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Load Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {(loadDocs || []).map((d: any) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div>
                            {d.type}: {d.name}
                          </div>
                          <a
                            className="text-primary underline"
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                      {(loadDocs?.length || 0) === 0 && (
                        <div className="text-muted-foreground">
                          No load documents
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Upload Document
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <Button
                          disabled={!file || uploadDoc.isPending}
                          onClick={() => file && uploadDoc.mutate(file)}
                        >
                          Upload
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Attach PDF/Excel and other files to this invoice.
                      </div>
                    </CardContent>
                  </Card>
                </PermissionGuard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
