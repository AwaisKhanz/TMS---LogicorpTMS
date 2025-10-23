import { z } from "zod";

export const loadFormSchema = z.object({
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

  // Instructions
  pickupNotes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  referenceNumber: z.string().optional(),
});

export type LoadFormData = z.infer<typeof loadFormSchema>;
