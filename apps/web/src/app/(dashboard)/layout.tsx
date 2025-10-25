"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { useAuth } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { PermissionChangeHandler } from "@/components/notifications/permission-change-handler";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();

  return (
    <WebSocketProvider>
      <PermissionChangeHandler>
        <DashboardLayout
          user={{
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email || "",
            image: user?.avatar,
          }}
          organizationName={organization?.name || ""}
        >
          <EmailVerificationBanner />
          {children}
        </DashboardLayout>
      </PermissionChangeHandler>
    </WebSocketProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={true}>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
