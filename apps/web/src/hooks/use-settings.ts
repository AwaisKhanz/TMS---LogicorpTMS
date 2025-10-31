import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import type { ApiErrorException } from "@/types/api.types";
import type {
  ProfileSettings,
  UpdateProfileRequest,
  SecuritySettings,
  ChangePasswordRequest,
  EnableTwoFactorRequest,
  DisableTwoFactorRequest,
  OrganizationSettings,
  UpdateOrganizationRequest,
  UpdateBusinessSettingsRequest,
  UpdateDocumentNumberingRequest,
  TeamMember,
  InviteTeamMemberRequest,
  UpdateTeamMemberRequest,
  BillingSettings,
  ActiveSession,
  TwoFactorSetupResponse,
  ProfileSettingsResponse,
  SecuritySettingsResponse,
  OrganizationSettingsResponse,
  BillingSettingsResponse,
  ActiveSessionsResponse,
  TeamMembersResponse,
  BillingHistoryResponse,
  BillingInvoice,
} from "@tms/shared-types";

// ==================== QUERY KEYS ====================
export const settingsKeys = {
  all: ["settings"] as const,
  profile: () => [...settingsKeys.all, "profile"] as const,
  security: () => [...settingsKeys.all, "security"] as const,
  organization: () => [...settingsKeys.all, "organization"] as const,
  billing: () => [...settingsKeys.all, "billing"] as const,
  sessions: () => [...settingsKeys.all, "sessions"] as const,
  team: () => [...settingsKeys.all, "team"] as const,
  billingHistory: () => [...settingsKeys.all, "billing-history"] as const,
};

// ==================== PROFILE SETTINGS ====================

export function useProfile() {
  return useQuery<ProfileSettings>({
    queryKey: settingsKeys.profile(),
    queryFn: async () => {
      const response =
        await apiClient.get<ProfileSettingsResponse>("/settings/profile");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await apiClient.put<ProfileSettingsResponse>(
        "/settings/profile",
        data
      );
      return response;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      // Refresh auth context to update user data in header
      console.log("Profile updated, refreshing user context...");
      await refreshUser();
      console.log("User context refreshed");
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to update profile"
      );
    },
  });
}

// Notification settings removed - using simplified notification system

// ==================== SECURITY SETTINGS ====================

export function useSecuritySettings() {
  return useQuery<SecuritySettings>({
    queryKey: settingsKeys.security(),
    queryFn: async () => {
      const response =
        await apiClient.get<SecuritySettingsResponse>("/settings/security");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      await apiClient.post("/settings/security/change-password", data);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to change password"
      );
    },
  });
}

export function useSetupTwoFactor() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<TwoFactorSetupResponse>(
        "/settings/security/2fa/setup"
      );
      return response;
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to setup two-factor authentication"
      );
    },
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnableTwoFactorRequest) => {
      const response = await apiClient.post(
        "/settings/security/2fa/enable",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.security() });
      toast.success("Two-factor authentication enabled successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to enable two-factor authentication"
      );
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DisableTwoFactorRequest) => {
      await apiClient.post("/settings/security/2fa/disable", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.security() });
      toast.success("Two-factor authentication disabled successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to disable two-factor authentication"
      );
    },
  });
}

export function useActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: settingsKeys.sessions(),
    queryFn: async () => {
      const response = await apiClient.get<ActiveSessionsResponse>(
        "/settings/security/sessions"
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useTerminateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/settings/security/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      toast.success("Session terminated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to terminate session"
      );
    },
  });
}

export function useTerminateAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/settings/security/sessions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      toast.success("All sessions terminated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to terminate sessions"
      );
    },
  });
}

// ==================== ORGANIZATION SETTINGS ====================

export function useOrganizationSettings() {
  return useQuery<OrganizationSettings>({
    queryKey: settingsKeys.organization(),
    queryFn: async () => {
      const response = await apiClient.get<OrganizationSettingsResponse>(
        "/settings/organization"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrganizationRequest) => {
      const response = await apiClient.put<OrganizationSettingsResponse>(
        "/settings/organization",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization() });
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update organization"
      );
    },
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBusinessSettingsRequest) => {
      const response = await apiClient.put<OrganizationSettingsResponse>(
        "/settings/organization/business",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization() });
      toast.success("Business settings updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update business settings"
      );
    },
  });
}

export function useUpdateDocumentNumbering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDocumentNumberingRequest) => {
      const response = await apiClient.put<OrganizationSettingsResponse>(
        "/settings/organization/document-numbering",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization() });
      toast.success("Document numbering updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update document numbering"
      );
    },
  });
}

export function useUpdateDocumentTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: import("@tms/shared-types").UpdateDocumentTermsRequest) => {
      const response = await apiClient.put<OrganizationSettingsResponse>(
        "/settings/organization/document-terms",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization() });
      toast.success("Document terms updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update document terms"
      );
    },
  });
}

// ==================== TEAM MANAGEMENT ====================

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: settingsKeys.team(),
    queryFn: async () => {
      const response =
        await apiClient.get<TeamMembersResponse>("/settings/team");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteTeamMemberRequest) => {
      const response = await apiClient.post("/settings/team/invite", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to invite team member"
      );
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: UpdateTeamMemberRequest;
    }) => {
      const response = await apiClient.put(`/settings/team/${memberId}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to update team member"
      );
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/settings/team/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to remove team member"
      );
    },
  });
}

export function useBulkDeleteTeamMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberIds: string[]) => {
      await apiClient.post("/settings/team/bulk-delete", {
        memberIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
      // Toast removed - WebSocket will handle the notification
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          "Failed to delete team members"
      );
    },
  });
}

// ==================== BILLING SETTINGS ====================

export function useBillingSettings() {
  return useQuery<BillingSettings>({
    queryKey: settingsKeys.billing(),
    queryFn: async () => {
      const response =
        await apiClient.get<BillingSettingsResponse>("/settings/billing");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBillingHistory() {
  return useQuery<BillingInvoice[]>({
    queryKey: settingsKeys.billingHistory(),
    queryFn: async () => {
      const response = await apiClient.get<BillingHistoryResponse>(
        "/settings/billing/history"
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
