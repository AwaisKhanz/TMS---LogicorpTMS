import type { Address } from "./api.types";
import type { Role, Permission } from "./permission.types";

// Auth Request Types (DTOs)
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  mcNumber: string;
  dotNumber: string;
  companyAddress: Address;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Auth Response Types
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  organizationId: string;
  twoFactorEnabled?: boolean;
  emailVerified: boolean;
  roles: Role[];
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  mcNumber: string;
  dotNumber: string;
  address: Address;
  logo?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  organization: AuthOrganization;
  tokens: AuthTokens;
  requires2FA?: boolean;
}

// Two-Factor Authentication Types
export interface TwoFactorSetupRequest {
  // No body needed, userId from auth middleware
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export interface TwoFactorEnableRequest {
  token: string;
}

export interface TwoFactorDisableRequest {
  token: string;
}

export interface TwoFactorVerifyRequest {
  token: string;
}

export interface TwoFactorVerifyResponse {
  valid: boolean;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
}

// Standard API Response Types for Auth
export interface LoginResponse {
  user: AuthUser;
  organization: AuthOrganization;
  tokens?: AuthTokens;
  requires2FA?: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
  organization: AuthOrganization;
  tokens: AuthTokens;
}

export interface LogoutResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationResponse {
  message: string;
}
