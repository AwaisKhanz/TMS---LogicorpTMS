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
import { useConsigneeOptions } from "@/hooks/use-consignee";
import type { LoadFormData } from "@tms/shared-types";

interface ConsigneeInformationSectionProps {
  control: Control<LoadFormData>;
}

export function ConsigneeInformationSection({
  control,
}: ConsigneeInformationSectionProps) {
  const { consignees, isLoading: isLoadingConsignees } = useConsigneeOptions();

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Consignee Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Select consignee and delivery timing details
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/consignees/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Consignee
          </Link>
        </Button>
      </div>
      <div className="space-y-6">
        <FormField
          control={control}
          name="consigneeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consignee *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a consignee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingConsignees ? (
                    <SelectItem value="loading" disabled>
                      Loading consignees...
                    </SelectItem>
                  ) : consignees.length === 0 ? (
                    <SelectItem value="no-consignees" disabled>
                      No consignees available
                    </SelectItem>
                  ) : (
                    consignees.map((consignee) => (
                      <SelectItem key={consignee.value} value={consignee.value}>
                        {consignee.label}
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
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex gap-1 mt-2 flex-col">
                <FormLabel>Delivery Date *</FormLabel>
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
            name="deliveryStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Start *</FormLabel>
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
            name="deliveryEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery End *</FormLabel>
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

        <FormField
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Delivery Type *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FCFS" id="delivery-fcfs" />
                    <label
                      htmlFor="delivery-fcfs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      FCFS (First Come, First Served)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="BY_APPOINTMENT"
                      id="delivery-appointment"
                    />
                    <label
                      htmlFor="delivery-appointment"
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
