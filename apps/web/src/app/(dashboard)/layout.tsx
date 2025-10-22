"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import { useAuth } from "@/contexts/auth-context";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();

  return (
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
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={true}>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
