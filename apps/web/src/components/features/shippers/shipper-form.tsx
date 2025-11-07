"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateShipper, useUpdateShipper } from "@/hooks/use-shipper";
import type {
  CreateShipperRequest,
  UpdateShipperRequest,
  Shipper,
} from "@tms/shared-types";
import { Loader2 } from "lucide-react";
import { CanCreate, CanEdit } from "@/components/auth/can";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { AddressFormFields } from "@/components/ui/address-form-fields";

const shipperFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code must be at least 5 characters"),
  country: z.string().min(1, "Country is required"),
  formattedAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ShipperFormData = z.infer<typeof shipperFormSchema>;

interface ShipperFormProps {
  shipper?: Shipper;
  mode?: "create" | "edit";
}

export function ShipperForm({ shipper, mode = "create" }: ShipperFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createShipper = useCreateShipper();
  const updateShipper = useUpdateShipper();

  const form = useForm<ShipperFormData>({
    resolver: zodResolver(shipperFormSchema),
    defaultValues: {
      companyName: shipper?.companyName || "",
      phone: shipper?.phone || "",
      email: shipper?.email || "",
      street: (shipper?.address as any)?.street || "",
      city: (shipper?.address as any)?.city || "",
      state: (shipper?.address as any)?.state || "",
      zip: (shipper?.address as any)?.zip || "",
      country: (shipper?.address as any)?.country || "US",
      formattedAddress: (shipper?.address as any)?.formattedAddress || "",
      latitude: (shipper?.address as any)?.latitude || undefined,
      longitude: (shipper?.address as any)?.longitude || undefined,
      placeId: (shipper?.address as any)?.placeId || "",
      contactPerson: shipper?.contactPerson || "",
      notes: shipper?.notes || "",
      isActive: shipper?.isActive ?? true,
    },
  });

  const onSubmit = async (data: ShipperFormData) => {
    setIsSubmitting(true);
    try {
      if (mode === "edit" && shipper) {
        const updateData: UpdateShipperRequest = {
          companyName: data.companyName,
          phone: data.phone,
          email: data.email || undefined,
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
          contactPerson: data.contactPerson || undefined,
          notes: data.notes || undefined,
        };
        await updateShipper.mutateAsync({
          id: shipper.id,
          data: updateData,
        });
      } else {
        const createData: CreateShipperRequest = {
          companyName: data.companyName,
          phone: data.phone,
          email: data.email || undefined,
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
          contactPerson: data.contactPerson || undefined,
          notes: data.notes || undefined,
        };
        await createShipper.mutateAsync(createData);
      }
      router.push("/shippers");
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GoogleMapsLoader>
      <div className="w-full ">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "edit" ? "Edit Shipper" : "Create New Shipper"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter company name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter contact person name"
                              {...field}
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email address"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Address Information</h3>
                  <div className="grid ">
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
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Additional Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional notes..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Whether this shipper is active and can be used in
                            loads
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/shippers")}
                  >
                    Cancel
                  </Button>
                  {mode === "edit" ? (
                    <CanEdit resource="shipper">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          "Update Shipper"
                        )}
                      </Button>
                    </CanEdit>
                  ) : (
                    <CanCreate resource="shipper">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          "Create Shipper"
                        )}
                      </Button>
                    </CanCreate>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </GoogleMapsLoader>
  );
}
