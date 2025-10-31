"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { PERMISSIONS } from "@tms/shared-types";

type Props = {
  invoice: any;
  fmt: Intl.NumberFormat;
  amount: string;
  setAmount: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  reference: string;
  setReference: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onAddPayment: () => void;
};

export function InvoicePayments(props: Props) {
  const { invoice, fmt } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(invoice.payments || []).map((p: any) => (
              <div key={p.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 rounded-md border p-2">
                <div>{new Date(p.date).toLocaleDateString()}</div>
                <div>{p.type}</div>
                <div>{p.method}</div>
                <div>{fmt.format(Number(p.amount))}</div>
                <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
                  <div className="truncate" title={p.notes || ""}>{p.notes || ""}</div>
                </PermissionGuard>
              </div>
            ))}
            {(!invoice.payments || invoice.payments.length === 0) && (
              <div className="text-muted-foreground">No payments yet</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <PermissionGuard permission={PERMISSIONS.INVOICE_EDIT}>
          <Card>
            <CardHeader>
              <CardTitle>Add Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={props.amount} onChange={(e) => props.setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={props.method} onValueChange={props.setMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACH">ACH</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="WIRE">Wire</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={props.type} onValueChange={props.setType}>
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
                  <Input type="date" value={props.date} onChange={(e) => props.setDate(e.target.value)} />
                </div>
                <div>
                  <Label>Reference</Label>
                  <Input value={props.reference} onChange={(e) => props.setReference(e.target.value)} placeholder="e.g. check #" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Input value={props.notes} onChange={(e) => props.setNotes(e.target.value)} placeholder="Internal notes (private)" />
                </div>
              </div>
              <Button onClick={props.onAddPayment} disabled={!props.amount}>Add Payment</Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}


