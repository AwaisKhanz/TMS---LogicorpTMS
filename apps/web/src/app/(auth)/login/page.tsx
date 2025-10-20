import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { LoginForm } from "@/components/auth/login-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <AuthHeader
        title="Welcome back"
        description="Sign in to your TMS account to continue"
      />

      <LoginForm />

      <AuthDivider text="New to TMS?" />

      <div className="text-center">
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/register">Create an account</Link>
        </Button>
      </div>

      <AuthFooter />
    </div>
  );
}
