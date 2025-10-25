"use client";

import { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LoadFormData } from "@tms/shared-types";

interface RatesPricingSectionProps {
  control: Control<LoadFormData>;
}

export function RatesPricingSection({ control }: RatesPricingSectionProps) {
  const customerRate = useWatch({ control, name: "customerRate" });
  const carrierRate = useWatch({ control, name: "carrierRate" });

  const calculateMargin = () => {
    if (customerRate && carrierRate) {
      return customerRate - carrierRate;
    }
    return 0;
  };

  const margin = calculateMargin();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Rates & Pricing
        </h3>
        <p className="text-sm text-muted-foreground">
          Customer and carrier rates
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={control}
            name="customerRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Rate ($) *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="2500.00"
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
            name="carrierRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier Rate ($)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="2200.00"
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

        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Estimated Margin
            </span>
            <span
              className={`text-lg font-bold ${
                margin > 0
                  ? "text-success"
                  : margin < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              ${margin.toFixed(2)}
            </span>
          </div>
          {margin > 0 && (
            <p className="text-xs text-success mt-1">
              Positive margin - profitable load
            </p>
          )}
          {margin < 0 && (
            <p className="text-xs text-destructive mt-1">
              Negative margin - review pricing
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            Rate Change Tracking
          </h4>

          <FormField
            control={control}
            name="customerRateChangeReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Rate Change Reason</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Reason for customer rate change..."
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="carrierRateChangeReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier Rate Change Reason</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Reason for carrier rate change..."
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
