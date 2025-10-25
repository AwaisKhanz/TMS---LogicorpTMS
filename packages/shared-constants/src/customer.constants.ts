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
  { value: "NET15", label: "Net 15" },
  { value: "NET30", label: "Net 30" },
  { value: "NET45", label: "Net 45" },
  { value: "NET60", label: "Net 60" },
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt" },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
] as const;

// Industry Options
export const INDUSTRY_OPTIONS = [
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "PHARMACEUTICALS", label: "Pharmaceuticals" },
  { value: "TEXTILES", label: "Textiles" },
  { value: "OTHER", label: "Other" },
] as const;

// Credit Status Indicators
export const CREDIT_STATUS = {
  GOOD: "good",
  WARNING: "warning", 
  CRITICAL: "critical",
} as const;

export const CREDIT_STATUS_LABELS = {
  [CREDIT_STATUS.GOOD]: "Good",
  [CREDIT_STATUS.WARNING]: "Warning",
  [CREDIT_STATUS.CRITICAL]: "Critical",
} as const;

export const CREDIT_STATUS_COLORS = {
  [CREDIT_STATUS.GOOD]: "green",
  [CREDIT_STATUS.WARNING]: "yellow",
  [CREDIT_STATUS.CRITICAL]: "red",
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  CREDIT_WARNING_PERCENTAGE: 75,
  CREDIT_CRITICAL_PERCENTAGE: 90,
  PAYMENT_OVERDUE_DAYS: 30,
  HIGH_VALUE_CUSTOMER_REVENUE: 100000,
  TOP_CUSTOMER_LIMIT: 10,
} as const;

// Export Field Mappings
export const CUSTOMER_EXPORT_FIELDS = [
  { key: "companyName", label: "Company Name", required: true },
  { key: "dba", label: "DBA" },
  { key: "industry", label: "Industry" },
  { key: "billingEmail", label: "Billing Email", required: true },
  { key: "billingPhone", label: "Billing Phone", required: true },
  { key: "billingAddress.street", label: "Street Address" },
  { key: "billingAddress.city", label: "City" },
  { key: "billingAddress.state", label: "State" },
  { key: "billingAddress.zip", label: "ZIP Code" },
  { key: "paymentTerms", label: "Payment Terms" },
  { key: "creditLimit", label: "Credit Limit" },
  { key: "creditUsed", label: "Credit Used" },
  { key: "totalLoads", label: "Total Loads" },
  { key: "totalRevenue", label: "Total Revenue" },
  { key: "averageMargin", label: "Average Margin" },
  { key: "isActive", label: "Status" },
  { key: "createdAt", label: "Created Date" },
] as const;

// Validation Constants
export const CUSTOMER_VALIDATION = {
  COMPANY_NAME_MIN_LENGTH: 1,
  COMPANY_NAME_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 50,
  NOTES_MAX_LENGTH: 1000,
  CREDIT_LIMIT_MIN: 0,
  CREDIT_LIMIT_MAX: 999999999,
} as const;

// Sort Options
export const CUSTOMER_SORT_OPTIONS = [
  { value: "companyName", label: "Company Name" },
  { value: "totalRevenue", label: "Total Revenue" },
  { value: "totalLoads", label: "Total Loads" },
  { value: "creditLimit", label: "Credit Limit" },
  { value: "createdAt", label: "Created Date" },
  { value: "updatedAt", label: "Last Updated" },
] as const;

// Filter Options
export const CUSTOMER_FILTER_OPTIONS = {
  STATUS: [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  CREDIT_STATUS: [
    { value: "all", label: "All Credit Status" },
    { value: "good", label: "Good" },
    { value: "warning", label: "Warning" },
    { value: "critical", label: "Critical" },
  ],
  PAYMENT_TERMS: [
    { value: "all", label: "All Payment Terms" },
    ...PAYMENT_TERMS,
  ],
  INDUSTRY: [
    { value: "all", label: "All Industries" },
    ...INDUSTRY_OPTIONS,
  ],
} as const;

// Bulk Action Options
export const CUSTOMER_BULK_ACTIONS = [
  { value: "activate", label: "Activate", icon: "check" },
  { value: "deactivate", label: "Deactivate", icon: "x" },
  { value: "export", label: "Export", icon: "download" },
  { value: "delete", label: "Delete", icon: "trash" },
] as const;
