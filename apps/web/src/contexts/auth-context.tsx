"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { cookieUtils } from "@/lib/cookies";
import type {
  AuthUser,
  AuthOrganization,
  AuthTokens,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth.types";
import type { Permission, Role } from "@tms/shared-types";

interface AuthContextType {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  roles: Role[];
  permissions: Permission[];
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  token: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
  hasAllPermissions: (...permissions: Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
  login: (
    email: string,
    password: string,
    twoFactorToken?: string
  ) => Promise<LoginResponse>;
  loginWithTokens: (
    userData: AuthUser,
    orgData: AuthOrganization,
    tokens: AuthTokens
  ) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<AuthOrganization | null>(
    null
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const isAuthenticated = !!user;
  const isEmailVerified = user?.emailVerified || false;

  // Permission checking helper functions
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some((permission) =>
      permissions.includes(permission)
    );
  };

  const hasAllPermissions = (...requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every((permission) =>
      permissions.includes(permission)
    );
  };

  const hasRole = (role: Role): boolean => {
    return roles.includes(role);
  };

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const currentToken = cookieUtils.getToken();
      setToken(currentToken || null);

      if (currentToken) {
        try {
          const response = await apiClient.get<{
            success: boolean;
            data: AuthUser & {
              organization: AuthOrganization;
              roles: Role[];
              permissions: Permission[];
            };
          }>("/auth/me");

          if (response.success && response.data) {
            // Extract user data (excluding organization and roles)
            const { organization, roles, permissions, ...userData } =
              response.data;
            setUser({ ...userData, roles, permissions });
            setOrganization(organization);
            setRoles(roles || []);
            setPermissions(permissions || []);
          }
        } catch (error) {
          // Token is invalid, clear it and reset state
          cookieUtils.clearAuth();
          setUser(null);
          setOrganization(null);
          setRoles([]);
          setPermissions([]);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (
    email: string,
    password: string,
    twoFactorToken?: string
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: LoginResponse;
    }>("/auth/login", {
      email,
      password,
      twoFactorToken,
    });

    if (response.success && response.data) {
      const {
        user: userData,
        organization: orgData,
        tokens,
        requires2FA,
      } = response.data;

      if (requires2FA) {
        // Return the response for the form to handle
        return response.data;
      }

      if (tokens) {
        // Store token in cookies for API client to use
        cookieUtils.setToken(tokens.accessToken);
        setToken(tokens.accessToken);

        // Set user and organization state with roles and permissions
        setUser(userData);
        setOrganization(orgData);
        setRoles(userData.roles);
        setPermissions(userData.permissions);
      }

      return response.data;
    }

    throw new Error("Login failed");
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    const response = await apiClient.post<{
      success: boolean;
      data: RegisterResponse;
    }>("/auth/register", data);

    if (response.success && response.data) {
      // Don't auto-login user after registration
      // User will be logged in after email verification
      // Just return success - the user will be redirected to verify-email page
    }
  };

  const loginWithTokens = async (
    userData: AuthUser,
    orgData: AuthOrganization,
    tokens: AuthTokens
  ): Promise<void> => {
    // Store token in cookies for API client to use
    cookieUtils.setToken(tokens.accessToken);
    setToken(tokens.accessToken);

    // Set user and organization state with roles and permissions
    setUser(userData);
    setOrganization(orgData);
    setRoles(userData.roles || []);
    setPermissions(userData.permissions || []);
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Ignore errors on logout
      console.error("Logout error:", error);
    } finally {
      // Clear token and user state
      cookieUtils.clearAuth();
      setUser(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setToken(null);
      router.push("/login");
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: AuthUser & {
          organization: AuthOrganization;
          roles: Role[];
          permissions: Permission[];
        };
      }>("/auth/me");
      if (response.success && response.data) {
        const { organization, roles, permissions, ...userData } = response.data;
        console.log("Refreshing user data:", userData);
        setUser({
          ...userData,
          roles: roles as Role[],
          permissions: permissions as Permission[],
        });
        setOrganization(organization);
        setRoles((roles as Role[]) || []);
        setPermissions(permissions || []);
      }
    } catch (error) {
      // If refresh fails, logout
      await logout();
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      // Get fresh user data with updated permissions
      const response = await apiClient.get<{
        success: boolean;
        data: AuthUser & {
          organization: AuthOrganization;
          roles: Role[];
          permissions: Permission[];
        };
      }>("/auth/me");

      if (response.success && response.data) {
        const { organization, roles, permissions, ...userData } = response.data;

        // Update auth state with fresh data
        setUser({
          ...userData,
          roles: roles as Role[],
          permissions: permissions as Permission[],
        });
        setOrganization(organization);
        setRoles((roles as Role[]) || []);
        setPermissions(permissions || []);
      }
    } catch (error) {
      console.error("Failed to refresh auth:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        roles,
        permissions,
        isAuthenticated,
        isEmailVerified,
        isLoading,
        token,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        login,
        loginWithTokens,
        register,
        logout,
        refreshUser,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
