import { z } from "zod";

const shipperRelationFormSchema = z.object({
  shipperId: z.string().min(1, "Shipper is required"),
  isPrimary: z.boolean().optional(),
  sequence: z.number().int().min(1).optional(),
  pickupDate: z.date({ required_error: "Pickup date is required" }),
  pickupStart: z.string().min(1, "Pickup start time is required"),
  pickupEnd: z.string().min(1, "Pickup end time is required"),
  pickupType: z.enum(["FCFS", "BY_APPOINTMENT"], {
    required_error: "Pickup type is required",
  }),
  pickupNotes: z.string().optional(),
});

const consigneeRelationFormSchema = z.object({
  consigneeId: z.string().min(1, "Consignee is required"),
  isPrimary: z.boolean().optional(),
  sequence: z.number().int().min(1).optional(),
  deliveryDate: z.date({ required_error: "Delivery date is required" }),
  deliveryStart: z.string().min(1, "Delivery start time is required"),
  deliveryEnd: z.string().min(1, "Delivery end time is required"),
  deliveryType: z.enum(["FCFS", "BY_APPOINTMENT"], {
    required_error: "Delivery type is required",
  }),
  deliveryNotes: z.string().optional(),
});

export const loadFormSchema = z.object({
  // Customer
  customerId: z.string().min(1, "Customer is required"),
  carrierId: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  truckNumber: z.string().optional(),
  trailerNumber: z.string().optional(),

  // Load-level pickup/delivery times (legacy - now using shipper/consignee specific times)
  pickupDate: z.union([z.date(), z.undefined()]).optional(),
  pickupStart: z.string().optional(),
  pickupEnd: z.string().optional(),
  pickupType: z.enum(["FCFS", "BY_APPOINTMENT"]).optional(),

  deliveryDate: z.union([z.date(), z.undefined()]).optional(),
  deliveryStart: z.string().optional(),
  deliveryEnd: z.string().optional(),
  deliveryType: z.enum(["FCFS", "BY_APPOINTMENT"]).optional(),

  // Multiple shippers and consignees
  shippers: z.array(shipperRelationFormSchema).min(1, "At least one shipper is required"),
  consignees: z.array(consigneeRelationFormSchema).min(1, "At least one consignee is required"),

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
  
  // Temperature (for REEFER equipment)
  minTemperature: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),
  maxTemperature: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      if (typeof val === "string") {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return val;
    })
    .optional(),
  temperatureUnit: z.enum(["FAHRENHEIT", "CELSIUS"]).optional(),
  continuousTemperature: z.boolean().optional(),

  // Rates
  customerRate: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return 0;
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .refine((val) => val > 0, "Customer rate is required and must be greater than 0"),
  carrierRate: z
    .union([z.number(), z.string()])
    .transform((val) => {
      if (val === "" || val === undefined || val === null) return 0;
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return val;
    })
    .refine((val) => val > 0, "Carrier rate is required and must be greater than 0"),

  // Rate Change Tracking
  customerRateChangeReason: z.string().optional(),
  carrierRateChangeReason: z.string().optional(),

  // Instructions
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

export type LoadFormData = z.infer<typeof loadFormSchema>;
