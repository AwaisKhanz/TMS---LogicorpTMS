"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ChevronRight } from "lucide-react";
import { LoadInformationSection } from "./form-sections/load-information-section";
import { ShippersSection } from "./form-sections/shippers-section";
import { ConsigneesSection } from "./form-sections/consignees-section";
import { LoadSpecificationsSection } from "./form-sections/load-specifications-section";
import { RatesPricingSection } from "./form-sections/rates-pricing-section";
import { AdditionalInformationSection } from "./form-sections/additional-information-section";
import { loadFormSchema, type LoadFormData } from "@tms/shared-types";
import { ShipperCreateDialog } from "@/components/features/shippers/shipper-create-dialog";
import { ConsigneeCreateDialog } from "@/components/features/consignees/consignee-create-dialog";

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
  // Dialog state management
  const [isShipperDialogOpen, setIsShipperDialogOpen] = useState(false);
  const [isConsigneeDialogOpen, setIsConsigneeDialogOpen] = useState(false);

  const form = useForm<LoadFormData>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: initialData
      ? ({
          customerId: initialData.customerId ?? "",
          carrierId: initialData.carrierId ?? "",
          // Explicitly set root-level dates to undefined to prevent validation errors
          pickupDate: undefined,
          deliveryDate: undefined,
          pickupStart: initialData.pickupStart || "08:00",
          pickupEnd: initialData.pickupEnd || "17:00",
          pickupType: initialData.pickupType || "FCFS",
          deliveryStart: initialData.deliveryStart || "08:00",
          deliveryEnd: initialData.deliveryEnd || "17:00",
          deliveryType: initialData.deliveryType || "FCFS",
          // Handle multiple shippers and consignees
          shippers: Array.isArray(initialData.loadShippers) && initialData.loadShippers.length > 0 
            ? initialData.loadShippers.map((ls: any, index: number) => ({
                shipperId: ls.shipperId || ls.shipper?.id,
                isPrimary: ls.isPrimary ?? (index === 0),
                sequence: ls.sequence ?? index + 1,
                pickupDate: ls.pickupDate ? new Date(ls.pickupDate) : undefined,
                pickupStart: ls.pickupStart,
                pickupEnd: ls.pickupEnd,
                pickupType: ls.pickupType,
                pickupNotes: ls.pickupNotes,
              }))
            : initialData.shipperId 
              ? [{
                  shipperId: initialData.shipperId,
                  isPrimary: true,
                  sequence: 1,
                  pickupDate: initialData.pickupDate && typeof initialData.pickupDate === 'string' ? new Date(initialData.pickupDate) : undefined,
                  pickupStart: initialData.pickupStart || "08:00",
                  pickupEnd: initialData.pickupEnd || "17:00",
                  pickupType: initialData.pickupType || "FCFS",
                  pickupNotes: initialData.pickupNotes,
                }]
              : [],
          consignees: Array.isArray(initialData.loadConsignees) && initialData.loadConsignees.length > 0
            ? initialData.loadConsignees.map((lc: any, index: number) => ({
                consigneeId: lc.consigneeId || lc.consignee?.id,
                isPrimary: lc.isPrimary ?? (index === 0),
                sequence: lc.sequence ?? index + 1,
                deliveryDate: lc.deliveryDate ? new Date(lc.deliveryDate) : undefined,
                deliveryStart: lc.deliveryStart,
                deliveryEnd: lc.deliveryEnd,
                deliveryType: lc.deliveryType,
                deliveryNotes: lc.deliveryNotes,
              }))
            : initialData.consigneeId 
              ? [{
                  consigneeId: initialData.consigneeId,
                  isPrimary: true,
                  sequence: 1,
                  deliveryDate: initialData.deliveryDate && typeof initialData.deliveryDate === 'string' ? new Date(initialData.deliveryDate) : undefined,
                  deliveryStart: initialData.deliveryStart || "08:00",
                  deliveryEnd: initialData.deliveryEnd || "17:00",
                  deliveryType: initialData.deliveryType || "FCFS",
                  deliveryNotes: initialData.deliveryNotes,
                }]
              : [],
          commodity: initialData.commodity ?? "",
          weight: initialData.weight ?? 0,
          pieces: initialData.pieces === null ? undefined : initialData.pieces,
          equipmentType: initialData.equipmentType ?? "DRY_VAN",
          loadType: initialData.loadType ?? "FULL_TRUCK",
          minTemperature: initialData.minTemperature ?? undefined,
          maxTemperature: initialData.maxTemperature ?? undefined,
          temperatureUnit: initialData.temperatureUnit ?? undefined,
          continuousTemperature: initialData.continuousTemperature ?? false,
          customerRate: initialData.customerRate ?? 0,
          carrierRate: initialData.carrierRate ?? 0,
          internalNotes: initialData.internalNotes ?? "",
          referenceNumber: initialData.referenceNumber ?? "",
          driverName: initialData.driverName ?? "",
          driverPhone: initialData.driverPhone ?? "",
          truckNumber: initialData.truckNumber ?? "",
          trailerNumber: initialData.trailerNumber ?? "",
        } as LoadFormData)
      : {
          // Explicitly set root-level dates to undefined to prevent validation errors
          pickupDate: undefined,
          deliveryDate: undefined,
          pickupStart: "08:00",
          pickupEnd: "17:00",
          deliveryStart: "08:00",
          deliveryEnd: "17:00",
          pickupType: "FCFS",
          deliveryType: "FCFS",
          weight: 0,
          customerRate: 0,
          carrierRate: 0,
          commodity: "",
          equipmentType: "DRY_VAN",
          loadType: "FULL_TRUCK",
          driverName: "",
          driverPhone: "",
          truckNumber: "",
          trailerNumber: "",
          shippers: [{
            shipperId: "",
            isPrimary: true,
            sequence: 1,
            pickupDate: new Date(),
            pickupStart: "08:00",
            pickupEnd: "17:00",
            pickupType: "FCFS",
            pickupNotes: "",
          }],
          consignees: [{
            consigneeId: "",
            isPrimary: true,
            sequence: 1,
            deliveryDate: new Date(),
            deliveryStart: "08:00",
            deliveryEnd: "17:00",
            deliveryType: "FCFS",
            deliveryNotes: "",
          }],
        },
  });

  const onSubmit = async (data: LoadFormData) => {
    try {
      console.log("Form submission data:", data);

      if (onSubmitProp) {
        // Transform form data to API format
        const loadData = {
          customerId: data.customerId,
          carrierId: data.carrierId || undefined,
          // Remove root-level pickup/delivery dates - now handled in shippers/consignees
          pickupStart: data.pickupStart,
          pickupEnd: data.pickupEnd,
          pickupType: data.pickupType,
          deliveryStart: data.deliveryStart,
          deliveryEnd: data.deliveryEnd,
          deliveryType: data.deliveryType,
          shippers: data.shippers.map(shipper => ({
            shipperId: shipper.shipperId,
            isPrimary: shipper.isPrimary,
            sequence: shipper.sequence,
            pickupDate: shipper.pickupDate?.toISOString(),
            pickupStart: shipper.pickupStart,
            pickupEnd: shipper.pickupEnd,
            pickupType: shipper.pickupType,
            pickupNotes: shipper.pickupNotes,
          })),
          consignees: data.consignees.map(consignee => ({
            consigneeId: consignee.consigneeId,
            isPrimary: consignee.isPrimary,
            sequence: consignee.sequence,
            deliveryDate: consignee.deliveryDate?.toISOString(),
            deliveryStart: consignee.deliveryStart,
            deliveryEnd: consignee.deliveryEnd,
            deliveryType: consignee.deliveryType,
            deliveryNotes: consignee.deliveryNotes,
          })),
          commodity: data.commodity,
          weight: data.weight,
          pieces: data.pieces,
          equipmentType: data.equipmentType,
          loadType: data.loadType,
          customerRate: data.customerRate,
          carrierRate: data.carrierRate,
          internalNotes: data.internalNotes,
          referenceNumber: data.referenceNumber || undefined,
          driverName: data.driverName?.trim() ? data.driverName.trim() : null,
          driverPhone: data.driverPhone?.trim()
            ? data.driverPhone.trim()
            : null,
          truckNumber: data.truckNumber?.trim()
            ? data.truckNumber.trim()
            : null,
          trailerNumber: data.trailerNumber?.trim()
            ? data.trailerNumber.trim()
            : null,
        };

        console.log("Transformed load data:", loadData);
        await onSubmitProp(loadData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Dialog handlers
  const handleShipperCreated = (_shipper: { id: string; companyName: string }) => {
    // This will be handled by the ShippersSection component
    setIsShipperDialogOpen(false);
  };

  const handleConsigneeCreated = (_consignee: { id: string; companyName: string }) => {
    // This will be handled by the ConsigneesSection component
    setIsConsigneeDialogOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form
          id="load-form"
          onSubmit={(e) => {
            console.log("Form onSubmit triggered");
            console.log("Form errors:", form.formState.errors);
            console.log("Form values:", form.getValues());
            form.handleSubmit(
              (data) => {
                console.log("Form validation passed, calling onSubmit");
                onSubmit(data);
              },
              (errors) => {
                console.log("Form validation failed:", errors);
              }
            )(e);
          }}
          className="space-y-8"
        >
          {/* Load Information Section */}
          <LoadInformationSection control={form.control} />

          {/* Shippers Section */}
          <ShippersSection 
            onOpenShipperDialog={() => setIsShipperDialogOpen(true)}
          />

          {/* Consignees Section */}
          <ConsigneesSection 
            onOpenConsigneeDialog={() => setIsConsigneeDialogOpen(true)}
          />

          {/* Load Specifications Section */}
          <LoadSpecificationsSection control={form.control} />

          {/* Rates & Pricing Section */}
          {!initialData && (
            <RatesPricingSection control={form.control} isEdit={false} />
          )}

          {/* Additional Information Section */}
          <AdditionalInformationSection control={form.control} />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              form="load-form"
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

      {/* Render dialogs outside of form context using React Portal */}
      {isShipperDialogOpen && typeof window !== 'undefined' && createPortal(
        <ShipperCreateDialog
          open={isShipperDialogOpen}
          onOpenChange={setIsShipperDialogOpen}
          onSuccess={handleShipperCreated}
        />,
        document.body
      )}

      {isConsigneeDialogOpen && typeof window !== 'undefined' && createPortal(
        <ConsigneeCreateDialog
          open={isConsigneeDialogOpen}
          onOpenChange={setIsConsigneeDialogOpen}
          onSuccess={handleConsigneeCreated}
        />,
        document.body
      )}
    </>
  );
}
