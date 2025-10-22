"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | "expired"
  >("pending");
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const token = searchParams.get("token");
  const email = user?.email;

  // Auto-verify if token is present
  useEffect(() => {
    if (token && verificationStatus === "pending") {
      verifyEmail(token);
    }
  }, [token]);

  // Redirect if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/");
    }
  }, [user?.emailVerified, router]);

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { message: string };
      }>("/auth/verify-email", {
        token: verificationToken,
      });

      if (response.success) {
        setVerificationStatus("success");
        // Refresh user data to get updated emailVerified status
        await refreshUser();
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err: unknown) {
      console.error("Email verification error:", err);
      setError(getErrorMessage(err));
      setVerificationStatus("error");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { message: string };
      }>("/auth/resend-verification", {
        email,
      });

      if (response.success) {
        setResendMessage("Verification email sent! Please check your inbox.");
      }
    } catch (err: unknown) {
      console.error("Resend verification error:", err);
      setResendMessage(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Mail className="h-12 w-12 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case "success":
        return {
          title: "Email Verified Successfully!",
          description:
            "Your email has been verified. Redirecting to dashboard...",
        };
      case "error":
        return {
          title: "Verification Failed",
          description: error || "There was an error verifying your email.",
        };
      default:
        return {
          title: "Verify Your Email Address",
          description: `We've sent a verification link to ${email}. Please check your email and click the link to verify your account.`,
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="flex justify-center mb-4">{getStatusIcon()}</div>
        <AuthHeader
          title={statusMessage.title}
          description={statusMessage.description}
        />
      </div>

      <div className="space-y-4">
        {verificationStatus === "pending" && (
          <>
            {isVerifying && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Verifying your email...</span>
              </div>
            )}

            {!token && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or request a
                  new one.
                </p>
                <Button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="w-full"
                  variant="outline"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {verificationStatus === "error" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={resendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Request New Verification Email"
              )}
            </Button>
          </div>
        )}

        {resendMessage && (
          <Alert
            variant={
              resendMessage.includes("Failed") ? "destructive" : "default"
            }
          >
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        )}

        {verificationStatus === "success" && (
          <div className="text-center">
            <p className="text-sm text-green-600">
              You will be redirected to the dashboard shortly.
            </p>
          </div>
        )}
      </div>

      <AuthDivider text="Need help?" />

      <div className="text-center">
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/login">Back to Sign in</Link>
        </Button>
      </div>

      <AuthFooter />
    </div>
  );
}
