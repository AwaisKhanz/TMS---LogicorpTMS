"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  redirectTo,
}: AuthGuardProps) {
  const { isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo || "/login");
      return;
    }

    // If email verification is required but user is not verified
    if (requireEmailVerification && isAuthenticated && !isEmailVerified) {
      router.push(redirectTo || "/verify-email");
      return;
    }

    // If user is authenticated but trying to access auth pages
    if (!requireAuth && isAuthenticated) {
      router.push(redirectTo || "/");
      return;
    }
  }, [
    isAuthenticated,
    isEmailVerified,
    isLoading,
    requireAuth,
    requireEmailVerification,
    redirectTo,
    router,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if redirecting
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireEmailVerification && isAuthenticated && !isEmailVerified) {
    return null;
  }

  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, "children"> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
