"use client";

import { Control, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  const equipmentType = useWatch({
    control,
    name: "equipmentType",
  });

  const isReefer = equipmentType === "REEFER";

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

        {isReefer && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-foreground">
              Temperature Requirements
            </h4>
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={control}
                name="minTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Temperature</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="32"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum temperature required (°F or °C)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="maxTemperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Temperature</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="40"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseInt(e.target.value, 10)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum temperature required (°F or °C)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={control}
                name="temperatureUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FAHRENHEIT">°F (Fahrenheit)</SelectItem>
                        <SelectItem value="CELSIUS">°C (Celsius)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Unit of measurement for temperature
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="continuousTemperature"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Continuous Temperature</FormLabel>
                      <FormDescription>
                        Temperature must be maintained continuously throughout transit
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
