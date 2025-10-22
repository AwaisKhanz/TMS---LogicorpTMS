import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { ApiErrorException } from "@/types/api.types";
import type {
  DocumentTemplate,
  DocumentType,
  CreateDocumentTemplateRequest,
  UpdateDocumentTemplateRequest,
} from "@tms/shared-types";

interface DocumentTemplateFilters {
  type?: DocumentType;
  isDefault?: boolean;
}

interface DocumentTemplateResponse {
  success: boolean;
  data: DocumentTemplate;
}

interface DocumentTemplatesResponse {
  success: boolean;
  data: DocumentTemplate[];
}

/**
 * React Query key factory for document template-related queries
 */
export const documentTemplateKeys = {
  all: ["document-templates"] as const,
  lists: () => [...documentTemplateKeys.all, "list"] as const,
  list: (filters: DocumentTemplateFilters) => [...documentTemplateKeys.lists(), filters] as const,
  details: () => [...documentTemplateKeys.all, "detail"] as const,
  detail: (id: string) => [...documentTemplateKeys.details(), id] as const,
  defaults: () => [...documentTemplateKeys.all, "defaults"] as const,
  default: (type: DocumentType) => [...documentTemplateKeys.defaults(), type] as const,
};

/**
 * Fetch all document templates with optional filtering
 */
export function useDocumentTemplates(filters: DocumentTemplateFilters = {}) {
  return useQuery<DocumentTemplate[]>({
    queryKey: documentTemplateKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.type) params.append("type", filters.type);
      if (filters.isDefault !== undefined) params.append("isDefault", filters.isDefault.toString());

      const response = await apiClient.get<DocumentTemplatesResponse>(
        `/document-templates?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single document template
 */
export function useDocumentTemplate(id: string | undefined) {
  return useQuery<DocumentTemplate>({
    queryKey: documentTemplateKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.get<DocumentTemplateResponse>(
        `/document-templates/${id}`
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch the default template for a specific document type
 */
export function useDefaultDocumentTemplate(type: DocumentType) {
  return useQuery<DocumentTemplate>({
    queryKey: documentTemplateKeys.default(type),
    queryFn: async () => {
      const response = await apiClient.get<DocumentTemplateResponse>(
        `/document-templates/default/${type}`
      );
      return response.data;
    },
    enabled: !!type,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Create a new document template
 */
export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentTemplateRequest) => {
      const response = await apiClient.post<DocumentTemplateResponse>(
        "/document-templates",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.defaults() });
      toast.success("Template created successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to create template"
      );
    },
  });
}

/**
 * Update an existing document template
 */
export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: UpdateDocumentTemplateRequest
    }) => {
      const response = await apiClient.put<DocumentTemplateResponse>(
        `/document-templates/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.defaults() });
      toast.success("Template updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to update template"
      );
    },
  });
}

/**
 * Delete a document template
 */
export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/document-templates/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.defaults() });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to delete template"
      );
    },
  });
}

/**
 * Set a template as the default for its document type
 */
export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<DocumentTemplateResponse>(
        `/document-templates/${id}/set-default`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.defaults() });
      toast.success("Default template updated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to set default template"
      );
    },
  });
}

/**
 * Duplicate an existing template
 */
export function useDuplicateDocumentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      const duplicateData: CreateDocumentTemplateRequest = {
        name: `${template.name} (Copy)`,
        type: template.type,
        template: template.template,
        isDefault: false, // Never duplicate as default
      };

      const response = await apiClient.post<DocumentTemplateResponse>(
        "/document-templates",
        duplicateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTemplateKeys.lists() });
      toast.success("Template duplicated successfully");
    },
    onError: (error) => {
      const apiError = error as ApiErrorException;
      toast.error(
        apiError.response?.data?.error?.message || "Failed to duplicate template"
      );
    },
  });
}