import { apiClient } from "@/lib/api-client";
import type {
  TwoFactorSetupResponse,
  TwoFactorVerifyResponse,
  ApiResponse,
} from "@/types";

export const authService = {
  // Two-Factor Authentication Methods
  setup2FA: async (): Promise<TwoFactorSetupResponse> => {
    const response = await apiClient.post<ApiResponse<TwoFactorSetupResponse>>(
      "/two-factor/setup",
      {}
    );
    return response.data;
  },

  enable2FA: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/two-factor/enable",
      { token }
    );
    return response.data;
  },

  disable2FA: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      "/two-factor/disable",
      { token }
    );
    return response.data;
  },

  verify2FA: async (token: string): Promise<TwoFactorVerifyResponse> => {
    const response = await apiClient.post<ApiResponse<TwoFactorVerifyResponse>>(
      "/two-factor/verify",
      { token }
    );
    return response.data;
  },
};
