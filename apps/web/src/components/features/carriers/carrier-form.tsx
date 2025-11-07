"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import type { Carrier, CreateCarrierInput } from "@/types/carrier.types";
import {
  CARRIER_EQUIPMENT_TYPES,
  AUTHORITY_STATUS_OPTIONS,
  SAFETY_RATING_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@tms/shared-constants";
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
import type { Address } from "@/types/carrier.types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { AddressFormFields } from "@/components/ui/address-form-fields";

const carrierFormSchema = z.object({
  // Identification
  mcNumber: z.string().min(1, "MC Number is required"),
  dotNumber: z.string().optional(),
  scac: z.string().optional(),

  // Company Info
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  ein: z.string().optional(),

  // Contact Info
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  fax: z.string().optional(),

  // Address
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().optional(),
  formattedAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),

  // Primary Contact
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Valid contact email is required"),

  // Compliance
  authorityStatus: z.string().optional(),
  insuranceExpiry: z.date().optional(),
  insuranceAmount: z.number().min(0).optional(),
  cargoInsurance: z.number().min(0).optional(),
  liabilityInsurance: z.number().min(0).optional(),

  // Safety
  safetyRating: z.string().optional(),

  // Financial
  paymentTerms: z.string().optional(),
  paymentMethod: z.string().optional(),
  w9OnFile: z.boolean().default(false),
  factoring: z.boolean().default(false),
  factoringCompany: z.string().optional(),

  // Equipment
  equipment: z.array(z.string()).default([]),

  // Notes
  notes: z.string().optional(),
});

type CarrierFormData = z.infer<typeof carrierFormSchema>;

// Use shared constants
const equipmentTypes = CARRIER_EQUIPMENT_TYPES;
const authorityStatuses = AUTHORITY_STATUS_OPTIONS;
const safetyRatings = SAFETY_RATING_OPTIONS;
const paymentTermsOptions = PAYMENT_TERMS_OPTIONS;
const paymentMethods = PAYMENT_METHOD_OPTIONS;

interface CarrierFormProps {
  initialData?: Carrier;
  onSubmit?: (data: CreateCarrierInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function CarrierForm({
  initialData,
  onSubmit: onSubmitProp,
  isSubmitting: isSubmittingProp,
}: CarrierFormProps) {
  const router = useRouter();

  const form = useForm<CarrierFormData>({
    resolver: zodResolver(carrierFormSchema),
    defaultValues: initialData
      ? {
          mcNumber: initialData.mcNumber,
          dotNumber: initialData.dotNumber || undefined,
          scac: initialData.scac || undefined,
          companyName: initialData.companyName,
          dba: initialData.dba || undefined,
          ein: initialData.ein || undefined,
          email: initialData.email,
          phone: initialData.phone,
          fax: initialData.fax || undefined,
          street: (initialData.address as Address)?.street || undefined,
          city: (initialData.address as Address)?.city || undefined,
          state: (initialData.address as Address)?.state || undefined,
          zip: (initialData.address as Address)?.zip || undefined,
          country: (initialData.address as Address)?.country || "US",
          formattedAddress: (initialData.address as Address)?.formattedAddress || "",
          latitude: (initialData.address as Address)?.latitude || undefined,
          longitude: (initialData.address as Address)?.longitude || undefined,
          placeId: (initialData.address as Address)?.placeId || "",
          contactName: initialData.contactName,
          contactPhone: initialData.contactPhone,
          contactEmail: initialData.contactEmail,
          authorityStatus: initialData.authorityStatus || "ACTIVE",
          insuranceExpiry: initialData.insuranceExpiry
            ? new Date(initialData.insuranceExpiry)
            : undefined,
          insuranceAmount: initialData.insuranceAmount
            ? Number(initialData.insuranceAmount)
            : undefined,
          cargoInsurance: initialData.cargoInsurance
            ? Number(initialData.cargoInsurance)
            : undefined,
          liabilityInsurance: initialData.liabilityInsurance
            ? Number(initialData.liabilityInsurance)
            : undefined,
          safetyRating: initialData.safetyRating || undefined,
          paymentTerms: initialData.paymentTerms || "NET30",
          paymentMethod: initialData.paymentMethod || "CHECK",
          w9OnFile: initialData.w9OnFile || false,
          factoring: initialData.factoring || false,
          factoringCompany: initialData.factoringCompany || undefined,
          equipment: initialData.equipment || [],
          notes: initialData.notes || undefined,
        }
      : {
          authorityStatus: "ACTIVE",
          paymentTerms: "NET30",
          paymentMethod: "CHECK",
          w9OnFile: false,
          factoring: false,
          equipment: [],
          country: "US",
        },
  });

  const onSubmit = async (data: CarrierFormData) => {
    if (onSubmitProp) {
      // Transform form data to API format
      const carrierData = {
        mcNumber: data.mcNumber,
        dotNumber: data.dotNumber,
        scac: data.scac,
        companyName: data.companyName,
        dba: data.dba,
        ein: data.ein,
        email: data.email,
        phone: data.phone,
        fax: data.fax,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          country: data.country,
          formattedAddress: data.formattedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          placeId: data.placeId,
        },
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        authorityStatus: data.authorityStatus,
        insuranceExpiry: data.insuranceExpiry,
        insuranceAmount: data.insuranceAmount,
        cargoInsurance: data.cargoInsurance,
        liabilityInsurance: data.liabilityInsurance,
        safetyRating: data.safetyRating,
        paymentTerms: data.paymentTerms,
        paymentMethod: data.paymentMethod,
        w9OnFile: data.w9OnFile,
        factoring: data.factoring,
        factoringCompany: data.factoringCompany,
        equipment: data.equipment,
        notes: data.notes,
      };

      await onSubmitProp(carrierData);
    }
  };

  const addEquipment = (equipmentType: string) => {
    const currentEquipment = form.getValues("equipment");
    if (!currentEquipment.includes(equipmentType)) {
      form.setValue("equipment", [...currentEquipment, equipmentType]);
    }
  };

  const removeEquipment = (equipmentType: string) => {
    const currentEquipment = form.getValues("equipment");
    form.setValue(
      "equipment",
      currentEquipment.filter((eq) => eq !== equipmentType)
    );
  };

  return (
    <GoogleMapsLoader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="mcNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MC Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MC123456" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOT Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="DOT789012" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SCAC Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABCD" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Fast Transport LLC" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dba"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBA</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doing Business As" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ein"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EIN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="12-3456789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
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
              name="fax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fax</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(555) 123-4568" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <AddressFormFields
              control={form.control}
              setValue={form.setValue}
              streetFieldName="street"
              cityFieldName="city"
              stateFieldName="state"
              zipFieldName="zip"
              countryFieldName="country"
              formattedAddressFieldName="formattedAddress"
              latitudeFieldName="latitude"
              longitudeFieldName="longitude"
              placeIdFieldName="placeId"
            />
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Smith" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@company.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance & Safety */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance & Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="authorityStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {authorityStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
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
                name="safetyRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety Rating</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select safety rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {safetyRatings.map((rating) => (
                          <SelectItem key={rating.value} value={rating.value}>
                            {rating.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Expiry</FormLabel>
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
                          disabled={(date) => date < new Date()}
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
                name="insuranceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="1000000"
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cargoInsurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo Insurance ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="100000"
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
                name="liabilityInsurance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liability Insurance ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="1000000"
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
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTermsOptions.map((term) => (
                          <SelectItem key={term.value} value={term.value}>
                            {term.label}
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
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="w9OnFile"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>W-9 Form on File</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="factoring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Uses Factoring</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("factoring") && (
              <FormField
                control={form.control}
                name="factoringCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factoring Company</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XYZ Factoring Co." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {equipmentTypes.map((equipment) => (
                <div
                  key={equipment.value}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="text-sm font-medium">{equipment.label}</span>
                  {form.watch("equipment").includes(equipment.value) ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEquipment(equipment.value)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addEquipment(equipment.value)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about this carrier..."
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
                ? "Updating Carrier..."
                : "Creating Carrier..."
              : initialData
                ? "Update Carrier"
                : "Create Carrier"}
          </Button>
        </div>
        </form>
      </Form>
    </GoogleMapsLoader>
  );
}
