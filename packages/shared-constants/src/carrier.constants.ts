// Carrier Form Constants

export const CARRIER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

export const CARRIER_TYPE_OPTIONS = [
  { value: "OWNER_OPERATOR", label: "Owner Operator" },
  { value: "FLEET", label: "Fleet" },
  { value: "BROKER", label: "Broker" },
  { value: "FREIGHT_FORWARDER", label: "Freight Forwarder" },
] as const;

export const INSURANCE_TYPES = [
  { value: "GENERAL_LIABILITY", label: "General Liability" },
  { value: "AUTO_LIABILITY", label: "Auto Liability" },
  { value: "CARGO", label: "Cargo" },
  { value: "WORKERS_COMP", label: "Workers Compensation" },
] as const;

// Equipment Types (same as loads but specific to carriers)
export const CARRIER_EQUIPMENT_TYPES = [
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

// Authority Status Options
export const AUTHORITY_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "REVOKED", label: "Revoked" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
] as const;

// Safety Rating Options
export const SAFETY_RATING_OPTIONS = [
  { value: "SATISFACTORY", label: "Satisfactory" },
  { value: "CONDITIONAL", label: "Conditional" },
  { value: "UNSATISFACTORY", label: "Unsatisfactory" },
  { value: "NOT_RATED", label: "Not Rated" },
] as const;

// Payment Terms Options
export const PAYMENT_TERMS_OPTIONS = [
  { value: "NET15", label: "Net 15" },
  { value: "NET30", label: "Net 30" },
  { value: "NET45", label: "Net 45" },
  { value: "NET60", label: "Net 60" },
  { value: "COD", label: "COD" },
  { value: "QUICKPAY", label: "Quick Pay" },
] as const;

// Payment Methods
export const PAYMENT_METHOD_OPTIONS = [
  { value: "CHECK", label: "Check" },
  { value: "ACH", label: "ACH" },
  { value: "WIRE", label: "Wire Transfer" },
  { value: "CARD", label: "Credit Card" },
] as const;

// Insurance Alert Levels
export const INSURANCE_ALERT_LEVELS = [
  { value: "GREEN", label: "Green", color: "text-green-600" },
  { value: "YELLOW", label: "Yellow", color: "text-yellow-600" },
  { value: "RED", label: "Red", color: "text-red-600" },
  { value: "EXPIRED", label: "Expired", color: "text-red-800" },
] as const;
