"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Key,
  Smartphone,
  Monitor,
  MapPin,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import {
  useSecuritySettings,
  useChangePassword,
  useSetupTwoFactor,
  useEnableTwoFactor,
  useDisableTwoFactor,
  useActiveSessions,
  useTerminateSession,
  useTerminateAllSessions,
} from "@/hooks/use-settings";
import type {
  ChangePasswordRequest,
  EnableTwoFactorRequest,
  DisableTwoFactorRequest,
  TwoFactorSetupResponse,
} from "@tms/shared-types";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const twoFactorTokenSchema = z.object({
  token: z.string().length(6, "Token must be 6 digits"),
});

export function SecuritySettingsForm() {
  const { data: securitySettings, isLoading } = useSecuritySettings();
  const { data: sessions = [] } = useActiveSessions();
  const changePassword = useChangePassword();
  const setupTwoFactor = useSetupTwoFactor();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();
  const terminateSession = useTerminateSession();
  const terminateAllSessions = useTerminateAllSessions();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] =
    useState<TwoFactorSetupResponse | null>(null);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showDisableTwoFactorDialog, setShowDisableTwoFactorDialog] =
    useState(false);
  const [sessionToTerminate, setSessionToTerminate] = useState<string | null>(
    null
  );
  const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerToken,
    handleSubmit: handleTokenSubmit,
    formState: { errors: tokenErrors },
    reset: resetTokenForm,
  } = useForm<{ token: string }>({
    resolver: zodResolver(twoFactorTokenSchema),
  });

  const onPasswordSubmit = async (data: ChangePasswordRequest) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        resetPasswordForm();
      },
    });
  };

  const handleSetupTwoFactor = async () => {
    setupTwoFactor.mutate(undefined, {
      onSuccess: (data) => {
        setTwoFactorSetup(data);
        setShowTwoFactorDialog(true);
      },
    });
  };

  const handleEnableTwoFactor = async (data: { token: string }) => {
    if (!twoFactorSetup) return;

    const enableData: EnableTwoFactorRequest = {
      secret: twoFactorSetup.secret,
      token: data.token,
    };

    enableTwoFactor.mutate(enableData, {
      onSuccess: () => {
        setShowTwoFactorDialog(false);
        setTwoFactorSetup(null);
        resetTokenForm();
      },
    });
  };

  const handleDisableTwoFactor = async (data: { token: string }) => {
    const disableData: DisableTwoFactorRequest = {
      token: data.token,
    };

    disableTwoFactor.mutate(disableData, {
      onSuccess: () => {
        setShowDisableTwoFactorDialog(false);
        resetTokenForm();
      },
    });
  };

  const handleTerminateSession = (sessionId: string) => {
    terminateSession.mutate(sessionId, {
      onSuccess: () => {
        setSessionToTerminate(null);
      },
    });
  };

  const handleTerminateAllSessions = () => {
    terminateAllSessions.mutate(undefined, {
      onSuccess: () => {
        setShowTerminateAllDialog(false);
      },
    });
  };

  if (isLoading) {
    return <div>Loading security settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">
                {securitySettings?.twoFactorEnabled
                  ? "Two-factor authentication is enabled"
                  : "Two-factor authentication is not enabled"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  securitySettings?.twoFactorEnabled ? "default" : "secondary"
                }
              >
                {securitySettings?.twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
              {securitySettings?.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDisableTwoFactorDialog(true)}
                >
                  Disable
                </Button>
              ) : (
                <Button onClick={handleSetupTwoFactor}>Enable</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Keep your account secure by using a strong password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...registerPassword("currentPassword")}
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...registerPassword("newPassword")}
                  placeholder="Enter your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...registerPassword("confirmPassword")}
                  placeholder="Confirm your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                Change Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowTerminateAllDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Terminate All Other Sessions
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Monitor className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No active sessions found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{session.deviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.ipAddress}
                            </p>
                          </div>
                          {session.isCurrent && (
                            <Badge variant="secondary" className="ml-2">
                              Current
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {session.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(
                            new Date(session.lastActive),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setSessionToTerminate(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Setup Dialog */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the
              verification code
            </DialogDescription>
          </DialogHeader>

          {twoFactorSetup && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Image
                  src={twoFactorSetup.qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Secret Key (Manual Entry)</Label>
                <code className="block p-2 bg-muted rounded text-sm break-all">
                  {twoFactorSetup.secret}
                </code>
              </div>

              <form
                onSubmit={handleTokenSubmit(handleEnableTwoFactor)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="token">Verification Code</Label>
                  <Input
                    id="token"
                    {...registerToken("token")}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                  {tokenErrors.token && (
                    <p className="text-sm text-destructive">
                      {tokenErrors.token.message}
                    </p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTwoFactorDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={enableTwoFactor.isPending}>
                    Enable 2FA
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Two-Factor Dialog */}
      <Dialog
        open={showDisableTwoFactorDialog}
        onOpenChange={setShowDisableTwoFactorDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authentication code to disable two-factor
              authentication
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleTokenSubmit(handleDisableTwoFactor)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="disableToken">Verification Code</Label>
              <Input
                id="disableToken"
                {...registerToken("token")}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              {tokenErrors.token && (
                <p className="text-sm text-destructive">
                  {tokenErrors.token.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisableTwoFactorDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={disableTwoFactor.isPending}
              >
                Disable 2FA
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terminate Session Confirmation */}
      <AlertDialog
        open={!!sessionToTerminate}
        onOpenChange={() => setSessionToTerminate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                sessionToTerminate && handleTerminateSession(sessionToTerminate)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate All Sessions Confirmation */}
      <AlertDialog
        open={showTerminateAllDialog}
        onOpenChange={setShowTerminateAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out from all other devices. Your current session
              will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateAllSessions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
