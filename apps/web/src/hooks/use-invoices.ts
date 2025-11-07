import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
// Using local interfaces to match API shape, mirroring use-loads.ts patterns
interface PaginatedInvoicesResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (q: any) => [...invoiceKeys.all, "list", q] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

export function useInvoices(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  return useQuery<PaginatedInvoicesResponse>({
    queryKey: invoiceKeys.list(params || {}),
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set("page", String(params.page));
      if (params?.limit) sp.set("limit", String(params.limit));
      if (params?.status) sp.set("status", params.status);
      if (params?.search) sp.set("search", params.search);
      const res = await apiClient.get<PaginatedInvoicesResponse>(
        `/invoices?${sp.toString()}`
      );
      return res;
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery<any>({
    queryKey: invoiceKeys.detail(id || ""),
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: any }>(
        `/invoices/${id}`
      );
      return res.data as any;
    },
    enabled: !!id,
  });
}

export function useAddPayment(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      type: "CUSTOMER" | "CARRIER";
      amount: number;
      method: "CASH" | "CHECK" | "ACH" | "WIRE" | "CREDIT_CARD" | "OTHER" | string;
      date?: string;
      reference?: string;
      notes?: string;
    }) => {
      const res = await apiClient.post(`/invoices/${invoiceId}/payments`, data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      toast.success("Payment recorded");
    },
    onError: () => toast.error("Failed to add payment"),
  });
}

export function useExportInvoice() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/invoices/${id}/export`, {});
      return res;
    },
    onSuccess: (res: any) => {
      try {
        const url =
          res?.data?.data?.fileUrl ||
          res?.data?.fileUrl ||
          res?.fileUrl ||
          res?.data?.data || // some endpoints may return a URL string directly
          undefined;
        if (typeof url === "string" && url.startsWith("http")) {
          if (typeof window !== "undefined") window.open(url, "_blank");
        }
      } catch {
        // Silently fail if window is not available or URL is invalid
      }
      toast.success("Invoice PDF generated");
    },
    onError: () => toast.error("Failed to export invoice"),
  });
}

// Invoice documents
export function useInvoiceDocuments(invoiceId: string | undefined, options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["invoice-documents", invoiceId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("entityType", "INVOICE");
      params.set("entityId", String(invoiceId));
      if (options?.page) params.set("page", String(options.page));
      if (options?.limit) params.set("limit", String(options.limit));
      const res = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>(`/documents?${params.toString()}`);
      return res;
    },
    enabled: !!invoiceId,
  });
}

export function useUploadInvoiceDocument(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "INVOICE");
      fd.append("entityId", invoiceId);
      fd.append("type", "INVOICE");
      fd.append("name", file.name);
      const res = await apiClient.post("/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice-documents", invoiceId] });
      toast.success("Document uploaded");
    },
    onError: () => toast.error("Failed to upload document"),
  });
}

export function useInvoiceStatistics() {
  return useQuery({
    queryKey: ["invoice-statistics"],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: {
          total: number;
          paid: number;
          totalRevenue: number;
          avgInvoice: number;
        };
      }>("/invoices/statistics");
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
