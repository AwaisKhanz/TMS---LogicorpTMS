import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <AuthHeader
        title="Forgot Password?"
        description="Enter your email address and we'll send you a link to reset your password."
      />

      <ForgotPasswordForm />

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
