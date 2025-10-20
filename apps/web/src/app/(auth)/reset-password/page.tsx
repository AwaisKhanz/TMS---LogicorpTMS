import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <AuthHeader
        title="Reset Password"
        description="Enter your new password below."
      />

      <ResetPasswordForm />

      <AuthDivider text="Remember your password?" />

      <div className="text-center">
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/login">Back to Sign in</Link>
        </Button>
      </div>

      <AuthFooter />
    </div>
  );
}
