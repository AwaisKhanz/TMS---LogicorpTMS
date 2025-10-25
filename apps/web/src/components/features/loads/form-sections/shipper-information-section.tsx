"use client";

import { Control } from "react-hook-form";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TIME_SLOTS } from "@tms/shared-constants";
import { useShipperOptions } from "@/hooks/use-shipper";
import type { LoadFormData } from "@tms/shared-types";

interface ShipperInformationSectionProps {
  control: Control<LoadFormData>;
}

export function ShipperInformationSection({
  control,
}: ShipperInformationSectionProps) {
  const { shippers, isLoading: isLoadingShippers } = useShipperOptions();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Shipper Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Select shipper and pickup timing details
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/shippers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Shipper
          </Link>
        </Button>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name="shipperId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shipper *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shipper" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingShippers ? (
                    <SelectItem value="loading" disabled>
                      Loading shippers...
                    </SelectItem>
                  ) : shippers.length === 0 ? (
                    <SelectItem value="no-shippers" disabled>
                      No shippers available
                    </SelectItem>
                  ) : (
                    shippers.map((shipper) => (
                      <SelectItem key={shipper.value} value={shipper.value}>
                        {shipper.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="grid gap-6 sm:grid-cols-3">
          <FormField
            control={control}
            name="pickupDate"
            render={({ field }) => (
              <FormItem className="flex gap-1 mt-2 flex-col">
                <FormLabel>Pickup Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pickupStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Start *</FormLabel>
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
                    {TIME_SLOTS.map((time: string) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="pickupEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup End *</FormLabel>
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
                    {TIME_SLOTS.map((time: string) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          name="pickupType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Pickup Type *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FCFS" id="pickup-fcfs" />
                    <label
                      htmlFor="pickup-fcfs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      FCFS (First Come, First Served)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="BY_APPOINTMENT"
                      id="pickup-appointment"
                    />
                    <label
                      htmlFor="pickup-appointment"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      By Appointment
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
