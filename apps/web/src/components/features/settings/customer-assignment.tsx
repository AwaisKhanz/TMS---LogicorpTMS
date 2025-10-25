"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Customer {
  id: string;
  companyName: string;
  billingEmail: string;
  billingPhone: string;
  isActive: boolean;
}

interface CustomerAssignmentProps {
  assignedCustomers: Customer[];
  availableCustomers: Customer[];
  onAssign: (customerIds: string[]) => void;
  onRemove: (customerId: string) => void;
  disabled?: boolean;
}

export function CustomerAssignment({
  assignedCustomers,
  availableCustomers,
  onAssign,
  onRemove,
  disabled = false,
}: CustomerAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const handleAssign = () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    onAssign(selectedCustomers);
    setSelectedCustomers([]);
    setIsOpen(false);
    toast.success("Customers assigned successfully");
  };

  const handleRemove = (customerId: string) => {
    onRemove(customerId);
    toast.success("Customer assignment removed");
  };

  const assignedCustomerIds = assignedCustomers.map((c) => c.id);
  const unassignedCustomers = availableCustomers.filter(
    (customer) => !assignedCustomerIds.includes(customer.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Assigned Customers</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || unassignedCustomers.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Customers
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Customers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Command>
                <CommandInput placeholder="Search customers..." />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {unassignedCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.companyName}
                        onSelect={() => {
                          setSelectedCustomers((prev) =>
                            prev.includes(customer.id)
                              ? prev.filter((id) => id !== customer.id)
                              : [...prev, customer.id]
                          );
                        }}
                      >
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => {
                            setSelectedCustomers((prev) =>
                              prev.includes(customer.id)
                                ? prev.filter((id) => id !== customer.id)
                                : [...prev, customer.id]
                            );
                          }}
                        />
                        <div className="ml-2 flex-1">
                          <div className="font-medium">
                            {customer.companyName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.billingEmail}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedCustomers([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssign}>
                  Assign ({selectedCustomers.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignedCustomers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No customers assigned yet
        </div>
      ) : (
        <div className="grid gap-2">
          {assignedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{customer.companyName}</div>
                <div className="text-sm text-muted-foreground">
                  {customer.billingEmail}
                </div>
                <div className="text-sm text-muted-foreground">
                  {customer.billingPhone}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={customer.isActive ? "default" : "secondary"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(customer.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
