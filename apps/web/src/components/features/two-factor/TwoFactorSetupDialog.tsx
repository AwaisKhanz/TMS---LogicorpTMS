"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TwoFactorVerifyInput } from "./TwoFactorVerifyInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { TwoFactorSetupResponse } from "@/types/auth.types";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupData: TwoFactorSetupResponse | undefined;
  onVerify: (token: string) => void;
  isVerifying: boolean;
}

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  setupData,
  onVerify,
  isVerifying,
}: TwoFactorSetupDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);
  const [step, setStep] = useState<"scan" | "verify">("scan");

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onVerify(verificationCode);
    }
  };

  const handleCodeComplete = (code: string) => {
    setVerificationCode(code);
    // Auto-submit when code is complete
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enhance your account security with two-factor authentication
          </DialogDescription>
        </DialogHeader>

        {step === "scan" ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Install an authenticator app like Google Authenticator, Authy,
                or 1Password on your mobile device.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Step 1: Scan the QR code</h4>
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                {setupData?.qrCode && (
                  <Image
                    src={setupData.qrCode}
                    alt="QR Code for 2FA setup"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                Or manually enter this key:
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm break-all">
                  {setupData?.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  className="shrink-0"
                >
                  {secretCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-center">
                Step 2: Enter the 6-digit code
              </h4>
              <p className="text-sm text-muted-foreground text-center">
                Open your authenticator app and enter the code shown
              </p>
            </div>
            <TwoFactorVerifyInput
              value={verificationCode}
              onChange={setVerificationCode}
              onComplete={handleCodeComplete}
              disabled={isVerifying}
            />
          </div>
        )}

        <DialogFooter>
          {step === "scan" ? (
            <Button onClick={() => setStep("verify")} className="w-full">
              Continue to Verification
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setStep("scan")}
                className="flex-1"
                disabled={isVerifying}
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
