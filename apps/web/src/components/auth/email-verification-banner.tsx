"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Mail, Loader2 } from "lucide-react";

export function EmailVerificationBanner() {
  const { user, isEmailVerified } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if user is verified or dismissed
  if (!user || isEmailVerified || isDismissed) {
    return null;
  }

  const resendVerification = async () => {
    if (!user.email) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { message: string };
      }>("/auth/resend-verification", {
        email: user.email,
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

  const handleVerifyClick = () => {
    router.push("/verify-email");
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-amber-800 font-medium">
            Please verify your email address to access all features.
          </p>
          <p className="text-amber-700 text-sm mt-1">
            We sent a verification link to <strong>{user.email}</strong>
          </p>
          {resendMessage && (
            <p className="text-amber-700 text-sm mt-1">{resendMessage}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={resendVerification}
            disabled={isResending}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            {isResending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Sending...
              </>
            ) : (
              "Resend"
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleVerifyClick}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Verify Email
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:bg-amber-100 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
