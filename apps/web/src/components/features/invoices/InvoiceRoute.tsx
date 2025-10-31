"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { load: any };

export function InvoiceRoute({ load }: Props) {
  if (!load) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="text-muted-foreground font-medium">Shippers</div>
          {(load.loadShippers || []).map((ls: any) => (
            <div key={ls.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{ls.shipper?.companyName || "-"}</div>
                {ls.isPrimary && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Primary</span>
                )}
              </div>
              <div className="text-muted-foreground">
                {ls.shipper?.streetAddress || ""}
                {ls.shipper?.city ? ", " + ls.shipper.city : ""}
                {ls.shipper?.state ? ", " + ls.shipper.state : ""} {ls.shipper?.zipCode || ""}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div>{ls.pickupDate ? new Date(ls.pickupDate).toLocaleDateString() : "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div>{ls.pickupStart || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div>{ls.pickupEnd || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div>{ls.pickupType || "-"}</div>
                </div>
              </div>
              {ls.pickupNotes ? (
                <div className="mt-2 text-muted-foreground">Notes: {ls.pickupNotes}</div>
              ) : null}
            </div>
          ))}
          {(load.loadShippers || []).length === 0 && (
            <div className="text-muted-foreground">No shippers</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-muted-foreground font-medium">Consignees</div>
          {(load.loadConsignees || []).map((lc: any) => (
            <div key={lc.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{lc.consignee?.companyName || "-"}</div>
                {lc.isPrimary && (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">Primary</span>
                )}
              </div>
              <div className="text-muted-foreground">
                {lc.consignee?.streetAddress || ""}
                {lc.consignee?.city ? ", " + lc.consignee.city : ""}
                {lc.consignee?.state ? ", " + lc.consignee.state : ""} {lc.consignee?.zipCode || ""}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div>{lc.deliveryDate ? new Date(lc.deliveryDate).toLocaleDateString() : "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Start</div>
                  <div>{lc.deliveryStart || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">End</div>
                  <div>{lc.deliveryEnd || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Type</div>
                  <div>{lc.deliveryType || "-"}</div>
                </div>
              </div>
              {lc.deliveryNotes ? (
                <div className="mt-2 text-muted-foreground">Notes: {lc.deliveryNotes}</div>
              ) : null}
            </div>
          ))}
          {(load.loadConsignees || []).length === 0 && (
            <div className="text-muted-foreground">No consignees</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


