"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { LoadFormData } from "@tms/shared-types";

interface AdditionalInformationSectionProps {
  control: Control<LoadFormData>;
}

export function AdditionalInformationSection({
  control,
}: AdditionalInformationSectionProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Additional Information
        </h3>
        <p className="text-sm text-muted-foreground">
          Notes and special instructions
        </p>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name="internalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Internal notes for your team..."
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={control}
            name="pickupNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Special pickup instructions..."
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="deliveryNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Special delivery instructions..."
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
