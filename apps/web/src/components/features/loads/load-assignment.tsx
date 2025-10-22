"use client";

import { useState } from "react";
import { useLoad, useAssignCarrier } from "@/hooks/use-loads";
import type { Load } from "@tms/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Truck, Building2, Shield, CheckCircle2, Loader2 } from "lucide-react";

// Mock carriers - replace with actual API call
const mockCarriers = [
  {
    id: "1",
    companyName: "Fast Transport LLC",
    mcNumber: "MC123456",
    dotNumber: "DOT654321",
    isActive: true,
    isApproved: true,
    rating: 4.8,
    insuranceExpiry: "2025-12-31",
  },
  {
    id: "2",
    companyName: "Reliable Freight Co.",
    mcNumber: "MC789012",
    dotNumber: "DOT210987",
    isActive: true,
    isApproved: true,
    rating: 4.6,
    insuranceExpiry: "2025-11-30",
  },
];

interface LoadAssignmentProps {
  loadId: string;
}

export function LoadAssignment({ loadId }: LoadAssignmentProps) {
  const { data: loadData, isLoading } = useLoad(loadId);

  // Explicit type assertion to ensure we use the correct shared Load type
  const load = loadData as Load;
  const assignCarrier = useAssignCarrier();
  const [open, setOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [notes, setNotes] = useState("");

  const handleAssign = async () => {
    if (!selectedCarrier) return;

    await assignCarrier.mutateAsync({
      id: loadId,
      carrierId: selectedCarrier,
      notes: notes || undefined,
    });

    setOpen(false);
    setSelectedCarrier("");
    setNotes("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!loadData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Carrier Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {load.carrier && load.carrierId ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {load.carrier.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>{load.carrier.mcNumber}</span>
                </div>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Assigned
                </Badge>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Reassign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Carrier</DialogTitle>
                    <DialogDescription>
                      Select a carrier for this load
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Carrier</Label>
                      <Select
                        value={selectedCarrier}
                        onValueChange={setSelectedCarrier}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCarriers.map((carrier) => (
                            <SelectItem key={carrier.id} value={carrier.id}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">
                                  {carrier.companyName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {carrier.mcNumber} • Rating: {carrier.rating}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCarrier && (
                      <div className="rounded-lg border p-3 space-y-2 text-sm">
                        {mockCarriers
                          .filter((c) => c.id === selectedCarrier)
                          .map((carrier) => (
                            <div key={carrier.id} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  DOT Number:
                                </span>
                                <span className="font-medium">
                                  {carrier.dotNumber}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Status:
                                </span>
                                <Badge
                                  variant="default"
                                  className="h-5 text-xs"
                                >
                                  {carrier.isActive && carrier.isApproved
                                    ? "Active"
                                    : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Insurance Valid Until:
                                </span>
                                <span className="font-medium">
                                  {carrier.insuranceExpiry}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any notes about this assignment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedCarrier || assignCarrier.isPending}
                    >
                      {assignCarrier.isPending
                        ? "Assigning..."
                        : "Assign Carrier"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {load.assignee && (
              <div className="text-sm text-muted-foreground">
                Assigned by {load.assignee.firstName} {load.assignee.lastName}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No carrier assigned yet
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Truck className="h-4 w-4 mr-2" />
                  Assign Carrier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Carrier</DialogTitle>
                  <DialogDescription>
                    Select a carrier for this load
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Carrier</Label>
                    <Select
                      value={selectedCarrier}
                      onValueChange={setSelectedCarrier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCarriers.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">
                                {carrier.companyName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {carrier.mcNumber} • Rating: {carrier.rating}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCarrier && (
                    <div className="rounded-lg border p-3 space-y-2 text-sm">
                      {mockCarriers
                        .filter((c) => c.id === selectedCarrier)
                        .map((carrier) => (
                          <div key={carrier.id} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                DOT Number:
                              </span>
                              <span className="font-medium">
                                {carrier.dotNumber}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Status:
                              </span>
                              <Badge variant="default" className="h-5 text-xs">
                                {carrier.isActive && carrier.isApproved
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Insurance Valid Until:
                              </span>
                              <span className="font-medium">
                                {carrier.insuranceExpiry}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add any notes about this assignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={!selectedCarrier || assignCarrier.isPending}
                  >
                    {assignCarrier.isPending
                      ? "Assigning..."
                      : "Assign Carrier"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
