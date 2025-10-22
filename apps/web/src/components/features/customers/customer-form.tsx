"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import type { Customer, CreateCustomerRequest } from "@tms/shared-types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";

const customerFormSchema = z.object({
  // Company Info
  companyName: z.string().min(1, "Company name is required"),
  dba: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ein: z.string().optional(),

  // Billing Address
  billingStreet: z.string().min(1, "Street address is required"),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().min(1, "State is required"),
  billingZip: z.string().min(1, "ZIP code is required"),

  // Billing Contact
  billingEmail: z.string().email("Valid email is required"),
  billingPhone: z.string().min(1, "Phone number is required"),

  // Financial
  creditLimit: z
    .number()
    .min(0, "Credit limit must be non-negative")
    .optional(),
  paymentTerms: z.string().optional(),

  // Preferences
  equipmentTypes: z.array(z.string()).default([]),

  // Status & Notes
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

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

const paymentTermsOptions = [
  { value: "NET15", label: "Net 15" },
  { value: "NET30", label: "Net 30" },
  { value: "NET45", label: "Net 45" },
  { value: "NET60", label: "Net 60" },
  { value: "COD", label: "COD" },
];

const industries = [
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "OTHER", label: "Other" },
];

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit?: (data: CreateCustomerRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export function CustomerForm({
  initialData,
  onSubmit: onSubmitProp,
  isSubmitting: isSubmittingProp,
}: CustomerFormProps) {
  const router = useRouter();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData
      ? {
          companyName: initialData.companyName,
          dba: initialData.dba || "",
          industry: initialData.industry || "",
          website: initialData.website || "",
          ein: initialData.ein || "",
          billingStreet: initialData.billingAddress?.street || "",
          billingCity: initialData.billingAddress?.city || "",
          billingState: initialData.billingAddress?.state || "",
          billingZip: initialData.billingAddress?.zip || "",
          billingEmail: initialData.billingEmail,
          billingPhone: initialData.billingPhone,
          creditLimit: initialData.creditLimit || 0,
          paymentTerms: initialData.paymentTerms || "NET30",
          equipmentTypes: initialData.equipmentTypes || [],
          notes: initialData.notes || "",
        }
      : {
          companyName: "",
          dba: "",
          industry: "",
          website: "",
          ein: "",
          billingStreet: "",
          billingCity: "",
          billingState: "",
          billingZip: "",
          billingEmail: "",
          billingPhone: "",
          creditLimit: 0,
          paymentTerms: "NET30",
          equipmentTypes: [],
          notes: "",
        },
  });

  const onSubmit = async (data: CustomerFormData) => {
    const submitData = {
      companyName: data.companyName,
      dba: data.dba || undefined,
      industry: data.industry || undefined,
      website: data.website || undefined,
      ein: data.ein || undefined,
      billingAddress: {
        street: data.billingStreet,
        city: data.billingCity,
        state: data.billingState,
        zip: data.billingZip,
        country: "US",
      },
      billingEmail: data.billingEmail,
      billingPhone: data.billingPhone,
      creditLimit: data.creditLimit || undefined,
      paymentTerms: data.paymentTerms || "NET30",
      equipmentTypes: data.equipmentTypes,
      notes: data.notes || undefined,
    };

    if (onSubmitProp) {
      await onSubmitProp(submitData);
    }
  };

  const isSubmitting = isSubmittingProp || form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Logistics Inc." {...field} />
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
                    <FormLabel>DBA (Doing Business As)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Logistics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem
                            key={industry.value}
                            value={industry.value}
                          >
                            {industry.label}
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
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EIN (Tax ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="XX-XXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="billingStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="billingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Los Angeles" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingZip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="90001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Billing Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="billingEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="billing@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="50000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>Maximum credit allowed</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
          </CardContent>
        </Card>

        {/* Equipment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="equipmentTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Preferred Equipment Types</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {equipmentTypes.map((equipment) => (
                      <FormField
                        key={equipment.value}
                        control={form.control}
                        name="equipmentTypes"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(equipment.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        equipment.value,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== equipment.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {equipment.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      placeholder="Any additional notes about this customer..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting
              ? initialData
                ? "Updating..."
                : "Creating..."
              : initialData
                ? "Update Customer"
                : "Create Customer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
