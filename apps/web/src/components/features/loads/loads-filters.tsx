"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { LoadFilters } from "@/types/load.types";

interface LoadsFiltersProps {
  filters: LoadFilters;
  onFiltersChange: (filters: LoadFilters) => void;
}

export function LoadsFilters({ filters, onFiltersChange }: LoadsFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<LoadFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: LoadFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Loads</SheetTitle>
          <SheetDescription>
            Apply advanced filters to find specific loads
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  status: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="QUOTE">Quote</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="POD_RECEIVED">POD Received</SelectItem>
                <SelectItem value="INVOICED">Invoiced</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range - Pickup */}
          <div className="space-y-2">
            <Label>Pickup Date Range</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.pickupDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.pickupDateFrom
                      ? format(new Date(localFilters.pickupDateFrom), "PP")
                      : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      localFilters.pickupDateFrom
                        ? new Date(localFilters.pickupDateFrom)
                        : undefined
                    }
                    onSelect={(date) =>
                      setLocalFilters({
                        ...localFilters,
                        pickupDateFrom: date?.toISOString(),
                      })
                    }
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFilters.pickupDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.pickupDateTo
                      ? format(new Date(localFilters.pickupDateTo), "PP")
                      : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      localFilters.pickupDateTo
                        ? new Date(localFilters.pickupDateTo)
                        : undefined
                    }
                    onSelect={(date) =>
                      setLocalFilters({
                        ...localFilters,
                        pickupDateTo: date?.toISOString(),
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Customer Filter */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <Input
              placeholder="Search customer..."
              value={localFilters.customerId || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  customerId: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* Carrier Filter */}
          <div className="space-y-2">
            <Label>Carrier</Label>
            <Input
              placeholder="Search carrier..."
              value={localFilters.carrierId || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  carrierId: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Load number, commodity, etc."
              value={localFilters.search || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  search: e.target.value || undefined,
                })
              }
            />
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

