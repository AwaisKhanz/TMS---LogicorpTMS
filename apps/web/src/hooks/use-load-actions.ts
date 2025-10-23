import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ApiErrorException } from "@/types/api.types";

// ==================== QUERY KEYS ====================
export const loadActionKeys = {
  all: ["load-actions"] as const,
  documents: (loadId: string) =>
    [...loadActionKeys.all, "documents", loadId] as const,
};

// ==================== DOCUMENT GENERATION ====================

export function useGenerateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      loadId,
      documentType,
    }: {
      loadId: string;
      documentType: string;
    }) => {
      const endpoint =
        documentType === "rate-confirmation"
          ? `/documents/loads/${loadId}/rate-confirmation`
          : documentType === "bol"
            ? `/documents/loads/${loadId}/bol`
            : documentType === "invoice"
              ? `/documents/loads/${loadId}/invoice`
              : `/documents/loads/${loadId}/pod`;

      return apiClient.post(endpoint);
    },
    onSuccess: (_, { documentType, loadId }) => {
      queryClient.invalidateQueries({
        queryKey: loadActionKeys.documents(loadId),
      });
      toast.success(`${documentType} generated successfully`);
    },
    onError: (error, { documentType }) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message ||
          `Failed to generate ${documentType}`
      );
    },
  });
}

// ==================== DOCUMENT SENDING ====================

export function useSendDocument() {
  return useMutation({
    mutationFn: async ({
      loadId,
      documentType,
      recipients,
      subject,
      message,
    }: {
      loadId: string;
      documentType: string;
      recipients: Array<{ email: string; name: string }>;
      subject: string;
      message: string;
    }) => {
      const endpoint =
        documentType === "rate-confirmation"
          ? `/documents/loads/${loadId}/send-rate-confirmation`
          : documentType === "bol"
            ? `/documents/loads/${loadId}/send-bol`
            : documentType === "invoice"
              ? `/documents/loads/${loadId}/send-invoice`
              : `/documents/loads/${loadId}/send-pod`;

      return apiClient.post(endpoint, {
        recipients,
        subject,
        message,
      });
    },
    onSuccess: () => {
      toast.success("Document sent successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to send document"
      );
    },
  });
}

// ==================== LOAD EXPORT ====================

export function useExportLoad() {
  return useMutation({
    mutationFn: async ({
      loadId,
      loadNumber,
    }: {
      loadId: string;
      loadNumber?: string;
    }) => {
      await apiClient.downloadFile(
        `/loads/export?loadIds=${loadId}&format=csv`,
        `load-${loadNumber || loadId}.csv`
      );
    },
    onSuccess: () => {
      toast.success("Load exported successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to export load"
      );
    },
  });
}
