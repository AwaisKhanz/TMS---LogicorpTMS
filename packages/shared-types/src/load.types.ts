import type { Address } from "./api.types";

// Load Enums
export enum LoadStatus {
  QUOTE = "QUOTE",
  BOOKED = "BOOKED",
  DISPATCHED = "DISPATCHED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  POD_RECEIVED = "POD_RECEIVED",
  COMPLETED = "COMPLETED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum EquipmentType {
  DRY_VAN = "DRY_VAN",
  REEFER = "REEFER",
  FLATBED = "FLATBED",
  STEP_DECK = "STEP_DECK",
  RGN = "RGN",
  POWER_ONLY = "POWER_ONLY",
  HOTSHOT = "HOTSHOT",
  BOX_TRUCK = "BOX_TRUCK",
  STRAIGHT_TRUCK = "STRAIGHT_TRUCK",
  OTHER = "OTHER",
}

export enum LoadType {
  FULL_TRUCK = "FULL_TRUCK",
  LTL = "LTL",
  PARTIAL = "PARTIAL",
  EXPEDITED = "EXPEDITED",
}

// Load Sub-Types
export interface Dimensions extends Record<string, number> {
  length: number;
  width: number;
  height: number;
}

export interface Accessorial extends Record<string, string | number> {
  type: string;
  amount: number;
  description: string;
}

export interface LoadCustomer {
  id: string;
  companyName: string;
}

export interface LoadCarrier {
  id: string;
  companyName: string;
  mcNumber: string;
}

export interface LoadShipper {
  id: string;
  companyName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactPerson?: string;
}

export interface LoadConsignee {
  id: string;
  companyName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  contactPerson?: string;
}

// Junction table types for many-to-many relationships
export interface LoadShipperRelation {
  id: string;
  loadId: string;
  shipperId: string;
  isPrimary: boolean;
  sequence: number;
  pickupDate?: string;
  pickupStart?: string;
  pickupEnd?: string;
  pickupType: "FCFS" | "BY_APPOINTMENT";
  pickupNotes?: string;
  createdAt: string;
  updatedAt: string;
  shipper: LoadShipper;
}

export interface LoadConsigneeRelation {
  id: string;
  loadId: string;
  consigneeId: string;
  isPrimary: boolean;
  sequence: number;
  deliveryDate?: string;
  deliveryStart?: string;
  deliveryEnd?: string;
  deliveryType: "FCFS" | "BY_APPOINTMENT";
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  consignee: LoadConsignee;
}

// Request types for shipper/consignee relationships
export interface CreateLoadShipperRequest {
  shipperId: string;
  isPrimary?: boolean;
  sequence?: number;
  pickupDate?: string;
  pickupStart?: string;
  pickupEnd?: string;
  pickupType?: "FCFS" | "BY_APPOINTMENT";
  pickupNotes?: string;
}

export interface CreateLoadConsigneeRequest {
  consigneeId: string;
  isPrimary?: boolean;
  sequence?: number;
  deliveryDate?: string;
  deliveryStart?: string;
  deliveryEnd?: string;
  deliveryType?: "FCFS" | "BY_APPOINTMENT";
  deliveryNotes?: string;
}

export interface LoadCreator {
  id: string;
  firstName: string;
  lastName: string;
}

export interface LoadEvent {
  id: string;
  loadId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LoadDocument {
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
}

export interface LoadTrackingInfo {
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
}

// Main Load Interface
export interface Load {
  id: string;
  loadNumber: string;
  referenceNumber?: string;
  status: LoadStatus;

  // Customer & Carrier
  customerId: string;
  customer: LoadCustomer;
  carrierId?: string;
  carrier?: LoadCarrier;

  // Pickup/Delivery Times (moved to load level for backward compatibility)
  pickupDate: string;
  pickupStart: string;
  pickupEnd: string;
  pickupType: "FCFS" | "BY_APPOINTMENT";

  deliveryDate: string;
  deliveryStart: string;
  deliveryEnd: string;
  deliveryType: "FCFS" | "BY_APPOINTMENT";

  // Multiple Shippers and Consignees
  loadShippers: LoadShipperRelation[];
  loadConsignees: LoadConsigneeRelation[];

  // Load Details
  commodity: string;
  weight: number;
  pieces?: number;
  units?: number;
  multipleCommodityDescription?: string;
  dimensions?: Dimensions;
  equipmentType: EquipmentType;
  loadType: LoadType;
  
  // Temperature (for REEFER equipment)
  minTemperature?: number;
  maxTemperature?: number;
  temperatureUnit?: "FAHRENHEIT" | "CELSIUS";
  continuousTemperature?: boolean;

  // Rates & Costs
  customerRate: number;
  carrierRate?: number;
  margin?: number;
  accessorials?: Accessorial[];

  // Rate Change Tracking
  customerRateChangeReason?: string;
  carrierRateChangeReason?: string;
  lastCustomerRateChange?: string;
  lastCarrierRateChange?: string;

  // Tracking
  currentLocation?: LoadTrackingInfo;
  eta?: string;
  trackingMethod?: string;

  // Instructions
  internalNotes?: string;

  // Status Timestamps
  bookedAt?: string;
  dispatchedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  invoicedAt?: string;
  paidAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator: LoadCreator;
  assignedTo?: string;
  assignee?: LoadCreator;

  // Relations
  events?: LoadEvent[];
  documents?: LoadDocument[];
}

// Request Types
export interface CreateLoadRequest {
  customerId: string;
  carrierId?: string;

  // Pickup/Delivery Times (load level)
  pickupDate: string; // Always string in requests
  pickupStart: string;
  pickupEnd: string;
  pickupType: "FCFS" | "BY_APPOINTMENT";

  deliveryDate: string; // Always string in requests
  deliveryStart: string;
  deliveryEnd: string;
  deliveryType: "FCFS" | "BY_APPOINTMENT";

  // Multiple Shippers and Consignees
  shippers: CreateLoadShipperRequest[];
  consignees: CreateLoadConsigneeRequest[];

  // Load Details
  commodity: string;
  weight: number;
  pieces?: number;
  units?: number;
  multipleCommodityDescription?: string;
  dimensions?: Dimensions;
  equipmentType: EquipmentType;
  loadType?: LoadType;
  
  // Temperature (for REEFER equipment)
  minTemperature?: number;
  maxTemperature?: number;
  temperatureUnit?: "FAHRENHEIT" | "CELSIUS";
  continuousTemperature?: boolean;

  // Rates
  customerRate: number;
  carrierRate?: number;
  accessorials?: Accessorial[];

  // Rate Change Tracking
  customerRateChangeReason?: string;
  carrierRateChangeReason?: string;

  // Instructions
  internalNotes?: string;
  referenceNumber?: string;
  assignedTo?: string;
}

export interface UpdateLoadRequest extends Partial<CreateLoadRequest> {
  status?: LoadStatus;
  pickupDate?: string; // Always string in requests
  deliveryDate?: string; // Always string in requests
  shippers?: CreateLoadShipperRequest[];
  consignees?: CreateLoadConsigneeRequest[];
}

export interface LoadFilters {
  status?: string;
  customerId?: string;
  carrierId?: string;
  pickupDateFrom?: Date | string;
  pickupDateTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Response Types
export interface CreateLoadResponse {
  success: boolean;
  data: Load;
}

export interface UpdateLoadResponse {
  success: boolean;
  data: Load;
}

export interface GetLoadResponse {
  success: boolean;
  data: Load;
}

export interface GetLoadsResponse {
  success: boolean;
  data: Load[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeleteLoadResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// Statistics Types
export interface LoadStatistics {
  count: number;
  revenue: number;
  cost: number;
  margin: number;
}

export type LoadStatisticsByStatus = Record<LoadStatus, LoadStatistics>;

export interface LoadDashboardStats {
  totalLoads: number;
  activeLoads: number;
  todayPickups: number;
  todayDeliveries: number;
  weekRevenue: number;
  weekMargin: number;
  monthRevenue: number;
  monthMargin: number;
  statusDistribution: Record<string, number>;
}

// Event Types
export interface LoadCreatedEventData {
  status: string;
  createdBy: string;
}

export interface LoadUpdatedEventData {
  updatedFields: string[];
  updatedBy: string;
}

export interface StatusChangeEventData {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason?: string;
}

export type LoadEventData =
  | LoadCreatedEventData
  | LoadUpdatedEventData
  | StatusChangeEventData
  | Record<string, unknown>;

export interface CreateLoadEventRequest {
  eventType: string;
  eventData: LoadEventData;
  createdBy?: string;
}

// Export Types
export interface LoadExportData {
  loadNumber: string;
  status: string;
  customer?: {
    companyName: string;
  };
  carrier?: {
    companyName: string;
  };
  shipperAddress: {
    city?: string;
    state?: string;
    [key: string]: unknown;
  };
  consigneeAddress: {
    city?: string;
    state?: string;
    [key: string]: unknown;
  };
  pickupDate?: Date;
  deliveryDate?: Date;
  commodity: string;
  weight: number;
  equipmentType: string;
  customerRate: number | string;
  carrierRate?: number | string;
  margin?: number | string;
  [key: string]: unknown;
}
