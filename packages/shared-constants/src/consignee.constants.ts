// Consignee Form Constants

export const CONSIGNEE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const;

// Form Section Configuration
export const CONSIGNEE_FORM_SECTIONS = [
  {
    id: "company-info",
    title: "Company Information",
    description: "Basic company details",
  },
  {
    id: "address-info",
    title: "Address Information",
    description: "Location and contact details",
  },
  {
    id: "additional-info",
    title: "Additional Information",
    description: "Contact person and notes",
  },
] as const;
