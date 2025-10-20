import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

class APIClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Enable sending cookies with requests
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Tokens are sent automatically via HTTP-only cookies
        // No need to manually add Authorization header

        // Add CSRF token to non-GET requests
        if (
          this.csrfToken &&
          config.method &&
          !["get", "head", "options"].includes(config.method.toLowerCase())
        ) {
          config.headers["X-CSRF-Token"] = this.csrfToken;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Extract and store CSRF token from response headers
        const csrfToken = response.headers["x-csrf-token"];
        if (csrfToken) {
          this.csrfToken = csrfToken;
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh using cookies
          try {
            await axios.post(
              `${API_URL}/auth/refresh`,
              {},
              { withCredentials: true } // Send refresh token cookie
            );

            // Retry original request (new token is in cookie)
            if (error.config) {
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch initial CSRF token from the server
   */
  async fetchCsrfToken(): Promise<void> {
    try {
      // Make a simple GET request to trigger CSRF token generation
      const response = await this.client.get("/auth/me");
      const csrfToken = response.headers["x-csrf-token"];
      if (csrfToken) {
        this.csrfToken = csrfToken;
      }
    } catch (error) {
      // Ignore errors (user might not be authenticated yet)
      // CSRF token will be fetched on first authenticated request
    }
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
}

export const apiClient = new APIClient();
