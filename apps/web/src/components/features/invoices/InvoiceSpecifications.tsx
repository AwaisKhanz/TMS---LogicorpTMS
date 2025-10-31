"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { load: any };

export function InvoiceSpecifications({ load }: Props) {
  if (!load) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specifications</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Equipment</div>
          <div>{load.equipmentType || "-"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Load Type</div>
          <div>{load.loadType || "-"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Commodity</div>
          <div>{load.commodity || load.multipleCommodityDescription || "-"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Weight</div>
          <div>{load.weight ?? "-"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Pieces</div>
          <div>{load.pieces ?? "-"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Units</div>
          <div>{load.units ?? "-"}</div>
        </div>
        <div className="md:col-span-3">
          <div className="text-muted-foreground">Internal Notes</div>
          <div>{load.internalNotes || "-"}</div>
        </div>
      </CardContent>
    </Card>
  );
}


