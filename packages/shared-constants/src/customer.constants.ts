// Customer Form Constants

export const CUSTOMER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PENDING", label: "Pending" },
] as const;

export const CUSTOMER_TYPE_OPTIONS = [
  { value: "SHIPPER", label: "Shipper" },
  { value: "CONSIGNEE", label: "Consignee" },
  { value: "BOTH", label: "Both Shipper & Consignee" },
] as const;

export const PAYMENT_TERMS = [
  { value: "NET_15", label: "Net 15" },
  { value: "NET_30", label: "Net 30" },
  { value: "NET_45", label: "Net 45" },
  { value: "NET_60", label: "Net 60" },
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
] as const;
