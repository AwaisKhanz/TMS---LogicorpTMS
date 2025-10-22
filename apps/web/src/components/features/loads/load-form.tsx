"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCustomerOptions } from "@/hooks/use-customers";
import { useCarrierOptions } from "@/hooks/use-carriers";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const loadFormSchema = z.object({
  // Customer
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional(),

  // Shipper
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperStreet: z.string().min(1, "Shipper address is required"),
  shipperCity: z.string().min(1, "Shipper city is required"),
  shipperState: z.string().min(1, "Shipper state is required"),
  shipperZip: z.string().min(1, "Shipper ZIP is required"),
  shipperPhone: z.string().min(1, "Shipper phone is required"),
  shipperEmail: z.string().email().optional().or(z.literal("")),
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  pickupStart: z.string().min(1, "Pickup start time is required"),
  pickupEnd: z.string().min(1, "Pickup end time is required"),

  // Consignee
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeStreet: z.string().min(1, "Consignee address is required"),
  consigneeCity: z.string().min(1, "Consignee city is required"),
  consigneeState: z.string().min(1, "Consignee state is required"),
  consigneeZip: z.string().min(1, "Consignee ZIP is required"),
  consigneePhone: z.string().min(1, "Consignee phone is required"),
  consigneeEmail: z.string().email().optional().or(z.literal("")),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  deliveryStart: z.string().min(1, "Delivery start time is required"),
  deliveryEnd: z.string().min(1, "Delivery end time is required"),

  // Load Details
  commodity: z.string().min(1, "Commodity is required"),
  weight: z.number().min(1, "Weight must be greater than 0"),
  pieces: z.number().min(1).optional(),
  equipmentType: z.string().min(1, "Equipment type is required"),
  loadType: z.string().optional(),

  // Rates
  customerRate: z.number().min(0, "Customer rate must be positive"),
  carrierRate: z.number().min(0).optional(),

  // Instructions
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

type LoadFormData = z.infer<typeof loadFormSchema>;

const equipmentTypes = [
  { value: "DRY_VAN", label: "Dry Van" },
  { value: "REEFER", label: "Refrigerated" },
  { value: "FLATBED", label: "Flatbed" },
  { value: "STEP_DECK", label: "Step Deck" },
  { value: "RGN", label: "RGN" },
  { value: "POWER_ONLY", label: "Power Only" },
  { value: "HOTSHOT", label: "Hotshot" },
  { value: "BOX_TRUCK", label: "Box Truck" },
  { value: "STRAIGHT_TRUCK", label: "Straight Truck" },
  { value: "OTHER", label: "Other" },
];

const loadTypes = [
  { value: "FULL_TRUCK", label: "Full Truckload" },
  { value: "LTL", label: "Less Than Truckload" },
  { value: "PARTIAL", label: "Partial" },
  { value: "EXPEDITED", label: "Expedited" },
];

const timeSlots = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// Removed mock data - now using real data from hooks

interface LoadFormProps {
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
}

export function LoadForm({
  initialData,
  onSubmit: onSubmitProp,
  isSubmitting: isSubmittingProp,
}: LoadFormProps) {
  const router = useRouter();

  // Fetch real data from API
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

  const form = useForm<LoadFormData>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: initialData
      ? ({
          customerId: initialData.customerId,
          carrierId: initialData.carrierId,
          shipperName: initialData.shipperName,
          shipperStreet:
            initialData.shipperStreet ||
            (initialData.shipperAddress as Record<string, unknown>)?.street,
          shipperCity:
            initialData.shipperCity ||
            (initialData.shipperAddress as Record<string, unknown>)?.city,
          shipperState:
            initialData.shipperState ||
            (initialData.shipperAddress as Record<string, unknown>)?.state,
          shipperZip:
            initialData.shipperZip ||
            (initialData.shipperAddress as Record<string, unknown>)?.zip,
          shipperPhone: initialData.shipperPhone,
          shipperEmail: initialData.shipperEmail,
          pickupDate: initialData.pickupDate,
          pickupStart: initialData.pickupStart || "08:00",
          pickupEnd: initialData.pickupEnd || "17:00",
          consigneeName: initialData.consigneeName,
          consigneeStreet:
            initialData.consigneeStreet ||
            (initialData.consigneeAddress as Record<string, unknown>)?.street,
          consigneeCity:
            initialData.consigneeCity ||
            (initialData.consigneeAddress as Record<string, unknown>)?.city,
          consigneeState:
            initialData.consigneeState ||
            (initialData.consigneeAddress as Record<string, unknown>)?.state,
          consigneeZip:
            initialData.consigneeZip ||
            (initialData.consigneeAddress as Record<string, unknown>)?.zip,
          consigneePhone: initialData.consigneePhone,
          consigneeEmail: initialData.consigneeEmail,
          deliveryDate: initialData.deliveryDate,
          deliveryStart: initialData.deliveryStart || "08:00",
          deliveryEnd: initialData.deliveryEnd || "17:00",
          commodity: initialData.commodity,
          weight: initialData.weight,
          pieces: initialData.pieces,
          equipmentType: initialData.equipmentType,
          loadType: initialData.loadType,
          customerRate: initialData.customerRate,
          carrierRate: initialData.carrierRate,
          pickupNotes: initialData.pickupNotes,
          deliveryNotes: initialData.deliveryNotes,
          internalNotes: initialData.internalNotes,
          referenceNumber: initialData.referenceNumber,
        } as Partial<LoadFormData>)
      : {
          pickupStart: "08:00",
          pickupEnd: "17:00",
          deliveryStart: "08:00",
          deliveryEnd: "17:00",
          weight: 0,
          customerRate: 0,
          equipmentType: "DRY_VAN",
          loadType: "FULL_TRUCK",
        },
  });

  const onSubmit = async (data: LoadFormData) => {
    if (onSubmitProp) {
      // Transform form data to API format
      const loadData = {
        customerId: data.customerId,
        carrierId: data.carrierId || undefined,
        shipperName: data.shipperName,
        shipperAddress: {
          street: data.shipperStreet,
          city: data.shipperCity,
          state: data.shipperState,
          zip: data.shipperZip,
        },
        shipperPhone: data.shipperPhone,
        shipperEmail: data.shipperEmail || undefined,
        pickupDate: data.pickupDate,
        pickupStart: data.pickupStart,
        pickupEnd: data.pickupEnd,
        consigneeName: data.consigneeName,
        consigneeAddress: {
          street: data.consigneeStreet,
          city: data.consigneeCity,
          state: data.consigneeState,
          zip: data.consigneeZip,
        },
        consigneePhone: data.consigneePhone,
        consigneeEmail: data.consigneeEmail || undefined,
        deliveryDate: data.deliveryDate,
        deliveryStart: data.deliveryStart,
        deliveryEnd: data.deliveryEnd,
        commodity: data.commodity,
        weight: data.weight,
        pieces: data.pieces,
        equipmentType: data.equipmentType,
        loadType: data.loadType,
        customerRate: data.customerRate,
        carrierRate: data.carrierRate,
        pickupNotes: data.pickupNotes,
        deliveryNotes: data.deliveryNotes,
        internalNotes: data.internalNotes,
        referenceNumber: data.referenceNumber,
      };

      await onSubmitProp(loadData);
    }
  };

  const calculateMargin = () => {
    const customerRate = form.watch("customerRate");
    const carrierRate = form.watch("carrierRate");
    if (customerRate && carrierRate) {
      return customerRate - carrierRate;
    }
    return 0;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer & Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Load Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
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
                        customers.map((customer) => (
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
              control={form.control}
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
                        carriers.map((carrier) => (
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
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Customer reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Shipper Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipper Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shipperName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABC Manufacturing" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipperPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shipperStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Industrial Blvd" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="shipperCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Chicago" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipperState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="IL" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipperZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="60601" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shipperEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@company.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
                control={form.control}
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
                        {timeSlots.map((time) => (
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
                control={form.control}
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
                        {timeSlots.map((time) => (
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
              control={form.control}
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
          </CardContent>
        </Card>

        {/* Consignee Information */}
        <Card>
          <CardHeader>
            <CardTitle>Consignee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="consigneeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XYZ Distribution" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 987-6543" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="consigneeStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="456 Warehouse Dr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="consigneeCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Detroit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneeState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MI" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consigneeZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="48201" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="consigneeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="receiving@company.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
                control={form.control}
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
                        {timeSlots.map((time) => (
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
                control={form.control}
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
                        {timeSlots.map((time) => (
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
              control={form.control}
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
          </CardContent>
        </Card>

        {/* Load Details */}
        <Card>
          <CardHeader>
            <CardTitle>Load Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
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
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
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
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                        {loadTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Rates & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
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
                control={form.control}
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
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Estimated Margin
                </div>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                  <Badge
                    variant={calculateMargin() > 0 ? "success" : "secondary"}
                    className="text-sm"
                  >
                    ${calculateMargin().toFixed(2)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
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
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmittingProp}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmittingProp}>
            {isSubmittingProp
              ? initialData
                ? "Updating Load..."
                : "Creating Load..."
              : initialData
                ? "Update Load"
                : "Create Load"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
