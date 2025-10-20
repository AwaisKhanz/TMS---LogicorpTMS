import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <AuthHeader
        title="Create your account"
        description="Start managing your freight operations today"
      />

      <RegisterForm />

      <AuthDivider text="Already have an account?" />

      <div className="text-center">
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/login">Sign in instead</Link>
        </Button>
      </div>

      <AuthFooter />
    </div>
  );
}
