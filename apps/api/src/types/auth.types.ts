import type { User, Organization } from "@tms/database";

// DTOs (Data Transfer Objects)
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
  twoFactorToken?: string; // Optional 2FA token
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

// Response Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, "passwordHash">;
  organization: Organization;
  tokens: AuthTokens;
  requires2FA?: boolean; // True if 2FA is required
}

export interface TwoFactorSetupDto {
  userId: string;
  token: string;
}

export interface TwoFactorVerifyDto {
  userId: string;
  token: string;
}
