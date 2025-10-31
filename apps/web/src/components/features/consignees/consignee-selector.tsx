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
import { useConsigneeOptions } from "@/hooks/use-consignee";

interface ConsigneeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onConsigneeCreated?: (consignee: { id: string; companyName: string }) => void;
  onOpenCreateDialog?: () => void;
  excludeConsigneeIds?: string[];
}

export function ConsigneeSelector({
  value,
  onValueChange,
  placeholder = "Select a consignee",
  disabled = false,
  onOpenCreateDialog,
  excludeConsigneeIds = [],
}: ConsigneeSelectorProps) {
  const { consignees, isLoading } = useConsigneeOptions();

  // Filter out excluded consignee IDs
  const availableConsignees = consignees.filter(
    (consignee) => !excludeConsigneeIds.includes(consignee.value)
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
                Loading consignees...
              </SelectItem>
            ) : availableConsignees.length === 0 ? (
              <SelectItem value="no-consignees" disabled>
                {excludeConsigneeIds.length > 0
                  ? "All consignees already selected"
                  : "No consignees available"}
              </SelectItem>
            ) : (
              availableConsignees.map((consignee) => (
                <SelectItem key={consignee.value} value={consignee.value}>
                  {consignee.label}
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
