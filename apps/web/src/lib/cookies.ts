import Cookies from "js-cookie";

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production", // Only secure in production
  sameSite: "strict" as const, // CSRF protection
  path: "/", // Available site-wide
};

// Token cookie names
const TOKEN_COOKIE = "tms_token";
const REFRESH_TOKEN_COOKIE = "tms_refresh_token";

export const cookieUtils = {
  // Set authentication token
  setToken: (token: string) => {
    Cookies.set(TOKEN_COOKIE, token, COOKIE_OPTIONS);
  },

  // Get authentication token
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_COOKIE);
  },

  // Set refresh token
  setRefreshToken: (refreshToken: string) => {
    Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);
  },

  // Get refresh token
  getRefreshToken: (): string | undefined => {
    return Cookies.get(REFRESH_TOKEN_COOKIE);
  },

  // Remove all authentication cookies
  clearAuth: () => {
    Cookies.remove(TOKEN_COOKIE, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_COOKIE, { path: "/" });
  },

  // Check if user is authenticated (has token)
  isAuthenticated: (): boolean => {
    return !!Cookies.get(TOKEN_COOKIE);
  },
};
