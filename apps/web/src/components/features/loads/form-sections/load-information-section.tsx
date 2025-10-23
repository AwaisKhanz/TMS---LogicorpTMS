"use client";

import { Control } from "react-hook-form";
import Link from "next/link";
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
import { useCustomerOptions } from "@/hooks/use-customers";
import { useCarrierOptions } from "@/hooks/use-carriers";
import type {
  LoadFormData,
  CustomerOption,
  CarrierOption,
} from "@tms/shared-types";

interface LoadInformationSectionProps {
  control: Control<LoadFormData>;
}

export function LoadInformationSection({
  control,
}: LoadInformationSectionProps) {
  const {
    customers,
    isLoading: customersLoading,
    error: customersError,
  } = useCustomerOptions();
  const {
    carriers,
    isLoading: carriersLoading,
    error: carriersError,
  } = useCarrierOptions();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Load Information
        </h3>
        <p className="text-sm text-muted-foreground">
          Customer and reference details
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={customersLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        customersLoading
                          ? "Loading customers..."
                          : customersError
                            ? "Error loading customers"
                            : "Select customer"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.length === 0 && !customersLoading ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No customers found.{" "}
                      <Link
                        href="/customers"
                        className="text-primary hover:underline"
                      >
                        Create your first customer
                      </Link>
                    </div>
                  ) : (
                    customers.map((customer: CustomerOption) => (
                      <SelectItem key={customer.id} value={customer.value}>
                        {customer.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="carrierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carrier</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={carriersLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        carriersLoading
                          ? "Loading carriers..."
                          : carriersError
                            ? "Error loading carriers"
                            : "Select carrier (optional)"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {carriers.length === 0 && !carriersLoading ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No carriers found.{" "}
                      <Link
                        href="/carriers"
                        className="text-primary hover:underline"
                      >
                        Add your first carrier
                      </Link>
                    </div>
                  ) : (
                    carriers.map((carrier: CarrierOption) => (
                      <SelectItem key={carrier.id} value={carrier.value}>
                        {carrier.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Customer reference" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
