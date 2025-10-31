"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  invoice: any;
  load: any;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  fmt: Intl.NumberFormat;
};

export function InvoiceOverview({ invoice, load, origin, destination, pickupDate, deliveryDate, fmt }: Props) {
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Math.max(0, total - paid);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className="text-base font-semibold">{invoice.status}</span>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="mt-1 text-base font-semibold">{fmt.format(total)}</div>
              </div>
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="mt-1 text-base font-semibold">{fmt.format(paid)}</div>
              </div>
              <div className={`rounded-lg border p-4 ${balance > 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/30"}`}>
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="mt-1 text-base font-semibold">{fmt.format(balance)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Load Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Load #</div>
                <div>{load?.loadNumber || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Customer</div>
                <div>{invoice.customer?.companyName || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Carrier</div>
                <div>{invoice.carrier?.companyName || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Origin</div>
                <div>{origin}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Destination</div>
                <div>{destination}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pickup Date</div>
                <div>{pickupDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Delivery Date</div>
                <div>{deliveryDate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invoice.lineItems?.map((li: any) => (
              <div key={li.id} className="flex items-center justify-between text-sm rounded-md border p-2">
                <div className="font-medium">{li.description}</div>
                <div className="text-muted-foreground">{fmt.format(Number(li.amount))}</div>
              </div>
            ))}
            {(!invoice.lineItems || invoice.lineItems.length === 0) && (
              <div className="text-sm text-muted-foreground">No items</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Use tabs to manage details, payments, and documents.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


