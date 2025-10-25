"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EQUIPMENT_TYPES, LOAD_TYPES } from "@tms/shared-constants";
import type { LoadFormData } from "@tms/shared-types";

interface LoadSpecificationsSectionProps {
  control: Control<LoadFormData>;
}

export function LoadSpecificationsSection({
  control,
}: LoadSpecificationsSectionProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Load Specifications
        </h3>
        <p className="text-sm text-muted-foreground">
          Commodity and equipment details
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name="commodity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commodity *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Steel coils, Electronics, etc."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-3">
          <FormField
            control={control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (lbs) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="45000"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pieces"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pieces</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="1"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="units"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Units</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="1"
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="multipleCommodityDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Multiple Commodity Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Steel coils, Electronics, Furniture, etc."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={control}
            name="equipmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map(
                      (type: { value: string; label: string }) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="loadType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Load Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LOAD_TYPES.map(
                      (type: { value: string; label: string }) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
