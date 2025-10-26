"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import type {
  AuthUser,
  AuthOrganization,
  AuthTokens,
} from "@/types/auth.types";
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const verificationAttempted = useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loginWithTokens } = useAuth();

  const token = searchParams.get("token");
  const email = user?.email || userEmail;

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      setIsVerifying(true);
      setError(null);

      try {
        const response = await apiClient.post<{
          success: boolean;
          data: {
            message: string;
            user: AuthUser;
            organization: AuthOrganization;
            tokens: AuthTokens;
          };
        }>("/auth/verify-email", {
          token: verificationToken,
        });

        if (response.success && response.data) {
          setVerificationStatus("success");

          // Auto-login the user with the returned tokens
          const {
            user: userData,
            organization: orgData,
            tokens,
          } = response.data;

          // Login the user with the tokens
          await loginWithTokens(userData, orgData, tokens);

          // Wait for the authentication context to be fully updated
          // This ensures all components (like sidebar) re-render with new permissions
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Redirect to dashboard
          router.push("/");
          router.refresh();
        }
      } catch (err: unknown) {
        console.error("Email verification error:", err);
        setError(getErrorMessage(err));
        setVerificationStatus("error");
      } finally {
        setIsVerifying(false);
      }
    },
    [loginWithTokens, router]
  );

  // Get email from URL parameters if user is not logged in
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && !user?.email) {
      setUserEmail(emailParam);
    }
  }, [searchParams, user?.email]);

  // Auto-verify if token is present (only once)
  useEffect(() => {
    if (
      token &&
      verificationStatus === "pending" &&
      !verificationAttempted.current
    ) {
      verificationAttempted.current = true;
      verifyEmail(token);
    }
  }, [token, verificationStatus, verifyEmail]);

  // Redirect if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/");
    }
  }, [user?.emailVerified, router]);

  const resendVerification = async () => {
    // If user is not logged in, we can't resend verification
    // This should be handled by the registration flow
    if (!email) {
      setResendMessage("Please check your email for the verification link.");
      return;
    }

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
        return <CheckCircle className="h-12 w-12 text-success" />;
      case "error":
        return <XCircle className="h-12 w-12 text-destructive" />;
      default:
        return <Mail className="h-12 w-12 text-info" />;
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
                  Didn&apos;t receive the email? Check your spam folder or
                  request a new one.
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
            <p className="text-sm text-success">
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
