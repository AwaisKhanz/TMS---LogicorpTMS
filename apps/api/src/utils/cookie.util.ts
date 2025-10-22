/**
 * Extract token from Authorization header or cookies
 */
export const extractToken = (req: {
  headers: { authorization?: string };
  cookies: { tms_token?: string };
}): { token: string; source: "header" | "cookie" } | null => {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return { token: authHeader.substring(7), source: "header" };
  }

  // Then try cookies
  const cookieToken = req.cookies.tms_token;
  if (cookieToken) {
    return { token: cookieToken, source: "cookie" };
  }

  return null;
};
