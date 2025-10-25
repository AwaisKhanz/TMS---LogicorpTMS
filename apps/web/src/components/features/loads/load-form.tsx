"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChevronRight } from "lucide-react";
import { LoadInformationSection } from "./form-sections/load-information-section";
import { ShipperInformationSection } from "./form-sections/shipper-information-section";
import { ConsigneeInformationSection } from "./form-sections/consignee-information-section";
import { LoadSpecificationsSection } from "./form-sections/load-specifications-section";
import { RatesPricingSection } from "./form-sections/rates-pricing-section";
import { AdditionalInformationSection } from "./form-sections/additional-information-section";
import { loadFormSchema, type LoadFormData } from "@tms/shared-types";

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
  const form = useForm<LoadFormData>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: initialData
      ? ({
          customerId: initialData.customerId,
          carrierId: initialData.carrierId,
          shipperId: initialData.shipperId,
          pickupDate: initialData.pickupDate,
          pickupStart: initialData.pickupStart || "08:00",
          pickupEnd: initialData.pickupEnd || "17:00",
          consigneeId: initialData.consigneeId,
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
        } as LoadFormData)
      : {
          pickupStart: "08:00",
          pickupEnd: "17:00",
          deliveryStart: "08:00",
          deliveryEnd: "17:00",
          pickupType: "FCFS",
          deliveryType: "FCFS",
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
        shipperId: data.shipperId,
        pickupDate: data.pickupDate,
        pickupStart: data.pickupStart,
        pickupEnd: data.pickupEnd,
        consigneeId: data.consigneeId,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Load Information Section */}
        <LoadInformationSection control={form.control} />

        {/* Shipper Information Section */}
        <ShipperInformationSection control={form.control} />

        {/* Consignee Information Section */}
        <ConsigneeInformationSection control={form.control} />

        {/* Load Specifications Section */}
        <LoadSpecificationsSection control={form.control} />

        {/* Rates & Pricing Section */}
        <RatesPricingSection control={form.control} />

        {/* Additional Information Section */}
        <AdditionalInformationSection control={form.control} />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmittingProp}
            className="flex items-center gap-2 px-8 py-3 h-12 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingProp ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>
                  {initialData ? "Updating Load..." : "Creating Load..."}
                </span>
              </>
            ) : (
              <>
                <span>{initialData ? "Update Load" : "Create Load"}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
