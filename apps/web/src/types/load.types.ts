// Re-export load types from shared types package
export type {
  Load,
  LoadStatus,
  EquipmentType,
  LoadType,
  Dimensions,
  Accessorial,
  LoadCustomer,
  LoadCarrier,
  LoadCreator,
  LoadEvent,
  LoadDocument,
  LoadTrackingInfo,
  CreateLoadRequest,
  UpdateLoadRequest,
  LoadFilters,
  CreateLoadResponse,
  UpdateLoadResponse,
  GetLoadResponse,
  GetLoadsResponse,
  DeleteLoadResponse,
  LoadStatistics,
  LoadStatisticsByStatus,
  DashboardStats,
  LoadCreatedEventData,
  LoadUpdatedEventData,
  StatusChangeEventData,
  LoadEventData,
  CreateLoadEventRequest,
  LoadExportData,
  Address,
} from "@tms/shared-types";

// Import shared types for aliases
import type { CreateLoadRequest, UpdateLoadRequest } from "@tms/shared-types";

// Legacy aliases for compatibility
export type CreateLoadInput = CreateLoadRequest;
export type UpdateLoadInput = UpdateLoadRequest;