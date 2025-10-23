// Load Form Constants

export const EQUIPMENT_TYPES = [
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
] as const;

export const LOAD_TYPES = [
  { value: "FULL_TRUCK", label: "Full Truckload" },
  { value: "LTL", label: "Less Than Truckload" },
  { value: "PARTIAL", label: "Partial" },
  { value: "EXPEDITED", label: "Expedited" },
] as const;

export const TIME_SLOTS = [
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
] as const;

export const LOAD_STATUS_OPTIONS = [
  { value: "QUOTE", label: "Quote" },
  { value: "BOOKED", label: "Booked" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "POD_RECEIVED", label: "POD Received" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

// Form Section Configuration
export const LOAD_FORM_SECTIONS = [
  {
    id: "load-info",
    title: "Load Information",
    description: "Customer and reference details",
  },
  {
    id: "shipper-info",
    title: "Shipper Information",
    description: "Pickup location and timing details",
  },
  {
    id: "consignee-info",
    title: "Consignee Information",
    description: "Delivery location and timing details",
  },
  {
    id: "load-specs",
    title: "Load Specifications",
    description: "Commodity and equipment details",
  },
  {
    id: "rates-pricing",
    title: "Rates & Pricing",
    description: "Customer and carrier rates",
  },
  {
    id: "additional-info",
    title: "Additional Information",
    description: "Notes and special instructions",
  },
] as const;
