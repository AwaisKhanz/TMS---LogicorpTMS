import { z } from "zod";

export const loadFormSchema = z.object({
  // Customer
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional(),

  // Shipper
  shipperId: z.string().min(1, "Shipper is required"),
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  pickupStart: z.string().min(1, "Pickup start time is required"),
  pickupEnd: z.string().min(1, "Pickup end time is required"),
  pickupType: z.enum(["FCFS", "BY_APPOINTMENT"], {
    required_error: "Pickup type is required",
  }),

  // Consignee
  consigneeId: z.string().min(1, "Consignee is required"),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  deliveryStart: z.string().min(1, "Delivery start time is required"),
  deliveryEnd: z.string().min(1, "Delivery end time is required"),
  deliveryType: z.enum(["FCFS", "BY_APPOINTMENT"], {
    required_error: "Delivery type is required",
  }),

  // Load Details
  commodity: z.string().min(1, "Commodity is required"),
  weight: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .refine((val) => val > 0, "Weight must be greater than 0"),
  pieces: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),
  units: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),
  multipleCommodityDescription: z.string().optional(),
  equipmentType: z.string().min(1, "Equipment type is required"),
  loadType: z.string().optional(),

  // Rates
  customerRate: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .refine((val) => val >= 0, "Customer rate must be positive"),
  carrierRate: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),

  // Rate Change Tracking
  customerRateChangeReason: z.string().optional(),
  carrierRateChangeReason: z.string().optional(),

  // Instructions
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

export type LoadFormData = z.infer<typeof loadFormSchema>;
