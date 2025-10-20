import { AuthHeader } from "@/components/auth/auth-header";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthDivider } from "@/components/auth/auth-divider";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <AuthHeader
        title="Verify Your Email"
        description="We've sent a verification link to your email address. Please check your inbox and click the link to verify your account."
      />

      <EmailVerificationForm />

      <AuthDivider text="Already verified?" />

      <AuthFooter />
    </div>
  );
}
