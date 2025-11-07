"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateShipper } from "@/hooks/use-shipper";
import type { CreateShipperRequest } from "@tms/shared-types";
import { Loader2 } from "lucide-react";
import { CanCreate } from "@/components/auth/can";
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

interface ShipperCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (shipper: { id: string; companyName: string }) => void;
}

export function ShipperCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: ShipperCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createShipper = useCreateShipper();

  const form = useForm<ShipperFormData>({
    resolver: zodResolver(shipperFormSchema),
    defaultValues: {
      companyName: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      formattedAddress: "",
      latitude: undefined,
      longitude: undefined,
      placeId: "",
      contactPerson: "",
      notes: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: ShipperFormData) => {
    setIsSubmitting(true);
    try {
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

      const response = await createShipper.mutateAsync(createData);

      // Reset form
      form.reset();

      // Call success callback with the new shipper data
      if (onSuccess) {
        onSuccess({
          id: response.data.id,
          companyName: response.data.companyName,
        });
      }

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipper</DialogTitle>
          <DialogDescription>
            Add a new shipper to your organization. This shipper will be
            available for selection in loads.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="shipper-create-form"
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
                        <Input placeholder="Enter company name" {...field} />
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
                        <Input placeholder="Enter phone number" {...field} />
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
              <GoogleMapsLoader>
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
              </GoogleMapsLoader>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
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
                        Whether this shipper is active and can be used in loads
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <CanCreate resource="shipper">
                <Button
                  type="submit"
                  form="shipper-create-form"
                  disabled={isSubmitting}
                >
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
