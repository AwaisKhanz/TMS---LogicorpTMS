"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useSecuritySettings,
  useChangePassword,
  useActiveSessions,
  useTerminateSession,
  useTerminateAllSessions,
} from "@/hooks/use-settings";
import {
  Shield,
  Key,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { CanEdit } from "@/components/auth/can";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function SecuritySettings() {
  const { data: securitySettings, isLoading: securityLoading } =
    useSecuritySettings();
  const { data: activeSessions, isLoading: sessionsLoading } =
    useActiveSessions();
  const changePassword = useChangePassword();
  const terminateSession = useTerminateSession();
  const terminateAllSessions = useTerminateAllSessions();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (
    data: z.infer<typeof changePasswordSchema>
  ) => {
    try {
      await changePassword.mutateAsync(data);
      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await terminateSession.mutateAsync(sessionId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await terminateAllSessions.mutateAsync();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes("Mobile")) return "📱";
    if (userAgent.includes("Tablet")) return "📱";
    if (userAgent.includes("Windows")) return "💻";
    if (userAgent.includes("Mac")) return "💻";
    if (userAgent.includes("Linux")) return "💻";
    return "🖥️";
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (securityLoading || sessionsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Security
          </CardTitle>
          <CardDescription>
            Change your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed:{" "}
                  {securitySettings?.lastPasswordChange
                    ? new Date(
                        securitySettings.lastPasswordChange
                      ).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
              <CanEdit resource="settings">
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  {isChangingPassword ? "Cancel" : "Change Password"}
                </Button>
              </CanEdit>
            </div>

            {isChangingPassword && (
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword.current ? "text" : "password"}
                              placeholder="Enter your current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  current: !prev.current,
                                }))
                              }
                            >
                              {showPassword.current ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword.new ? "text" : "password"}
                              placeholder="Enter your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  new: !prev.new,
                                }))
                              }
                            >
                              {showPassword.new ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword.confirm ? "text" : "password"}
                              placeholder="Confirm your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPassword((prev) => ({
                                  ...prev,
                                  confirm: !prev.confirm,
                                }))
                              }
                            >
                              {showPassword.confirm ? "Hide" : "Show"}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-medium text-primary mb-2">
                      Password Requirements
                    </h4>
                    <ul className="text-sm text-primary/80 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        One uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        One lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        One number
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        One special character
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={changePassword.isPending}>
                      {changePassword.isPending
                        ? "Changing..."
                        : "Change Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        passwordForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {securitySettings?.twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"}
              </p>
            </div>
            <Badge
              variant={
                securitySettings?.twoFactorEnabled ? "default" : "secondary"
              }
            >
              {securitySettings?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
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
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {activeSessions?.length || 0} active sessions
              </p>
              {activeSessions && activeSessions.length > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Terminate All Others
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Terminate All Other Sessions
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will log out all other devices except this one.
                        You&apos;ll need to log in again on those devices.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleTerminateAllSessions}
                        disabled={terminateAllSessions.isPending}
                      >
                        {terminateAllSessions.isPending
                          ? "Terminating..."
                          : "Terminate All"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {activeSessions && activeSessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getDeviceIcon(session.userAgent)}
                          </span>
                          <div>
                            <div className="font-medium">
                              {session.deviceName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getBrowserInfo(session.userAgent)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <div className="font-medium">
                            {session.location || "Unknown"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.ipAddress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {session.ipAddress}
                        </code>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {formatLastActive(session.lastActive)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {session.isCurrent ? (
                          <Badge
                            variant="default"
                            className="flex items-center gap-1 w-fit"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {!session.isCurrent && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Terminate Session
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to terminate this
                                  session? The user will be logged out on this
                                  device.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleTerminateSession(session.id)
                                  }
                                  disabled={terminateSession.isPending}
                                >
                                  {terminateSession.isPending
                                    ? "Terminating..."
                                    : "Terminate"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active sessions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
          <CardDescription>
            Follow these recommendations to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {securitySettings?.twoFactorEnabled ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-medium">Enable Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account with 2FA
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Use a Strong Password</p>
                <p className="text-sm text-muted-foreground">
                  Your password should be unique and contain a mix of letters,
                  numbers, and symbols
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Regularly Review Active Sessions</p>
                <p className="text-sm text-muted-foreground">
                  Check your active sessions and terminate any that look
                  suspicious
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium">Keep Your Information Updated</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your contact information is current so we can reach
                  you if needed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
