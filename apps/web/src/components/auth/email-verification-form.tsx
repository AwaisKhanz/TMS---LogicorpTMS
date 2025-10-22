"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

export function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string>("");

  const token = searchParams.get("token");

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      setIsVerifying(true);

      try {
        await apiClient.post("/auth/verify-email", {
          token: verificationToken,
        });

        setIsVerified(true);
        toast.success("Email verified successfully!", {
          description: "Your account is now fully activated.",
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        const apiError = error as {
          response?: { data?: { error?: { message?: string } } };
        };
        toast.error("Verification failed", {
          description:
            apiError.response?.data?.error?.message ||
            "Invalid or expired verification link.",
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [router]
  );

  useEffect(() => {
    // If token is present, verify automatically
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  const resendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);

    try {
      await apiClient.post("/auth/resend-verification", {
        email,
      });

      toast.success("Verification email sent!", {
        description: "Please check your inbox for the verification link.",
      });
    } catch (error) {
      const apiError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error("Failed to resend verification", {
        description:
          apiError.response?.data?.error?.message || "Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Email Verified!</h3>
              <p className="text-sm text-muted-foreground">
                Your account has been successfully verified. Redirecting to
                dashboard...
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/">Continue to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isVerifying) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Verifying...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Check Your Email</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification link to your email address. Click
              the link to verify your account.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Didn&apos;t receive the email? Check your spam folder or resend
                verification.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={resendVerification}
                disabled={isResending || !email}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
