// Re-export carrier types from shared types package
export type {
  Carrier,
  CSAScores,
  PreferredLane,
  CarrierContact,
  CarrierDocument,
  CreateCarrierRequest,
  UpdateCarrierRequest,
  CreateCarrierContactRequest,
  UpdateCarrierContactRequest,
  CarrierRatingRequest,
  CarrierFilters,
  CreateCarrierResponse,
  UpdateCarrierResponse,
  GetCarrierResponse,
  GetCarriersResponse,
  DeleteCarrierResponse,
  CreateCarrierContactResponse,
  UpdateCarrierContactResponse,
  DeleteCarrierContactResponse,
  CarrierStatistics,
  CarrierPerformance,
  CarrierRating,
  CarrierOnboarding,
  InsuranceAlert,
  GetInsuranceAlertsResponse,
  FMCSAVerification,
  VerifyFMCSARequest,
  VerifyFMCSAResponse,
  CarrierLoadData,
  GetCarrierLoadsResponse,
  CarrierExportData,
  Address,
} from "@tms/shared-types";

// Import types for legacy aliases
import type {
  CreateCarrierRequest,
  UpdateCarrierRequest,
  CreateCarrierContactRequest,
  UpdateCarrierContactRequest
} from "@tms/shared-types";

// Legacy aliases for compatibility
export type CreateCarrierInput = CreateCarrierRequest;
export type UpdateCarrierInput = UpdateCarrierRequest;
export type CreateCarrierContactInput = CreateCarrierContactRequest;
export type UpdateCarrierContactInput = UpdateCarrierContactRequest;