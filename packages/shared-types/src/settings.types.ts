// Settings Types for TMS Application

// ==================== PROFILE SETTINGS ====================
export interface ProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  loadUpdates: boolean;
  documentNotifications: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatar?: string | null;
  timezone?: string;
  language?: string;
}

export interface UpdateNotificationSettingsRequest {
  emailNotifications?: boolean;
  loadUpdates?: boolean;
  documentNotifications?: boolean;
  weeklyReports?: boolean;
  marketingEmails?: boolean;
}

// ==================== SECURITY SETTINGS ====================
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange?: string | null;
  activeSessions: ActiveSession[];
  passwordRequirements: PasswordRequirements;
}

export interface ActiveSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  location?: string;
  userAgent: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EnableTwoFactorRequest {
  secret: string;
  token: string;
}

export interface DisableTwoFactorRequest {
  token: string;
}

export interface TerminateSessionRequest {
  sessionId: string;
}

// ==================== ORGANIZATION SETTINGS ====================
export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  website?: string | null;
  mcNumber: string;
  dotNumber: string;
  address: OrganizationAddress;
  billingEmail?: string | null;
  plan: string;
  planExpiresAt?: string | null;
  documentNumbering: DocumentNumberingSettings;
  businessSettings: BusinessSettings;
  teamMembers: TeamMember[];
}

export interface OrganizationAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface DocumentNumberingSettings {
  loadNumberPrefix: string;
  loadNumberStart: number;
  invoiceNumberPrefix: string;
  invoiceNumberStart: number;
  autoIncrement: boolean;
}

export interface BusinessSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  fuelSurchargeRate: number;
  defaultLoadMargin: number;
  requireApprovalForLoads: boolean;
  allowCarrierSelfDispatch: boolean;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: string | null;
  invitedAt?: string | null;
  joinedAt?: string | null;
}

export interface UpdateOrganizationRequest {
  name?: string;
  logo?: string | null;
  website?: string | null;
  mcNumber?: string;
  dotNumber?: string;
  address?: Partial<OrganizationAddress>;
  billingEmail?: string | null;
}

export interface UpdateBusinessSettingsRequest {
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  fuelSurchargeRate?: number;
  defaultLoadMargin?: number;
  requireApprovalForLoads?: boolean;
  allowCarrierSelfDispatch?: boolean;
}

export interface UpdateDocumentNumberingRequest {
  loadNumberPrefix?: string;
  loadNumberStart?: number;
  invoiceNumberPrefix?: string;
  invoiceNumberStart?: number;
  autoIncrement?: boolean;
}

export interface InviteTeamMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface UpdateTeamMemberRequest {
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  isActive?: boolean;
}

// ==================== BILLING SETTINGS ====================
export interface BillingSettings {
  plan: string;
  planDisplayName: string;
  planExpiresAt?: string | null;
  billingCycle: "monthly" | "annual";
  nextBillingDate?: string | null;
  paymentMethods: PaymentMethod[];
  billingHistory: BillingInvoice[];
  usage: UsageMetrics;
}

export interface PaymentMethod {
  id: string;
  type: "card" | "bank_account";
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface BillingInvoice {
  id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  paidAt?: string | null;
  invoiceDate: string;
  description: string;
  downloadUrl?: string;
}

export interface UsageMetrics {
  loadsThisMonth: number;
  loadsLimit: number;
  usersCount: number;
  usersLimit: number;
  storageUsed: number;
  storageLimit: number;
}

export interface UpdateBillingRequest {
  billingCycle?: "monthly" | "annual";
}

export interface AddPaymentMethodRequest {
  type: "card" | "bank_account";
  token: string;
  setAsDefault?: boolean;
}

export interface UpdatePaymentMethodRequest {
  isDefault?: boolean;
}

// ==================== RESPONSE TYPES ====================
export interface ProfileSettingsResponse {
  success: boolean;
  data: ProfileSettings;
}

export interface SecuritySettingsResponse {
  success: boolean;
  data: SecuritySettings;
}

export interface OrganizationSettingsResponse {
  success: boolean;
  data: OrganizationSettings;
}

export interface BillingSettingsResponse {
  success: boolean;
  data: BillingSettings;
}

// TwoFactorSetupResponse is exported from auth.types.ts

export interface ActiveSessionsResponse {
  success: boolean;
  data: ActiveSession[];
}

export interface TeamMembersResponse {
  success: boolean;
  data: TeamMember[];
}

export interface BillingHistoryResponse {
  success: boolean;
  data: BillingInvoice[];
}

// ==================== SETTINGS FILTERS ====================
export interface SettingsFilters {
  section?: "profile" | "security" | "organization" | "billing";
}

// ==================== AUDIT LOG TYPES ====================
export interface SettingsAuditLog {
  id: string;
  userId: string;
  action: string;
  section: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
