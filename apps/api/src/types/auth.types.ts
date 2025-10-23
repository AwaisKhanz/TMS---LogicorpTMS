import type { Request } from "express";

// Authenticated request interface that matches the actual middleware implementation
export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    organizationId: string;
    email: string;
    role: string;
    permissions: string[];
    emailVerified: boolean;
  };
}

// Re-export auth types from shared types package
export type {
  LoginRequest as LoginDto,
  RegisterRequest as RegisterDto,
  ForgotPasswordRequest as ForgotPasswordDto,
  ResetPasswordRequest as ResetPasswordDto,
  VerifyEmailRequest as VerifyEmailDto,
  ResendVerificationRequest as ResendVerificationDto,
  AuthTokens,
  AuthUser,
  AuthOrganization,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  TwoFactorSetupRequest as TwoFactorSetupDto,
  TwoFactorSetupResponse,
  TwoFactorEnableRequest as TwoFactorEnableDto,
  TwoFactorDisableRequest as TwoFactorDisableDto,
  TwoFactorVerifyRequest as TwoFactorVerifyDto,
  TwoFactorVerifyResponse,
  TwoFactorStatusResponse,
} from "@tms/shared-types";
