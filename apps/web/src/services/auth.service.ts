import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyResponse,
} from "@/types";

type TwoFactorEnableResponse = { success: boolean };
type TwoFactorDisableResponse = { success: boolean };

export interface ValidateInvitationResponse {
  organizationName: string;
  inviterName: string;
  roles: string[];
  userEmail: string;
  userName: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface AcceptInvitationResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
    emailVerifiedAt?: string;
    twoFactorEnabled: boolean;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logo?: string;
      website?: string;
      mcNumber?: string;
      dotNumber?: string;
      address: {
        zip: string;
        city: string;
        state: string;
        street: string;
        country: string;
      };
      settings: Record<string, unknown>;
      documentNumbering: {
        autoIncrement: boolean;
        loadNumberStart: number;
        loadNumberPrefix: string;
        invoiceNumberStart: number;
        invoiceNumberPrefix: string;
      };
      billingEmail?: string;
      plan: string;
      planExpiresAt?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    roles: string[];
    permissions: string[];
  };
  token: string;
  expiresAt: string;
}

export const authService = {
  async acceptInvitation(
    data: AcceptInvitationRequest
  ): Promise<ApiResponse<AcceptInvitationResponse>> {
    const response = await apiClient.post<
      ApiResponse<AcceptInvitationResponse>
    >("/auth/accept-invitation", data);
    return response;
  },

  async setup2FA() {
    const response =
      await apiClient.post<ApiResponse<TwoFactorSetupResponse>>(
        "/two-factor/setup"
      );
    return response.data;
  },

  async enable2FA(token: string) {
    const response = await apiClient.post<ApiResponse<TwoFactorEnableResponse>>(
      "/two-factor/enable",
      { token }
    );
    return response.data;
  },

  async disable2FA(token: string) {
    const response = await apiClient.post<
      ApiResponse<TwoFactorDisableResponse>
    >("/two-factor/disable", { token });
    return response.data;
  },

  async verify2FA(token: string) {
    const response = await apiClient.post<ApiResponse<TwoFactorVerifyResponse>>(
      "/two-factor/verify",
      { token }
    );
    return response.data;
  },

  async validateInvitation(token: string) {
    const response = await apiClient.get<
      ApiResponse<ValidateInvitationResponse>
    >(`/auth/validate-invitation?token=${token}`);
    return response.data;
  },
};
