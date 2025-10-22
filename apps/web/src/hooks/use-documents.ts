import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ApiErrorException } from "@/types/api.types";
import type {
  Document,
  DocumentFilters,
  UpdateDocumentRequest,
} from "@tms/shared-types";

interface PaginatedDocumentsResponse {
  success: boolean;
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface DocumentResponse {
  success: boolean;
  data: Document;
}

interface DocumentsResponse {
  success: boolean;
  data: Document[];
}

/**
 * React Query key factory for document-related queries
 */
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters: DocumentFilters) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  entity: (entityType: string, entityId: string) =>
    [...documentKeys.all, "entity", entityType, entityId] as const,
};

/**
 * Fetch paginated list of documents with filtering
 */
export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery<PaginatedDocumentsResponse>({
    queryKey: documentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.entityId) params.append("entityId", filters.entityId);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.order) params.append("order", filters.order);

      const response = await apiClient.get<PaginatedDocumentsResponse>(
        `/documents?${params.toString()}`
      );
      return response;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch documents for a specific entity
 */
export function useEntityDocuments(entityType: string, entityId: string) {
  return useQuery<Document[]>({
    queryKey: documentKeys.entity(entityType, entityId),
    queryFn: async () => {
      const response = await apiClient.get<DocumentsResponse>(
        `/documents/${entityType}/${entityId}`
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch a single document
 */
export function useDocument(id: string | undefined) {
  return useQuery<Document>({
    queryKey: documentKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Upload a document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      entityType: string;
      entityId: string;
      type: string;
      name?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("entityType", data.entityType);
      formData.append("entityId", data.entityId);
      formData.append("type", data.type);
      formData.append("name", data.name || data.file.name);

      const response = await apiClient.post<DocumentResponse>(
        "/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentKeys.entity(variables.entityType, variables.entityId)
      });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to upload document"
      );
    },
  });
}

/**
 * Update a document
 */
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateDocumentRequest
    }) => {
      const response = await apiClient.put<DocumentResponse>(
        `/documents/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) });
      toast.success("Document updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to update document"
      );
    },
  });
}

/**
 * Delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/documents/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete document"
      );
    },
  });
}

/**
 * Generate a document (Rate Confirmation, BOL, etc.)
 */
export function useGenerateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      loadId: string;
      documentType: string;
    }) => {
      const response = await apiClient.post<DocumentResponse>(
        "/documents/generate",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document generated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to generate document"
      );
    },
  });
}

/**
 * Download a document
 */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (doc: { id: string; name: string }) => {
      const response = await apiClient.get<Blob>(
        `/documents/${doc.id}/download`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return doc;
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to download document"
      );
    },
  });
}