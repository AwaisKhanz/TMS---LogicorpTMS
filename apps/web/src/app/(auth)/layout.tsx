import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthRightSection } from "@/components/auth/auth-right-section";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="min-h-screen flex relative">
        {/* Theme Toggle - Floating */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Left Section - Form (Dynamic Content) */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          {children}
        </div>

        {/* Right Section - Branding (Static/Shared) */}
        <AuthRightSection />
      </div>
    </AuthGuard>
  );
}
