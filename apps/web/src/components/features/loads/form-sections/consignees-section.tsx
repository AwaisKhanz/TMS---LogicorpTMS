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
import { ConsigneeSelector } from "@/components/features/consignees/consignee-selector";

interface ConsigneesSectionProps {
  onOpenConsigneeDialog: () => void;
}

export function ConsigneesSection({ onOpenConsigneeDialog }: ConsigneesSectionProps) {
  const { control, watch, setValue } = useFormContext<LoadFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "consignees",
  });


  const addConsignee = () => {
    const nextSequence = fields.length + 1;
    append({
      consigneeId: "",
      isPrimary: fields.length === 0, // First consignee is primary by default
      sequence: nextSequence,
      deliveryDate: new Date(),
      deliveryStart: "08:00",
      deliveryEnd: "17:00",
      deliveryType: "FCFS",
      deliveryNotes: "",
    });
  };

  const removeConsignee = (index: number) => {
    const currentValues = watch("consignees");
    const wasPrimary = currentValues[index]?.isPrimary;
    
    remove(index);
    
    // If we removed the primary consignee, make the first remaining one primary
    if (wasPrimary && fields.length > 1) {
      // Find the next consignee to make primary (first remaining one)
      const nextIndex = index === 0 ? 0 : index - 1;
      if (nextIndex < fields.length - 1) {
        // Use setValue to properly update the form
        setValue(`consignees.${nextIndex}.isPrimary`, true);
      }
    }
  };


  const setPrimaryConsignee = (index: number) => {
    // First, set all consignees to not primary
    fields.forEach((_, i) => {
      setValue(`consignees.${i}.isPrimary`, false);
    });
    
    // Then set the selected one as primary
    setValue(`consignees.${index}.isPrimary`, true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Consignees</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addConsignee}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Consignee
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No consignees added yet.</p>
            <p className="text-sm">Click &quot;Add Consignee&quot; to get started.</p>
          </div>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Consignee {index + 1}
                    </span>
                    {watch(`consignees.${index}.isPrimary`) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!watch(`consignees.${index}.isPrimary`) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryConsignee(index)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeConsignee(index)}
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
                  name={`consignees.${index}.consigneeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consignee *</FormLabel>
                      <FormControl>
                        <ConsigneeSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a consignee"
                          onOpenCreateDialog={onOpenConsigneeDialog}
                          excludeConsigneeIds={fields
                            .map((_, otherIndex) => watch(`consignees.${otherIndex}.consigneeId`))
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
                    name={`consignees.${index}.deliveryStart`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Start Time</FormLabel>
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
                    name={`consignees.${index}.deliveryEnd`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery End Time</FormLabel>
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
                    name={`consignees.${index}.deliveryType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery type" />
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
                    name={`consignees.${index}.deliveryDate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
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
                  name={`consignees.${index}.deliveryNotes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Special instructions for delivery..."
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
