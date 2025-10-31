"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useShipperOptions } from "@/hooks/use-shipper";

interface ShipperSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onShipperCreated?: (shipper: { id: string; companyName: string }) => void;
  onOpenCreateDialog?: () => void;
  excludeShipperIds?: string[];
}

export function ShipperSelector({
  value,
  onValueChange,
  placeholder = "Select a shipper",
  disabled = false,
  onOpenCreateDialog,
  excludeShipperIds = [],
}: ShipperSelectorProps) {
  const { shippers, isLoading } = useShipperOptions();

  // Filter out excluded shipper IDs
  const availableShippers = shippers.filter(
    (shipper) => !excludeShipperIds.includes(shipper.value)
  );

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenCreateDialog) {
      onOpenCreateDialog();
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading shippers...
              </SelectItem>
            ) : availableShippers.length === 0 ? (
              <SelectItem value="no-shippers" disabled>
                {excludeShipperIds.length > 0
                  ? "All shippers already selected"
                  : "No shippers available"}
              </SelectItem>
            ) : (
              availableShippers.map((shipper) => (
                <SelectItem key={shipper.value} value={shipper.value}>
                  {shipper.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCreateClick}
          disabled={disabled}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
