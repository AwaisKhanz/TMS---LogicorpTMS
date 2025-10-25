import type { Address, PaginationMeta } from "./api.types";

// CSA (Compliance, Safety, Accountability) Scores
export interface CSAScores extends Record<string, number | undefined> {
  unsafeDrivering?: number;
  crashIndicator?: number;
  hoursOfServiceCompliance?: number;
  vehicleMaintenance?: number;
  controlledSubstancesAlcohol?: number;
  hazmatCompliance?: number;
  driverFitness?: number;
}

// Preferred Lane Configuration
export interface PreferredLane
  extends Record<string, string | number | undefined> {
  pickup: string; // State or city
  delivery: string; // State or city
  equipmentType?: string;
  rate?: number;
  notes?: string;
}

// Carrier Sub-Types
export interface CarrierContact {
  id: string;
  carrierId: string;
  name: string;
  title?: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface CarrierDocument {
  id: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  type: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt: string | null;
}

// Main Carrier Interface
export interface Carrier {
  id: string;
  organizationId: string;

  // Identification
  mcNumber: string;
  dotNumber?: string;
  scac?: string;

  // Company Info
  companyName: string;
  dba?: string;
  ein?: string;

  // Contact
  email: string;
  phone: string;
  fax?: string;
  address: Address;

  // Primary Contact
  contactName: string;
  contactPhone: string;
  contactEmail: string;

  // Compliance
  authorityStatus: string;
  insuranceExpiry?: string;
  insuranceAmount?: number;
  cargoInsurance?: number;
  liabilityInsurance?: number;

  // Safety
  safetyRating?: string;
  csa?: CSAScores;

  // Financial
  paymentTerms: string;
  paymentMethod: string;
  w9OnFile: boolean;
  factoring: boolean;
  factoringCompany?: string;

  // Performance
  totalLoads: number;

  // Preferences
  preferredLanes?: PreferredLane[];
  equipment: string[];

  // Status
  isActive: boolean;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relations
  contacts?: CarrierContact[];
  _count?: {
    loads: number;
  };
}

// Request Types
export interface CreateCarrierRequest {
  mcNumber: string;
  dotNumber?: string;
  scac?: string;
  companyName: string;
  dba?: string;
  ein?: string;
  email: string;
  phone: string;
  fax?: string;
  address: Address;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  authorityStatus?: string;
  insuranceExpiry?: Date | string;
  insuranceAmount?: number;
  cargoInsurance?: number;
  liabilityInsurance?: number;
  safetyRating?: string;
  csa?: CSAScores;
  paymentTerms?: string;
  paymentMethod?: string;
  w9OnFile?: boolean;
  factoring?: boolean;
  factoringCompany?: string;
  preferredLanes?: PreferredLane[];
  equipment?: string[];
  notes?: string;
}

export interface UpdateCarrierRequest extends Partial<CreateCarrierRequest> {
  isActive?: boolean;
}

export interface CreateCarrierContactRequest {
  name: string;
  email: string;
  phone: string;
  title?: string;
  isPrimary?: boolean;
}

export interface UpdateCarrierContactRequest
  extends Partial<CreateCarrierContactRequest> {}

export interface CarrierRatingRequest {
  rating: number; // 1-5
  comment?: string;
  loadId?: string;
}

export interface CarrierFilters {
  status?: string;
  isActive?: boolean;
  isApproved?: boolean;
  equipment?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Response Types
export interface CreateCarrierResponse {
  success: boolean;
  data: Carrier;
}

export interface UpdateCarrierResponse {
  success: boolean;
  data: Carrier;
}

export interface GetCarrierResponse {
  success: boolean;
  data: Carrier;
}

export interface GetCarriersResponse {
  success: boolean;
  data: Carrier[];
  pagination?: PaginationMeta;
}

export interface DeleteCarrierResponse {
  success: boolean;
  data: {
    message: string;
  };
}

export interface CreateCarrierContactResponse {
  success: boolean;
  data: CarrierContact;
}

export interface UpdateCarrierContactResponse {
  success: boolean;
  data: CarrierContact;
}

export interface DeleteCarrierContactResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// Statistics and Performance Types
export interface CarrierStatistics {
  total: number;
  approved: number;
  pending: number;
  active: number;
  inactive: number;
  expiringInsurance: number;
}

export interface CarrierPerformance {
  totalLoads: number;
  activeLoads: number;
  completedLoads: number;
  totalRevenue: number;
  averageMargin: number;
}

// Onboarding Types
export interface CarrierOnboarding {
  step: number; // 1-6
  basicInfoComplete: boolean;
  fmcsaVerified: boolean;
  insuranceVerified: boolean;
  w9Received: boolean;
  contractSigned: boolean;
  approved: boolean;
}

// Insurance Alert Types
export interface InsuranceAlert {
  carrierId: string;
  carrierName: string;
  mcNumber: string;
  insuranceExpiry: string;
  daysUntilExpiry: number;
  insuranceAmount: number;
  alertLevel: "GREEN" | "YELLOW" | "RED" | "EXPIRED";
}

export interface GetInsuranceAlertsResponse {
  success: boolean;
  data: InsuranceAlert[];
}

// FMCSA Verification Types
export interface FMCSAVerification {
  mcNumber: string;
  verified: boolean;
  data: {
    legalName: string;
    authorityStatus: string;
    insuranceOnFile: boolean;
    safetyRating: string;
  };
  message?: string;
}

export interface VerifyFMCSARequest {
  mcNumber: string;
  dotNumber?: string;
}

export interface VerifyFMCSAResponse {
  success: boolean;
  data: FMCSAVerification;
}

// Carrier Load Data for display
export interface CarrierLoadData {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate: string;
  deliveryDate: string;
  customer?: {
    companyName: string;
  };
  customerRate: number;
  carrierRate?: number;
}

// Carrier with loads included
export interface CarrierWithLoads extends Carrier {
  loads: CarrierLoadData[];
  contacts: CarrierContact[];
  _count: {
    loads: number;
  };
}

export interface GetCarrierLoadsResponse {
  success: boolean;
  data: CarrierLoadData[];
  pagination?: PaginationMeta;
}

// Export Types
export interface CarrierExportData {
  mcNumber: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    city?: string;
    state?: string;
    [key: string]: unknown;
  };
  authorityStatus: string;
  insuranceExpiry?: Date | string;
  insuranceAmount?: number | string;
  totalLoads: number;
  onTimeDelivery: number;
  rating: number;
  isActive: boolean;
  isApproved: boolean;
  [key: string]: unknown;
}
