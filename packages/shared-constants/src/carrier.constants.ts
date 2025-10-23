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
