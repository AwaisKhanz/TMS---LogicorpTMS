import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { cookieUtils } from "./cookies";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - add Authorization header from cookies
    this.client.interceptors.request.use(
      (config) => {
        // Get token from cookies and add to Authorization header
        if (typeof window !== "undefined") {
          const token = cookieUtils.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || "";
          const isAuthEndpoint =
            url.includes("/auth/") || url.includes("/two-factor/");

          // For auth endpoints, only redirect if it's a token validation failure
          // (not validation errors like wrong password, missing 2FA, etc.)
          const isTokenValidationFailure =
            url.includes("/auth/me") ||
            url.includes("/auth/refresh") ||
            !isAuthEndpoint;

          if (isTokenValidationFailure && typeof window !== "undefined") {
            // Clear invalid token and redirect to login
            cookieUtils.clearAuth();
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Upload with progress tracking
  async uploadWithProgress<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ) {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  }

  // Download file
  async downloadFile(url: string, filename: string) {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}

export const apiClient = new APIClient();

// Utility function for extracting error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  const apiError = error as {
    response?: {
      data?: {
        error?: {
          message?: string;
        };
      };
    };
    message?: string;
  };

  return (
    apiError.response?.data?.error?.message ||
    apiError.message ||
    "An unexpected error occurred"
  );
}
