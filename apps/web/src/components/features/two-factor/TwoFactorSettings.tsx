"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog";
import { TwoFactorVerifyInput } from "./TwoFactorVerifyInput";
import { useTwoFactor } from "@/hooks/use-two-factor";
import { ShieldCheck, ShieldOff, Smartphone, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function TwoFactorSettings() {
  const { user } = useAuth();
  const {
    setup,
    setupData,
    isSettingUp,
    enable,
    isEnabling,
    disable,
    isDisabling,
    isSetupDialogOpen,
    setIsSetupDialogOpen,
  } = useTwoFactor();

  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableVerificationCode, setDisableVerificationCode] = useState("");

  const is2FAEnabled = user?.twoFactorEnabled || false;

  const handleSetup = () => {
    setup();
  };

  const handleDisable = () => {
    if (disableVerificationCode.length === 6) {
      disable(disableVerificationCode);
      setShowDisableDialog(false);
      setDisableVerificationCode("");
    }
  };

  const handleDisableCodeComplete = (code: string) => {
    setDisableVerificationCode(code);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {is2FAEnabled ? (
              <Badge variant="default" className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <ShieldOff className="h-3.5 w-3.5" />
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            <>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with two-factor authentication.
                  You&apos;ll need to enter a code from your authenticator app
                  when you sign in.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Disable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Remove two-factor authentication from your account
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowDisableDialog(true)}
                  disabled={isDisabling}
                >
                  Disable
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is currently disabled. Enable it to
                  add an extra layer of security to your account.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">How it works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Install an authenticator app on your mobile device</li>
                  <li>Scan the QR code or enter the secret key</li>
                  <li>Enter the 6-digit code to verify</li>
                  <li>You&apos;ll need this code each time you sign in</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your account with two-factor authentication
                  </p>
                </div>
                <Button onClick={handleSetup} disabled={isSettingUp}>
                  {isSettingUp ? "Setting up..." : "Enable 2FA"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <TwoFactorSetupDialog
        open={isSetupDialogOpen}
        onOpenChange={setIsSetupDialogOpen}
        setupData={setupData}
        onVerify={enable}
        isVerifying={isEnabling}
      />

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable Two-Factor Authentication
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove two-factor authentication from your account,
              making it less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm font-medium text-center">
              Enter the 6-digit code from your authenticator app to confirm
            </p>
            <TwoFactorVerifyInput
              value={disableVerificationCode}
              onChange={setDisableVerificationCode}
              onComplete={handleDisableCodeComplete}
              disabled={isDisabling}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDisableVerificationCode("");
                setShowDisableDialog(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disableVerificationCode.length !== 6 || isDisabling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDisabling ? "Disabling..." : "Disable 2FA"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
