"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { LoadFormData } from "@tms/shared-types";
import { ShipperSelector } from "@/components/features/shippers/shipper-selector";

interface ShippersSectionProps {
  onOpenShipperDialog: () => void;
}

export function ShippersSection({ onOpenShipperDialog }: ShippersSectionProps) {
  const { control, watch, setValue } = useFormContext<LoadFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shippers",
  });


  const addShipper = () => {
    const nextSequence = fields.length + 1;
    append({
      shipperId: "",
      isPrimary: fields.length === 0, // First shipper is primary by default
      sequence: nextSequence,
      pickupDate: new Date(),
      pickupStart: "08:00",
      pickupEnd: "17:00",
      pickupType: "FCFS",
      pickupNotes: "",
    });
  };

  const removeShipper = (index: number) => {
    const currentValues = watch("shippers");
    const wasPrimary = currentValues[index]?.isPrimary;
    
    remove(index);
    
    // If we removed the primary shipper, make the first remaining one primary
    if (wasPrimary && fields.length > 1) {
      // Find the next shipper to make primary (first remaining one)
      const nextIndex = index === 0 ? 0 : index - 1;
      if (nextIndex < fields.length - 1) {
        // Use setValue to properly update the form
        setValue(`shippers.${nextIndex}.isPrimary`, true);
      }
    }
  };


  const setPrimaryShipper = (index: number) => {
    // First, set all shippers to not primary
    fields.forEach((_, i) => {
      setValue(`shippers.${i}.isPrimary`, false);
    });
    
    // Then set the selected one as primary
    setValue(`shippers.${index}.isPrimary`, true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Shippers</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addShipper}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Shipper
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No shippers added yet.</p>
            <p className="text-sm">Click &quot;Add Shipper&quot; to get started.</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Shipper {index + 1}
                    </span>
                    {watch(`shippers.${index}.isPrimary`) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!watch(`shippers.${index}.isPrimary`) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryShipper(index)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeShipper(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name={`shippers.${index}.shipperId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipper *</FormLabel>
                      <FormControl>
                        <ShipperSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a shipper"
                          onOpenCreateDialog={onOpenShipperDialog}
                          excludeShipperIds={fields
                            .map((_, otherIndex) => watch(`shippers.${otherIndex}.shipperId`))
                            .filter((id, otherIndex) => id && otherIndex !== index)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`shippers.${index}.pickupStart`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            placeholder="08:00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`shippers.${index}.pickupEnd`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            placeholder="17:00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`shippers.${index}.pickupType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pickup type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FCFS">FCFS (First Come, First Served)</SelectItem>
                            <SelectItem value="BY_APPOINTMENT">By Appointment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`shippers.${index}.pickupDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              field.onChange(e.target.value ? new Date(e.target.value) : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name={`shippers.${index}.pickupNotes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Special instructions for pickup..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
